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
  assert.match(source, /getSidebarApplicationBadgeCount\(item, dashboardMetrics, \{ isHrmWorkspace \}\)/);
  assert.match(source, /className="hrm-sidebar-badge"/);
  assert.match(source, /aria-label=\{`\$\{sidebarBadgeCount\} permohonan baharu`\}/);
  assert.match(source, /isHrmPendingDepartmentDecisionApplication\(application\)/);
  assert.match(source, /\(application\?\.status \|\| "submitted"\) === "submitted"/);
});

test("department and HRM internship rows mark pending decision tasks as new", () => {
  assert.match(source, /department_new: "Baharu"/);
  assert.match(source, /hrm_department_new: "Baharu"/);
  assert.match(source, /hrm_department_accepted: "Diterima Bahagian"/);
  assert.match(source, /hrm_department_rejected: "Ditolak Bahagian"/);
  assert.match(source, /department_new: "red"/);
  assert.match(source, /hrm_department_new: "red"/);
  assert.match(source, /hrm_department_accepted: "green"/);
  assert.match(source, /function hasSubmittedDepartmentDecision\(application\)/);
  assert.match(source, /function isDepartmentPendingDecisionApplication\(application\)/);
  assert.match(source, /function isHrmPendingDepartmentDecisionApplication\(application\)/);
  assert.match(source, /function getHrmDepartmentDecisionStatus\(application\)/);
  assert.match(source, /return Boolean\(application\?\.assigned_department && !hasSubmittedDepartmentDecision\(application\)\)/);
  assert.match(source, /return Boolean\(hasSubmittedDepartmentDecision\(application\) && \["accepted", "rejected"\]\.includes\(application\?\.status\)\)/);
  assert.match(source, /const applications = metrics\?\.\[item\.vacancyType\]\?\.applications \|\| \[\]/);
  assert.match(source, /if \(!isHrmWorkspace\) \{\s*return applications\.filter\(isDepartmentPendingDecisionApplication\)\.length;\s*\}/);
  assert.match(source, /function getInternshipApplicationDisplayStatus\(application, isHrmWorkspace\)/);
  assert.match(source, /return getHrmDepartmentDecisionStatus\(application\)/);
  assert.match(source, /return "department_new"/);
  assert.match(source, /isHrmWorkspace=\{isHrmWorkspace\}/);
  assert.match(source, /const showHrmNewBadge = isHrmWorkspace && isHrmPendingDepartmentDecisionApplication\(application\)/);
  assert.match(source, /className="hrm-reference-cell"/);
  assert.match(source, /<Badge status="hrm_department_new" \/> : null\}\s*<span>\{formatReferenceNo\(application\)\}<\/span>/);
  assert.match(source, /<Badge status=\{displayStatus\} \/>/);
});

test("internship application table uses icon-only view actions", () => {
  assert.match(source, /<button className="view" type="button" aria-label="Lihat" title="Lihat" onClick=\{\(\) => onView\(application\)\}>/);
  assert.doesNotMatch(source, /className="view app-view-action"/);
  assert.doesNotMatch(source, /<Icon>visibility<\/Icon>\s*Lihat\s*<\/button>/);
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
  assert.match(source, /const isAssessmentLocked = isFinal \|\| isAssignedToDepartment/);
  assert.match(source, /disabled=\{!application \|\| isSavingAssessment \|\| !assignedDepartment\}/);
});

