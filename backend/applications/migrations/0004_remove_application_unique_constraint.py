from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0003_add_incomplete_application_status"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="candidateapplication",
            name="unique_application_per_vacancy_applicant",
        ),
    ]
