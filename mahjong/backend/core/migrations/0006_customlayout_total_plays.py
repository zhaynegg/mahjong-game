from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_customlayout_share_rating"),
    ]

    operations = [
        migrations.AddField(
            model_name="customlayout",
            name="total_plays",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
