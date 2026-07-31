from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "application", "read_at", "created_at")
    list_filter = ("read_at",)
    search_fields = ("title", "message", "user__username")

