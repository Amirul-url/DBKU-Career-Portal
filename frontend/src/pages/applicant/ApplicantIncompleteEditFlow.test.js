import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routesSource = readFileSync(new URL("../../modules/applicant/applicantRoutes.js", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../../index.css", import.meta.url), "utf8");
const listSource = readFileSync(new URL("./ApplicantPortalListPage.jsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("./ApplicantProfilePage.jsx", import.meta.url), "utf8");
const viewSource = readFileSync(new URL("./ApplicantApplicationViewPage.jsx", import.meta.url), "utf8");
const formSource = readFileSync(new URL("./ApplicantInternshipApplicationPage.jsx", import.meta.url), "utf8");
const infoSource = readFileSync(new URL("./ApplicantInternshipInfoContent.jsx", import.meta.url), "utf8");

test("applicant incomplete applications can be reopened for editing", () => {
  assert.match(routesSource, /internshipApplicationEdit: \(id\) => `\/profile\/internship-application\?application=\$\{id\}`/);
  assert.match(listSource, /status === "draft" \|\| status === "incomplete"/);
  assert.match(listSource, /status === "incomplete" \? "Kemaskini" : "Teruskan"/);
  assert.match(viewSource, /status === "incomplete"/);
  assert.match(viewSource, /Kemaskini Permohonan/);
  assert.match(formSource, /useSearchParams/);
  assert.match(formSource, /editableApplicationStatuses\.has/);
  assert.match(formSource, /useState\(\(\) => loadStudentInfoDraft\(user\)\)/);
  assert.doesNotMatch(formSource, /\[editApplicationId, savedDraft\?\.studentInfo, user\]/);
  assert.match(
    formSource,
    /Number\(application\.vacancy\) === Number\(internshipVacancy\?\.id\)[\s\S]*editableApplicationStatuses\.has\(application\.status \|\| "draft"\)/,
  );
});

test("applicant rejected applications use Ditolak status label", () => {
  assert.match(listSource, /rejected: "Ditolak"/);
  assert.match(viewSource, /rejected: "Ditolak"/);
  assert.doesNotMatch(listSource, /Tidak berjaya/);
  assert.doesNotMatch(viewSource, /Tidak berjaya/);
});

test("applicant accepted applications stay hidden behind review status until HRM notification", () => {
  assert.match(listSource, /accepted: "Dalam semakan"/);
  assert.match(viewSource, /accepted: "Dalam semakan"/);
  assert.match(listSource, /function hasOrganizationFeedbackBeenSent\(application\)/);
  assert.match(listSource, /function getApplicantVisibleStatus\(status, application = null\)/);
  assert.match(listSource, /status === "accepted" && !hasOrganizationFeedbackBeenSent\(application\) \? "screening" : status/);
  assert.match(listSource, /function getApplicantStatusLabel\(status, application = null\)/);
  assert.match(listSource, /status === "accepted" && hasOrganizationFeedbackBeenSent\(application\)\) return "Diterima"/);
  assert.match(listSource, /getApplicantStatusLabel\(status, application\)/);
  assert.match(viewSource, /maskAcceptedStatus = true/);
  assert.match(viewSource, /maskAcceptedStatus && status === "accepted" \? "screening" : status/);
  assert.match(viewSource, /!maskAcceptedStatus && status === "accepted"\) return "Diterima"/);
  assert.match(viewSource, /const organizationFeedbackTab = "Maklumbalas Organisasi"/);
  assert.match(viewSource, /function hasOrganizationFeedbackBeenSent\(application\)/);
  assert.match(viewSource, /extraTabs=\{organizationFeedbackSent \? \[organizationFeedbackTab\] : \[\]\}/);
  assert.match(viewSource, /maskAcceptedStatus=\{!organizationFeedbackSent\}/);
  assert.match(viewSource, /function ApplicantOrganizationFeedbackTab/);
  assert.match(viewSource, /function getApplicantFeedbackPlacementDepartment\(application\)/);
  assert.match(viewSource, /className="organization-feedback-table applicant-organization-feedback-table"/);
  assert.match(viewSource, /<th>Nama Pelajar<\/th>/);
  assert.match(viewSource, /<th>Tempoh Latihan Industri \/ Praktikal<\/th>/);
  assert.match(viewSource, /<th>Program<\/th>/);
  assert.match(viewSource, /<th>Bahagian Ditempatkan<\/th>/);
  assert.match(viewSource, /Sila muat turun dokumen maklumbalas organisasi di bawah\./);
  assert.match(viewSource, /className="app-view-action applicant-organization-document-action"/);
  assert.match(viewSource, /aria-label=\{`Lihat \$\{document\.name\}`\}/);
  assert.doesNotMatch(viewSource, /organizationFeedbackDate/);
  assert.doesNotMatch(viewSource, /Tarikh Maklumbalas/);
});

test("applicant organization feedback notification shows red badges", () => {
  assert.match(listSource, /function hasNewOrganizationFeedbackForApplicant\(application\)/);
  assert.match(listSource, /\(application\?\.status \|\| ""\) === "accepted" && hasOrganizationFeedbackBeenSent\(application\)/);
  assert.match(listSource, /const newApplicationFeedbackCount = useMemo/);
  assert.match(listSource, /displayApplications\.filter\(hasNewOrganizationFeedbackForApplicant\)\.length/);
  assert.match(listSource, /applicationBadgeCount=\{newApplicationFeedbackCount\}/);
  assert.match(listSource, /className="applicant-applications-table applicant-profile-applications-table"/);
  assert.match(listSource, /className="applicant-reference-col"/);
  assert.match(listSource, /className="applicant-reference-cell"/);
  assert.match(listSource, /className="applicant-new-badge">Baharu/);
  assert.match(listSource, /className="applicant-reference-number">\{formatReferenceNo\(application\)\}/);
  assert.match(listSource, /aria-label=\{`Lihat permohonan \$\{formatReferenceNo\(application\)\}`\}/);
  assert.match(listSource, /<Icon>visibility<\/Icon>\s*<\/Link>/);
  assert.match(profileSource, /export function ProfileSidebar\(\{ applicationBadgeCount = 0, isOpen, onToggle \}\)/);
  assert.match(profileSource, /item\.to === APPLICANT_ROUTES\.applications \? applicationBadgeCount : 0/);
  assert.match(profileSource, /className=\{`profile-nav-badge\$\{isOpen \? "" : " collapsed"\}`\}/);
  assert.match(profileSource, /aria-label=\{`\$\{badgeCount\} maklumbalas baharu`\}/);
  assert.match(cssSource, /\.applicant-applications-table th:first-child,\s*\.applicant-applications-table td:first-child \{[\s\S]*min-width: 270px;[\s\S]*text-align: center;/);
  assert.match(cssSource, /\.applicant-profile-applications-table \{[\s\S]*table-layout: fixed;/);
  assert.match(cssSource, /\.applicant-profile-applications-table \.applicant-reference-col \{[\s\S]*width: 230px;/);
  assert.match(cssSource, /\.applicant-profile-applications-table th:first-child,\s*\.applicant-profile-applications-table td:first-child \{[\s\S]*width: 230px;[\s\S]*min-width: 0;[\s\S]*max-width: 230px;/);
  assert.match(cssSource, /\.applicant-reference-cell \{[\s\S]*position: relative;[\s\S]*display: block;[\s\S]*text-align: center;/);
  assert.match(cssSource, /\.applicant-reference-number \{[\s\S]*display: inline-block;[\s\S]*padding-inline: 4px;/);
  assert.match(cssSource, /\.applicant-new-badge \{[\s\S]*position: absolute;[\s\S]*left: -10px;[\s\S]*transform: translateY\(-50%\);[\s\S]*padding: 4px 8px;[\s\S]*font-size: 10px;/);
  assert.match(cssSource, /\.applicant-profile-applications-table \.app-view-action \{[\s\S]*width: 38px;[\s\S]*height: 38px;[\s\S]*background: #eff6ff;[\s\S]*color: #0b70c9;/);
});

test("applicant rejected internship applications can apply again", () => {
  assert.match(routesSource, /internshipApplicationNew: "\/profile\/internship-application\?new=1"/);
  assert.match(infoSource, /reapplyAllowedApplicationStatuses = new Set\(\["rejected", "withdrawn"\]\)/);
  assert.match(infoSource, /function isReapplyAllowedInternshipApplication/);
  assert.match(infoSource, /function isBlockingInternshipApplication/);
  assert.match(
    infoSource,
    /status !== "draft"[\s\S]*!reapplyAllowedApplicationStatuses\.has\(status\)/,
  );
  assert.match(infoSource, /setHasSubmittedInternshipApplication\(applications\.some\(isBlockingInternshipApplication\)\)/);
  assert.match(
    infoSource,
    /setHasReapplyAllowedInternshipApplication\(applications\.some\(isReapplyAllowedInternshipApplication\)\)/,
  );
  assert.match(infoSource, /draft\?\.purpose === "new-application"/);
  assert.match(
    infoSource,
    /const hasEditableLocalDraft = hasDraft && \(!hasReapplyAllowedInternshipApplication \|\| hasNewApplicationDraft\)/,
  );
  assert.match(
    infoSource,
    /hasReapplyAllowedInternshipApplication\s*\?\s*APPLICANT_ROUTES\.internshipApplicationNew/,
  );
  assert.doesNotMatch(infoSource, /: hasDraft\s*\?/);
  assert.match(formSource, /const isStartingNewApplication = searchParams\.get\("new"\) === "1"/);
  assert.match(
    formSource,
    /const activeSavedDraft = isStartingNewApplication && savedDraft\?\.purpose !== "new-application"\s*\?\s*null\s*:\s*savedDraft/,
  );
  assert.match(formSource, /activeSavedDraft\?\.studentInfo/);
  assert.match(formSource, /purpose:[\s\S]*"new-application"/);
  assert.match(listSource, /reapplyAllowedApplicationStatuses = new Set\(\["rejected", "withdrawn"\]\)/);
  assert.match(listSource, /function shouldHideLocalDraftForApplication/);
  assert.match(
    listSource,
    /isInternshipApplication\(application\)[\s\S]*!reapplyAllowedApplicationStatuses\.has\(status\)/,
  );
  assert.match(
    listSource,
    /const hasBlockingInternshipApplication = applications\.some\(shouldHideLocalDraftForApplication\)/,
  );
  assert.match(listSource, /hasBlockingInternshipApplication \? applications : \[localDraftApplication, \.\.\.applications\]/);
  assert.doesNotMatch(listSource, /hasInternshipApplication \? applications/);
});
