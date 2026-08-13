from django.db import migrations


EVERGREEN_INTERNSHIP_TITLE = "Permohonan Latihan Industri DBKU"


def ensure_evergreen_internship_vacancy(apps, _schema_editor):
    Vacancy = apps.get_model("jobs", "Vacancy")
    vacancy = Vacancy.objects.filter(
        title=EVERGREEN_INTERNSHIP_TITLE,
        vacancy_type="internship",
    ).first()

    defaults = {
        "department": "Pengurusan Sumber Manusia",
        "division": "Bahagian Pengurusan Sumber Manusia",
        "employment_type": "Latihan Industri",
        "location": "Kuching, Sarawak",
        "status": "open",
        "summary": (
            "Permohonan latihan industri DBKU dibuka sepanjang tahun untuk pelajar "
            "yang ingin menjalani latihan industri."
        ),
        "responsibilities": "Tertakluk kepada penempatan dan keperluan semasa DBKU.",
        "requirements": "Terbuka kepada pelajar institusi, kolej atau universiti yang memerlukan penempatan latihan industri.",
        "application_instructions": "Lengkapkan borang permohonan latihan industri secara dalam talian melalui Portal Kerjaya DBKU.",
        "application_notes": "Permohonan latihan industri diterima sepanjang tahun.",
        "closing_date": None,
    }

    if vacancy:
        for field, value in defaults.items():
            setattr(vacancy, field, value)
        vacancy.save(update_fields=[*defaults.keys(), "updated_at"])
        return

    Vacancy.objects.create(
        title=EVERGREEN_INTERNSHIP_TITLE,
        vacancy_type="internship",
        **defaults,
    )


class Migration(migrations.Migration):
    dependencies = [("jobs", "0005_vacancy_official_document_original_name")]

    operations = [
        migrations.RunPython(ensure_evergreen_internship_vacancy, migrations.RunPython.noop),
    ]
