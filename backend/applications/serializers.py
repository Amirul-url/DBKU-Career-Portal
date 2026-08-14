import json

from django.utils import timezone
from rest_framework import serializers

from jobs.serializers import VacancySerializer

from .models import CandidateApplication


class CandidateApplicationSerializer(serializers.ModelSerializer):
    vacancy_detail = VacancySerializer(source="vacancy", read_only=True)
    applicant_name = serializers.SerializerMethodField()
    document_files = serializers.SerializerMethodField()
    universityLetterFile = serializers.FileField(required=False, write_only=True)
    transcriptFile = serializers.FileField(required=False, write_only=True)
    resumeFile = serializers.FileField(required=False, write_only=True)
    passportPhotoFile = serializers.FileField(required=False, write_only=True)
    bankAccountFile = serializers.FileField(required=False, write_only=True)

    document_upload_fields = {
        "universityLetterFile": ("internship_university_letter", "internship_university_letter_original_name"),
        "transcriptFile": ("internship_transcript", "internship_transcript_original_name"),
        "resumeFile": ("internship_resume", "internship_resume_original_name"),
        "passportPhotoFile": ("internship_passport_photo", "internship_passport_photo_original_name"),
        "bankAccountFile": ("internship_bank_account", "internship_bank_account_original_name"),
    }

    class Meta:
        model = CandidateApplication
        fields = (
            "id",
            "reference_no",
            "vacancy",
            "vacancy_detail",
            "applicant",
            "applicant_name",
            "status",
            "cover_letter",
            "resume",
            "document_files",
            "universityLetterFile",
            "transcriptFile",
            "resumeFile",
            "passportPhotoFile",
            "bankAccountFile",
            "profile_data",
            "latest_remark",
            "submitted_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reference_no",
            "applicant",
            "applicant_name",
            "submitted_at",
            "created_at",
            "updated_at",
        )

    def get_applicant_name(self, obj):
        return obj.applicant.get_full_name() or obj.applicant.username

    def get_document_files(self, obj):
        documents = {}
        request = self.context.get("request")
        for public_field, (file_field, original_name_field) in self.document_upload_fields.items():
            uploaded_file = getattr(obj, file_field)
            if not uploaded_file:
                continue

            url = uploaded_file.url
            if request:
                url = request.build_absolute_uri(url)
            documents[public_field] = {
                "name": getattr(obj, original_name_field) or uploaded_file.name.rsplit("/", 1)[-1],
                "url": url,
            }
        return documents

    def validate_profile_data(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError as error:
                raise serializers.ValidationError("Format profile_data tidak sah.") from error
        return value

    def pop_document_uploads(self, validated_data):
        uploads = {}
        for public_field in self.document_upload_fields:
            uploaded_file = validated_data.pop(public_field, None)
            if uploaded_file:
                uploads[public_field] = uploaded_file
        return uploads

    def apply_document_uploads(self, instance, uploads):
        if not uploads:
            return instance

        profile_data = dict(instance.profile_data or {})
        documents = dict(profile_data.get("documents") or {})

        for public_field, uploaded_file in uploads.items():
            file_field, original_name_field = self.document_upload_fields[public_field]
            setattr(instance, file_field, uploaded_file)
            setattr(instance, original_name_field, uploaded_file.name)
            documents[public_field] = {"name": uploaded_file.name}

        profile_data["documents"] = documents
        instance.profile_data = profile_data
        return instance

    def create(self, validated_data):
        user = self.context["request"].user
        uploads = self.pop_document_uploads(validated_data)
        application = CandidateApplication.objects.create(applicant=user, **validated_data)
        self.apply_document_uploads(application, uploads)
        if uploads:
            application.save()
        return application

    def update(self, instance, validated_data):
        uploads = self.pop_document_uploads(validated_data)
        new_status = validated_data.get("status")
        if new_status == "submitted" and instance.status == "draft" and not instance.submitted_at:
            validated_data["submitted_at"] = timezone.now()
        instance = super().update(instance, validated_data)
        self.apply_document_uploads(instance, uploads)
        if uploads:
            instance.save()
        return instance
