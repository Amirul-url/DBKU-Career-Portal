import logging

from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from notifications.services import create_notification

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
    login_url = f"{settings.FRONTEND_URL}/login" if settings.FRONTEND_URL else ""
    lines = [
        f"Salam sejahtera {user.get_full_name() or user.username},",
        "",
        "Tahniah, akaun Portal Kerjaya DBKU anda telah berjaya didaftarkan.",
        "",
        "Anda kini boleh log masuk untuk melengkapkan profil, memohon kerja kosong atau latihan industri, dan menyemak status permohonan anda melalui portal.",
    ]
    if login_url:
        lines.extend(["", f"Pautan log masuk: {login_url}"])
    lines.extend(
        [
            "",
            "Jika anda tidak membuat pendaftaran ini, sila abaikan emel ini atau hubungi pihak DBKU untuk semakan lanjut.",
            "",
            "Terima kasih.",
            "Portal Kerjaya DBKU",
        ]
    )
    return {
        "title": "Pendaftaran Akaun Portal Kerjaya DBKU Berjaya",
        "message": "\n".join(lines),
    }


def notify_applicant_registration_success(user):
    if not getattr(settings, "NOTIFICATION_SIDE_EFFECTS_ENABLED", False):
        return None

    notification = build_applicant_registration_success_message(user)
    try:
        return create_notification(
            user=user,
            title=notification["title"],
            message=notification["message"],
        )
    except Exception:
        logger.exception("Unable to create applicant registration notification for user %s", user.pk)
        return None
