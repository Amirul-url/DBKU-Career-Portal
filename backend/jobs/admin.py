from django.contrib import admin

from .models import Vacancy


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = ("title", "vacancy_type", "department", "status", "closing_date")
    list_filter = ("vacancy_type", "status", "department")
    search_fields = ("title", "department", "summary")

