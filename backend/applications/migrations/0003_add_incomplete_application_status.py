from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0002_candidateapplication_internship_bank_account_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="candidateapplication",
            name="status",
            field=models.CharField(
                choices=[
                    ("draft", "Draft"),
                    ("submitted", "Submitted"),
                    ("screening", "Screening"),
                    ("incomplete", "Incomplete"),
                    ("shortlisted", "Shortlisted"),
                    ("interview", "Interview"),
                    ("offered", "Offered"),
                    ("accepted", "Accepted"),
                    ("rejected", "Rejected"),
                    ("withdrawn", "Withdrawn"),
                ],
                default="draft",
                max_length=20,
            ),
        ),
    ]
