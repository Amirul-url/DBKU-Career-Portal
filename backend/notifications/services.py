import logging

from django.conf import settings

from .email import EmailDeliveryError, send_notification_email
from .models import Notification


logger = logging.getLogger(__name__)


def create_notification(user, title, message, application=None):
    if not user:
        return None
    notification = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        application=application,
    )

    if settings.NOTIFICATION_EMAIL_ENABLED:
        try:
            send_notification_email(user, title, message)
        except EmailDeliveryError:
            logger.exception("Unable to send notification email for notification %s", notification.pk)

    return notification
