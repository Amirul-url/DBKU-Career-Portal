import logging

from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from notifications.services import create_notification

from .otp_delivery import OTPDeliveryError, send_whatsapp_message
from .serializers import UserSerializer


logger = logging.getLogger(__name__)


def build_auth_response(user, request=None, login_session=None):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
        "user": UserSerializer(user, context={"request": request}).data,
        "login_session_id": login_session.id if login_session else None,
    }


def build_applicant_registration_success_message(user):
    frontend_url = (settings.FRONTEND_URL or "").rstrip("/")
    login_url = f"{frontend_url}/login" if frontend_url else ""
    lines = [
        "Pendaftaran akaun Portal Kerjaya DBKU anda telah berjaya.",
        "Sila log masuk untuk meneruskan penggunaan portal.",
    ]
    if login_url:
        lines.append(f"Pautan log masuk: {login_url}")
    return {
        "title": "Pendaftaran Akaun Berjaya",
        "message": "\n".join(lines),
    }


def notify_applicant_registration_success(user):
    notification = build_applicant_registration_success_message(user)
    try:
        created_notification = create_notification(
            user=user,
            title=notification["title"],
            message=notification["message"],
        )
    except Exception:
        logger.exception("Unable to create applicant registration notification for user %s", user.pk)
        created_notification = None

    if user.mobile_number and getattr(settings, "WHATSAPP_ENABLED", False):
        try:
            send_whatsapp_message(user.mobile_number, notification["message"])
        except OTPDeliveryError:
            logger.exception("Unable to send applicant registration WhatsApp for user %s", user.pk)

    return created_notification
