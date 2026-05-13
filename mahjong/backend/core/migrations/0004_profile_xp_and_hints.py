from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_customlayout"),
    ]

    operations = [
        migrations.AddField(
            model_name="profile",
            name="xp",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="gameresult",
            name="hints_used",
            field=models.IntegerField(default=0),
        ),
    ]
