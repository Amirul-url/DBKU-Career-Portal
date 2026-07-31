from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class PortalUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (
            "Portal profile",
            {
                "fields": (
                    "role",
                    "department",
                    "mykad_number",
                    "mobile_number",
                    "address",
                )
            },
        ),
    )
    list_display = ("username", "email", "first_name", "last_name", "role", "is_staff")
    list_filter = ("role", "is_staff", "is_superuser")

