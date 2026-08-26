export function getJobApplicationRoute(vacancyId) {
  return `/profile/job-application?vacancy=${encodeURIComponent(vacancyId)}`;
}

export function getJobApplicationEditRoute(applicationId) {
  return `/profile/job-application?application=${encodeURIComponent(applicationId)}`;
}

export function getApplicationViewRoute(applicationId) {
  return `/profile/applications/${encodeURIComponent(applicationId)}`;
}

export const jobReapplyAllowedApplicationStatuses = new Set(["rejected", "withdrawn"]);
export const jobEditableApplicationStatuses = new Set(["draft", "incomplete"]);

export function getApplicationVacancyId(application) {
  const vacancy = application?.vacancy_detail || application?.vacancy || {};
  if (typeof vacancy === "object" && vacancy !== null) {
    return vacancy.id || "";
  }
  return vacancy || "";
}

export function isJobApplication(application) {
  const vacancy = application?.vacancy_detail || application?.vacancy || {};
  return application?.vacancy_type === "job"
    || application?.type === "job"
    || vacancy.vacancy_type === "job"
    || vacancy.type === "Jawatan"
    || vacancy.category === "Jawatan";
}

export function isJobReapplyAllowedApplication(application) {
  return jobReapplyAllowedApplicationStatuses.has(application?.status || "draft");
}

export function getBlockingJobApplicationForVacancy(applications = [], vacancyId = "") {
  const targetVacancyId = String(vacancyId || "");
  if (!targetVacancyId) {
    return null;
  }

  return applications.find((application) => (
    isJobApplication(application)
    && String(getApplicationVacancyId(application)) === targetVacancyId
    && !isJobReapplyAllowedApplication(application)
  )) || null;
}

export function getExistingJobApplicationTarget(application) {
  if (!application?.id) {
    return "";
  }

  if (jobEditableApplicationStatuses.has(application.status || "draft")) {
    return getJobApplicationEditRoute(application.id);
  }

  return getApplicationViewRoute(application.id);
}

export function getOpportunityApplicationTarget(opportunity, { actionTarget = "/login", applications = [] } = {}) {
  if (actionTarget !== "/profile") {
    return actionTarget;
  }

  if (opportunity?.vacancy_type === "job" && opportunity?.id) {
    const existingApplication = getBlockingJobApplicationForVacancy(applications, opportunity.id);
    const existingApplicationTarget = getExistingJobApplicationTarget(existingApplication);
    if (existingApplicationTarget) {
      return existingApplicationTarget;
    }

    return getJobApplicationRoute(opportunity.id);
  }

  return actionTarget;
}
