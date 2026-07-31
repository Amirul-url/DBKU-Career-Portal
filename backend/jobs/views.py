from rest_framework import permissions, viewsets

from .models import Vacancy
from .serializers import VacancySerializer


class IsStaffOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in {
            "admin",
            "hr",
            "superadmin",
        }


class VacancyViewSet(viewsets.ModelViewSet):
    queryset = Vacancy.objects.all()
    serializer_class = VacancySerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated or user.role == "applicant":
            queryset = queryset.filter(status="open")

        vacancy_type = self.request.query_params.get("type")
        search = self.request.query_params.get("search")
        department = self.request.query_params.get("department")

        if vacancy_type:
            queryset = queryset.filter(vacancy_type=vacancy_type)
        if department:
            queryset = queryset.filter(department__icontains=department)
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

