from rest_framework import serializers

from .models import Vacancy
from .utils import vacancy_document_name


class VacancySerializer(serializers.ModelSerializer):
    is_open = serializers.BooleanField(read_only=True)
    official_document_name = serializers.SerializerMethodField()
    official_document_view_url = serializers.SerializerMethodField()

    def get_official_document_name(self, obj):
        if not obj.official_document:
            return ""
        return vacancy_document_name(obj)

    def get_official_document_view_url(self, obj):
        if not obj.official_document:
            return ""
        request = self.context.get("request")
        path = f"/api/jobs/{obj.pk}/document/"
        return request.build_absolute_uri(path) if request else path

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
            "official_document_view_url",
            "closing_date",
            "status",
            "is_open",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        uploaded_document = validated_data.get("official_document")
        if uploaded_document:
            validated_data["official_document_original_name"] = uploaded_document.name
        return super().create(validated_data)

    def update(self, instance, validated_data):
        uploaded_document = validated_data.get("official_document")
        if uploaded_document:
            validated_data["official_document_original_name"] = uploaded_document.name
        return super().update(instance, validated_data)
