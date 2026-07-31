from django.contrib import admin

from .models import CandidateApplication


@admin.register(CandidateApplication)
class CandidateApplicationAdmin(admin.ModelAdmin):
    list_display = ("reference_no", "vacancy", "applicant", "status", "submitted_at")
    list_filter = ("status", "vacancy__vacancy_type")
    search_fields = ("reference_no", "vacancy__title", "applicant__username", "applicant__email")

