import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AdminHrmPage.jsx", import.meta.url), "utf8");

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
  assert.doesNotMatch(source, />Pentadbir HRM<\/p>/);
  assert.doesNotMatch(source, />Papan pemuka HRM<\/h1>/);
});

test("HRM review can assign internship applications to a department dashboard", () => {
  assert.match(source, /assigned_department: assignedDepartment/);
  assert.match(source, />\s*Hantar kepada bahagian\s*</);
  assert.match(source, /disabled=\{!application \|\| isFinal \|\| isSavingAssessment \|\| !assignedDepartment\}/);
});
