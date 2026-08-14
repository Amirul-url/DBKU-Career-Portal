const hrmVisibleApplicationStatuses = new Set([
  "submitted",
  "screening",
  "shortlisted",
  "interview",
  "offered",
  "accepted",
  "rejected",
  "withdrawn",
]);

const isHrmVisibleApplication = (application) =>
  hrmVisibleApplicationStatuses.has(application?.status || "submitted");

const isActiveVacancy = (job) => job?.is_open ?? job?.status === "open";

export function buildHrmDashboardMetrics(jobs = [], applications = []) {
  const visibleJobs = Array.isArray(jobs) ? jobs : [];
  const visibleApplications = (Array.isArray(applications) ? applications : []).filter(isHrmVisibleApplication);
  const jobTypesById = new Map(visibleJobs.map((job) => [String(job.id), job.vacancy_type]));
  const applicationsByType = (type) =>
    visibleApplications.filter((application) => {
      const vacancyType = application.vacancy_detail?.vacancy_type || jobTypesById.get(String(application.vacancy));
      return vacancyType === type;
    });
  const metricsByType = (type) => {
    const typeJobs = visibleJobs.filter((job) => job.vacancy_type === type);
    const typeApplications = applicationsByType(type);
    return {
      applications: typeApplications,
      jobs: typeJobs,
      new: typeApplications.filter((app) => app.status === "submitted").length,
      open: typeJobs.filter(isActiveVacancy).length,
      shortlist: typeApplications.filter((app) => app.status === "shortlisted").length,
      total: typeApplications.length,
    };
  };
  const job = metricsByType("job");
  const internship = metricsByType("internship");
  const all = {
    applications: visibleApplications,
    jobs: visibleJobs,
    new: visibleApplications.filter((app) => app.status === "submitted").length,
    open: visibleJobs.filter(isActiveVacancy).length,
    shortlist: visibleApplications.filter((app) => app.status === "shortlisted").length,
    total: visibleApplications.length,
  };

  return {
    all,
    internship,
    job,
    summary: {
      activeJobAds: job.open,
      newApplications: all.new,
      shortlist: all.shortlist,
      totalApplications: all.total,
    },
  };
}
