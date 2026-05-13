from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_profile_xp_and_hints"),
    ]

    operations = [
        migrations.AddField(
            model_name="customlayout",
            name="is_shared",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="CustomLayoutRating",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("score", models.IntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("layout", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="ratings", to="core.customlayout")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, to="auth.user")),
            ],
            options={
                "unique_together": {("layout", "user")},
            },
        ),
    ]
