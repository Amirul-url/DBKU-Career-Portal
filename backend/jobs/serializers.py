from rest_framework import serializers

from .models import Vacancy


class VacancySerializer(serializers.ModelSerializer):
    is_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = Vacancy
        fields = (
            "id",
            "title",
            "vacancy_type",
            "department",
            "division",
            "advertisement_no",
            "service_group",
            "service_classification",
            "location",
            "employment_type",
            "grade",
            "minimum_salary",
            "maximum_salary",
            "summary",
            "responsibilities",
            "requirements",
            "application_instructions",
            "application_notes",
            "official_document",
            "closing_date",
            "status",
            "is_open",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
