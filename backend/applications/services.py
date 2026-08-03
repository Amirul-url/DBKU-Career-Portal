from django.utils import timezone

from notifications.services import create_notification

from .models import CandidateApplication


class InvalidApplicationStatus(ValueError):
    pass


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
    create_notification(
        user=application.applicant,
        title="Permohonan dihantar",
        message=f"Permohonan {application.reference_no} telah dihantar.",
        application=application,
    )
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
