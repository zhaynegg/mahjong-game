from django.contrib import admin

from .models import AuthToken, GameResult, Profile

admin.site.register(Profile)
admin.site.register(AuthToken)
admin.site.register(GameResult)
