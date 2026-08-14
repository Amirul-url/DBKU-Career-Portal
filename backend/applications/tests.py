from datetime import date
import json
import shutil
import tempfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from jobs.models import Vacancy
from notifications.models import Notification

from .models import CandidateApplication


class CandidateApplicationReferenceNoTests(TestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp()
        self.media_override = override_settings(MEDIA_ROOT=self.media_root)
        self.media_override.enable()
        self.vacancy = Vacancy.objects.create(
            title="Permohonan Latihan Industri DBKU",
            vacancy_type="internship",
            department="Pengurusan Sumber Manusia",
            summary="Permohonan latihan industri sepanjang tahun.",
            status="open",
        )
        self.user_model = get_user_model()

    def tearDown(self):
        self.media_override.disable()
        shutil.rmtree(self.media_root, ignore_errors=True)
        super().tearDown()

    def create_applicant(self, email, mobile_number=""):
        return self.user_model.objects.create_user(
            username=email,
            email=email,
            password="Password123!",
            role="applicant",
            mobile_number=mobile_number,
        )

    def test_reference_no_uses_yearly_pk_format(self):
        with patch("applications.models.timezone.localdate", return_value=date(2026, 8, 13)):
            first_application = CandidateApplication.objects.create(
                applicant=self.create_applicant("first@example.com"),
                vacancy=self.vacancy,
            )
            second_application = CandidateApplication.objects.create(
                applicant=self.create_applicant("second@example.com"),
                vacancy=self.vacancy,
            )

        self.assertEqual(first_application.reference_no, "PK.2026-0001")
        self.assertEqual(second_application.reference_no, "PK.2026-0002")

    def test_reference_no_resets_for_new_year(self):
        CandidateApplication.objects.create(
            applicant=self.create_applicant("old@example.com"),
            vacancy=self.vacancy,
            reference_no="PK.2026-0001",
        )

        with patch("applications.models.timezone.localdate", return_value=date(2027, 1, 1)):
            next_application = CandidateApplication.objects.create(
                applicant=self.create_applicant("new@example.com"),
                vacancy=self.vacancy,
            )

        self.assertEqual(next_application.reference_no, "PK.2027-0001")

    def test_reference_no_has_yearly_limit_of_9999(self):
        CandidateApplication.objects.create(
            applicant=self.create_applicant("limit@example.com"),
            vacancy=self.vacancy,
            reference_no="PK.2026-9999",
        )

        with patch("applications.models.timezone.localdate", return_value=date(2026, 12, 31)):
            with self.assertRaises(ValueError):
                CandidateApplication.objects.create(
                    applicant=self.create_applicant("overflow@example.com"),
                    vacancy=self.vacancy,
                )

    def test_creating_draft_application_does_not_create_notification(self):
        applicant = self.create_applicant("draft@example.com")
        client = APIClient()
        client.force_authenticate(user=applicant)

        response = client.post(
            "/api/applications/",
            {"vacancy": self.vacancy.id, "cover_letter": "Draf sementara."},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertFalse(Notification.objects.filter(user=applicant).exists())

    def test_internship_document_upload_is_saved_and_returned(self):
        applicant = self.create_applicant("documents@example.com")
        client = APIClient()
        client.force_authenticate(user=applicant)
        uploaded_file = SimpleUploadedFile(
            "surat-institusi.pdf",
            b"%PDF-1.4\n% test\n",
            content_type="application/pdf",
        )

        response = client.post(
            "/api/applications/",
            {
                "vacancy": self.vacancy.id,
                "cover_letter": "Permohonan Latihan Industri DBKU",
                "profile_data": json.dumps({"documents": {"universityLetterFile": "surat-institusi.pdf"}}),
                "universityLetterFile": uploaded_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        application = CandidateApplication.objects.get(id=response.data["id"])
        self.assertTrue(application.internship_university_letter.name.startswith("internship_documents/"))
        self.assertEqual(application.internship_university_letter_original_name, "surat-institusi.pdf")
        self.assertEqual(response.data["document_files"]["universityLetterFile"]["name"], "surat-institusi.pdf")
        self.assertIn("/media/internship_documents/", response.data["document_files"]["universityLetterFile"]["url"])

    def test_staff_application_list_excludes_drafts(self):
        applicant = self.create_applicant("hidden-draft@example.com")
        staff = self.user_model.objects.create_user(
            username="hrm@example.com",
            email="hrm@example.com",
            password="Password123!",
            role="admin",
        )
        draft_application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="draft",
        )
        submitted_application = CandidateApplication.objects.create(
            applicant=self.create_applicant("submitted@example.com"),
            vacancy=self.vacancy,
            status="submitted",
        )
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.get("/api/applications/")

        self.assertEqual(response.status_code, 200)
        applications = response.data.get("results", response.data) if isinstance(response.data, dict) else response.data
        returned_ids = {application["id"] for application in applications}
        self.assertNotIn(draft_application.id, returned_ids)
        self.assertIn(submitted_application.id, returned_ids)

    def test_applicant_can_update_and_resubmit_incomplete_application(self):
        applicant = self.create_applicant("resubmit-incomplete@example.com")
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="incomplete",
            profile_data={"student_info": {"name": "OLD NAME"}},
        )
        client = APIClient()
        client.force_authenticate(user=applicant)

        update_response = client.patch(
            f"/api/applications/{application.id}/",
            {
                "profile_data": {"student_info": {"name": "UPDATED NAME"}},
            },
            format="json",
        )
        submit_response = client.post(f"/api/applications/{application.id}/submit/")

        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(submit_response.status_code, 200)
        application.refresh_from_db()
        self.assertEqual(application.status, "submitted")
        self.assertEqual(application.profile_data["student_info"]["name"], "UPDATED NAME")

    def test_applicant_cannot_update_submitted_application(self):
        applicant = self.create_applicant("locked-submitted@example.com")
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="submitted",
            profile_data={"student_info": {"name": "LOCKED NAME"}},
        )
        client = APIClient()
        client.force_authenticate(user=applicant)

        response = client.patch(
            f"/api/applications/{application.id}/",
            {
                "profile_data": {"student_info": {"name": "SHOULD NOT SAVE"}},
            },
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        application.refresh_from_db()
        self.assertEqual(application.profile_data["student_info"]["name"], "LOCKED NAME")

    def test_applicant_cannot_resubmit_rejected_application(self):
        applicant = self.create_applicant("locked-rejected@example.com")
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="rejected",
        )
        client = APIClient()
        client.force_authenticate(user=applicant)

        response = client.post(f"/api/applications/{application.id}/submit/")

        self.assertEqual(response.status_code, 400)
        application.refresh_from_db()
        self.assertEqual(application.status, "rejected")

    def test_applicant_cannot_change_status_with_update(self):
        applicant = self.create_applicant("status-guard@example.com")
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="incomplete",
        )
        client = APIClient()
        client.force_authenticate(user=applicant)

        response = client.patch(
            f"/api/applications/{application.id}/",
            {"status": "submitted"},
            format="json",
        )

        self.assertEqual(response.status_code, 403)
        application.refresh_from_db()
        self.assertEqual(application.status, "incomplete")

    def test_applicant_can_create_new_application_after_rejection(self):
        applicant = self.create_applicant("new-after-reject@example.com")
        CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="rejected",
        )
        client = APIClient()
        client.force_authenticate(user=applicant)

        response = client.post(
            "/api/applications/",
            {"vacancy": self.vacancy.id, "cover_letter": "Permohonan baharu."},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(CandidateApplication.objects.filter(applicant=applicant, vacancy=self.vacancy).count(), 2)
        self.assertNotEqual(response.data["status"], "rejected")

    def test_applicant_cannot_create_duplicate_active_application(self):
        applicant = self.create_applicant("duplicate-active@example.com")
        CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="submitted",
        )
        client = APIClient()
        client.force_authenticate(user=applicant)

        response = client.post(
            "/api/applications/",
            {"vacancy": self.vacancy.id, "cover_letter": "Permohonan kedua."},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(CandidateApplication.objects.filter(applicant=applicant, vacancy=self.vacancy).count(), 1)

    @override_settings(NOTIFICATION_EMAIL_ENABLED=True, WHATSAPP_ENABLED=True)
    @patch("applications.services.send_whatsapp_message")
    @patch("notifications.services.send_notification_email")
    def test_review_marks_application_incomplete_and_notifies_applicant(self, mock_send_email, mock_send_whatsapp):
        applicant = self.create_applicant("incomplete@example.com", mobile_number="60123456789")
        staff = self.user_model.objects.create_user(
            username="hrm-incomplete@example.com",
            email="hrm-incomplete@example.com",
            password="Password123!",
            role="admin",
        )
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="submitted",
        )
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.post(
            f"/api/applications/{application.id}/review/",
            {"status": "incomplete"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        application.refresh_from_db()
        self.assertEqual(application.status, "incomplete")
        notification = Notification.objects.get(application=application, user=applicant)
        self.assertEqual(notification.title, "Permohonan Tidak Lengkap")
        self.assertIn(application.reference_no, notification.message)
        self.assertIn("tidak lengkap", notification.message.lower())
        mock_send_email.assert_called_once_with(applicant, notification.title, notification.message)
        mock_send_whatsapp.assert_called_once_with(applicant.mobile_number, notification.message)

    @override_settings(NOTIFICATION_EMAIL_ENABLED=True, WHATSAPP_ENABLED=True)
    @patch("applications.services.send_whatsapp_message")
    @patch("notifications.services.send_notification_email")
    def test_review_marks_application_not_eligible_and_notifies_applicant(self, mock_send_email, mock_send_whatsapp):
        applicant = self.create_applicant("not-eligible@example.com", mobile_number="60199887766")
        staff = self.user_model.objects.create_user(
            username="hrm-reject@example.com",
            email="hrm-reject@example.com",
            password="Password123!",
            role="admin",
        )
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="submitted",
        )
        client = APIClient()
        client.force_authenticate(user=staff)

        response = client.post(
            f"/api/applications/{application.id}/review/",
            {"status": "rejected"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        application.refresh_from_db()
        self.assertEqual(application.status, "rejected")
        notification = Notification.objects.get(application=application, user=applicant)
        self.assertEqual(notification.title, "Permohonan Tidak Layak")
        self.assertIn(application.reference_no, notification.message)
        self.assertIn("tidak layak", notification.message.lower())
        self.assertIn("Permohonan ini tidak boleh dikemaskini semula", notification.message)
        self.assertIn("Sila buat permohonan baharu", notification.message)
        mock_send_email.assert_called_once_with(applicant, notification.title, notification.message)
        mock_send_whatsapp.assert_called_once_with(applicant.mobile_number, notification.message)
