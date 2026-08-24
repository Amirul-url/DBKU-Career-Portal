import json
import os
import re
from datetime import date, datetime
from uuid import uuid4

from django.core.files.storage import default_storage
from django.utils import timezone
from django.utils.text import get_valid_filename
from rest_framework import serializers

from jobs.serializers import VacancySerializer

from .models import CandidateApplication
from .services import notify_organization_feedback_released


REAPPLY_ALLOWED_STATUSES = {"rejected", "withdrawn"}
MALAY_MONTH_NUMBERS = {
    "januari": 1,
    "jan": 1,
    "februari": 2,
    "feb": 2,
    "mac": 3,
    "march": 3,
    "april": 4,
    "apr": 4,
    "mei": 5,
    "may": 5,
    "jun": 6,
    "june": 6,
    "julai": 7,
    "july": 7,
    "ogos": 8,
    "aug": 8,
    "august": 8,
    "september": 9,
    "sep": 9,
    "oktober": 10,
    "oct": 10,
    "november": 11,
    "nov": 11,
    "disember": 12,
    "dec": 12,
    "december": 12,
}


def has_organization_feedback_been_released(profile_data):
    release = (profile_data or {}).get("organization_feedback_release") or {}
    return bool(release.get("sent_to_applicant_at"))


def parse_date_value(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    text = str(value or "").strip()
    if not text:
        return None

    iso_match = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", text)
    if iso_match:
        return date(int(iso_match.group(1)), int(iso_match.group(2)), int(iso_match.group(3)))

    malay_match = re.match(r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", text)
    if malay_match:
        month = MALAY_MONTH_NUMBERS.get(malay_match.group(2).lower())
        if month:
            return date(int(malay_match.group(3)), month, int(malay_match.group(1)))

    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def parse_internship_period_text(value):
    parts = re.split(r"\s+-\s+|\s+hingga\s+|\s+to\s+", str(value or "").strip(), maxsplit=1, flags=re.IGNORECASE)
    if len(parts) != 2:
        return None
    start_date = parse_date_value(parts[0])
    end_date = parse_date_value(parts[1])
    if start_date and end_date:
        return start_date, end_date
    return None


def get_first_available_value(*values):
    return next((value for value in values if str(value or "").strip()), "")


def get_internship_period_range(profile_data):
    release = (profile_data or {}).get("organization_feedback_release") or {}
    release_range = parse_internship_period_text(release.get("internship_period"))
    if release_range:
        return release_range

    student_info = (profile_data or {}).get("student_info") or {}
    start_date = parse_date_value(get_first_available_value(
        student_info.get("trainingStartDate"),
        student_info.get("training_start_date"),
        student_info.get("internshipStartDate"),
        student_info.get("internship_start_date"),
        student_info.get("practicalStartDate"),
    ))
    end_date = parse_date_value(get_first_available_value(
        student_info.get("trainingEndDate"),
        student_info.get("training_end_date"),
        student_info.get("internshipEndDate"),
        student_info.get("internship_end_date"),
        student_info.get("practicalEndDate"),
    ))
    if start_date and end_date:
        return start_date, end_date

    return parse_internship_period_text(student_info.get("trainingPeriod") or student_info.get("internshipPeriod"))


def is_completed_internship_application(application, today=None):
    if application.vacancy.vacancy_type != "internship":
        return False

    profile_data = application.profile_data or {}
    confirmation = profile_data.get("applicant_confirmation") or {}
    if confirmation.get("status") != "agreed":
        return False

    internship_range = get_internship_period_range(profile_data)
    if not internship_range:
        return False

    _start_date, end_date = internship_range
    return (today or timezone.localdate()) > end_date


def can_create_new_application_after(application, today=None):
    return application.status in REAPPLY_ALLOWED_STATUSES or is_completed_internship_application(application, today)


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
    organizationFeedbackDocuments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        write_only=True,
    )
    clearOrganizationFeedbackDocument = serializers.BooleanField(required=False, write_only=True)
    clearOrganizationFeedbackDocumentId = serializers.CharField(required=False, write_only=True, allow_blank=True)

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
            "organizationFeedbackDocuments",
            "clearOrganizationFeedbackDocument",
            "clearOrganizationFeedbackDocumentId",
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
            if public_field == "organizationFeedbackDocument" and not self.can_view_organization_feedback_documents(obj):
                continue
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
        organization_feedback_documents = self.serialize_organization_feedback_documents(obj)
        if organization_feedback_documents and self.can_view_organization_feedback_documents(obj):
            documents["organizationFeedbackDocuments"] = organization_feedback_documents
        applicant_confirmation_documents = self.serialize_applicant_confirmation_documents(obj)
        if applicant_confirmation_documents:
            documents["applicantConfirmationDocuments"] = applicant_confirmation_documents
        return documents

    def can_view_organization_feedback_documents(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not request or not user or not getattr(user, "is_authenticated", False):
            return True
        if getattr(user, "role", "") in {"admin", "superadmin"}:
            return True

        profile_data = dict(obj.profile_data or {})
        feedback_release = profile_data.get("organization_feedback_release") or {}
        return bool(feedback_release.get("sent_to_applicant_at"))

    def build_absolute_file_url(self, file_path):
        url = default_storage.url(file_path)
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return url

    def format_file_size(self, size):
        try:
            size = int(size)
        except (TypeError, ValueError):
            size = 0

        if size <= 0:
            return ""
        if size < 1024:
            return f"{size} B"
        if size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        return f"{size / (1024 * 1024):.1f} MB"

    def serialize_organization_feedback_documents(self, obj):
        profile_data = dict(obj.profile_data or {})
        stored_documents = profile_data.get("organization_feedback_documents") or []
        documents = []

        for index, document in enumerate(stored_documents, start=1):
            if not isinstance(document, dict):
                continue
            file_path = document.get("path")
            if not file_path:
                continue
            size = document.get("size") or 0
            documents.append({
                "id": document.get("id") or str(index),
                "name": document.get("name") or os.path.basename(file_path),
                "url": self.build_absolute_file_url(file_path),
                "size": size,
                "size_label": self.format_file_size(size),
                "uploaded_at": document.get("uploaded_at") or "",
            })

        if not documents and obj.organization_feedback_document:
            size = getattr(obj.organization_feedback_document, "size", 0) or 0
            documents.append({
                "id": "legacy",
                "name": obj.organization_feedback_document_original_name
                or obj.organization_feedback_document.name.rsplit("/", 1)[-1],
                "url": self.build_absolute_file_url(obj.organization_feedback_document.name),
                "size": size,
                "size_label": self.format_file_size(size),
                "uploaded_at": profile_data.get("organization_feedback", {}).get("uploaded_at", ""),
            })

        return documents

    def serialize_applicant_confirmation_documents(self, obj):
        profile_data = dict(obj.profile_data or {})
        stored_documents = profile_data.get("applicant_confirmation_documents") or []
        documents = []

        for index, document in enumerate(stored_documents, start=1):
            if not isinstance(document, dict):
                continue
            file_path = document.get("path")
            if not file_path:
                continue
            size = document.get("size") or 0
            documents.append({
                "id": document.get("id") or str(index),
                "name": document.get("name") or os.path.basename(file_path),
                "url": self.build_absolute_file_url(file_path),
                "size": size,
                "size_label": self.format_file_size(size),
                "uploaded_at": document.get("uploaded_at") or "",
            })

        return documents

    def validate_profile_data(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError as error:
                raise serializers.ValidationError("Format profile_data tidak sah.") from error
        return value

    def validate_organizationFeedbackDocument(self, value):
        return self.validate_pdf_document(value)

    def validate_organizationFeedbackDocuments(self, value):
        for uploaded_file in value:
            self.validate_pdf_document(uploaded_file)
        return value

    def validate_organization_feedback_pdf(self, value):
        return self.validate_pdf_document(value)

    def validate_pdf_document(self, value):
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

        existing_applications = CandidateApplication.objects.filter(
            applicant=user,
            vacancy=vacancy,
        )
        has_active_application = any(
            not can_create_new_application_after(application)
            for application in existing_applications
        )
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

    def pop_organization_feedback_document_uploads(self, validated_data):
        uploads = list(validated_data.pop("organizationFeedbackDocuments", []) or [])
        request = self.context.get("request")

        if request:
            request_files = []
            for field_name in ("organizationFeedbackDocuments", "organizationFeedbackDocuments[]"):
                request_files.extend(request.FILES.getlist(field_name))
            for uploaded_file in request_files:
                if uploaded_file not in uploads:
                    self.validate_organization_feedback_pdf(uploaded_file)
                    uploads.append(uploaded_file)

        return uploads

    def get_applicant_confirmation_document_uploads(self, request):
        uploads = []
        for field_name in ("applicantConfirmationDocuments", "applicantConfirmationDocuments[]"):
            uploads.extend(request.FILES.getlist(field_name))
        for uploaded_file in uploads:
            self.validate_pdf_document(uploaded_file)
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

    def save_organization_feedback_documents(self, instance, uploads):
        if not uploads:
            return instance

        profile_data = dict(instance.profile_data or {})
        documents = [
            document
            for document in profile_data.get("organization_feedback_documents", [])
            if isinstance(document, dict)
        ]

        for uploaded_file in uploads:
            safe_name = get_valid_filename(uploaded_file.name or "maklumbalas-organisasi.pdf")
            _, extension = os.path.splitext(safe_name)
            extension = extension or ".pdf"
            document_id = uuid4().hex
            saved_path = default_storage.save(
                f"organization_feedback_documents/{document_id}{extension}",
                uploaded_file,
            )
            documents.append({
                "id": document_id,
                "name": uploaded_file.name,
                "path": saved_path,
                "size": getattr(uploaded_file, "size", 0) or 0,
                "uploaded_at": timezone.now().isoformat(),
            })

        profile_data["organization_feedback_documents"] = documents
        latest_document = documents[-1]
        profile_data["organization_feedback"] = {
            "file_name": latest_document.get("name", ""),
            "uploaded_at": latest_document.get("uploaded_at", ""),
        }
        instance.profile_data = profile_data
        return instance

    def save_applicant_confirmation_documents(self, instance, uploads, submitted_by=""):
        if not uploads:
            return instance

        profile_data = dict(instance.profile_data or {})
        documents = [
            document
            for document in profile_data.get("applicant_confirmation_documents", [])
            if isinstance(document, dict)
        ]

        for uploaded_file in uploads:
            safe_name = get_valid_filename(uploaded_file.name or "pengesahan-pemohon.pdf")
            _, extension = os.path.splitext(safe_name)
            extension = extension or ".pdf"
            document_id = uuid4().hex
            saved_path = default_storage.save(
                f"applicant_confirmation_documents/{document_id}{extension}",
                uploaded_file,
            )
            documents.append({
                "id": document_id,
                "name": uploaded_file.name,
                "path": saved_path,
                "size": getattr(uploaded_file, "size", 0) or 0,
                "uploaded_at": timezone.now().isoformat(),
            })

        submitted_at = timezone.now().isoformat()
        profile_data["applicant_confirmation_documents"] = documents
        profile_data["applicant_confirmation"] = {
            **(profile_data.get("applicant_confirmation") or {}),
            "status": "agreed",
            "submitted_at": submitted_at,
            "submitted_by": submitted_by,
            "statement":
                "Dengan ini, saya mengesahkan penerimaan tawaran menjalani latihan industri di "
                "Dewan Bandaraya Kuching Utara (DBKU) seperti yang dinyatakan.",
        }
        instance.profile_data = profile_data
        instance.status = "accepted"
        instance.save(update_fields=["status", "profile_data", "updated_at"])
        return instance

    def delete_organization_feedback_document_by_id(self, instance, document_id):
        if not document_id:
            return instance

        if document_id == "legacy":
            return self.clear_organization_feedback_document(instance)

        profile_data = dict(instance.profile_data or {})
        documents = []
        removed_document = None
        for document in profile_data.get("organization_feedback_documents", []) or []:
            if not isinstance(document, dict):
                continue
            if document.get("id") == document_id:
                removed_document = document
                continue
            documents.append(document)

        if removed_document:
            file_path = removed_document.get("path")
            if file_path and default_storage.exists(file_path):
                default_storage.delete(file_path)

        if documents:
            profile_data["organization_feedback_documents"] = documents
            latest_document = documents[-1]
            profile_data["organization_feedback"] = {
                "file_name": latest_document.get("name", ""),
                "uploaded_at": latest_document.get("uploaded_at", ""),
            }
        else:
            profile_data.pop("organization_feedback_documents", None)
            profile_data.pop("organization_feedback", None)
            profile_data.pop("organization_feedback_release", None)

        instance.profile_data = profile_data
        return instance

    def clear_organization_feedback_document(self, instance):
        if instance.organization_feedback_document:
            instance.organization_feedback_document.delete(save=False)
        instance.organization_feedback_document = ""
        instance.organization_feedback_document_original_name = ""

        profile_data = dict(instance.profile_data or {})
        for document in profile_data.get("organization_feedback_documents", []) or []:
            if not isinstance(document, dict):
                continue
            file_path = document.get("path")
            if file_path and default_storage.exists(file_path):
                default_storage.delete(file_path)
        profile_data.pop("organization_feedback_documents", None)
        profile_data.pop("organization_feedback", None)
        profile_data.pop("organization_feedback_release", None)
        documents = dict(profile_data.get("documents") or {})
        documents.pop("organizationFeedbackDocument", None)
        profile_data["documents"] = documents
        instance.profile_data = profile_data
        return instance

    def create(self, validated_data):
        user = self.context["request"].user
        uploads = self.pop_document_uploads(validated_data)
        organization_feedback_document_uploads = self.pop_organization_feedback_document_uploads(validated_data)
        validated_data.pop("clearOrganizationFeedbackDocument", None)
        validated_data.pop("clearOrganizationFeedbackDocumentId", None)
        application = CandidateApplication.objects.create(applicant=user, **validated_data)
        self.apply_document_uploads(application, uploads)
        self.save_organization_feedback_documents(application, organization_feedback_document_uploads)
        if uploads or organization_feedback_document_uploads:
            application.save()
        return application

    def update(self, instance, validated_data):
        uploads = self.pop_document_uploads(validated_data)
        organization_feedback_document_uploads = self.pop_organization_feedback_document_uploads(validated_data)
        clear_organization_feedback_document = validated_data.pop("clearOrganizationFeedbackDocument", False)
        clear_organization_feedback_document_id = validated_data.pop("clearOrganizationFeedbackDocumentId", "")
        was_organization_feedback_released = has_organization_feedback_been_released(instance.profile_data)
        new_status = validated_data.get("status")
        if new_status == "submitted" and instance.status == "draft" and not instance.submitted_at:
            validated_data["submitted_at"] = timezone.now()
        instance = super().update(instance, validated_data)
        if clear_organization_feedback_document:
            self.clear_organization_feedback_document(instance)
        elif clear_organization_feedback_document_id:
            self.delete_organization_feedback_document_by_id(instance, clear_organization_feedback_document_id)
        self.apply_document_uploads(instance, uploads)
        self.save_organization_feedback_documents(instance, organization_feedback_document_uploads)
        if (
            uploads
            or organization_feedback_document_uploads
            or clear_organization_feedback_document
            or clear_organization_feedback_document_id
        ):
            instance.save()
        organization_feedback_was_just_released = (
            not was_organization_feedback_released
            and has_organization_feedback_been_released(instance.profile_data)
        )
        if organization_feedback_was_just_released:
            if instance.status != "offered":
                instance.status = "offered"
                instance.save(update_fields=["status", "updated_at"])
            notify_organization_feedback_released(instance)
        return instance
