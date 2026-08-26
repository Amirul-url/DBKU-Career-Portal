export const ADMIN_ROUTES = {
  applications: {
    internship: "/admin/internships/applications",
    job: "/admin/jobs/applications",
  },
  applicants: "/admin/applicants",
  create: {
    job: "/admin/jobs/create",
  },
  dashboard: "/admin/dashboard",
  manage: {
    job: "/admin/jobs",
  },
};

export const adminNavItems = [
  { icon: "dashboard", label: "Papan Pemuka", panel: "dashboard", to: ADMIN_ROUTES.dashboard },
  { kind: "section", label: "PEMOHON" },
  { icon: "group", label: "Akaun Pemohon", panel: "applicants", to: ADMIN_ROUTES.applicants },
  { kind: "section", label: "JAWATAN DBKU" },
  { icon: "add_circle", label: "Tambah Jawatan DBKU", panel: "create", to: ADMIN_ROUTES.create.job, vacancyType: "job" },
  { icon: "work_history", label: "Jawatan Kosong DBKU", panel: "manage", to: ADMIN_ROUTES.manage.job, vacancyType: "job" },
  { icon: "group", label: "Permohonan Jawatan DBKU", panel: "applications", to: ADMIN_ROUTES.applications.job, vacancyType: "job" },
  { kind: "section", label: "LATIHAN INDUSTRI" },
  { icon: "group", label: "Permohonan Latihan Industri", panel: "applications", to: ADMIN_ROUTES.applications.internship, vacancyType: "internship" },
];

export function getAdminRouteState(pathname) {
  const currentPath = pathname.replace(/\/+$/, "") || "/admin";
  const jobApplicationDetailMatch = currentPath.match(/^\/admin\/jobs\/applications\/([^/]+)$/);
  if (jobApplicationDetailMatch) {
    return {
      icon: "group",
      label: "Butiran Permohonan Jawatan DBKU",
      panel: "application-detail",
      to: currentPath,
      vacancyType: "job",
      applicationId: jobApplicationDetailMatch[1],
    };
  }

  const internshipApplicationDetailMatch = currentPath.match(/^\/admin\/internships\/applications\/([^/]+)$/);
  if (internshipApplicationDetailMatch) {
    return {
      icon: "group",
      label: "Butiran Permohonan Latihan Industri",
      panel: "application-detail",
      to: currentPath,
      vacancyType: "internship",
      applicationId: internshipApplicationDetailMatch[1],
    };
  }

  const route = adminNavItems.find((item) => item.to === currentPath);

  return route || adminNavItems[0];
}

export function getAdminRoutePath(panel, vacancyType = "job") {
  if (panel === "create") {
    return ADMIN_ROUTES.create[vacancyType] || ADMIN_ROUTES.create.job;
  }

  if (panel === "manage") {
    return ADMIN_ROUTES.manage[vacancyType] || ADMIN_ROUTES.manage.job;
  }

  if (panel === "applications") {
    return ADMIN_ROUTES.applications[vacancyType] || ADMIN_ROUTES.applications.job;
  }

  if (panel === "applicants") {
    return ADMIN_ROUTES.applicants;
  }

  return ADMIN_ROUTES.dashboard;
}
