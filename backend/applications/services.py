import logging

from django.conf import settings
from django.utils import timezone

from accounts.otp_delivery import OTPDeliveryError, send_whatsapp_message
from notifications.services import create_notification

from .models import CandidateApplication


logger = logging.getLogger(__name__)


class InvalidApplicationStatus(ValueError):
    pass


def build_application_submitted_message(application):
    return (
        f"Permohonan latihan industri anda telah berjaya dihantar. "
        f"No. rujukan: {application.reference_no}. "
        "Sila semak status permohonan melalui Portal Kerjaya DBKU."
    )


def create_draft_notification(application):
    return create_notification(
        user=application.applicant,
        title="Draf permohonan dicipta",
        message=f"Draf telah dicipta untuk {application.vacancy.title}.",
        application=application,
    )


def submit_application(application):
    application.status = "submitted"
    application.submitted_at = application.submitted_at or timezone.now()
    application.save(update_fields=["status", "submitted_at", "updated_at"])
    message = build_application_submitted_message(application)
    create_notification(
        user=application.applicant,
        title="Permohonan Latihan Industri Berjaya Dihantar",
        message=message,
        application=application,
    )
    if application.applicant.mobile_number and getattr(settings, "WHATSAPP_ENABLED", False):
        try:
            send_whatsapp_message(application.applicant.mobile_number, message)
        except OTPDeliveryError:
            logger.exception("Unable to send application submission WhatsApp for application %s", application.pk)
    return application


def withdraw_application(application, remark=""):
    application.status = "withdrawn"
    application.latest_remark = remark
    application.save(update_fields=["status", "latest_remark", "updated_at"])
    return application


def review_application(application, next_status, remark=None):
    valid_statuses = {key for key, _label in CandidateApplication.STATUS_CHOICES}
    if next_status not in valid_statuses:
        raise InvalidApplicationStatus("Status tidak sah.")

    application.status = next_status
    if remark is not None:
        application.latest_remark = remark
    application.save(update_fields=["status", "latest_remark", "updated_at"])
    create_notification(
        user=application.applicant,
        title="Status permohonan dikemas kini",
        message=f"{application.reference_no} kini berstatus {application.get_status_display()}.",
        application=application,
    )
    return application
