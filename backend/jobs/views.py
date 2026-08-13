import mimetypes

from django.http import FileResponse
from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework import viewsets

from .models import Vacancy
from .permissions import IsStaffOrReadOnly
from .serializers import VacancySerializer
from .utils import vacancy_document_name


class VacancyViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.all()
    serializer_class = VacancySerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        vacancy_type = self.request.query_params.get("type")
        search = self.request.query_params.get("search")
        department = self.request.query_params.get("department")

        if not user.is_authenticated or user.role == "applicant":
            queryset = queryset.filter(status="open")
            if vacancy_type != "internship":
                queryset = queryset.filter(
                    Q(vacancy_type="internship")
                    | Q(closing_date__isnull=True)
                    | Q(closing_date__gte=timezone.localdate())
                )

        if vacancy_type:
            queryset = queryset.filter(vacancy_type=vacancy_type)
        if department:
            queryset = queryset.filter(department__icontains=department)
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"], url_path="document")
    def document(self, _request, pk=None):
        vacancy = self.get_object()
        if not vacancy.official_document:
            raise NotFound("Dokumen rasmi tidak ditemui.")

        content_type, _encoding = mimetypes.guess_type(vacancy.official_document.name)
        response = FileResponse(
            vacancy.official_document.open("rb"),
            as_attachment=False,
            filename=vacancy_document_name(vacancy),
            content_type=content_type or "application/octet-stream",
        )
        return response
