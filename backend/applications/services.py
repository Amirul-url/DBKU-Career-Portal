import logging
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.utils import timezone

from accounts.otp_delivery import OTPDeliveryError, send_whatsapp_message
from notifications.services import create_notification

from .models import CandidateApplication


logger = logging.getLogger(__name__)


class InvalidApplicationStatus(ValueError):
    pass


HRM_DEPARTMENT_ALIASES = {
    "",
    "HRM",
    "Pengurusan Sumber Manusia (HRM)",
    "Bahagian Pengurusan Sumber Manusia (HRM)",
}


def get_application_type_copy(application):
    if application.vacancy.vacancy_type == "job":
        job_label = get_job_application_label(application)
        return {
            "applicant_success_title": f"Permohonan {job_label}",
            "applicant_type_label": job_label,
            "hrm_submission_title": f"Permohonan {job_label} Baharu Untuk Semakan.",
            "hrm_submission_message": f"Terdapat permohonan {job_label} baharu untuk semakan HRM.",
        }

    return {
        "applicant_success_title": "Permohonan Latihan Industri Berjaya Dihantar",
        "applicant_type_label": "latihan industri",
        "hrm_submission_title": "Permohonan LI Baharu Untuk Semakan",
        "hrm_submission_message": "Terdapat permohonan Latihan Industri baharu untuk semakan HRM.",
    }


def get_job_application_label(application):
    title = str(getattr(application.vacancy, "title", "") or "").strip()
    if not title:
        return "Jawatan Kosong DBKU"
    if title.lower().startswith("jawatan "):
        return title
    return f"Jawatan {title}"


def build_application_submitted_message(application):
    copy = get_application_type_copy(application)
    return (
        f"Permohonan {copy['applicant_type_label']} anda telah berjaya dihantar. "
        f"No. rujukan: {application.reference_no}. "
        "Sila semak status permohonan melalui Portal Kerjaya DBKU."
    )


def build_hrm_application_submission_notification(application):
    copy = get_application_type_copy(application)
    title = copy["hrm_submission_title"]
    if application.vacancy.vacancy_type != "job":
        title = f"{title} - {application.reference_no}"
    return {
        "title": title,
        "message": (
            "Portal Kerjaya DBKU\n\n"
            f"{copy['hrm_submission_message']}\n"
            f"No. Rujukan: {application.reference_no}\n\n"
            "Sila semak permohonan melalui Portal Kerjaya DBKU."
        ),
    }


def build_department_application_assignment_notification(application):
    if application.vacancy.vacancy_type == "job":
        job_label = get_job_application_label(application)
        return {
            "title": f"Permohonan {job_label} Untuk Semakan Bahagian - {application.reference_no}",
            "message": (
                "Portal Kerjaya DBKU\n\n"
                f"Terdapat permohonan {job_label} semakan Bahagian.\n"
                f"No. Rujukan: {application.reference_no}\n\n"
                "Sila semak permohonan melalui Portal Kerjaya DBKU."
            ),
        }

    return {
        "title": f"Permohonan LI Baharu Untuk Semakan - {application.reference_no}",
        "message": (
            "Portal Kerjaya DBKU\n\n"
            "Terdapat permohonan Latihan Industri baharu untuk semakan Bahagian.\n"
            f"No. Rujukan: {application.reference_no}\n\n"
            "Sila semak permohonan melalui Portal Kerjaya DBKU."
        ),
    }


def build_hrm_department_decision_notification(application):
    if application.vacancy.vacancy_type == "job":
        job_label = get_job_application_label(application)
        return {
            "title": f"Permohonan {job_label} Untuk Pengesahan - {application.reference_no}",
            "message": (
                "Portal Kerjaya DBKU\n\n"
                f"Terdapat permohonan {job_label} untuk pengesahan.\n"
                f"No. Rujukan: {application.reference_no}\n\n"
                "Sila semak permohonan melalui Portal Kerjaya DBKU."
            ),
        }

    return {
        "title": f"Permohonan LI Baharu Untuk Pengesahan - {application.reference_no}",
        "message": (
            "Portal Kerjaya DBKU\n\n"
            "Terdapat permohonan Latihan Industri baharu untuk pengesahan.\n"
            f"No. Rujukan: {application.reference_no}\n\n"
            "Sila semak permohonan melalui Portal Kerjaya DBKU."
        ),
    }


def build_hrm_offer_acceptance_notification(application):
    return {
        "title": f"Pengesahan Penerimaan Tawaran LI - {application.reference_no}",
        "message": (
            "Portal Kerjaya DBKU\n\n"
            "Pemohon telah menerima tawaran Latihan Industri.\n"
            f"No. Rujukan: {application.reference_no}\n\n"
            "Sila semak pengesahan penerimaan tawaran melalui Portal Kerjaya DBKU."
        ),
    }


