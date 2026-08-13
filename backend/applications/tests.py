from datetime import date
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase

from jobs.models import Vacancy

from .models import CandidateApplication


class CandidateApplicationReferenceNoTests(TestCase):
    def setUp(self):
        self.vacancy = Vacancy.objects.create(
            title="Permohonan Latihan Industri DBKU",
            vacancy_type="internship",
            department="Pengurusan Sumber Manusia",
            summary="Permohonan latihan industri sepanjang tahun.",
            status="open",
        )
        self.user_model = get_user_model()

    def create_applicant(self, email):
        return self.user_model.objects.create_user(
            username=email,
            email=email,
            password="Password123!",
            role="applicant",
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
