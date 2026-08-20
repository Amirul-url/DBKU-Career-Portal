import json

from django.utils import timezone
from rest_framework import serializers

from jobs.serializers import VacancySerializer

from .models import CandidateApplication


REAPPLY_ALLOWED_STATUSES = {"rejected", "withdrawn"}


class CandidateApplicationSerializer(serializers.ModelSerializer):
    vacancy_detail = VacancySerializer(source="vacancy", read_only=True)
    applicant_name = serializers.SerializerMethodField()
    document_files = serializers.SerializerMethodField()
    universityLetterFile = serializers.FileField(required=False, write_only=True)
    transcriptFile = serializers.FileField(required=False, write_only=True)
    resumeFile = serializers.FileField(required=False, write_only=True)
    passportPhotoFile = serializers.FileField(required=False, write_only=True)
    bankAccountFile = serializers.FileField(required=False, write_only=True)
    organizationFeedbackDocument = serializers.FileField(required=False, write_only=True)

    document_upload_fields = {
        "universityLetterFile": ("internship_university_letter", "internship_university_letter_original_name"),
        "transcriptFile": ("internship_transcript", "internship_transcript_original_name"),
        "resumeFile": ("internship_resume", "internship_resume_original_name"),
        "passportPhotoFile": ("internship_passport_photo", "internship_passport_photo_original_name"),
        "bankAccountFile": ("internship_bank_account", "internship_bank_account_original_name"),
        "organizationFeedbackDocument": ("organization_feedback_document", "organization_feedback_document_original_name"),
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
            "organizationFeedbackDocument",
            "profile_data",
            "latest_remark",
            "assigned_department",
            "submitted_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reference_no",
            "applicant",
            "applicant_name",
            "assigned_department",
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

    def validate_organizationFeedbackDocument(self, value):
        is_pdf_content = getattr(value, "content_type", "") == "application/pdf"
        is_pdf_name = value.name.lower().endswith(".pdf")
        if not (is_pdf_content or is_pdf_name):
            raise serializers.ValidationError("Format fail mesti PDF sahaja.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if self.instance:
            return attrs

        request = self.context.get("request")
        user = getattr(request, "user", None)
        vacancy = attrs.get("vacancy")
        if not user or not getattr(user, "is_authenticated", False) or not vacancy:
            return attrs

        has_active_application = CandidateApplication.objects.filter(
            applicant=user,
            vacancy=vacancy,
        ).exclude(status__in=REAPPLY_ALLOWED_STATUSES).exists()
        if has_active_application:
            raise serializers.ValidationError({
                "vacancy": "Anda sudah mempunyai permohonan aktif untuk peluang ini.",
            })

        return attrs

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
