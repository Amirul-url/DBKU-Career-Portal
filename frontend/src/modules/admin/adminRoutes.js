export const ADMIN_ROUTES = {
  applications: {
    internship: "/admin/internships/applications",
    job: "/admin/jobs/applications",
  },
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
  { kind: "section", label: "JAWATAN DBKU" },
  { icon: "add_circle", label: "Tambah Jawatan DBKU", panel: "create", to: ADMIN_ROUTES.create.job, vacancyType: "job" },
  { icon: "work_history", label: "Urus Jawatan DBKU", panel: "manage", to: ADMIN_ROUTES.manage.job, vacancyType: "job" },
  { icon: "group", label: "Permohonan Jawatan DBKU", panel: "applications", to: ADMIN_ROUTES.applications.job, vacancyType: "job" },
  { kind: "section", label: "LATIHAN INDUSTRI" },
  { icon: "group", label: "Permohonan Latihan Industri", panel: "applications", to: ADMIN_ROUTES.applications.internship, vacancyType: "internship" },
];

export function getAdminRouteState(pathname) {
  const currentPath = pathname.replace(/\/+$/, "") || "/admin";
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

  return ADMIN_ROUTES.dashboard;
}
