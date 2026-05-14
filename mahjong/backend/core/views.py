import json
import secrets
import os
from datetime import datetime, timezone

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Avg, Count, F, Max, Min
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
import stripe
from stripe import error as stripe_error

from .models import AuthToken, CustomLayout, CustomLayoutRating, GameResult, Profile

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


def utc_today_key() -> str:
    now = datetime.now(timezone.utc)
    return f"{now.year}-{now.month}-{now.day}"


RANKS = [
    {"name": "Rookie", "min_xp": 0, "max_xp": 99},
    {"name": "Apprentice", "min_xp": 100, "max_xp": 249},
    {"name": "Challenger", "min_xp": 250, "max_xp": 499},
    {"name": "Expert", "min_xp": 500, "max_xp": 999},
    {"name": "Master", "min_xp": 1000, "max_xp": 9999999},
]


def daily_seed() -> int:
    now = datetime.now(timezone.utc)
    return int(f"{now.year}{now.month}{now.day}")


def rank_for_xp(xp):
    for rank in RANKS:
        if rank["min_xp"] <= xp <= rank["max_xp"]:
            return rank["name"]
    return RANKS[-1]["name"]


def next_rank_threshold(xp):
    for rank in RANKS:
        if xp < rank["min_xp"]:
            return rank["min_xp"]
    return None


def xp_for_game(mode, difficulty):
    if mode not in ("classic", "daily"):
        return 0
    difficulty_bonus = {"easy": 5, "medium": 20, "hard": 50}
    if mode == "daily":
        return 20 + difficulty_bonus.get(difficulty, 0)
    return 10 + difficulty_bonus.get(difficulty, 0)


def compute_achievements(user):
    wins = GameResult.objects.filter(user=user, won=True, mode__in=("classic", "daily"))
    layout_count = CustomLayout.objects.filter(user=user).count()
    speed_runner = wins.filter(time_seconds__lt=90).exists()
    zen_master = wins.filter(score__gte=1200).exists()
    no_hint_victory = wins.filter(hints_used=0).exists()
    perfect_daily = wins.filter(mode="daily").exists()
    return {
        "rank": rank_for_xp(user.profile.xp),
        "xp": user.profile.xp,
        "next_rank_xp": next_rank_threshold(user.profile.xp),
        "total_wins": wins.count(),
        "classic_wins": wins.filter(mode="classic").count(),
        "daily_wins": wins.filter(mode="daily").count(),
        "layout_count": layout_count,
        "achievements": [
            {"id": "speed_runner", "label": "Speed Runner", "unlocked": speed_runner, "description": "Win a classic or daily game in under 90 seconds."},
            {"id": "zen_master", "label": "Zen Master", "unlocked": zen_master, "description": "Score 1200+ in a classic or daily win."},
            {"id": "no_hint_victory", "label": "No Hint Victory", "unlocked": no_hint_victory, "description": "Win with zero hints used."},
            {"id": "perfect_daily", "label": "Perfect Daily", "unlocked": perfect_daily, "description": "Win the daily challenge."},
            {"id": "architect", "label": "Architect", "unlocked": layout_count >= 10, "description": "Create 10 saved layouts."},
        ],
    }


def read_json(request):
    raw = request.body.decode("utf-8").strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def normalize_layout_mask(mask):
    if not isinstance(mask, list) or not mask:
        raise ValueError("Mask must be an array of strings or level arrays.")

    is_single_level = all(isinstance(row, str) for row in mask)
    is_multi_level = all(
        isinstance(level, list) and level and all(isinstance(row, str) for row in level)
        for level in mask
    )

    if not is_single_level and not is_multi_level:
        raise ValueError("Mask must be an array of strings or level arrays.")

    levels = [mask] if is_single_level else mask
    normalized = []
    has_tile = False

    for level in levels:
        normalized_level = []
        for row in level:
            if len(row) > 32:
                raise ValueError("Each row may be at most 32 characters.")
            if not all(ch in ".#" for ch in row):
                raise ValueError("Mask rows may only contain '.' and '#'.")
            if "#" in row:
                has_tile = True
            normalized_level.append(row)
        normalized.append(normalized_level)

    if not has_tile:
        raise ValueError("Layout must contain at least one tile.")

    if is_multi_level:
        for z, level in enumerate(normalized[1:], start=1):
            for y, row in enumerate(level):
                for x, cell in enumerate(row):
                    if cell != "#":
                        continue
                    for lower_z in range(z):
                        lower_level = normalized[lower_z]
                        if y >= len(lower_level) or x >= len(lower_level[y]) or lower_level[y][x] != "#":
                            raise ValueError("Higher-level tiles must have all lower support tiles beneath them.")

    return normalized[0] if is_single_level else normalized


