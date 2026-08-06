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


class AccountActivity(models.Model):
    ACTION_CHOICES = (
        ("login", "Log masuk"),
        ("logout", "Log keluar"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="account_activities")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    duration_seconds = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user.email} - {self.get_action_display()}"


class LoginSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="login_sessions")
    login_at = models.DateTimeField()
    logout_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ("-login_at",)

    def __str__(self):
        return f"{self.user.email} - {self.login_at}"
