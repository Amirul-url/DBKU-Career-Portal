from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import CandidateApplication
from .permissions import CandidateApplicationPermission
from .serializers import CandidateApplicationSerializer
from .services import (
    InvalidApplicationStatus,
    review_application,
    submit_application,
    withdraw_application,
)

HRM_DEPARTMENT_ALIASES = {
    "HRM",
    "Pengurusan Sumber Manusia (HRM)",
    "Bahagian Pengurusan Sumber Manusia (HRM)",
}


def is_hrm_staff(user):
    department = getattr(user, "department", "")
    return getattr(user, "role", None) == "superadmin" or not department or department in HRM_DEPARTMENT_ALIASES


class CandidateApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, CandidateApplicationPermission]
    applicant_editable_statuses = {"draft", "incomplete"}

    def get_queryset(self):
        queryset = CandidateApplication.objects.select_related("vacancy", "applicant")
        user = self.request.user
        if user.role not in CandidateApplicationPermission.staff_roles:
            queryset = queryset.filter(applicant=user)
        else:
            queryset = queryset.exclude(status="draft")
            if user.role == "admin" and not is_hrm_staff(user):
                queryset = queryset.filter(assigned_department=user.department, status="shortlisted").filter(
                    profile_data__department_decision__submitted_at__isnull=True
                )

        status_filter = self.request.query_params.get("status")
        vacancy_type = self.request.query_params.get("type")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if vacancy_type:
            queryset = queryset.filter(vacancy__vacancy_type=vacancy_type)
        return queryset

    def update(self, request, *args, **kwargs):
        application = self.get_object()
        if (
            request.user.role not in CandidateApplicationPermission.staff_roles
            and application.status not in self.applicant_editable_statuses
        ):
            return Response(
                {"detail": "Permohonan ini tidak boleh dikemaskini pada status semasa."},
                status=status.HTTP_403_FORBIDDEN,
            )
        requested_status = request.data.get("status")
        if (
            request.user.role not in CandidateApplicationPermission.staff_roles
            and requested_status
            and requested_status != application.status
        ):
            return Response(
                {"detail": "Status permohonan hanya boleh berubah melalui proses hantar semula."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        application = self.get_object()
        if application.applicant_id != request.user.id:
            return Response({"detail": "Hanya pemohon boleh menghantar permohonan ini."}, status=403)
        if application.status not in self.applicant_editable_statuses:
            return Response(
                {"detail": "Permohonan ini tidak boleh dihantar semula pada status semasa."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        application = submit_application(application)
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"])
    def withdraw(self, request, pk=None):
        application = self.get_object()
        if application.applicant_id != request.user.id:
            return Response({"detail": "Hanya pemohon boleh menarik balik permohonan ini."}, status=403)
        application = withdraw_application(application, remark=request.data.get("remark", ""))
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"], url_path="confirm-offer")
    def confirm_offer(self, request, pk=None):
        application = self.get_object()
        if application.applicant_id != request.user.id:
            return Response({"detail": "Hanya pemohon boleh membuat pengesahan tawaran ini."}, status=403)
        if application.status not in {"offered", "accepted"}:
            return Response(
                {"detail": "Pengesahan hanya boleh dihantar selepas tawaran diterima."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile_data = dict(application.profile_data or {})
        feedback_release = profile_data.get("organization_feedback_release") or {}
        if not feedback_release.get("sent_to_applicant_at"):
            return Response(
                {"detail": "Maklumbalas organisasi belum dihantar kepada pemohon."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(application)
        try:
            uploads = serializer.get_applicant_confirmation_document_uploads(request)
        except ValidationError as error:
            return Response({"applicantConfirmationDocuments": error.detail}, status=status.HTTP_400_BAD_REQUEST)
        if not uploads:
            return Response(
                {"applicantConfirmationDocuments": ["Sila muat naik sekurang-kurangnya satu dokumen pengesahan."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        application = serializer.save_applicant_confirmation_documents(
            application,
            uploads,
            submitted_by=request.user.get_full_name() or request.user.email,
        )
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"], url_path="reject-offer")
    def reject_offer(self, request, pk=None):
        application = self.get_object()
        if application.applicant_id != request.user.id:
            return Response({"detail": "Hanya pemohon boleh membuat pengesahan tawaran ini."}, status=403)
        if application.status not in {"offered", "accepted"}:
            return Response(
                {"detail": "Penolakan hanya boleh dihantar selepas tawaran diterima."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile_data = dict(application.profile_data or {})
        feedback_release = profile_data.get("organization_feedback_release") or {}
        if not feedback_release.get("sent_to_applicant_at"):
            return Response(
                {"detail": "Maklumbalas organisasi belum dihantar kepada pemohon."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile_data["applicant_confirmation"] = {
            **(profile_data.get("applicant_confirmation") or {}),
            "status": "rejected",
            "submitted_at": timezone.now().isoformat(),
            "submitted_by": request.user.get_full_name() or request.user.email,
            "statement": "Pemohon menolak tawaran menjalani latihan industri di DBKU.",
        }
        application.profile_data = profile_data
        application.status = "rejected"
        application.save(update_fields=["status", "profile_data", "updated_at"])
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        application = self.get_object()
        if request.user.role not in CandidateApplicationPermission.staff_roles:
            return Response({"detail": "Akses kakitangan diperlukan."}, status=403)

        next_status = request.data.get("status")
        assigned_department = request.data.get("assigned_department") if is_hrm_staff(request.user) else None
        profile_data_updates = {}
        hrm_final_decision = request.data.get("hrm_final_decision") if is_hrm_staff(request.user) else None
        if isinstance(hrm_final_decision, dict):
            profile_data_updates["hrm_final_decision"] = hrm_final_decision
        try:
            application = review_application(
                application,
                next_status=next_status,
                remark=request.data.get("remark", application.latest_remark),
                assigned_department=assigned_department,
                profile_data_updates=profile_data_updates,
            )
        except InvalidApplicationStatus as error:
            return Response({"status": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(application).data)