def normalize_play_mode(value):
    mode = (value or "classic").strip()
    if mode not in ("classic", "fog", "no-excuse"):
        raise ValueError("Layout mode must be classic, fog, or no-excuse.")
    return mode


def normalize_locked_tiles(value):
    if value in (None, ""):
        return []
    if not isinstance(value, list):
        raise ValueError("Locked tiles must be an array.")
    normalized = []
    seen = set()
    for item in value:
        if not isinstance(item, dict):
            raise ValueError("Each locked tile must be an object.")
        try:
            x = int(item.get("x"))
            y = int(item.get("y"))
            z = int(item.get("z"))
        except (TypeError, ValueError):
            raise ValueError("Locked tile coordinates must be numbers.")
        if x < 0 or y < 0 or z < 0:
            raise ValueError("Locked tile coordinates cannot be negative.")
        key = (x, y, z)
        if key not in seen:
            seen.add(key)
            normalized.append({"x": x, "y": y, "z": z})
    return normalized


def auth_user(request):
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    token = header.replace("Bearer ", "", 1).strip()
    try:
        token_obj = AuthToken.objects.select_related("user").get(token=token)
        return token_obj.user
    except AuthToken.DoesNotExist:
        return None


def mask_to_points(mask):
    if isinstance(mask, list) and mask and isinstance(mask[0], str):
        return sum(row.count("#") for row in mask)
    if isinstance(mask, list):
        return sum(row.count("#") for level in mask for row in level)
    return 0


def user_payload(user):
    profile, _ = Profile.objects.get_or_create(user=user, defaults={"city": "Almaty"})
    achievements = compute_achievements(user)
    return {
        "id": user.id,
        "username": user.username,
        "city": profile.city,
        "is_pro": profile.is_pro,
        "xp": achievements["xp"],
        "rank": achievements["rank"],
        "next_rank_xp": achievements["next_rank_xp"],
        "total_wins": achievements["total_wins"],
        "classic_wins": achievements["classic_wins"],
        "daily_wins": achievements["daily_wins"],
        "layout_count": achievements["layout_count"],
        "achievements": achievements["achievements"],
    }


@require_GET
def health(request):
    return JsonResponse({"status": "ok"})


@csrf_exempt
@require_POST
def register(request):
    if not request.body.strip():
        return JsonResponse({"detail": "Empty body. Send JSON: username, password, city."}, status=400)
    data = read_json(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    city = (data.get("city") or "").strip()
    errors = []
    if len(username) < 3:
        errors.append("username must be at least 3 characters")
    if len(password) < 6:
        errors.append("password must be at least 6 characters")
    if len(city) < 2:
        errors.append("city is required (min 2 characters)")
    if errors:
        return JsonResponse({"detail": "; ".join(errors), "errors": errors}, status=400)
    if User.objects.filter(username=username).exists():
        return JsonResponse({"detail": "Username already exists — try Login or pick another name."}, status=400)
    try:
        with transaction.atomic():
            user = User.objects.create_user(username=username, password=password)
            Profile.objects.create(user=user, city=city)
            token = secrets.token_hex(24)
            AuthToken.objects.create(user=user, token=token)
    except ValidationError as exc:
        msgs = [str(m) for m in exc.messages] if exc.messages else [str(exc)]
        return JsonResponse({"detail": " ".join(msgs)}, status=400)
    except ValueError as exc:
        return JsonResponse({"detail": str(exc)}, status=400)
    return JsonResponse({"token": token, "user": user_payload(user)})


@csrf_exempt
@require_POST
def login(request):
    data = read_json(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = authenticate(username=username, password=password)
    if not user:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)
    token = secrets.token_hex(24)
    AuthToken.objects.create(user=user, token=token)
    return JsonResponse({"token": token, "user": user_payload(user)})


@require_GET
def me(request):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)
    return JsonResponse(user_payload(user))


