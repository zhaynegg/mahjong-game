from django.urls import path

from . import views

urlpatterns = [
    path("health", views.health),
    path("auth/register", views.register),
    path("auth/login", views.login),
    path("me", views.me),
    path("daily-challenge", views.daily_challenge),
    path("daily/summary", views.daily_summary),
    path("game/result", views.game_result),
    path("game/history", views.game_history),
    path("leaderboard/daily", views.leaderboard_daily),
    path("leaderboard/cities", views.leaderboard_cities),
    path("coach", views.coach),
    path("pro/layouts", views.pro_layouts),
    path("pro/layouts/<int:layout_id>/share", views.share_layout),
    path("shared-layouts", views.shared_layouts),
    path("shared-layouts/<int:layout_id>/play", views.record_shared_layout_play),
    path("shared-layouts/<int:layout_id>/rate", views.rate_shared_layout),
    path("upgrade-pro", views.upgrade_pro),
    path("stripe-webhook", views.stripe_webhook),
]
