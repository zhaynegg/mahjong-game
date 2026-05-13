# Generated migration for adding Pro subscription fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="is_pro",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="profile",
            name="stripe_customer_id",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
