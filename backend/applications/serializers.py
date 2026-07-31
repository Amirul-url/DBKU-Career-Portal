from django.utils import timezone
from rest_framework import serializers

from jobs.serializers import VacancySerializer

from .models import CandidateApplication


class CandidateApplicationSerializer(serializers.ModelSerializer):
    vacancy_detail = VacancySerializer(source="vacancy", read_only=True)
    applicant_name = serializers.SerializerMethodField()

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
            "profile_data",
            "latest_remark",
            "submitted_at",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "reference_no",
            "applicant",
            "applicant_name",
            "submitted_at",
            "created_at",
            "updated_at",
        )

    def get_applicant_name(self, obj):
        return obj.applicant.get_full_name() or obj.applicant.username

    def create(self, validated_data):
        user = self.context["request"].user
        return CandidateApplication.objects.create(applicant=user, **validated_data)

    def update(self, instance, validated_data):
        new_status = validated_data.get("status")
        if new_status == "submitted" and instance.status == "draft" and not instance.submitted_at:
            validated_data["submitted_at"] = timezone.now()
        return super().update(instance, validated_data)

