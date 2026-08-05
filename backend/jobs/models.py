from django.conf import settings
from django.db import models
from django.utils import timezone


class Vacancy(models.Model):
    TYPE_CHOICES = (
        ("job", "Job"),
        ("internship", "Internship"),
    )

    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("open", "Open"),
        ("closed", "Closed"),
        ("archived", "Archived"),
    )

    title = models.CharField(max_length=180)
    vacancy_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    department = models.CharField(max_length=120)
    advertisement_no = models.CharField(max_length=60, blank=True)
    service_group = models.CharField(max_length=100, blank=True)
    service_classification = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=160, default="Kuching, Sarawak")
    employment_type = models.CharField(max_length=80, blank=True)
    grade = models.CharField(max_length=50, blank=True)
    minimum_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    maximum_salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    summary = models.TextField()
    responsibilities = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    application_instructions = models.TextField(blank=True)
    application_notes = models.TextField(blank=True)
    official_document = models.FileField(upload_to="vacancy_documents/", blank=True)
    closing_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_vacancies",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "vacancy_type"], name="vacancy_status_type_idx"),
            models.Index(fields=["department"], name="vacancy_department_idx"),
            models.Index(fields=["closing_date"], name="vacancy_closing_idx"),
        ]

    @property
    def is_open(self):
        if self.status != "open":
            return False
        return not self.closing_date or self.closing_date >= timezone.localdate()

    def __str__(self):
        return self.title
