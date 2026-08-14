from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
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

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        application = self.get_object()
        if request.user.role not in CandidateApplicationPermission.staff_roles:
            return Response({"detail": "Akses kakitangan diperlukan."}, status=403)

        next_status = request.data.get("status")
        try:
            application = review_application(
                application,
                next_status=next_status,
                remark=request.data.get("remark", application.latest_remark),
            )
        except InvalidApplicationStatus as error:
            return Response({"status": str(error)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(application).data)
