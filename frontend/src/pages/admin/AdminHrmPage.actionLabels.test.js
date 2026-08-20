import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AdminHrmPage.jsx", import.meta.url), "utf8");
const adminRoutesSource = readFileSync(new URL("../../modules/admin/adminRoutes.js", import.meta.url), "utf8");

test("HRM application action labels match the department review workflow", () => {
  assert.match(source, />\s*Hantar ke Bahagian\s*</);
  assert.match(source, />\s*Tidak Lengkap\s*</);
  assert.match(source, />\s*Tidak Layak\s*</);
  assert.match(source, /reviewWithAssessment\("incomplete", "Tidak Lengkap"\)/);
  assert.match(source, /onReview\(app\.id, "incomplete"\)/);
  assert.doesNotMatch(source, />\s*Senarai pendek\s*</);
  assert.doesNotMatch(source, />\s*Tolak\s*</);
});

test("HRM sidebar shows red badges for new application counts", () => {
  assert.match(source, /getSidebarApplicationBadgeCount\(item, dashboardMetrics\)/);
  assert.match(source, /className="hrm-sidebar-badge"/);
  assert.match(source, /aria-label=\{`\$\{sidebarBadgeCount\} permohonan baharu`\}/);
});

test("admin workspace labels and navigation follow the signed-in department", () => {
  assert.match(source, /getDepartmentWorkspaceLabel\(user\)/);
  assert.match(source, /getAdminShellRoleLabel\(user\)/);
  assert.match(source, /visibleAdminNavItems\.map/);
  assert.match(source, /isHrmWorkspace \? adminNavItems : adminNavItems\.filter/);
  assert.match(source, /item\.panel === "applicants"/);
  assert.match(source, /\["PEMOHON", "JAWATAN DBKU", "LATIHAN INDUSTRI"\]\.includes\(item\.label\)/);
  assert.match(source, /item\.panel === "manage" && item\.vacancyType === "job"/);
  assert.match(source, /\["job", "internship"\]\.includes\(item\.vacancyType\)/);
  assert.doesNotMatch(source, />Pentadbir HRM<\/p>/);
  assert.doesNotMatch(source, />Papan pemuka HRM<\/h1>/);
});

test("department job management is read-only", () => {
  assert.match(adminRoutesSource, /label: "Jawatan Kosong DBKU"/);
  assert.doesNotMatch(adminRoutesSource, /label: "Urus Jawatan DBKU"/);
  assert.match(source, /activeManageOpportunityLabel = activeVacancyType === "job" \? "Jawatan Kosong DBKU" : activeOpportunityLabel/);
  assert.match(source, />Senarai \{activeManageOpportunityLabel\}<\/h1>/);
  assert.match(source, /onDelete=\{isHrmWorkspace \? requestDeleteJob : null\}/);
  assert.match(source, /onEdit=\{isHrmWorkspace \? openJobEdit : null\}/);
  assert.match(source, /\{isHrmWorkspace \? \(\s*<button[\s\S]*Tambah \{activeManageOpportunityLabel\}/);
  assert.match(source, /\{onEdit \? \(/);
  assert.match(source, /\{onDelete \? \(/);
});

test("department dashboards keep the HRM layout without HRM-only workflow links", () => {
  assert.match(source, /<div className="hrm-grid hrm-dashboard-grid">[\s\S]*<RecentApplicationsPanel/);
  assert.match(source, /applicationLinks=\{isHrmWorkspace \? undefined : \[\]\}/);
  assert.match(source, /title=\{isHrmWorkspace \? "Saluran pengambilan" : "Ringkasan bahagian"\}/);
  assert.match(source, /onViewApplications: isHrmWorkspace \? \(\) => openFilteredPanel\(item\.applicationsLabel, "Permohonan", item\.type\) : null/);
  assert.match(source, /\{channel\.onViewApplications \? <button onClick=\{channel\.onViewApplications\} type="button">Permohonan<\/button> : null\}/);
  assert.doesNotMatch(source, /function DepartmentDashboardPanel/);
});

test("HRM review can assign internship applications to a department dashboard", () => {
  assert.match(source, /assigned_department: assignedDepartment/);
  assert.match(source, />\s*Hantar kepada bahagian\s*</);
  assert.match(source, /<\/div>\s*<label className="hrm-assignment-target">/);
  assert.match(source, /disabled=\{!application \|\| isFinal \|\| isSavingAssessment \|\| !assignedDepartment\}/);
});