@csrf_exempt
def pro_layouts(request):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)

    profile, _ = Profile.objects.get_or_create(user=user, defaults={"city": "Almaty"})
    if not profile.is_pro:
        return JsonResponse({"detail": "Pro feature only"}, status=403)

    if request.method == "GET":
        layouts = (
            CustomLayout.objects.filter(user=user)
            .select_related("user")
            .annotate(ratings_total=Count("ratings"), ratings_average=Avg("ratings__score"))
        )
        items = [
            {
                "id": layout.pk,
                "name": layout.name,
                "mask": json.loads(layout.mask),
                "play_mode": layout.play_mode,
                "locked_tiles": json.loads(layout.locked_tiles),
                "created_at": layout.created_at.isoformat(),
                "is_shared": layout.is_shared,
                "total_plays": layout.total_plays,
                "rating_count": layout.ratings_total,
                "avg_rating": round(layout.ratings_average or 0, 2),
            }
            for layout in layouts
        ]
        return JsonResponse({"items": items})

    if request.method == "POST":
        data = read_json(request)
        if data is None:
            return JsonResponse({"detail": "Invalid JSON body."}, status=400)

        name = (data.get("name") or "").strip()
        mask = data.get("mask")
        locked_tiles = data.get("locked_tiles", [])
        if len(name) < 2:
            return JsonResponse({"detail": "Layout name must be at least 2 characters."}, status=400)
        try:
            normalized = normalize_layout_mask(mask)
            play_mode = normalize_play_mode(data.get("play_mode"))
            normalized_locks = normalize_locked_tiles(locked_tiles)
        except ValueError as exc:
            return JsonResponse({"detail": str(exc)}, status=400)

        CustomLayout.objects.create(
            user=user,
            name=name,
            mask=json.dumps(normalized),
            play_mode=play_mode,
            locked_tiles=json.dumps(normalized_locks if play_mode == "fog" else []),
        )
        return JsonResponse({"ok": True})

    return JsonResponse({"detail": "Method not allowed."}, status=405)


@csrf_exempt
def share_layout(request, layout_id):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)

    profile, _ = Profile.objects.get_or_create(user=user, defaults={"city": "Almaty"})
    if not profile.is_pro:
        return JsonResponse({"detail": "Pro feature only"}, status=403)

    try:
        layout = CustomLayout.objects.get(id=layout_id, user=user)
    except CustomLayout.DoesNotExist:
        return JsonResponse({"detail": "Layout not found."}, status=404)

    if request.method == "POST":
        data = read_json(request)
        if data is None:
            return JsonResponse({"detail": "Invalid JSON body."}, status=400)
        share_value = bool(data.get("shared", True))
        layout.is_shared = share_value
        layout.save()
        return JsonResponse({"ok": True, "is_shared": layout.is_shared})

    return JsonResponse({"detail": "Method not allowed."}, status=405)


