from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0008_user_video_resume_url"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="department_role",
            field=models.CharField(blank=True, max_length=40),
        ),
    ]
