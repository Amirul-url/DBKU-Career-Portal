from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from notifications.services import create_notification

from .models import CandidateApplication
from .serializers import CandidateApplicationSerializer


class CandidateApplicationPermission(permissions.BasePermission):
    staff_roles = {"admin", "hr", "reviewer", "superadmin"}

    def has_object_permission(self, request, view, obj):
        if request.user.role in self.staff_roles:
            return True
        return obj.applicant_id == request.user.id


class CandidateApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = CandidateApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, CandidateApplicationPermission]

    def get_queryset(self):
        queryset = CandidateApplication.objects.select_related("vacancy", "applicant")
        user = self.request.user
        if user.role not in CandidateApplicationPermission.staff_roles:
            queryset = queryset.filter(applicant=user)

        status_filter = self.request.query_params.get("status")
        vacancy_type = self.request.query_params.get("type")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if vacancy_type:
            queryset = queryset.filter(vacancy__vacancy_type=vacancy_type)
        return queryset

    def perform_create(self, serializer):
        application = serializer.save()
        create_notification(
            user=application.applicant,
            title="Application draft created",
            message=f"Draft created for {application.vacancy.title}.",
            application=application,
        )

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        application = self.get_object()
        if application.applicant_id != request.user.id:
            return Response({"detail": "Only the applicant can submit this application."}, status=403)
        application.status = "submitted"
        application.submitted_at = application.submitted_at or timezone.now()
        application.save(update_fields=["status", "submitted_at", "updated_at"])
        create_notification(
            user=application.applicant,
            title="Application submitted",
            message=f"Your application {application.reference_no} has been submitted.",
            application=application,
        )
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"])
    def withdraw(self, request, pk=None):
        application = self.get_object()
        if application.applicant_id != request.user.id:
            return Response({"detail": "Only the applicant can withdraw this application."}, status=403)
        application.status = "withdrawn"
        application.latest_remark = request.data.get("remark", "")
        application.save(update_fields=["status", "latest_remark", "updated_at"])
        return Response(self.get_serializer(application).data)

    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        application = self.get_object()
        if request.user.role not in CandidateApplicationPermission.staff_roles:
            return Response({"detail": "Staff access required."}, status=403)

        next_status = request.data.get("status")
        valid_statuses = {key for key, _label in CandidateApplication.STATUS_CHOICES}
        if next_status not in valid_statuses:
            return Response({"status": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        application.status = next_status
        application.latest_remark = request.data.get("remark", application.latest_remark)
        application.save(update_fields=["status", "latest_remark", "updated_at"])
        create_notification(
            user=application.applicant,
            title="Application status updated",
            message=f"{application.reference_no} is now {application.get_status_display()}.",
            application=application,
        )
        return Response(self.get_serializer(application).data)
