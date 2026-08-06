export const SUPERADMIN_ROUTES = {
  administrators: "/superadmin/admins",
  applicants: "/superadmin/applicants",
  dashboard: "/superadmin/dashboard",
  superadmins: "/superadmin/superadmins",
};

export const superAdminNavItems = [
  { icon: "dashboard", key: "dashboard", label: "Papan Pemuka", to: SUPERADMIN_ROUTES.dashboard },
  { kind: "section", label: "PEMOHON" },
  { icon: "group", key: "applicants", label: "Pemohon", to: SUPERADMIN_ROUTES.applicants },
  { kind: "section", label: "DBKU" },
  { icon: "admin_panel_settings", key: "administrators", label: "Pentadbir", to: SUPERADMIN_ROUTES.administrators },
  { kind: "section", label: "SISTEM" },
  { icon: "shield_person", key: "superadmins", label: "Super Admin", to: SUPERADMIN_ROUTES.superadmins },
];
