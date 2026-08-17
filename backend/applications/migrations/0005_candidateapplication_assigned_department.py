from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0004_remove_application_unique_constraint"),
    ]

    operations = [
        migrations.AddField(
            model_name="candidateapplication",
            name="assigned_department",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddIndex(
            model_name="candidateapplication",
            index=models.Index(fields=["assigned_department"], name="cand_assigned_dept_idx"),
        ),
    ]
