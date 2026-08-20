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
  assert.doesNotMatch(source, /className="reject"[\s\S]*>\s*Tolak\s*</);
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
  assert.doesNotMatch(source, /<h2>\{activeManageOpportunityLabel\} disiarkan<\/h2>/);
  assert.doesNotMatch(source, /rekod \{activeManageOpportunityLabel\.toLowerCase\(\)\}/);
  assert.match(source, /className="hrm-job-management-table"/);
  assert.match(source, /className="hrm-pagination hrm-job-management-pagination"/);
  assert.match(source, /const \[jobMonthFilter, setJobMonthFilter\] = useState\("all"\)/);
  assert.match(source, /const \[jobYearFilter, setJobYearFilter\] = useState\("all"\)/);
  assert.match(source, /className="applicant-table-toolbar hrm-manage-toolbar"/);
  assert.match(source, /className="applicant-table-controls hrm-manage-filters"/);
  assert.match(source, /resetJobFilters/);
  assert.match(source, /getJobDateParts\(job\)/);
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

test("internship application list does not repeat the page title inside the table card", () => {
  assert.match(source, /activeVacancyType !== "internship" \? \(/);
  assert.match(source, /<h2>Permohonan \{activeOpportunityLabel\}<\/h2>/);
});

test("HRM review can assign internship applications to a department dashboard", () => {
  assert.match(source, /assigned_department: assignedDepartment/);
  assert.match(source, />\s*Hantar kepada bahagian\s*</);
  assert.match(source, /<\/div>\s*<label className="hrm-assignment-target">/);
  assert.match(source, /disabled=\{!application \|\| isFinal \|\| isSavingAssessment \|\| !assignedDepartment\}/);
});

test("department decision tab replaces HRM review for department workspaces", () => {
  assert.match(source, /const departmentDecisionTab = "Keputusan Bahagian"/);
  assert.match(source, /profile_data: profileData/);
  assert.match(source, /status: "accepted"/);
  assert.match(source, /department_decision: decision/);
  assert.match(source, /function DepartmentDecisionTab/);
  assert.match(source, /Syor Bahagian/);
  assert.match(source, /Sila pilih/);
  assert.match(source, /Terima/);
  assert.match(source, /Tolak/);
  assert.match(source, /Hantar ke HRM/);
  assert.match(source, /\.\.\.\(isHrmWorkspace \? \[hrmReviewTab\] : \[\]\)/);
  assert.match(source, /\.\.\.\(shouldShowDepartmentDecision \? \[departmentDecisionTab\] : \[\]\)/);
  assert.match(source, /isReadOnly=\{isHrmWorkspace\}/);
  assert.match(source, /maskAcceptedStatus=\{false\}/);
});

test("HRM and department decision tabs keep draft selections in local state until submitted", () => {
  assert.match(source, /const \[decision, setDecision\] = useState\(savedAssessment\.decision \|\| ""\)/);
  assert.match(source, /const \[educationLevel, setEducationLevel\] = useState/);
  assert.match(source, /const \[recommendation, setRecommendation\] = useState/);
  assert.match(source, /const \[remarks, setRemarks\] = useState/);
  assert.match(source, /const isSaved = await saveAssessment\(\{ decision: nextDecision, educationLevel \}\)/);
  assert.match(source, /const chooseDecision = \(item\) => \{\s*const nextDecision = decision === item \? "" : item;\s*setDecision\(nextDecision\);\s*\};/);
  assert.match(source, /const chooseEducationLevel = \(item\) => \{\s*const nextEducationLevel = educationLevel === item \? "" : item;\s*setEducationLevel\(nextEducationLevel\);\s*\};/);
  assert.match(source, /await onSaveDecision\(application, buildDepartmentDecisionPayload/);
  assert.doesNotMatch(source, /window\.alert/);
  assert.match(source, /function DepartmentDecisionConfirmModal/);
  assert.doesNotMatch(source, />Pengesahan<\/p>/);
  assert.doesNotMatch(source, /<h2[^>]*>Hantar kepada HRM\?<\/h2>/);
  assert.doesNotMatch(source, /DepartmentDecisionConfirmModal[\s\S]*<Icon>close<\/Icon>[\s\S]*function DepartmentDecisionTab/);
  assert.match(source, /Anda yakin mahu menghantar keputusan bahagian ini kepada HRM\?/);
  assert.match(source, />\s*Tidak\s*</);
  assert.match(source, />\s*\{isSaving \? "Menghantar\.\.\." : "Ya"\}\s*</);
  assert.match(source, /setShowConfirmModal\(true\)/);
  assert.match(source, /onSubmitted\?\.\(\)/);
  assert.match(source, /onDepartmentDecisionSubmitted=\{\(\) => navigate\(ADMIN_ROUTES\.applications\.internship\)\}/);
});