@require_GET
def shared_layouts(request):
    layouts = (
        CustomLayout.objects.filter(is_shared=True)
        .select_related("user")
        .annotate(ratings_total=Count("ratings"), ratings_average=Avg("ratings__score"))
    )
    items = []
    for layout in layouts:
        layout_mask = json.loads(layout.mask)
        items.append(
            {
                "id": layout.pk,
                "name": layout.name,
                "username": layout.user.username,
                "mask": layout_mask,
                "play_mode": layout.play_mode,
                "locked_tiles": json.loads(layout.locked_tiles),
                "created_at": layout.created_at.isoformat(),
                "total_plays": layout.total_plays,
                "rating_count": layout.ratings_total,
                "avg_rating": round(layout.ratings_average or 0, 2),
                "tiles_count": mask_to_points(layout_mask),
                "difficulty": "Custom",
                "shared": layout.is_shared,
            }
        )
    return JsonResponse({"items": items})


@csrf_exempt
@require_POST
def record_shared_layout_play(request, layout_id):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)
    updated = CustomLayout.objects.filter(id=layout_id, is_shared=True).update(total_plays=F("total_plays") + 1)
    if not updated:
        return JsonResponse({"detail": "Layout not found."}, status=404)
    layout = CustomLayout.objects.get(id=layout_id)
    return JsonResponse({"ok": True, "total_plays": layout.total_plays})


@csrf_exempt
def rate_shared_layout(request, layout_id):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)
    data = read_json(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)
    score = int(data.get("score", 0))
    if score < 1 or score > 5:
        return JsonResponse({"detail": "Score must be between 1 and 5."}, status=400)
    try:
        layout = CustomLayout.objects.get(id=layout_id, is_shared=True)
    except CustomLayout.DoesNotExist:
        return JsonResponse({"detail": "Layout not found."}, status=404)
    rating, created = CustomLayoutRating.objects.update_or_create(
        layout=layout,
        user=user,
        defaults={"score": score},
    )
    return JsonResponse({"ok": True, "rating": score, "created": created})


@require_GET
def daily_challenge(request):
    return JsonResponse({"date_key": utc_today_key(), "seed": daily_seed()})


def result_payload(item):
    return {
        "username": item.user.username,
        "city": item.city,
        "score": item.score,
        "time_seconds": item.time_seconds,
        "difficulty": item.difficulty,
        "hints_used": item.hints_used,
        "created_at": item.created_at.isoformat(),
    }


@require_GET
def daily_summary(request):
    user = auth_user(request)
    today_key = utc_today_key()
    today_results = GameResult.objects.filter(game_date=today_key, mode="daily")
    today_wins = today_results.filter(won=True).select_related("user").order_by("-score", "time_seconds", "hints_used")
    user_results = GameResult.objects.none()
    if user:
        user_results = today_results.filter(user=user).order_by("-created_at")
    user_best = user_results.filter(won=True).order_by("-score", "time_seconds", "hints_used").first()
    user_rank = None
    if user_best:
        for index, item in enumerate(today_wins, start=1):
            if item.user_id == user.id:
                user_rank = index
                break

    archive_dates = (
        GameResult.objects.filter(mode="daily", won=True)
        .exclude(game_date=today_key)
        .values_list("game_date", flat=True)
        .distinct()
        .order_by("-game_date")[:7]
    )
    archive = []
    for date_key in archive_dates:
        winners = (
            GameResult.objects.filter(game_date=date_key, mode="daily", won=True)
            .select_related("user")
            .order_by("-score", "time_seconds", "hints_used")[:5]
        )
        archive.append(
            {
                "date_key": date_key,
                "entries": [result_payload(item) for item in winners],
            }
        )

    return JsonResponse(
        {
            "date_key": today_key,
            "seed": daily_seed(),
            "attempts_today": user_results.count() if user else 0,
            "user_best": result_payload(user_best) if user_best else None,
            "user_rank": user_rank,
            "today_leaderboard": [result_payload(item) for item in today_wins[:30]],
            "archive": archive,
        }
    )


