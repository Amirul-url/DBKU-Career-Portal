import assert from "node:assert/strict";
import test from "node:test";
import {
  getApplicantAgreedInternshipStatus,
  getInternshipLifecycleStatus,
} from "./internshipLifecycleStatus.js";

test("marks agreed internship as active during the internship period", () => {
  const application = {
    profile_data: {
      applicant_confirmation: { status: "agreed" },
      organization_feedback_release: {
        internship_period: "16 Mac 2026 - 28 Ogos 2026",
      },
    },
  };

  assert.equal(getInternshipLifecycleStatus(application, new Date("2026-08-21T08:00:00+08:00")), "internship_active");
  assert.equal(getApplicantAgreedInternshipStatus(application, new Date("2026-08-21T08:00:00+08:00")), "internship_active");
});

test("marks agreed internship as completed after the internship period ends", () => {
  const application = {
    profile_data: {
      applicant_confirmation: { status: "agreed" },
      organization_feedback_release: {
        internship_period: "16 Mac 2026 - 28 Ogos 2026",
      },
    },
  };

  assert.equal(getInternshipLifecycleStatus(application, new Date("2026-08-29T08:00:00+08:00")), "internship_completed");
  assert.equal(getApplicantAgreedInternshipStatus(application, new Date("2026-08-29T08:00:00+08:00")), "internship_completed");
});

test("keeps agreed internships in confirmation status before the internship starts or when the period is missing", () => {
  const application = {
    profile_data: {
      applicant_confirmation: { status: "agreed" },
      organization_feedback_release: {
        internship_period: "25 Ogos 2026 - 24 Februari 2027",
      },
    },
  };

  assert.equal(getApplicantAgreedInternshipStatus(application, new Date("2026-08-24T08:00:00+08:00")), "applicant_agreed");
  assert.equal(getApplicantAgreedInternshipStatus({ profile_data: { applicant_confirmation: { status: "agreed" } } }), "applicant_agreed");
});
