from django.conf import settings

from notifications.email import EmailDeliveryError, send_brevo_email


class OTPDeliveryError(Exception):
    pass


def password_reset_cache_key(email):
    return f"password_reset_otp:email:{email}"


def build_password_reset_otp_message(otp):
    return {
        "subject": "OTP Tetapan Semula Kata Laluan Portal Kerjaya DBKU",
        "text": (
            "Kod OTP tetapan semula kata laluan Portal Kerjaya DBKU anda ialah "
            f"{otp}. Kod ini akan tamat tempoh dalam 10 minit."
        ),
    }


def send_password_reset_email(user, otp):
    if not getattr(settings, "NOTIFICATION_EMAIL_ENABLED", False):
        raise OTPDeliveryError("Penghantaran emel belum diaktifkan.")

    message = build_password_reset_otp_message(otp)
    try:
        send_brevo_email(
            to_email=user.email,
            to_name=user.get_full_name() or user.username,
            subject=message["subject"],
            message=message["text"],
        )
    except EmailDeliveryError as exc:
        raise OTPDeliveryError(f"OTP emel tidak dapat dihantar: {exc}") from exc