test("department decision tab replaces HRM review for department workspaces", () => {
  assert.match(source, /const departmentDecisionTab = "Keputusan Bahagian"/);
  assert.match(source, /profile_data: profileData/);
  assert.match(source, /status: decision\.recommendation === "Tolak" \? "rejected" : "accepted"/);
  assert.match(source, /department_decision: decision/);
  assert.match(source, /function DepartmentDecisionTab/);
  assert.match(source, /Syor Bahagian/);
  assert.match(source, /Sila pilih/);
  assert.match(source, /Terima/);
  assert.match(source, /Tolak/);
  assert.match(source, /Hantar ke HRM/);
  assert.match(source, /const isSubmitted = Boolean\(savedDecision\.submitted_at\)/);
  assert.match(source, /const isLocked = isReadOnly \|\| isSubmitted/);
  assert.match(source, /disabled=\{isLocked\}/);
  assert.match(source, /\{!isLocked \? \(/);
  assert.match(source, /\.\.\.\(isHrmWorkspace \? \[hrmReviewTab\] : \[\]\)/);
  assert.match(source, /\.\.\.\(shouldShowDepartmentDecision \? \[departmentDecisionTab\] : \[\]\)/);
  assert.match(source, /isReadOnly=\{isHrmWorkspace\}/);
  assert.match(source, /maskAcceptedStatus=\{false\}/);
});

test("HRM assessment saves do not change the application status before review action", () => {
  const assessmentStart = source.indexOf("const saveHrmAssessment = async");
  const decisionStart = source.indexOf("const saveDepartmentDecision = async");
  assert.ok(assessmentStart >= 0);
  assert.ok(decisionStart > assessmentStart);
  const assessmentSource = source.slice(assessmentStart, decisionStart);
  assert.doesNotMatch(assessmentSource, /status:/);
});

test("HRM assessment locks after the application is sent to a department", () => {
  assert.match(source, /const isAssignedToDepartment = Boolean\(application\?\.assigned_department\)/);
  assert.match(source, /const isAssessmentLocked = isFinal \|\| isAssignedToDepartment/);
  assert.match(source, /if \(isAssessmentLocked\) return;\s*const nextDecision = decision === item \? "" : item;/);
  assert.match(source, /if \(isAssessmentLocked\) return;\s*const nextEducationLevel = educationLevel === item \? "" : item;/);
  assert.match(source, /if \(!application \|\| isAssessmentLocked\) return;/);
  assert.match(source, /disabled=\{isAssessmentLocked\}[\s\S]*type="checkbox"/);
  assert.match(source, /<select disabled=\{isAssessmentLocked\} value=\{assignedDepartment\}/);
  assert.match(source, /\{!isAssessmentLocked \? \(\s*<footer className="hrm-application-detail-actions">/);
  assert.doesNotMatch(source, /disabled=\{!application \|\| isFinal \|\| isSavingAssessment/);
});

test("HRM and department decision tabs keep draft selections in local state until submitted", () => {
  assert.match(source, /const \[decision, setDecision\] = useState\(savedAssessment\.decision \|\| ""\)/);
  assert.match(source, /const \[educationLevel, setEducationLevel\] = useState/);
  assert.match(source, /const \[recommendation, setRecommendation\] = useState/);
  assert.match(source, /const \[remarks, setRemarks\] = useState/);
  assert.match(source, /const isSaved = await saveAssessment\(\{ decision: nextDecision, educationLevel \}\)/);
  assert.match(source, /const chooseDecision = \(item\) => \{\s*if \(isAssessmentLocked\) return;\s*const nextDecision = decision === item \? "" : item;\s*setDecision\(nextDecision\);\s*\};/);
  assert.match(source, /const chooseEducationLevel = \(item\) => \{\s*if \(isAssessmentLocked\) return;\s*const nextEducationLevel = educationLevel === item \? "" : item;\s*setEducationLevel\(nextEducationLevel\);\s*\};/);
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

test("HRM detail includes an organization feedback document tab", () => {
  assert.match(source, /const organizationFeedbackTab = "Maklumbalas Organisasi"/);
  assert.match(source, /\.\.\.\(isHrmWorkspace \? \[organizationFeedbackTab\] : \[\]\)/);
  assert.match(source, /function OrganizationFeedbackTab/);
  assert.match(source, /Dokumen maklumbalas organisasi/);
  assert.match(source, /Muat naik fail PDF untuk dihantar kepada pemohon\. Saiz fail maksimum 15MB\./);
  assert.match(source, /className="organization-feedback-section"/);
  assert.match(source, /className="organization-feedback-section-header"/);
  assert.match(source, /className="organization-feedback-add"/);
  assert.match(source, />\s*Tambah Dokumen\s*</);
  assert.match(source, /className="organization-feedback-document-table"/);
  assert.match(source, /className="organization-feedback-attachment-cell"/);
  assert.match(source, /Tiada fail dipilih\./);
  assert.match(source, /Saiz fail maksimum: 15MB/);
  assert.match(source, /className="organization-feedback-row-actions"/);
  assert.match(source, /organization-feedback-icon-button organization-feedback-icon-button-view/);
  assert.match(source, /organization-feedback-icon-button organization-feedback-icon-button-remove-file/);
  assert.match(source, /<Icon>visibility<\/Icon>/);
  assert.match(source, /<Icon>delete<\/Icon>/);
  assert.match(source, />\s*Padam baris\s*</);
  assert.doesNotMatch(source, /organization-feedback-icon-button-download/);
  assert.match(source, /--Tiada rekod--/);
  assert.match(source, /type="file"/);
  assert.match(source, /accept="application\/pdf,\.pdf"/);
  assert.match(source, /multiple/);
  assert.match(source, /const isPdfFile = \(file\) => file\?\.type === "application\/pdf" \|\| file\?\.name\?\.toLowerCase\(\)\.endsWith\("\.pdf"\)/);
  assert.match(source, /function getOrganizationFeedbackDocuments\(application\)/);
  assert.match(source, /const clearFeedbackInput = \(\) => \{/);
  assert.match(source, /const selectedFiles = Array\.from\(event\.target\.files \|\| \[\]\)/);
  assert.match(source, /void uploadDocuments\(selectedFiles\);/);
  assert.match(source, /await onSaveDocument\(application, selectedFiles\);/);
  assert.match(source, /const deleteOrganizationFeedbackDocument = async/);
  assert.match(source, /clearOrganizationFeedbackDocument: true/);
  assert.match(source, /clearOrganizationFeedbackDocumentId: documentId/);
  assert.match(source, /aria-label="Buang fail"/);
  assert.match(source, /onDeleteDocument=\{onDeleteOrganizationFeedbackDocument\}/);
  assert.match(source, /const saveOrganizationFeedbackDocument = async/);
  assert.match(source, /payload\.append\("organizationFeedbackDocuments", file\)/);
  assert.match(source, /onSaveOrganizationFeedbackDocument=\{saveOrganizationFeedbackDocument\}/);
  assert.match(source, /onSaveDocument=\{onSaveOrganizationFeedbackDocument\}/);
  assert.match(source, /application\?\.document_files\?\.organizationFeedbackDocuments/);
  assert.match(source, /Nama Pelajar/);
  assert.match(source, /Tempoh Latihan Industri \/ Praktikal/);
  assert.match(source, /Program/);
  assert.match(source, /Bahagian Ditempatkan/);
  assert.match(source, /No\. Kad Pengenalan:/);
});
