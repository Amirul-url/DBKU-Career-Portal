import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./AdminHrmPage.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
const adminRoutesSource = readFileSync(new URL("../../modules/admin/adminRoutes.js", import.meta.url), "utf8");

test("HRM application action labels match the department review workflow", () => {
  assert.match(source, /submitted: "Menunggu Semakan HRM"/);
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
  assert.match(source, /return Boolean\(application\?\.assigned_department && !hasSubmittedDepartmentDecision\(application\)\)/);
  assert.match(source, /!\s*hasSubmittedHrmFinalDecision\(application\)/);
  assert.match(source, /\(application\?\.status \|\| "submitted"\) === "submitted" \|\|\s*isHrmPendingDepartmentDecisionApplication\(application\)/);
  assert.match(source, /const applications = metrics\?\.\[item\.vacancyType\]\?\.applications \|\| \[\]/);
  assert.match(source, /if \(!isHrmWorkspace\) \{\s*return applications\.filter\(isDepartmentPendingDecisionApplication\)\.length;\s*\}/);
  assert.match(source, /return applications\.filter\(isHrmNewApplication\)\.length;/);
  assert.match(source, /function getInternshipApplicationDisplayStatus\(application, isHrmWorkspace\)/);
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
  assert.match(source, /if \(isDepartmentPendingDecisionApplication\(application\)\) return "department_new"/);
  assert.match(source, /if \(isDepartmentAcceptedApplication\(application\)\) return "hrm_department_accepted"/);
  assert.match(source, /function getDashboardApplicationStatus\(application, isHrmWorkspace\)/);
  assert.match(source, /return getInternshipDashboardStatus\(application, isHrmWorkspace\)/);
  assert.match(source, /const displayStatus = useDashboardStatus \? getDashboardApplicationStatus\(app, isHrmWorkspace\) : app\.status/);
  assert.match(source, /<StatusSummaryPanel applications=\{overallMetrics\.applications\} isHrmWorkspace=\{isHrmWorkspace\} \/>/);
  assert.match(source, /applications\.filter\(\(app\) => getDashboardApplicationStatus\(app, isHrmWorkspace\) === status\)\.length/);
});

test("internship application table uses icon-only view actions", () => {
  assert.match(source, /<button className="view" type="button" aria-label="Lihat" title="Lihat" onClick=\{\(\) => onView\(application\)\}>/);
  assert.match(cssSource, /\.hrm-internship-applications-table \.hrm-badge \{[\s\S]*max-width: 122px;[\s\S]*text-align: center;[\s\S]*white-space: normal;/);
  assert.doesNotMatch(source, /className="view app-view-action"/);
  assert.doesNotMatch(source, /<Icon>visibility<\/Icon>\s*Lihat\s*<\/button>/);
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
  assert.doesNotMatch(source, /applicationLinks=\{isHrmWorkspace \? undefined : \[\]\}/);
  assert.doesNotMatch(source, /applicationLinks\.map/);
  assert.doesNotMatch(source, /<button key=\{link\.type\} onClick=\{\(\) => onOpenApplications\(link\.type\)\} type="button">/);
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
  assert.match(source, /const hrmFinalRejectionMessage = `/);
  assert.match(source, /saudara\/i untuk menjalani latihan industri di Dewan Bandaraya Kuching Utara \(DBKU\) telah diterima dan diteliti/);
  assert.match(source, /function HrmFinalDecisionTab/);
  assert.match(source, /const saveHrmFinalDecision = async/);
  assert.match(source, /hrm_final_decision: finalDecision/);
  assert.match(source, /status: nextStatus/);
  assert.match(source, /const nextStatus = "rejected"/);
  assert.match(source, /onSaveFinalDecision=\{saveHrmFinalDecision\}/);
  assert.match(source, /\.\.\.\(shouldShowHrmFinalDecision \? \[hrmFinalDecisionTab\] : \[\]\)/);
  assert.match(source, /\.\.\.\(shouldShowOrganizationFeedback \? \[organizationFeedbackTab\] : \[\]\)/);
  assert.match(source, /const \[finalRemarks, setFinalRemarks\] = useState/);
  assert.match(source, /<textarea[\s\S]*value=\{finalRemarks\}[\s\S]*onChange=\{\(event\) => setFinalRemarks\(event\.target\.value\)\}/);
  assert.match(source, /buildHrmFinalDecisionPayload\(application, user, finalRemarks\)/);
  assert.match(source, /remarks: remarks\.trim\(\)/);
  assert.doesNotMatch(source, /Terima Permohonan/);
  assert.doesNotMatch(source, /: "Tolak Permohonan"/);
  assert.match(source, /: "Hantar ke Pemohon"/);
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
  assert.match(source, /const applicantDetailTabs = \["Maklumat Peribadi Pemohon", "Maklumat Akademik", "Dokumen Sokongan"\]/);
  assert.match(source, /const shouldShowOrganizationFeedback = isHrmWorkspace && application\?\.status === "accepted"/);
  assert.match(source, /\.\.\.\(shouldShowOrganizationFeedback \? \[organizationFeedbackTab\] : \[\]\)/);
  assert.match(source, /const detailTabGroups = \[\s*\{ label: "Pemohon", tabs: applicantDetailTabs \},\s*\{ label: "Urusan Dalaman", tabs: extraTabs \},\s*\]/);
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
  assert.match(source, /key=\{`\$\{application\?\.id \|\| "organization-feedback"\}-\$\{application\?\.updated_at \|\| ""\}`\}/);
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
  assert.match(source, /organization_feedback_release:/);
  assert.match(source, /report_date: feedback\.reportDate \|\| organizationFeedbackReportDefaults\.date/);
  assert.match(source, /report_time: feedback\.reportTime \|\| organizationFeedbackReportDefaults\.time/);
  assert.match(source, /report_place: feedback\.reportPlace \|\| organizationFeedbackReportDefaults\.place/);
  assert.match(source, /confirmation_date: feedback\.confirmationDate \|\| organizationFeedbackReportDefaults\.confirmationDate/);
  assert.match(source, /sent_to_applicant_at:/);
  assert.match(source, /onSendOrganizationFeedbackToApplicant=\{sendOrganizationFeedbackToApplicant\}/);
  assert.match(source, /onSendToApplicant=\{onSendOrganizationFeedbackToApplicant\}/);
  assert.match(source, /onOrganizationFeedbackSent=\{\(\) => navigate\(ADMIN_ROUTES\.applications\.internship\)\}/);
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
  assert.match(source, /function getApplicantConfirmationDocuments\(application\)/);
  assert.match(source, /return getApplicantAgreedInternshipStatus\(application\)/);
  assert.match(source, /const applicantConfirmationTab = "Pengesahan Pemohon"/);
  assert.match(source, /\.\.\.\(hasApplicantAgreedToOffer\(application\) \? \[applicantConfirmationTab\] : \[\]\)/);
  assert.match(source, /function ApplicantConfirmationReadOnlyTab/);
  assert.match(source, /Dokumen pengesahan pemohon/);
  assert.match(source, /Dengan ini, saya mengesahkan penerimaan tawaran menjalani latihan industri di Dewan Bandaraya Kuching Utara \(DBKU\)/);
  assert.match(source, /applicantConfirmationDocuments/);
});
