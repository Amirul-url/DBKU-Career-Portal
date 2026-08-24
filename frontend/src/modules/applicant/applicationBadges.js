function hasOrganizationFeedbackBeenSent(application) {
  return Boolean(application?.profile_data?.organization_feedback_release?.sent_to_applicant_at);
}

function hasApplicantAgreedToOffer(application) {
  return application?.profile_data?.applicant_confirmation?.status === "agreed";
}

export function hasNewOrganizationFeedbackForApplicant(application) {
  return (application?.status || "") === "offered" && hasOrganizationFeedbackBeenSent(application) && !hasApplicantAgreedToOffer(application);
}

export function getApplicantApplicationBadgeCount(applications = []) {
  return applications.filter(hasNewOrganizationFeedbackForApplicant).length;
}

export function getApplicationRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}
