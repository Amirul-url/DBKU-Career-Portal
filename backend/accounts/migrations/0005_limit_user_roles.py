from django.db import migrations, models


def convert_legacy_staff_roles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(role__in=["hr", "reviewer"]).update(role="admin")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_applicantprofiledata"),
    ]

    operations = [
        migrations.RunPython(convert_legacy_staff_roles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("superadmin", "Super Admin"),
                    ("admin", "Pentadbir"),
                    ("applicant", "Pemohon"),
                ],
                default="applicant",
                max_length=20,
            ),
        ),
    ]
