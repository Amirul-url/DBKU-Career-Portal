const hrmVisibleApplicationStatuses = new Set([
  "submitted",
  "screening",
  "incomplete",
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

function getApplicationDateParts(application) {
  const value = application?.submitted_at || application?.created_at || "";
  if (!value) return { month: "", year: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "", year: "" };
  return {
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear()),
  };
}

export function buildRecentApplicationsView(applications = [], { month = "all", page = 1, pageSize = 5, year = "all" } = {}) {
  const filteredApplications = (Array.isArray(applications) ? applications : []).filter((application) => {
    const dateParts = getApplicationDateParts(application);
    return (
      (month === "all" || dateParts.month === month) &&
      (year === "all" || dateParts.year === year)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const activePage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const visibleApplications = filteredApplications.slice(startIndex, startIndex + pageSize);

  return {
    activePage,
    total: filteredApplications.length,
    totalPages,
    visibleApplications,
    visibleEnd: Math.min(startIndex + pageSize, filteredApplications.length),
    visibleStart: filteredApplications.length ? startIndex + 1 : 0,
  };
}
