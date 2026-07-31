from .models import Notification


def create_notification(user, title, message, application=None):
    if not user:
        return None
    return Notification.objects.create(
        user=user,
        title=title,
        message=message,
        application=application,
    )

