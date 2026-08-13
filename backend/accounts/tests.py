from datetime import timedelta
from unittest.mock import patch

from django.core.cache import cache
from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import LoginSession, User


class LoginSessionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="sessionuser",
            email="session@example.com",
            password="Password123!",
            role="admin",
        )

    def test_login_creates_session_and_logout_closes_it(self):
        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "session@example.com", "password": "Password123!"},
            format="json",
        )

        self.assertEqual(login_response.status_code, 200)
        session_id = login_response.data["login_session_id"]
        session = LoginSession.objects.get(pk=session_id)
        self.assertEqual(session.user, self.user)
        self.assertIsNone(session.logout_at)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")
        logout_response = self.client.post(
            "/api/auth/logout/",
            {"login_session_id": session_id},
            format="json",
        )

        self.assertEqual(logout_response.status_code, 200)
        session.refresh_from_db()
        self.assertIsNotNone(session.logout_at)
        self.assertIsNotNone(session.duration_seconds)

    def test_login_again_closes_existing_open_session_and_starts_new_one(self):
        first_login = self.client.post(
            "/api/auth/login/",
            {"email": "session@example.com", "password": "Password123!"},
            format="json",
        )
        second_login = self.client.post(
            "/api/auth/login/",
            {"email": "session@example.com", "password": "Password123!"},
            format="json",
        )

        self.assertEqual(first_login.status_code, 200)
        self.assertEqual(second_login.status_code, 200)
        first_session = LoginSession.objects.get(pk=first_login.data["login_session_id"])
        second_session = LoginSession.objects.get(pk=second_login.data["login_session_id"])
        self.assertEqual(first_session.user, self.user)
        self.assertEqual(second_session.user, self.user)
        self.assertIsNotNone(first_session.logout_at)
        self.assertIsNotNone(first_session.duration_seconds)
        self.assertIsNone(second_session.logout_at)
        self.assertIsNone(second_session.duration_seconds)

    @override_settings(LOGIN_SESSION_TIMEOUT_SECONDS=3600)
    def test_login_again_caps_stale_session_duration_at_timeout(self):
        stale_login_at = timezone.now() - timedelta(hours=3)
        stale_session = LoginSession.objects.create(user=self.user, login_at=stale_login_at)

        login_response = self.client.post(
            "/api/auth/login/",
            {"email": "session@example.com", "password": "Password123!"},
            format="json",
        )

        self.assertEqual(login_response.status_code, 200)
        stale_session.refresh_from_db()
        self.assertEqual(stale_session.logout_at, stale_login_at + timedelta(hours=1))
        self.assertEqual(stale_session.duration_seconds, 3600)


class PasswordResetTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="reset@example.com",
            email="reset@example.com",
            mobile_number="60123456789",
            password="OldPassword123!",
            role="applicant",
        )

    @override_settings(NOTIFICATION_EMAIL_ENABLED=True)
    @patch("accounts.views.send_password_reset_email")
    def test_forgot_password_sends_and_verifies_otp_then_resets_password(self, mock_send_email):
        send_response = self.client.post(
            "/api/auth/forgot-password/send-otp/",
            {"email": "reset@example.com"},
            format="json",
        )

        self.assertEqual(send_response.status_code, 200)
        mock_send_email.assert_called_once()
        otp = mock_send_email.call_args.args[1]

        verify_response = self.client.post(
            "/api/auth/forgot-password/verify-otp/",
            {"email": "reset@example.com", "otp": otp},
            format="json",
        )
        self.assertEqual(verify_response.status_code, 200)

        reset_response = self.client.post(
            "/api/auth/reset-password/submit/",
            {
                "email": "reset@example.com",
                "otp": otp,
                "password": "NewPassword123!",
                "password2": "NewPassword123!",
            },
            format="json",
        )

        self.assertEqual(reset_response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPassword123!"))

    @override_settings(WHATSAPP_ENABLED=True)
    @patch("accounts.views.send_password_reset_whatsapp")
    def test_forgot_password_can_send_otp_by_whatsapp(self, mock_send_whatsapp):
        response = self.client.post(
            "/api/auth/forgot-password/send-otp/",
            {"method": "whatsapp", "phone_number": "+60 12-345 6789"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        mock_send_whatsapp.assert_called_once()
        self.assertEqual(mock_send_whatsapp.call_args.args[0], "60123456789")


class ApplicantRegistrationNotificationTests(APITestCase):
    @override_settings(NOTIFICATION_SIDE_EFFECTS_ENABLED=True, FRONTEND_URL="https://portal-kerjaya.example.test")
    @patch("accounts.services.create_notification")
    def test_register_sends_formal_registration_notification(self, mock_create_notification):
        response = self.client.post(
            "/api/auth/register/",
            {
                "full_name": "ALI BIN ABU",
                "email": "ali@example.com",
                "mobile_number": "60122223333",
                "password": "Password123!",
                "password2": "Password123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertNotIn("access", response.data)
        self.assertEqual(response.data["message"], "Pendaftaran akaun berjaya. Sila log masuk untuk meneruskan.")
        mock_create_notification.assert_called_once()
        call_kwargs = mock_create_notification.call_args.kwargs
        self.assertEqual(call_kwargs["title"], "Pendaftaran Akaun Berjaya")
        self.assertEqual(
            call_kwargs["message"],
            "Akaun Portal Kerjaya DBKU anda telah berjaya didaftarkan.\n\n"
            "Sila log masuk ke Portal Kerjaya DBKU untuk melengkapkan profil anda dan membuat permohonan jawatan yang bersesuaian.\n\n"
            "Pautan log masuk: https://portal-kerjaya.example.test/login\n\n"
            "Terima kasih.",
        )

    @override_settings(NOTIFICATION_SIDE_EFFECTS_ENABLED=True, WHATSAPP_ENABLED=True, FRONTEND_URL="https://portal-kerjaya.example.test")
    @patch("accounts.services.create_notification")
    @patch("accounts.services.send_whatsapp_message")
    def test_register_sends_formal_registration_whatsapp(self, mock_send_whatsapp, mock_create_notification):
        response = self.client.post(
            "/api/auth/register/",
            {
                "full_name": "SITI BINTI ABU",
                "email": "siti@example.com",
                "mobile_number": "+60 13-222 3333",
                "password": "Password123!",
                "password2": "Password123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        mock_create_notification.assert_called_once()
        mock_send_whatsapp.assert_called_once()
        self.assertEqual(mock_send_whatsapp.call_args.args[0], "60132223333")
        self.assertEqual(
            mock_send_whatsapp.call_args.args[1],
            "Akaun Portal Kerjaya DBKU anda telah berjaya didaftarkan.\n\n"
            "Sila log masuk ke Portal Kerjaya DBKU untuk melengkapkan profil anda dan membuat permohonan jawatan yang bersesuaian.\n\n"
            "Pautan log masuk: https://portal-kerjaya.example.test/login\n\n"
            "Terima kasih.",
        )


class SuperAdminApplicantManagementTests(APITestCase):
    def setUp(self):
        self.superadmin = User.objects.create_user(
            username="superadmin@example.com",
            email="superadmin@example.com",
            password="Password123!",
            role="superadmin",
        )
        self.admin = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="Password123!",
            role="admin",
        )
        self.applicant = User.objects.create_user(
            username="delete-me@example.com",
            email="delete-me@example.com",
            password="Password123!",
            role="applicant",
        )

    def test_superadmin_can_delete_applicant(self):
        self.client.force_authenticate(user=self.superadmin)

        response = self.client.delete(f"/api/auth/applicants/{self.applicant.id}/profile/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(User.objects.filter(id=self.applicant.id).exists())

    def test_admin_can_list_and_view_applicants(self):
        self.client.force_authenticate(user=self.admin)

        list_response = self.client.get("/api/auth/applicants/")
        detail_response = self.client.get(f"/api/auth/applicants/{self.applicant.id}/profile/")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["applicant"]["id"], self.applicant.id)

    def test_admin_cannot_delete_applicant(self):
        self.client.force_authenticate(user=self.admin)

        response = self.client.delete(f"/api/auth/applicants/{self.applicant.id}/profile/")

        self.assertEqual(response.status_code, 403)
        self.assertTrue(User.objects.filter(id=self.applicant.id).exists())
