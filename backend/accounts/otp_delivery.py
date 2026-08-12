import json
import re
from urllib import error, request
from urllib.parse import quote

from django.conf import settings

from notifications.email import EmailDeliveryError, send_brevo_email


class OTPDeliveryError(Exception):
    pass


def normalize_phone_number(value):
    digits = re.sub(r"\D", "", value or "")
    return digits or None


def password_reset_cache_key(method, identifier):
    return f"password_reset_otp:{method}:{identifier}"


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


def send_password_reset_whatsapp(phone_number, otp):
    if not getattr(settings, "WHATSAPP_ENABLED", False):
        raise OTPDeliveryError("Penghantaran WhatsApp belum diaktifkan.")
    if getattr(settings, "WHATSAPP_PROVIDER", "evolution") != "evolution":
        raise OTPDeliveryError("Provider WhatsApp tidak disokong.")

    base_url = getattr(settings, "EVOLUTION_API_URL", "").rstrip("/")
    api_key = getattr(settings, "EVOLUTION_API_KEY", "")
    instance = getattr(settings, "EVOLUTION_INSTANCE_NAME", "")

    if not base_url or not api_key or not instance:
        raise OTPDeliveryError("Evolution API belum dikonfigurasi.")

    payload = json.dumps(
        {
            "number": normalize_phone_number(phone_number),
            "text": build_password_reset_otp_message(otp)["text"],
        }
    ).encode("utf-8")

    api_request = request.Request(
        f"{base_url}/message/sendText/{quote(instance, safe='')}",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "apikey": api_key,
        },
        method="POST",
    )

    try:
        with request.urlopen(api_request, timeout=getattr(settings, "EVOLUTION_API_TIMEOUT", 15)) as response:
            if response.status >= 400:
                raise OTPDeliveryError("Evolution API menolak permintaan OTP WhatsApp.")
    except (error.HTTPError, error.URLError, TimeoutError) as exc:
        raise OTPDeliveryError(f"OTP WhatsApp tidak dapat dihantar: {exc}") from exc
