from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    city = models.CharField(max_length=64)
    is_pro = models.BooleanField(default=False)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    xp = models.IntegerField(default=0)


class CustomLayout(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=128)
    mask = models.TextField()
    is_shared = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def average_rating(self):
        ratings = self.ratings.all()
        if not ratings:
            return 0.0
        return sum(r.score for r in ratings) / ratings.count()

    @property
    def rating_count(self):
        return self.ratings.count()


class CustomLayoutRating(models.Model):
    layout = models.ForeignKey(CustomLayout, on_delete=models.CASCADE, related_name="ratings")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("layout", "user")


class AuthToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class GameResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    game_date = models.CharField(max_length=32)
    mode = models.CharField(max_length=16)
    difficulty = models.CharField(max_length=16)
    score = models.IntegerField()
    time_seconds = models.IntegerField()
    hints_used = models.IntegerField(default=0)
    won = models.BooleanField(default=False)
    city = models.CharField(max_length=64)
    created_at = models.DateTimeField(auto_now_add=True)
