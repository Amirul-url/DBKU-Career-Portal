from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("applications", "0005_candidateapplication_assigned_department"),
    ]

    operations = [
        migrations.AddField(
            model_name="candidateapplication",
            name="organization_feedback_document",
            field=models.FileField(blank=True, upload_to="organization_feedback_documents/"),
        ),
        migrations.AddField(
            model_name="candidateapplication",
            name="organization_feedback_document_original_name",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
