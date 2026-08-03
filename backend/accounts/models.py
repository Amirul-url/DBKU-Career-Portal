from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ("superadmin", "Super Admin"),
        ("admin", "Admin"),
        ("hr", "HR Officer"),
        ("reviewer", "Reviewer"),
        ("applicant", "Applicant"),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="applicant")
    department = models.CharField(max_length=80, blank=True)
    mykad_number = models.CharField(max_length=12, blank=True)
    mobile_number = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    profile_photo = models.FileField(upload_to="profile_photos/", blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"
