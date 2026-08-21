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


def build_application_review_notification(application, next_status):
    copy = {
        "incomplete": {
            "title": "Permohonan Tidak Lengkap",
            "message": (
                f"Permohonan anda dengan No. rujukan {application.reference_no} "
                "telah ditanda tidak lengkap. Sila log masuk ke Portal Kerjaya DBKU "
                "untuk menyemak dan melengkapkan maklumat atau dokumen yang diperlukan."
            ),
        },
        "rejected": {
            "title": "Keputusan Permohonan Latihan Industri",
            "message": (
                f"Dukacita dimaklumkan bahawa permohonan anda dengan No. rujukan {application.reference_no} "
                "tidak berjaya dipertimbangkan buat masa ini. "
                "Untuk maklumat lanjut, sila layari Portal Kerjaya DBKU."
            ),
        },
    }
    return copy.get(
        next_status,
        {
            "title": "Status permohonan dikemas kini",
            "message": f"{application.reference_no} kini berstatus {application.get_status_display()}.",
        },
    )


def send_application_whatsapp(application, message, context):
    if not application.applicant.mobile_number or not getattr(settings, "WHATSAPP_ENABLED", False):
        return

    try:
        send_whatsapp_message(application.applicant.mobile_number, message)
    except OTPDeliveryError:
        logger.exception("Unable to send %s WhatsApp for application %s", context, application.pk)


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
    send_application_whatsapp(application, message, "application submission")
    return application


def withdraw_application(application, remark=""):
    application.status = "withdrawn"
    application.latest_remark = remark
    application.save(update_fields=["status", "latest_remark", "updated_at"])
    return application


def review_application(application, next_status, remark=None, assigned_department=None, profile_data_updates=None):
    valid_statuses = {key for key, _label in CandidateApplication.STATUS_CHOICES}
    if next_status not in valid_statuses:
        raise InvalidApplicationStatus("Status tidak sah.")

    application.status = next_status
    if remark is not None:
        application.latest_remark = remark
    update_fields = ["status", "latest_remark", "updated_at"]
    if assigned_department is not None:
        application.assigned_department = assigned_department
        update_fields.append("assigned_department")
    if profile_data_updates:
        profile_data = dict(application.profile_data or {})
        profile_data.update(profile_data_updates)
        application.profile_data = profile_data
        update_fields.append("profile_data")
    application.save(update_fields=update_fields)
    notification = build_application_review_notification(application, next_status)
    create_notification(
        user=application.applicant,
        title=notification["title"],
        message=notification["message"],
        application=application,
    )
    if next_status in {"incomplete", "rejected"}:
        send_application_whatsapp(application, notification["message"], "application review")
    return application
