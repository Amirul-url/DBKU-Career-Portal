from rest_framework import serializers

from .models import Vacancy


class VacancySerializer(serializers.ModelSerializer):
    is_open = serializers.BooleanField(read_only=True)
    official_document_name = serializers.SerializerMethodField()

    def get_official_document_name(self, obj):
        if not obj.official_document:
            return ""
        return obj.official_document.name.rsplit("/", 1)[-1]

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
            "official_document_name",
            "closing_date",
            "status",
            "is_open",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
