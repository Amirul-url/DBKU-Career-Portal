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
    if digits.startswith("0"):
        digits = f"60{digits[1:]}"
    return digits or None


def password_reset_cache_key(method, identifier):
    return f"password_reset_otp:{method}:{identifier}"


def build_password_reset_otp_message(otp):
    return {
        "subject": "Kod OTP Portal Kerjaya DBKU",
        "text": (
            f"Kod OTP anda untuk Portal Kerjaya DBKU ialah {otp}. "
            "Kod ini sah selama 10 minit. "
            "Jika anda tidak membuat permintaan ini, sila abaikan mesej ini."
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
    send_whatsapp_message(phone_number, build_password_reset_otp_message(otp)["text"])


def send_whatsapp_message(phone_number, text):
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
            "text": text,
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
                raise OTPDeliveryError("Evolution API menolak permintaan WhatsApp.")
    except (error.HTTPError, error.URLError, TimeoutError) as exc:
        raise OTPDeliveryError(f"Mesej WhatsApp tidak dapat dihantar: {exc}") from exc
