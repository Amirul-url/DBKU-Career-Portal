from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("jobs", "0004_vacancy_division")]

    operations = [
        migrations.AddField(
            model_name="vacancy",
            name="official_document_original_name",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
