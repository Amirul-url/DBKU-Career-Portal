from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("superadmin", "Super Admin"),
        ("admin", "Pentadbir"),
        ("applicant", "Pemohon"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="applicant")
    department = models.CharField(max_length=80, blank=True)
    mykad_number = models.CharField(max_length=12, blank=True)
    mobile_number = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    profile_photo = models.FileField(upload_to="profile_photos/", blank=True)
    resume_file = models.FileField(upload_to="resumes/", blank=True)
    video_resume_file = models.FileField(upload_to="video_resumes/", blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class ApplicantProfileData(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile_data")
    personal = models.JSONField(default=dict, blank=True)
    job_preferences = models.JSONField(default=dict, blank=True)
    experience = models.JSONField(default=dict, blank=True)
    academic = models.JSONField(default=dict, blank=True)
    skills = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profil {self.user.email}"
