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
    return {
        "title": "Pendaftaran Akaun Berjaya",
        "message": (
            "Salam sejahtera. Akaun Portal Kerjaya DBKU anda telah berjaya didaftarkan. "
            "Sila log masuk untuk melengkapkan profil dan membuat permohonan. Terima kasih."
        ),
    }


def notify_applicant_registration_success(user):
    if not getattr(settings, "NOTIFICATION_SIDE_EFFECTS_ENABLED", False):
        return None

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