@csrf_exempt
@require_POST
def game_result(request):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)
    data = read_json(request)
    if data is None:
        return JsonResponse({"detail": "Invalid JSON body."}, status=400)
    profile, _ = Profile.objects.get_or_create(user=user, defaults={"city": "Almaty"})
    hints_used = int(data.get("hints_used", 0))
    mode = data.get("mode", "classic")
    difficulty = data.get("difficulty", "medium")
    won = bool(data.get("won", False))
    GameResult.objects.create(
        user=user,
        game_date=utc_today_key(),
        mode=mode,
        difficulty=difficulty,
        score=int(data.get("score", 0)),
        time_seconds=int(data.get("time_seconds", 0)),
        hints_used=hints_used,
        won=won,
        city=profile.city,
    )
    if won and mode in ("classic", "daily"):
        profile.xp += xp_for_game(mode, difficulty)
        profile.save()
    return JsonResponse({"ok": True})


@require_GET
def game_history(request):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)
    rows = (
        GameResult.objects.filter(user=user)
        .order_by("-id")
        .values("mode", "difficulty", "score", "time_seconds", "won", "created_at")[:20]
    )
    return JsonResponse({"items": list(rows)})


@require_GET
def leaderboard_daily(request):
    city = (request.GET.get("city") or "").strip()
    qs = GameResult.objects.filter(game_date=utc_today_key(), mode="daily", won=True).select_related("user")
    if city:
        qs = qs.filter(city=city)
    rows = []
    for item in qs.order_by("-score", "time_seconds")[:30]:
        rows.append(
            {
                "username": item.user.username,
                "city": item.city,
                "score": item.score,
                "time_seconds": item.time_seconds,
                "difficulty": item.difficulty,
            }
        )
    return JsonResponse({"items": rows})


@require_GET
def leaderboard_cities(request):
    qs = GameResult.objects.filter(game_date=utc_today_key(), mode="classic", won=True)
    grouped = qs.values("city").annotate(best_score=Max("score"), best_time=Min("time_seconds")).order_by("-best_score", "best_time")[:20]
    return JsonResponse({"items": list(grouped)})


@require_GET
def coach(request):
    pairs_left = int(request.GET.get("pairs_left", "0"))
    top_layer_free = int(request.GET.get("top_layer_free", "0"))
    blocked_risk = int(request.GET.get("blocked_risk", "0"))
    if pairs_left == 0:
        tip = "No free pairs now. Shuffle can reopen paths."
    elif top_layer_free > 2:
        tip = "Open top-layer tiles first to reduce future lock-ins."
    elif blocked_risk > 3:
        tip = "Avoid removing both side exits in one zone."
    else:
        tip = "Board is stable. Keep hints for endgame."
    return JsonResponse({"tip": tip})


@csrf_exempt
@require_POST
def upgrade_pro(request):
    user = auth_user(request)
    if not user:
        return JsonResponse({"detail": "Unauthorized"}, status=401)
    
    profile, _ = Profile.objects.get_or_create(user=user, defaults={"city": "Almaty"})
    
    if profile.is_pro:
        return JsonResponse({"detail": "Already a Pro member"}, status=400)
    
    try:
        # Create Stripe customer if not exists
        if not profile.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.username,
                metadata={"user_id": user.id}
            )
            profile.stripe_customer_id = customer.id
            profile.save()
        
        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=profile.stripe_customer_id,
            payment_method_types=["card"],
            mode="payment",
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": "Mahjong Pro",
                            "description": "Unlock Pro features",
                        },
                        "unit_amount": 1000,  # $10.00
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{os.getenv('FRONTEND_URL')}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/",
            metadata={"user_id": user.id}
        )
        return JsonResponse({"checkout_url": session.url})
    except stripe_error.StripeError as e:
        return JsonResponse({"detail": str(e)}, status=400)



@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')  # You'll get this from Stripe
    
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
    except ValueError:
        return JsonResponse({'error': 'Invalid payload'}, status=400)
    except stripe_error.SignatureVerificationError:
        return JsonResponse({'error': 'Invalid signature'}, status=400)
    
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session['metadata']['user_id']
        
        # Mark user as Pro
        try:
            profile = Profile.objects.get(user_id=user_id)
            profile.is_pro = True
            profile.save()
        except Profile.DoesNotExist:
            pass  # Handle error
    
    return JsonResponse({'status': 'success'})
