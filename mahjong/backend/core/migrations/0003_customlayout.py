from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_profile_pro_subscription"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomLayout",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=128)),
                ("mask", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, to="auth.user")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
    ]
