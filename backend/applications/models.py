from django.conf import settings
from django.db import models
from django.utils import timezone


class CandidateApplication(models.Model):
    STATUS_CHOICES = (
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("screening", "Screening"),
        ("incomplete", "Incomplete"),
        ("shortlisted", "Shortlisted"),
        ("interview", "Interview"),
        ("offered", "Offered"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn"),
    )

    vacancy = models.ForeignKey(
        "jobs.Vacancy",
        on_delete=models.CASCADE,
        related_name="applications",
    )
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="candidate_applications",
    )
    reference_no = models.CharField(max_length=40, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    cover_letter = models.TextField(blank=True)
    resume = models.FileField(upload_to="resumes/", blank=True)
    internship_university_letter = models.FileField(upload_to="internship_documents/", blank=True)
    internship_university_letter_original_name = models.CharField(max_length=255, blank=True)
    internship_transcript = models.FileField(upload_to="internship_documents/", blank=True)
    internship_transcript_original_name = models.CharField(max_length=255, blank=True)
    internship_resume = models.FileField(upload_to="internship_documents/", blank=True)
    internship_resume_original_name = models.CharField(max_length=255, blank=True)
    internship_passport_photo = models.FileField(upload_to="internship_documents/", blank=True)
    internship_passport_photo_original_name = models.CharField(max_length=255, blank=True)
    internship_bank_account = models.FileField(upload_to="internship_documents/", blank=True)
    internship_bank_account_original_name = models.CharField(max_length=255, blank=True)
    organization_feedback_document = models.FileField(upload_to="organization_feedback_documents/", blank=True)
    organization_feedback_document_original_name = models.CharField(max_length=255, blank=True)
    profile_data = models.JSONField(default=dict, blank=True)
    latest_remark = models.TextField(blank=True)
    assigned_department = models.CharField(max_length=120, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        indexes = [
            models.Index(fields=["status", "-updated_at"], name="cand_status_updated_idx"),
            models.Index(fields=["applicant", "-updated_at"], name="cand_applicant_updated_idx"),
            models.Index(fields=["vacancy", "status"], name="cand_vacancy_status_idx"),
            models.Index(fields=["assigned_department"], name="cand_assigned_dept_idx"),
        ]

    @classmethod
    def next_reference_no(cls):
        year = timezone.localdate().year
        prefix = f"PK.{year}-"
        last = (
            cls.objects.exclude(reference_no="")
            .filter(reference_no__startswith=prefix)
            .order_by("-reference_no")
            .values_list("reference_no", flat=True)
            .first()
        )
        next_number = 1
        if last:
            try:
                next_number = int(last.replace(prefix, "")) + 1
            except ValueError:
                next_number = cls.objects.filter(reference_no__startswith=prefix).count() + 1
        if next_number > 9999:
            raise ValueError(f"Had maksimum nombor rujukan permohonan untuk tahun {year} telah dicapai.")
        return f"{prefix}{next_number:04d}"

    def save(self, *args, **kwargs):
        if not self.reference_no:
            self.reference_no = self.next_reference_no()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference_no} - {self.vacancy.title}"