def build_hrm_offer_rejection_notification(application):
    return {
        "title": f"Penolakan Tawaran LI - {application.reference_no}",
        "message": (
            "Portal Kerjaya DBKU\n\n"
            "Pemohon telah menolak tawaran Latihan Industri.\n"
            f"No. Rujukan: {application.reference_no}\n\n"
            "Sila semak pengesahan penerimaan tawaran melalui Portal Kerjaya DBKU."
        ),
    }


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


def build_organization_feedback_released_notification(application):
    return {
        "title": "Permohonan Latihan Industri Berjaya",
        "message": (
            f"Sukacita dimaklumkan bahawa permohonan latihan industri anda dengan No. rujukan {application.reference_no} "
            "telah berjaya diterima. "
            "Untuk menyemak maklumat tawaran dan tindakan lanjut, sila layari Portal Kerjaya DBKU."
        ),
    }


def send_application_whatsapp(application, message, context):
    if not application.applicant.mobile_number or not getattr(settings, "WHATSAPP_ENABLED", False):
        return

    try:
        send_whatsapp_message(application.applicant.mobile_number, message)
    except OTPDeliveryError:
        logger.exception("Unable to send %s WhatsApp for application %s", context, application.pk)


def get_hrm_notification_recipients():
    user_model = get_user_model()
    return user_model.objects.filter(
        Q(role="superadmin")
        | Q(role="admin", department__in=HRM_DEPARTMENT_ALIASES)
    ).distinct()


def get_department_aliases(department):
    department_name = str(department or "").strip()
    aliases = {department_name}
    code_match = re.search(r"\(([^)]+)\)\s*$", department_name)
    if code_match:
        aliases.add(code_match.group(1))
    return {alias for alias in aliases if alias}


def get_department_notification_recipients(department):
    aliases = get_department_aliases(department)
    if not aliases:
        return get_user_model().objects.none()
    return get_user_model().objects.filter(role="admin", department__in=aliases).distinct()


def send_recipient_whatsapp(recipient, message, context, application):
    if not recipient.mobile_number or not getattr(settings, "WHATSAPP_ENABLED", False):
        return

    try:
        send_whatsapp_message(recipient.mobile_number, message)
    except OTPDeliveryError:
        logger.exception(
            "Unable to send %s WhatsApp for application %s to user %s",
            context,
            application.pk,
            recipient.pk,
        )


def notify_hrm_application_submitted(application):
    notification = build_hrm_application_submission_notification(application)
    for recipient in get_hrm_notification_recipients().exclude(pk=application.applicant_id):
        create_notification(
            user=recipient,
            title=notification["title"],
            message=notification["message"],
            application=application,
        )
        send_recipient_whatsapp(recipient, notification["message"], "HRM application submission", application)


def notify_department_application_assigned(application):
    notification = build_department_application_assignment_notification(application)
    for recipient in get_department_notification_recipients(application.assigned_department).exclude(pk=application.applicant_id):
        create_notification(
            user=recipient,
            title=notification["title"],
            message=notification["message"],
            application=application,
        )
        send_recipient_whatsapp(recipient, notification["message"], "department application assignment", application)


def notify_hrm_department_decision_submitted(application):
    notification = build_hrm_department_decision_notification(application)
    for recipient in get_hrm_notification_recipients().exclude(pk=application.applicant_id):
        create_notification(
            user=recipient,
            title=notification["title"],
            message=notification["message"],
            application=application,
        )
        send_recipient_whatsapp(recipient, notification["message"], "HRM department decision submission", application)


def notify_hrm_offer_accepted(application):
    notification = build_hrm_offer_acceptance_notification(application)
    for recipient in get_hrm_notification_recipients().exclude(pk=application.applicant_id):
        create_notification(
            user=recipient,
            title=notification["title"],
            message=notification["message"],
            application=application,
        )
        send_recipient_whatsapp(recipient, notification["message"], "HRM offer acceptance", application)


def notify_hrm_offer_rejected(application):
    notification = build_hrm_offer_rejection_notification(application)
    for recipient in get_hrm_notification_recipients().exclude(pk=application.applicant_id):
        create_notification(
            user=recipient,
            title=notification["title"],
            message=notification["message"],
            application=application,
        )
        send_recipient_whatsapp(recipient, notification["message"], "HRM offer rejection", application)


def submit_application(application):
    application.status = "submitted"
    application.submitted_at = application.submitted_at or timezone.now()
    application.save(update_fields=["status", "submitted_at", "updated_at"])
    message = build_application_submitted_message(application)
    create_notification(
        user=application.applicant,
        title=get_application_type_copy(application)["applicant_success_title"],
        message=message,
        application=application,
    )
    send_application_whatsapp(application, message, "application submission")
    notify_hrm_application_submitted(application)
    return application


def notify_organization_feedback_released(application):
    notification = build_organization_feedback_released_notification(application)
    create_notification(
        user=application.applicant,
        title=notification["title"],
        message=notification["message"],
        application=application,
    )
    send_application_whatsapp(application, notification["message"], "organization feedback release")


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
    if next_status == "shortlisted" and assigned_department:
        notify_department_application_assigned(application)
    return application
