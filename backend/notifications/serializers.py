from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            "id",
            "application",
            "title",
            "message",
            "read_at",
            "created_at",
        )
        read_only_fields = fields

