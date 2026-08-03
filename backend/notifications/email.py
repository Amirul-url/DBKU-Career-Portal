import json
import logging
from html import escape
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings


logger = logging.getLogger(__name__)

BREVO_SMTP_EMAIL_URL = "https://api.brevo.com/v3/smtp/email"


class EmailDeliveryError(RuntimeError):
    pass


def _build_html_content(title, message):
    safe_title = escape(title)
    safe_message = escape(message).replace("\n", "<br>")
    return f"""
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.55;">
      <h2 style="margin: 0 0 12px; color: #16A34A;">{safe_title}</h2>
      <p style="margin: 0;">{safe_message}</p>
    </div>
    """.strip()


def send_brevo_email(to_email, subject, message, to_name=""):
    if not settings.BREVO_API_KEY:
        raise EmailDeliveryError("BREVO_API_KEY is not configured.")
    if not settings.BREVO_SENDER_EMAIL:
        raise EmailDeliveryError("BREVO_SENDER_EMAIL is not configured.")

    recipient = {"email": to_email}
    if to_name:
        recipient["name"] = to_name

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [recipient],
        "subject": subject,
        "htmlContent": _build_html_content(subject, message),
        "textContent": message,
    }
    request = Request(
        BREVO_SMTP_EMAIL_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=settings.BREVO_TIMEOUT_SECONDS) as response:
            return json.loads(response.read().decode("utf-8") or "{}")
    except HTTPError as exc:
        response_body = exc.read().decode("utf-8", errors="replace")
        logger.warning("Brevo email failed with HTTP %s: %s", exc.code, response_body)
        raise EmailDeliveryError(f"Brevo email failed with HTTP {exc.code}") from exc
    except URLError as exc:
        logger.warning("Brevo email request failed: %s", exc)
        raise EmailDeliveryError("Brevo email request failed.") from exc


def send_notification_email(user, title, message):
    if not user or not user.email:
        return None
    return send_brevo_email(
        to_email=user.email,
        to_name=user.get_full_name() or user.username,
        subject=title,
        message=message,
    )
