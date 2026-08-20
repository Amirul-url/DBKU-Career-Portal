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

    def test_organization_feedback_document_must_be_pdf(self):
        applicant = self.create_applicant("feedback-target@example.com")
        hrm = self.user_model.objects.create_user(
            username="hrm-feedback@example.com",
            email="hrm-feedback@example.com",
            password="Password123!",
            role="admin",
            department="Bahagian Pengurusan Sumber Manusia (HRM)",
        )
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="accepted",
        )
        uploaded_file = SimpleUploadedFile(
            "maklumbalas.png",
            b"not a pdf",
            content_type="image/png",
        )
        client = APIClient()
        client.force_authenticate(user=hrm)

        response = client.patch(
            f"/api/applications/{application.id}/",
            {"organizationFeedbackDocument": uploaded_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("organizationFeedbackDocument", response.data)

    def test_hrm_can_clear_uploaded_organization_feedback_document(self):
        applicant = self.create_applicant("clear-feedback-target@example.com")
        hrm = self.user_model.objects.create_user(
            username="hrm-clear-feedback@example.com",
            email="hrm-clear-feedback@example.com",
            password="Password123!",
            role="admin",
            department="Bahagian Pengurusan Sumber Manusia (HRM)",
        )
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="accepted",
        )
        uploaded_file = SimpleUploadedFile(
            "maklumbalas.pdf",
            b"%PDF-1.4\n% test\n",
            content_type="application/pdf",
        )
        client = APIClient()
        client.force_authenticate(user=hrm)
        upload_response = client.patch(
            f"/api/applications/{application.id}/",
            {"organizationFeedbackDocument": uploaded_file},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, 200)
        self.assertIn("organizationFeedbackDocument", upload_response.data["document_files"])

        clear_response = client.patch(
            f"/api/applications/{application.id}/",
            {"clearOrganizationFeedbackDocument": True},
            format="json",
        )

        self.assertEqual(clear_response.status_code, 200)
        self.assertNotIn("organizationFeedbackDocument", clear_response.data["document_files"])
        self.assertNotIn("organizationFeedbackDocuments", clear_response.data["document_files"])
        application.refresh_from_db()
        self.assertFalse(application.organization_feedback_document)
        self.assertEqual(application.organization_feedback_document_original_name, "")
        self.assertNotIn("organization_feedback", application.profile_data)

    def test_hrm_can_upload_multiple_organization_feedback_documents(self):
        applicant = self.create_applicant("multi-feedback-target@example.com")
        hrm = self.user_model.objects.create_user(
            username="hrm-multi-feedback@example.com",
            email="hrm-multi-feedback@example.com",
            password="Password123!",
            role="admin",
            department="Bahagian Pengurusan Sumber Manusia (HRM)",
        )
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="accepted",
        )
        first_file = SimpleUploadedFile(
            "maklumbalas-pertama.pdf",
            b"%PDF-1.4\n% first\n",
            content_type="application/pdf",
        )
        second_file = SimpleUploadedFile(
            "maklumbalas-kedua.pdf",
            b"%PDF-1.4\n% second\n",
            content_type="application/pdf",
        )
        client = APIClient()
        client.force_authenticate(user=hrm)

        response = client.patch(
            f"/api/applications/{application.id}/",
            {"organizationFeedbackDocuments": [first_file, second_file]},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        documents = response.data["document_files"]["organizationFeedbackDocuments"]
        self.assertEqual(len(documents), 2)
        self.assertEqual([document["name"] for document in documents], ["maklumbalas-pertama.pdf", "maklumbalas-kedua.pdf"])
        self.assertIn("/media/organization_feedback_documents/", documents[0]["url"])
        self.assertIn("size_label", documents[0])
        self.assertNotIn("organizationFeedbackDocument", response.data["document_files"])

        application.refresh_from_db()
        self.assertEqual(len(application.profile_data["organization_feedback_documents"]), 2)

        delete_response = client.patch(
            f"/api/applications/{application.id}/",
            {"clearOrganizationFeedbackDocumentId": documents[0]["id"]},
            format="json",
        )

        self.assertEqual(delete_response.status_code, 200)
        remaining_documents = delete_response.data["document_files"]["organizationFeedbackDocuments"]
        self.assertEqual(len(remaining_documents), 1)
        self.assertEqual(remaining_documents[0]["name"], "maklumbalas-kedua.pdf")

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

    def test_department_admin_only_sees_applications_assigned_to_department(self):
        applicant = self.create_applicant("assigned-applicant@example.com")
        ict_admin = self.user_model.objects.create_user(
            username="ict-admin@example.com",
            email="ict-admin@example.com",
            password="Password123!",
            role="admin",
            department="Bahagian Teknologi Maklumat (ICT)",
            department_role="Ketua Bahagian",
        )
        finance_admin = self.user_model.objects.create_user(
            username="finance-admin@example.com",
            email="finance-admin@example.com",
            password="Password123!",
            role="admin",
            department="Bahagian Kewangan (FIN)",
            department_role="Ketua Bahagian",
        )
        ict_application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="shortlisted",
            assigned_department="Bahagian Teknologi Maklumat (ICT)",
        )
        finance_application = CandidateApplication.objects.create(
            applicant=self.create_applicant("finance-assigned@example.com"),
            vacancy=self.vacancy,
            status="shortlisted",
            assigned_department="Bahagian Kewangan (FIN)",
        )

        client = APIClient()
        client.force_authenticate(user=ict_admin)
        ict_response = client.get("/api/applications/")
        client.force_authenticate(user=finance_admin)
        finance_response = client.get("/api/applications/")

        self.assertEqual(ict_response.status_code, 200)
        self.assertEqual(finance_response.status_code, 200)
        ict_applications = ict_response.data.get("results", ict_response.data) if isinstance(ict_response.data, dict) else ict_response.data
        finance_applications = finance_response.data.get("results", finance_response.data) if isinstance(finance_response.data, dict) else finance_response.data
        ict_ids = {application["id"] for application in ict_applications}
        finance_ids = {application["id"] for application in finance_applications}
        self.assertIn(ict_application.id, ict_ids)
        self.assertNotIn(finance_application.id, ict_ids)
        self.assertIn(finance_application.id, finance_ids)
        self.assertNotIn(ict_application.id, finance_ids)

    def test_hrm_review_can_assign_application_to_department(self):
        applicant = self.create_applicant("assign-target@example.com")
        hrm = self.user_model.objects.create_user(
            username="hrm-assign@example.com",
            email="hrm-assign@example.com",
            password="Password123!",
            role="admin",
            department="Bahagian Pengurusan Sumber Manusia (HRM)",
        )
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="submitted",
        )
        client = APIClient()
        client.force_authenticate(user=hrm)

        response = client.post(
            f"/api/applications/{application.id}/review/",
            {
                "status": "shortlisted",
                "assigned_department": "Bahagian Teknologi Maklumat (ICT)",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["assigned_department"], "Bahagian Teknologi Maklumat (ICT)")
        application.refresh_from_db()
        self.assertEqual(application.assigned_department, "Bahagian Teknologi Maklumat (ICT)")

    def test_department_admin_cannot_reassign_application_to_another_department(self):
        applicant = self.create_applicant("department-review@example.com")
        ict_admin = self.user_model.objects.create_user(
            username="ict-review@example.com",
            email="ict-review@example.com",
            password="Password123!",
            role="admin",
            department="Bahagian Teknologi Maklumat (ICT)",
            department_role="Ketua Bahagian",
        )
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="shortlisted",
            assigned_department="Bahagian Teknologi Maklumat (ICT)",
        )
        client = APIClient()
        client.force_authenticate(user=ict_admin)

        response = client.post(
            f"/api/applications/{application.id}/review/",
            {
                "status": "shortlisted",
                "assigned_department": "Bahagian Kewangan (FIN)",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        application.refresh_from_db()
        self.assertEqual(application.assigned_department, "Bahagian Teknologi Maklumat (ICT)")

    def test_assigned_department_is_read_only_on_application_update(self):
        applicant = self.create_applicant("readonly-assignment@example.com")
        application = CandidateApplication.objects.create(
            applicant=applicant,
            vacancy=self.vacancy,
            status="incomplete",
        )
        client = APIClient()
        client.force_authenticate(user=applicant)

        response = client.patch(
            f"/api/applications/{application.id}/",
            {"assigned_department": "Bahagian Teknologi Maklumat (ICT)"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        application.refresh_from_db()
        self.assertEqual(application.assigned_department, "")

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
        self.assertIn("telah ditanda tidak layak", notification.message)
        self.assertIn("Permohonan ini tidak boleh dikemaskini semula", notification.message)
        self.assertIn("Sila buat permohonan baharu", notification.message)
        self.assertIn("Portal Kerjaya DBKU", notification.message)
        self.assertNotIn("HRM", notification.message)
        mock_send_email.assert_called_once_with(applicant, notification.title, notification.message)
        mock_send_whatsapp.assert_called_once_with(applicant.mobile_number, notification.message)
