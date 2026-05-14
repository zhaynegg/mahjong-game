from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0006_customlayout_total_plays"),
    ]

    operations = [
        migrations.AddField(
            model_name="customlayout",
            name="play_mode",
            field=models.CharField(default="classic", max_length=16),
        ),
        migrations.AddField(
            model_name="customlayout",
            name="locked_tiles",
            field=models.TextField(default="[]"),
        ),
    ]
