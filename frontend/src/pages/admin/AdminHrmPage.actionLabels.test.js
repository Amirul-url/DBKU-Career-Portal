import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AdminHrmPage.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
const adminRoutesSource = readFileSync(new URL("../../modules/admin/adminRoutes.js", import.meta.url), "utf8");
const applicantViewSource = readFileSync(new URL("../applicant/ApplicantApplicationViewPage.jsx", import.meta.url), "utf8");
const decisionCopySource = readFileSync(new URL("../../modules/internship/internshipDecisionCopy.js", import.meta.url), "utf8");

test("HRM application action labels match the department review workflow", () => {
  assert.match(source, /submitted: "Menunggu Semakan HRM"/);
  assert.match(source, /submitted: statusLabel\.submitted/);
  assert.match(source, />\s*Hantar ke Bahagian\s*</);
  assert.match(source, />\s*Tidak Lengkap\s*</);
  assert.match(source, />\s*Tidak Layak\s*</);
  assert.match(source, /reviewWithAssessment\("incomplete", "Tidak Lengkap"\)/);
  assert.match(source, /onReview\(app\.id, "incomplete"\)/);
  assert.doesNotMatch(source, />\s*Senarai pendek\s*</);
  assert.doesNotMatch(source, /className="reject"[\s\S]{0,200}>\s*Tolak\s*</);
});

test("HRM sidebar shows red badges for new application counts", () => {
  assert.match(source, /getSidebarApplicationBadgeCount\(item, dashboardMetrics, \{ isHrmWorkspace \}\)/);
  assert.match(source, /className="hrm-sidebar-badge"/);
  assert.match(source, /aria-label=\{`\$\{sidebarBadgeCount\} permohonan baharu`\}/);
  assert.match(source, /isHrmPendingDepartmentDecisionApplication\(application\)/);
  assert.match(source, /\(application\?\.status \|\| "submitted"\) === "submitted"/);
});

test("HRM and department headers no longer render notification bell", () => {
  assert.doesNotMatch(source, /aria-label="Notifikasi"/);
  assert.doesNotMatch(source, /<Icon>notifications<\/Icon>/);
});

