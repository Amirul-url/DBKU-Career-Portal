export function getJobApplicationRoute(vacancyId) {
  return `/profile/job-application?vacancy=${encodeURIComponent(vacancyId)}`;
}

export function getOpportunityApplicationTarget(opportunity, { actionTarget = "/login" } = {}) {
  if (actionTarget !== "/profile") {
    return actionTarget;
  }

  if (opportunity?.vacancy_type === "job" && opportunity?.id) {
    return getJobApplicationRoute(opportunity.id);
  }

  return actionTarget;
}