test("department and HRM internship rows mark pending decision tasks as new", () => {
  assert.match(source, /department_new: "Semakan Bahagian"/);
  assert.match(source, /hrm_department_new: "Baharu"/);
  assert.match(source, /hrm_department_accepted: "Diterima Bahagian"/);
  assert.match(source, /hrm_department_rejected: "Ditolak Bahagian"/);
  assert.match(source, /department_new: "red"/);
  assert.match(source, /hrm_department_new: "red"/);
  assert.match(source, /hrm_department_accepted: "green"/);
  assert.match(source, /function hasSubmittedDepartmentDecision\(application\)/);
  assert.match(source, /function hasOrganizationFeedbackBeenSent\(application\)/);
  assert.match(source, /function isDepartmentPendingDecisionApplication\(application\)/);
  assert.match(source, /function isHrmPendingDepartmentDecisionApplication\(application\)/);
  assert.match(source, /function isHrmNewApplication\(application\)/);
  assert.match(source, /function getHrmDepartmentDecisionStatus\(application\)/);
  assert.match(source, /if \(hasOrganizationFeedbackBeenSent\(application\)\) return "offered"/);
  assert.match(source, /return Boolean\(application\?\.assigned_department && !hasSubmittedDepartmentDecision\(application\)\)/);
  assert.match(source, /!\s*hasSubmittedHrmFinalDecision\(application\)/);
  assert.match(source, /\(application\?\.status \|\| "submitted"\) === "submitted" \|\|\s*isHrmPendingDepartmentDecisionApplication\(application\)/);
  assert.match(source, /const applications = metrics\?\.\[item\.vacancyType\]\?\.applications \|\| \[\]/);
  assert.match(source, /if \(!isHrmWorkspace\) \{\s*return applications\.filter\(isDepartmentPendingDecisionApplication\)\.length;\s*\}/);
  assert.match(source, /return applications\.filter\(isHrmNewApplication\)\.length;/);
  assert.match(source, /function getInternshipApplicationDisplayStatus\(application, isHrmWorkspace\)/);
  assert.match(source, /if \(hasOrganizationFeedbackBeenSent\(application\)\) return "offered"/);
  assert.match(source, /if \(isHrmWorkspace && isDepartmentPendingDecisionApplication\(application\)\) return "department_new"/);
  assert.match(source, /return getHrmDepartmentDecisionStatus\(application\)/);
  assert.match(source, /return "department_new"/);
  assert.match(source, /isHrmWorkspace=\{isHrmWorkspace\}/);
  assert.match(source, /const showReferenceNewBadge = isHrmWorkspace\s*\?\s*isHrmNewApplication\(application\)\s*:\s*isDepartmentPendingDecisionApplication\(application\)/);
  assert.match(source, /className="hrm-reference-cell"/);
  assert.match(cssSource, /\.hrm-reference-cell \{[\s\S]*position: relative;[\s\S]*display: block;[\s\S]*width: 100%;[\s\S]*text-align: center;/);
  assert.match(cssSource, /\.hrm-reference-cell \.hrm-badge \{[\s\S]*position: absolute;[\s\S]*left: -24px;[\s\S]*top: 50%;[\s\S]*transform: translateY\(-50%\);/);
  assert.match(source, /\{showReferenceNewBadge \? <Badge status="hrm_department_new" \/> : null\}\s*<span>\{formatReferenceNo\(application\)\}<\/span>/);
  assert.match(source, /<Badge status=\{displayStatus\} \/>/);
});

test("HRM and department dashboards keep assignment status separate from shortlisted status", () => {
  assert.match(source, /function isDepartmentAcceptedApplication\(application\)/);
  assert.match(source, /function getInternshipDashboardStatus\(application, isHrmWorkspace\)/);
  assert.match(source, /if \(hasOrganizationFeedbackBeenSent\(application\)\) return "offered"/);
  assert.match(source, /if \(isDepartmentPendingDecisionApplication\(application\)\) return "department_new"/);
  assert.match(source, /if \(isDepartmentAcceptedApplication\(application\)\) return "hrm_department_accepted"/);
  assert.match(source, /function getDashboardApplicationStatus\(application, isHrmWorkspace\)/);
  assert.match(source, /return getInternshipDashboardStatus\(application, isHrmWorkspace\)/);
  assert.match(source, /const displayStatus = useDashboardStatus \? getDashboardApplicationStatus\(app, isHrmWorkspace\) : app\.status/);
  assert.match(source, /\{isHrmWorkspace \? \(\s*<StatusSummaryPanel applications=\{overallMetrics\.applications\} isHrmWorkspace=\{isHrmWorkspace\} \/>\s*\) : null\}/);
  assert.match(source, /applications\.filter\(\(app\) => getDashboardApplicationStatus\(app, isHrmWorkspace\) === status\)\.length/);
});

test("internship application table uses icon-only view actions", () => {
  assert.match(source, /<button className="view" type="button" aria-label="Lihat" title="Lihat" onClick=\{\(\) => onView\(application\)\}>/);
  assert.match(cssSource, /\.hrm-internship-applications-table \.hrm-badge \{[\s\S]*max-width: 122px;[\s\S]*text-align: center;[\s\S]*white-space: normal;/);
  assert.doesNotMatch(source, /className="view app-view-action"/);
  assert.doesNotMatch(source, /<Icon>visibility<\/Icon>\s*Lihat\s*<\/button>/);
});

test("HRM job application table follows the internship list layout", () => {
  assert.match(source, /function JobApplicationsPanel\(\{ applications, isHrmWorkspace, onView \}\)/);
  assert.match(source, /<JobApplicationsPanel[\s\S]*applications=\{filteredApplications\}[\s\S]*onView=\{\(application\) => navigate\(`\$\{ADMIN_ROUTES\.applications\.job\}\/\$\{application\.id\}`\)\}/);
  assert.match(source, /<JobApplicationsPanel[\s\S]*isHrmWorkspace=\{isHrmWorkspace\}/);
  assert.match(source, /className="hrm-internship-applications-card hrm-job-applications-card"/);
  assert.match(source, /className="applicant-table-controls hrm-internship-filters hrm-job-application-filters"/);
  assert.match(source, />\s*Jawatan Dipohon\s*</);
  assert.match(source, />\s*No\. Rujukan\s*</);
  assert.match(source, />\s*Nama Calon\s*</);
  assert.match(source, />\s*Tarikh\s*<\/th>\s*<th>Status<\/th>/);
  assert.match(source, /formatReferenceNo\(app\)/);
  assert.match(source, /dateValue\(getApplicationDateValue\(app\)\)/);
  assert.match(source, /<footer className="applicant-table-pagination">[\s\S]*Memaparkan \{visibleStart\}-\{visibleEnd\} daripada \{filteredApplications\.length\} permohonan/);
  assert.match(cssSource, /\.hrm-job-applications-table \{[\s\S]*min-width: 1080px;/);
  assert.match(cssSource, /\.hrm-job-applications-table th:nth-child\(6\),[\s\S]*\.hrm-job-applications-table td:nth-child\(6\) \{[\s\S]*width: 9%;[\s\S]*text-align: center;/);
});

test("HRM job application table shows department review status after assignment", () => {
  const jobPanelSource = source.slice(
    source.indexOf("function JobApplicationsPanel"),
    source.indexOf("function InternshipApplicationsPanel"),
  );
  assert.match(jobPanelSource, /applications\.map\(\(application\) => getInternshipApplicationDisplayStatus\(application, isHrmWorkspace\)\)/);
  assert.match(jobPanelSource, /const displayStatus = getInternshipApplicationDisplayStatus\(application, isHrmWorkspace\)/);
  assert.match(jobPanelSource, /const displayStatus = getInternshipApplicationDisplayStatus\(app, isHrmWorkspace\)/);
  assert.match(jobPanelSource, /<Badge status=\{displayStatus\} \/>/);
  assert.doesNotMatch(jobPanelSource, /const displayStatus = app\.status \|\| "submitted"/);
});

test("HRM job application table uses only the blue eye action", () => {
  const jobPanelSource = source.slice(
    source.indexOf("function JobApplicationsPanel"),
    source.indexOf("function InternshipApplicationsPanel"),
  );
  assert.match(jobPanelSource, /<button className="view" type="button" aria-label="Lihat" title="Lihat" onClick=\{\(\) => onView\(app\)\}>/);
  assert.match(jobPanelSource, /<Icon>visibility<\/Icon>/);
  assert.doesNotMatch(jobPanelSource, /className="shortlist"/);
  assert.doesNotMatch(jobPanelSource, /className="incomplete"/);
  assert.doesNotMatch(jobPanelSource, /className="reject"/);
  assert.doesNotMatch(source, /function JobApplicationDetailModal/);
  assert.ok(adminRoutesSource.includes("const jobApplicationDetailMatch = currentPath.match(/^\\/admin\\/jobs\\/applications\\/([^/]+)$/);"));
  assert.match(adminRoutesSource, /label: "Butiran Permohonan Jawatan DBKU"/);
});

test("HRM job application detail shows A-L tabs and HRM review tab", () => {
  assert.match(source, /function HrmApplicationDetailPage\(\{/);
  assert.match(source, /applicationType=\{activeVacancyType\}/);
  assert.match(source, /const isJobApplication = applicationType === "job"/);
  assert.match(source, /const shouldShowDepartmentDecision = isHrmWorkspace\s*\?\s*hasSubmittedDepartmentDecision\(application\)\s*:\s*Boolean\(application\?\.assigned_department\)/);
  assert.match(source, /\.\.\.\(isHrmWorkspace \? \[hrmReviewTab\] : \[\]\)/);
  assert.match(source, /\.\.\.\(shouldShowDepartmentDecision \? \[departmentDecisionTab\] : \[\]\)/);
  assert.match(source, /const detailTabGroups = isJobApplication \? \[\] : \[/);
  assert.match(source, /tab === hrmReviewTab \? \(\s*<HrmInternshipAssessmentTab/);
  assert.match(source, /tab === departmentDecisionTab \? \(\s*<DepartmentDecisionTab/);
  assert.match(applicantViewSource, /const readOnlyJobInfoTabs = \[/);
  assert.match(applicantViewSource, /const panelTabs = isJobApplication \? \[\.\.\.readOnlyJobInfoTabs, \.\.\.extraTabs\] : \[\.\.\.infoTabs, \.\.\.extraTabs\]/);
  assert.match(applicantViewSource, /const defaultJobTabGroups = isJobApplication && extraTabs\.length/);
  assert.match(applicantViewSource, /\{ label: "PEMOHON", tabs: readOnlyJobInfoTabs \}/);
  assert.match(applicantViewSource, /\{ label: "URUSAN DALAMAN", tabs: extraTabs \}/);
  assert.match(applicantViewSource, /\(tabGroups\.length \? tabGroups : defaultJobTabGroups\)/);
  assert.match(applicantViewSource, /if \(!readOnlyJobInfoTabs\.includes\(activeInfoTab\)\) \{\s*return renderExtraTabContent \? renderExtraTabContent\(activeInfoTab\) : null;/);
  assert.match(applicantViewSource, /isJobApplication && readOnlyJobInfoTabs\.includes\(tab\) \? getReadOnlyJobTabLabel\(tab, readOnlyJobInfoTabs\.indexOf\(tab\)\) : tab/);
});

test("readonly job application details show the same summary cards as LI", () => {
  assert.match(applicantViewSource, /<section className="student-readonly-summary" aria-label="Ringkasan permohonan">/);
  assert.match(applicantViewSource, /<span>No\. Rujukan<\/span>\s*<strong>\{formatReferenceNo\(application\)\}<\/strong>/);
  assert.match(applicantViewSource, /<span>Permohonan<\/span>\s*<strong>\{vacancy\.title \|\| "Permohonan DBKU"\}<\/strong>/);
  assert.match(applicantViewSource, /<span>Tarikh<\/span>\s*<strong>\{formatDate\(getApplicationDate\(application\)\)\}<\/strong>/);
  assert.match(applicantViewSource, /<span>Status<\/span>\s*<strong className=\{`applicant-status-pill \$\{visibleStatus\}`\}>/);
  assert.doesNotMatch(applicantViewSource, /!\s*isJobApplication \? \(\s*<section className="student-readonly-summary"/);
});

test("job internal workflow tabs show the green section heading like LI", () => {
  assert.match(applicantViewSource, /const shouldShowActiveInfoHeading = !isJobApplication \|\| !readOnlyJobInfoTabs\.includes\(activeInfoTab\)/);
  assert.match(applicantViewSource, /\{shouldShowActiveInfoHeading \? <h2>\{activeInfoHeading\}<\/h2> : null\}/);
  assert.doesNotMatch(applicantViewSource, /\{!isJobApplication \? <h2>\{activeInfoHeading\}<\/h2> : null\}/);
});

test("HRM assessment higher education fields can be edited and saved", () => {
  assert.match(source, /const \[assessmentInstitution, setAssessmentInstitution\] = useState\(savedAssessment\.institution \|\| studentInfo\.institution \|\| ""\)/);
  assert.match(source, /const \[assessmentSpecialization, setAssessmentSpecialization\] = useState\(savedAssessment\.specialization \|\| studentInfo\.program \|\| ""\)/);
  assert.match(source, /const \[assessmentCgpa, setAssessmentCgpa\] = useState\(savedAssessment\.cgpa \|\| studentInfo\.cgpa \|\| ""\)/);
  assert.match(source, /institution: values\.institution \|\| studentInfo\.institution \|\| ""/);
  assert.match(source, /specialization: values\.specialization \|\| studentInfo\.program \|\| ""/);
  assert.match(source, /cgpa: values\.cgpa \|\| studentInfo\.cgpa \|\| ""/);
  assert.match(source, /value=\{assessmentInstitution\}/);
  assert.match(source, /onChange=\{\(event\) => setAssessmentInstitution\(event\.target\.value\)\}/);
  assert.match(source, /value=\{assessmentSpecialization\}/);
  assert.match(source, /onChange=\{\(event\) => setAssessmentSpecialization\(event\.target\.value\)\}/);
  assert.match(source, /value=\{assessmentCgpa\}/);
  assert.match(source, /onChange=\{\(event\) => setAssessmentCgpa\(event\.target\.value\)\}/);
  assert.match(source, /saveAssessment\(\{ decision: nextDecision, educationLevel, institution: assessmentInstitution, specialization: assessmentSpecialization, cgpa: assessmentCgpa \}\)/);
});

test("recent application pagination keeps controls evenly aligned", () => {
  assert.match(source, /<footer className="hrm-recent-pagination">[\s\S]*<strong>\{recentApplications\.activePage\} \/ \{recentApplications\.totalPages\}<\/strong>/);
  assert.match(cssSource, /\.hrm-recent-pagination div \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 42px minmax\(42px, auto\) 42px;[\s\S]*justify-items: center;/);
  assert.match(cssSource, /\.hrm-recent-pagination button \{[\s\S]*width: 42px;[\s\S]*height: 42px;/);
  assert.match(cssSource, /\.hrm-recent-pagination strong \{[\s\S]*min-width: 0;/);
});

test("internship filter reset button has breathing room after status filter", () => {
  assert.match(source, /<button className="hrm-filter-reset" type="button" onClick=\{resetFilters\}>[\s\S]*Set semula/);
  assert.match(cssSource, /\.hrm-filter-reset \{[\s\S]*margin-left: 8px;[\s\S]*min-width: 112px;/);
  assert.match(cssSource, /@media \(max-width: 900px\) \{[\s\S]*\.hrm-filter-reset \{[\s\S]*margin-left: 0;/);
});

test("application table pagination centers page count with buttons", () => {
  assert.match(source, /<footer className="applicant-table-pagination">[\s\S]*<strong>\{activePage\} \/ \{totalPages\}<\/strong>/);
  assert.match(cssSource, /\.applicant-table-pagination div \{[\s\S]*display: flex;[\s\S]*align-items: center;/);
  assert.match(cssSource, /\.applicant-table-pagination strong \{[\s\S]*display: inline-flex;[\s\S]*height: 38px;[\s\S]*align-items: center;/);
});

test("status summary card keeps long badges away from progress bars", () => {
  assert.match(source, /function StatusSummaryPanel\(\{ applications, isHrmWorkspace \}\)/);
  assert.match(source, /<span><Badge status=\{status\} \/><\/span>\s*<i><b style=\{\{ width: `\$\{statusPercent\}%` \}\} \/><\/i>/);
  assert.match(cssSource, /\.hrm-status-list > div \{[\s\S]*grid-template-columns: minmax\(160px, max-content\) minmax\(0, 1fr\) 24px;/);
  assert.match(cssSource, /\.hrm-status-list > div > span \{[\s\S]*min-width: 0;/);
});

test("admin workspace labels and navigation follow the signed-in department", () => {
  assert.match(source, /getDepartmentWorkspaceLabel\(user\)/);
  assert.match(source, /getAdminShellRoleLabel\(user\)/);
  assert.match(source, /visibleAdminNavItems\.map/);
  assert.match(source, /isHrmWorkspace \? adminNavItems : adminNavItems\.filter/);
  assert.match(source, /item\.panel !== "applicants"/);
  assert.match(source, /item\.label !== "PEMOHON"/);
  assert.match(source, /\["JAWATAN DBKU", "LATIHAN INDUSTRI"\]\.includes\(item\.label\)/);
  assert.match(source, /item\.panel === "manage" && item\.vacancyType === "job"/);
  assert.match(source, /\["job", "internship"\]\.includes\(item\.vacancyType\)/);
  assert.doesNotMatch(source, />Pentadbir HRM<\/p>/);
  assert.doesNotMatch(source, />Papan pemuka HRM<\/h1>/);
});

test("application detail sidebar only highlights the matching application type", () => {
  assert.match(source, /const isDetailActive =\s*panel === "application-detail" &&\s*item\.panel === "applications" &&\s*item\.vacancyType === activeVacancyType &&\s*item\.to === ADMIN_ROUTES\.applications\[item\.vacancyType\]/);
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
  assert.doesNotMatch(source, /applicationLinks=\{isHrmWorkspace \? undefined : \[\]\}/);
  assert.doesNotMatch(source, /applicationLinks\.map/);
  assert.doesNotMatch(source, /<button key=\{link\.type\} onClick=\{\(\) => onOpenApplications\(link\.type\)\} type="button">/);
  assert.match(source, /title=\{isHrmWorkspace \? "Saluran pengambilan" : "Ringkasan bahagian"\}/);
  assert.match(source, /onViewApplications: isHrmWorkspace \? \(\) => openFilteredPanel\(item\.applicationsLabel, "Permohonan", item\.type\) : null/);
  assert.match(source, /\{channel\.onViewApplications \? <button onClick=\{channel\.onViewApplications\} type="button">Permohonan<\/button> : null\}/);
  assert.doesNotMatch(source, /function DepartmentDashboardPanel/);
});

test("application lists do not repeat the page title inside the table card", () => {
  assert.match(source, /activeVacancyType === "internship" \? \(/);
  assert.match(source, /<InternshipApplicationsPanel[\s\S]*applications=\{filteredApplications\}/);
  assert.match(source, /<JobApplicationsPanel[\s\S]*applications=\{filteredApplications\}/);
  assert.doesNotMatch(source, /<h2>Permohonan \{activeOpportunityLabel\}<\/h2>/);
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
  const saveDepartmentDecisionStart = source.indexOf("const saveDepartmentDecision = async");
  const saveOrganizationFeedbackStart = source.indexOf("const saveHrmFinalDecision = async");
  assert.ok(saveDepartmentDecisionStart >= 0);
  assert.ok(saveOrganizationFeedbackStart > saveDepartmentDecisionStart);
  const saveDepartmentDecisionSource = source.slice(saveDepartmentDecisionStart, saveOrganizationFeedbackStart);
  assert.doesNotMatch(saveDepartmentDecisionSource, /status:/);
  assert.match(source, /department_decision: decision/);
  assert.match(source, /function DepartmentDecisionTab/);
  assert.match(source, /Syor Bahagian/);
  assert.match(source, /Sila pilih/);
  assert.match(source, /Terima/);
  assert.match(source, /Tolak/);
  assert.match(source, /Hantar ke HRM/);
  const departmentDecisionTabStart = source.indexOf("function DepartmentDecisionTab");
  const hrmFinalDecisionPayloadStart = source.indexOf("function buildHrmFinalDecisionPayload");
  assert.ok(departmentDecisionTabStart >= 0);
  assert.ok(hrmFinalDecisionPayloadStart > departmentDecisionTabStart);
  const departmentDecisionTabSource = source.slice(departmentDecisionTabStart, hrmFinalDecisionPayloadStart);
  assert.doesNotMatch(departmentDecisionTabSource, /<Icon>check_circle<\/Icon>[\s\S]*Hantar ke HRM/);
  assert.match(source, /const isSubmitted = Boolean\(savedDecision\.submitted_at\)/);
  assert.match(source, /const isLocked = isReadOnly \|\| isSubmitted/);
  assert.match(source, /disabled=\{isLocked\}/);
  assert.match(source, /\{!isLocked \? \(/);
  assert.match(source, /\.\.\.\(isHrmWorkspace \? \[hrmReviewTab\] : \[\]\)/);
  assert.match(source, /\.\.\.\(shouldShowDepartmentDecision \? \[departmentDecisionTab\] : \[\]\)/);
  assert.match(source, /isReadOnly=\{isHrmWorkspace\}/);
  assert.match(source, /maskAcceptedStatus=\{false\}/);
});

test("HRM makes the final internship decision after department recommendation", () => {
  assert.match(source, /const hrmFinalDecisionTab = "Keputusan Akhir HRM"/);
  assert.match(source, /hrmFinalRejectionMessage,[\s\S]*normalizeHrmFinalRejectionRemarks/);
  assert.match(decisionCopySource, /Dukacita dimaklumkan bahawa permohonan saudara\/i untuk menjalani latihan industri di Dewan Bandaraya Kuching Utara \(DBKU\) telah diterima dan diteliti/);
  assert.match(decisionCopySource, /normalizeHrmFinalRejectionRemarks/);
  assert.doesNotMatch(source, /Sukacita dimaklumkan bahawa permohonan saudara\/i/);
  assert.match(source, /function HrmFinalDecisionTab/);
  assert.match(source, /const saveHrmFinalDecision = async/);
  assert.match(source, /hrm_final_decision: finalDecision/);
  assert.match(source, /status: nextStatus/);
  assert.match(source, /const nextStatus = "rejected"/);
  assert.match(source, /onSaveFinalDecision=\{saveHrmFinalDecision\}/);
  assert.match(source, /\.\.\.\(!isJobApplication && shouldShowHrmFinalDecision \? \[hrmFinalDecisionTab\] : \[\]\)/);
  assert.match(source, /const departmentRecommendation = getSavedDepartmentDecision\(application\)\.recommendation \|\| ""/);
  assert.match(source, /departmentRecommendation === "Tolak"[\s\S]*application\?\.status === "shortlisted"/);
  assert.match(source, /const shouldShowHrmFinalDecision = isHrmWorkspace && \(needsFinalDecision \|\| hasFinalRejectionDecision\)/);
  assert.match(source, /\.\.\.\(shouldShowOrganizationFeedback \? \[organizationFeedbackTab\] : \[\]\)/);
  assert.match(source, /const \[finalRemarks, setFinalRemarks\] = useState/);
  assert.match(source, /<textarea[\s\S]*value=\{finalRemarks\}[\s\S]*onChange=\{\(event\) => setFinalRemarks\(event\.target\.value\)\}/);
  assert.match(source, /buildHrmFinalDecisionPayload\(application, user, finalRemarks\)/);
  assert.match(source, /const normalizedRemarks = normalizeHrmFinalRejectionRemarks\(remarks\)/);
  assert.match(source, /remarks: normalizedRemarks/);
  assert.doesNotMatch(source, /Terima Permohonan/);
  assert.doesNotMatch(source, /: "Tolak Permohonan"/);
  assert.match(source, /: "Hantar ke Pemohon"/);
});

test("HRM uses organization feedback after department accepts an application", () => {
  assert.match(source, /const departmentRecommendation = getSavedDepartmentDecision\(application\)\.recommendation \|\| ""/);
  assert.match(source, /const shouldShowOrganizationFeedback =\s*isHrmWorkspace &&\s*\(departmentRecommendation === "Terima" \|\| application\?\.status === "offered" \|\| application\?\.status === "accepted"\)/);
  assert.match(source, /const shouldShowHrmFinalDecision = isHrmWorkspace && \(needsFinalDecision \|\| hasFinalRejectionDecision\)/);
  assert.match(source, /\.\.\.\(shouldShowOrganizationFeedback \? \[organizationFeedbackTab\] : \[\]\)/);
  assert.doesNotMatch(source, /\.\.\.\(!isJobApplication && shouldShowOrganizationFeedback \? \[organizationFeedbackTab\] : \[\]\)/);
  assert.doesNotMatch(source, /const shouldShowOrganizationFeedback = isHrmWorkspace && application\?\.status === "accepted"/);
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
  assert.match(source, /const isSaved = await saveAssessment\(\{ decision: nextDecision, educationLevel, institution: assessmentInstitution, specialization: assessmentSpecialization, cgpa: assessmentCgpa \}\)/);
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
  assert.match(source, /onDepartmentDecisionSubmitted=\{\(\) => navigate\(ADMIN_ROUTES\.applications\[activeVacancyType\] \|\| ADMIN_ROUTES\.applications\.job\)\}/);
});

test("HRM detail includes an organization feedback document tab", () => {
  assert.match(source, /const organizationFeedbackTab = "Maklumbalas Organisasi"/);
  assert.match(source, /const applicantDetailTabs = \["Maklumat Peribadi Pemohon", "Maklumat Akademik", "Dokumen Sokongan"\]/);
  assert.match(source, /const shouldShowOrganizationFeedback =\s*isHrmWorkspace &&\s*\(departmentRecommendation === "Terima" \|\| application\?\.status === "offered" \|\| application\?\.status === "accepted"\)/);
  assert.match(source, /\.\.\.\(shouldShowOrganizationFeedback \? \[organizationFeedbackTab\] : \[\]\)/);
  assert.match(source, /const detailTabGroups = isJobApplication \? \[\] : \[\s*\{ label: "Pemohon", tabs: applicantDetailTabs \},\s*\{ label: "Urusan Dalaman", tabs: extraTabs \},\s*\]/);
  assert.match(source, /tabGroups=\{detailTabGroups\}/);
  assert.match(source, /import \{ InternshipApplicationReadOnlyPanel \} from "\.\.\/applicant\/ApplicantApplicationViewPage"/);
  assert.match(source, /className="hrm-application-direct-panel"/);
  assert.match(cssSource, /\.student-readonly-document-cell \.organization-feedback-icon-button \{/);
  assert.match(cssSource, /\.student-info-tabs-grouped \{[\s\S]*flex-direction: column;[\s\S]*align-items: stretch;/);
  assert.match(cssSource, /\.student-info-tab-group \{[\s\S]*display: grid;[\s\S]*grid-template-columns: 145px minmax\(0, 1fr\);[\s\S]*width: 100%;/);
  assert.match(cssSource, /\.student-info-tab-group \+ \.student-info-tab-group \{[\s\S]*border-top: 1px solid #e1f1e8;/);
  assert.match(source, /function OrganizationFeedbackTab/);
  assert.match(source, /function OrganizationFeedbackSendConfirmModal/);
  assert.match(source, /Anda yakin mahu menghantar maklumbalas organisasi ini kepada pemohon\?/);
  assert.match(source, /Hantar ke Pemohon/);
  assert.match(source, />\s*Tidak\s*</);
  assert.match(source, />\s*\{isSaving \? "Menghantar\.\.\." : "Ya"\}\s*</);
  assert.match(source, /Dokumen maklumbalas organisasi/);
  assert.match(source, /Wajib muat naik sekurang-kurangnya 1 fail PDF untuk dihantar kepada pemohon\. Saiz fail maksimum 15MB\./);
  assert.match(source, /className="organization-feedback-section"/);
  assert.match(source, /className="organization-feedback-section-header"/);
  assert.match(source, /className="organization-feedback-add"/);
  assert.match(source, />\s*Tambah Dokumen\s*</);
  assert.match(source, /className="organization-feedback-document-table"/);
  assert.match(source, /className="organization-feedback-attachment-cell"/);
  assert.match(source, /Tiada fail dipilih\./);
  assert.doesNotMatch(source, /organization-feedback-attachment-size/);
  assert.doesNotMatch(source, /organization-feedback-attachment-hint/);
  assert.match(source, /className="organization-feedback-report-note"/);
  assert.match(source, /Sehubungan itu, pelajar tuan\/puan adalah diminta untuk melapor diri/);
  assert.match(source, /className="organization-feedback-confirmation-note"/);
  assert.match(source, /Sila buat pengesahan secara bertulis/);
  assert.match(source, /seperti di Lampiran II/);
  assert.match(source, /aria-label="Tarikh akhir pengesahan bertulis"/);
  assert.match(source, /className="organization-feedback-inline-date-input"/);
  assert.match(source, /date: ""/);
  assert.match(source, /confirmationDate: ""/);
  assert.match(source, /time: "8\.00 pagi"/);
  assert.match(source, /Unit Pengurusan Latihan/);
  assert.match(source, /className="organization-feedback-row-actions"/);
  assert.match(source, /organization-feedback-icon-button organization-feedback-icon-button-view/);
  assert.match(source, /organization-feedback-icon-button organization-feedback-icon-button-remove-file/);
  assert.ok(
    source.indexOf('className="organization-feedback-table"') < source.indexOf('className="organization-feedback-document-table"'),
  );
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
  assert.match(source, /const \[feedbackDocuments, setFeedbackDocuments\] = useState\(\(\) => getOrganizationFeedbackDocuments\(application\)\)/);
  assert.match(source, /const \[feedbackInternshipPeriod, setFeedbackInternshipPeriod\] = useState/);
  assert.match(source, /const \[feedbackReportDate, setFeedbackReportDate\] = useState\(\(\) => getOrganizationFeedbackReportValue\(application, "date"\)\)/);
  assert.match(source, /const \[feedbackReportTime, setFeedbackReportTime\] = useState\(\(\) => getOrganizationFeedbackReportValue\(application, "time"\)\)/);
  assert.match(source, /const \[feedbackReportPlace, setFeedbackReportPlace\] = useState\(\(\) => getOrganizationFeedbackReportValue\(application, "place"\)\)/);
  assert.match(source, /const \[feedbackConfirmationDate, setFeedbackConfirmationDate\] = useState\(\(\) =>/);
  assert.match(source, /getOrganizationFeedbackConfirmationDate\(application\)/);
  assert.match(source, /const \[feedbackRelease, setFeedbackRelease\] = useState\(\(\) => getOrganizationFeedbackRelease\(application\)\)/);
  assert.match(source, /const \[showSendConfirmModal, setShowSendConfirmModal\] = useState\(false\)/);
  assert.match(source, /const hasRequiredOrganizationFeedbackDocuments = feedbackDocuments\.length > 0/);
  assert.match(source, /const canSendOrganizationFeedbackToApplicant = Boolean\(/);
  assert.match(source, /hasRequiredOrganizationFeedbackDocuments/);
  assert.match(source, /feedbackInternshipPeriod\.trim\(\)/);
  assert.match(source, /disabled=\{!canSendOrganizationFeedbackToApplicant\}/);
  assert.match(source, /className="organization-feedback-required"/);
  assert.match(source, /className="organization-feedback-period-input"/);
  assert.match(source, /placeholder="Contoh: 16 Mac 2026 - 29 Ogos 2026"/);
  assert.match(source, /required/);
  assert.match(source, /onChange=\{\(event\) => setFeedbackInternshipPeriod\(event\.target\.value\)\}/);
  assert.match(source, /className="organization-feedback-report-input"/);
  assert.match(source, /onChange=\{\(event\) => setFeedbackReportDate\(event\.target\.value\)\}/);
  assert.match(source, /onChange=\{\(event\) => setFeedbackReportTime\(event\.target\.value\)\}/);
  assert.match(source, /onChange=\{\(event\) => setFeedbackReportPlace\(event\.target\.value\)\}/);
  assert.match(source, /onChange=\{\(event\) => setFeedbackConfirmationDate\(event\.target\.value\)\}/);
  assert.match(source, /key=\{application\?\.id \|\| "organization-feedback"\}/);
  assert.doesNotMatch(source, /key=\{`\$\{application\?\.id \|\| "organization-feedback"\}-\$\{application\?\.updated_at \|\| ""\}`\}/);
  assert.match(source, /const clearFeedbackInput = \(\) => \{/);
  assert.match(source, /const selectedFiles = Array\.from\(event\.target\.files \|\| \[\]\)/);
  assert.match(source, /void uploadDocuments\(selectedFiles\);/);
  assert.match(source, /await onSaveDocument\(application, selectedFiles\);/);
  assert.match(source, /setFeedbackDocuments\(getOrganizationFeedbackDocuments\(updatedApplication \|\| application\)\)/);
  assert.match(source, /const deleteOrganizationFeedbackDocument = async/);
  assert.match(source, /clearOrganizationFeedbackDocument: true/);
  assert.match(source, /clearOrganizationFeedbackDocumentId: documentId/);
  assert.match(source, /aria-label="Buang fail"/);
  assert.match(source, /onDeleteDocument=\{onDeleteOrganizationFeedbackDocument\}/);
  assert.match(source, /const saveOrganizationFeedbackDocument = async/);
  assert.match(source, /payload\.append\("organizationFeedbackDocuments", file\)/);
  assert.match(source, /onSaveOrganizationFeedbackDocument=\{saveOrganizationFeedbackDocument\}/);
  assert.match(source, /onSaveDocument=\{onSaveOrganizationFeedbackDocument\}/);
  assert.match(source, /const sendOrganizationFeedbackToApplicant = async/);
  assert.match(source, /body: JSON\.stringify\(\{ status: "offered", profile_data: profileData \}\)/);
  assert.match(source, /organization_feedback_release:/);
  assert.match(source, /report_date: feedback\.reportDate \|\| organizationFeedbackReportDefaults\.date/);
  assert.match(source, /report_time: feedback\.reportTime \|\| organizationFeedbackReportDefaults\.time/);
  assert.match(source, /report_place: feedback\.reportPlace \|\| organizationFeedbackReportDefaults\.place/);
  assert.match(source, /confirmation_date: feedback\.confirmationDate \|\| organizationFeedbackReportDefaults\.confirmationDate/);
  assert.match(source, /sent_to_applicant_at:/);
  assert.match(source, /onSendOrganizationFeedbackToApplicant=\{sendOrganizationFeedbackToApplicant\}/);
  assert.match(source, /onSendToApplicant=\{onSendOrganizationFeedbackToApplicant\}/);
  assert.match(source, /onOrganizationFeedbackSent=\{\(\) => navigate\(ADMIN_ROUTES\.applications\[activeVacancyType\] \|\| ADMIN_ROUTES\.applications\.job\)\}/);
  assert.match(source, /onSubmitted=\{onOrganizationFeedbackSent\}/);
  assert.match(source, /await onSendToApplicant\(application, \{/);
  assert.match(source, /reportDate: feedbackReportDate\.trim\(\)/);
  assert.match(source, /reportTime: feedbackReportTime\.trim\(\)/);
  assert.match(source, /reportPlace: feedbackReportPlace\.trim\(\)/);
  assert.match(source, /confirmationDate: feedbackConfirmationDate\.trim\(\)/);
  assert.match(source, /setFeedbackRelease\(getOrganizationFeedbackRelease\(updatedApplication \|\| application\)\)/);
  assert.match(source, /onSubmitted\?\.\(\)/);
  assert.match(source, /application\?\.document_files\?\.organizationFeedbackDocuments/);
  assert.match(source, /Nama Pelajar/);
  assert.match(source, /Tempoh Latihan Industri \/ Praktikal/);
  assert.match(source, /Program/);
  assert.match(source, /Bahagian Ditempatkan/);
  assert.match(source, /No\. Kad Pengenalan:/);
  assert.match(source, /Dengan segala hormatnya perkara di atas adalah dirujuk\./);
  assert.match(
    source,
    /Sukacita dimaklumkan bahawa Dewan Bandaraya Kuching Utara tiada halangan untuk menerima anda bagi menjalani/,
  );
  assert.match(
    source,
    /Sukacita dimaklumkan bahawa Dewan Bandaraya Kuching Utara telah bersetuju untuk melantik anda bagi mengisi jawatan yang telah dipohon seperti berikut:-/,
  );
  assert.match(source, /function getOrganizationFeedbackIntroText\(application\)/);
  assert.match(source, /isJobApplicationDetail\(application\) \? jobOrganizationFeedbackIntro : internshipOrganizationFeedbackIntro/);
  assert.match(source, /<p>\{feedbackIntroText\}<\/p>/);
  assert.ok(
    source.indexOf('className="organization-feedback-intro"') < source.indexOf('className="organization-feedback-table"'),
  );
  assert.doesNotMatch(source, /<Icon>send<\/Icon>/);
});

test("HRM can see applicant offer confirmation after applicant agrees", () => {
  assert.match(source, /applicant_agreed: "Pemohon Bersetuju"/);
  assert.match(source, /internship_active: internshipLifecycleStatusLabels\.internship_active/);
  assert.match(source, /internship_completed: internshipLifecycleStatusLabels\.internship_completed/);
  assert.match(source, /getApplicantAgreedInternshipStatus/);
  assert.match(source, /function hasApplicantAgreedToOffer\(application\)/);
  assert.match(source, /function hasApplicantRespondedToOffer\(application\)/);
  assert.match(source, /function getApplicantConfirmationDocuments\(application\)/);
  assert.match(source, /return getApplicantAgreedInternshipStatus\(application\)/);
  assert.match(source, /applicant_agreed: statusLabel\.applicant_agreed/);
  assert.match(source, /internship_active: statusLabel\.internship_active/);
  assert.match(source, /internship_completed: statusLabel\.internship_completed/);
  assert.match(source, /const applicantConfirmationTab = "Pengesahan Pemohon"/);
  assert.match(source, /\.\.\.\(!isJobApplication && hasApplicantRespondedToOffer\(application\) \? \[applicantConfirmationTab\] : \[\]\)/);
  assert.match(source, /function ApplicantConfirmationReadOnlyTab/);
  assert.match(source, /Dokumen pengesahan pemohon/);
  assert.match(source, /Pemohon telah menerima tawaran latihan industri ini pada \$\{dateValue\(confirmation\.submitted_at\)\}\./);
  assert.match(source, /Pemohon telah menolak tawaran latihan industri ini\./);
  const applicantConfirmationSource = source.slice(
    source.indexOf("function ApplicantConfirmationReadOnlyTab"),
    source.indexOf("function HrmApplicationDetailPage"),
  );
  assert.match(applicantConfirmationSource, /if \(isRejected\) return \(/);
  assert.ok(
    applicantConfirmationSource.indexOf("if (isRejected) return (") <
      applicantConfirmationSource.indexOf('className="organization-feedback-document-table applicant-confirmation-document-table"'),
  );
  assert.doesNotMatch(source, /Dengan ini, saya mengesahkan penerimaan tawaran menjalani latihan industri di Dewan Bandaraya Kuching Utara \(DBKU\)/);
  assert.doesNotMatch(source, /Sekian, terima kasih atas perhatian dan kerjasama pihak puan\./);
  assert.match(source, /applicantConfirmationDocuments/);
});

test("HRM internship rows show applicant offer rejections distinctly", () => {
  assert.match(source, /applicant_offer_rejected: "Tolak Tawaran"/);
  assert.match(source, /applicant_offer_rejected: "red"/);
  assert.match(source, /function hasApplicantRejectedOffer\(application\)/);
  assert.match(source, /if \(hasApplicantRejectedOffer\(application\)\) return "applicant_offer_rejected"/);
  const displayStatusSource = source.slice(
    source.indexOf("function getInternshipApplicationDisplayStatus"),
    source.indexOf("function getInternshipDashboardStatus"),
  );
  assert.ok(
    displayStatusSource.indexOf('if (hasApplicantRejectedOffer(application)) return "applicant_offer_rejected"') <
      displayStatusSource.indexOf('if (hasOrganizationFeedbackBeenSent(application)) return "offered"'),
  );
});
