import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const appSource = readFileSync(new URL("../../App.jsx", import.meta.url), "utf8");
const routesSource = readFileSync(new URL("../../modules/applicant/applicantRoutes.js", import.meta.url), "utf8");
const marketplaceSource = readFileSync(new URL("../JobMarketplacePage.jsx", import.meta.url), "utf8");
const jobFormUrl = new URL("./ApplicantJobApplicationPage.jsx", import.meta.url);
const jobFormSource = existsSync(jobFormUrl) ? readFileSync(jobFormUrl, "utf8") : "";
const internshipFormSource = readFileSync(new URL("./ApplicantInternshipApplicationPage.jsx", import.meta.url), "utf8");
const listSource = readFileSync(new URL("./ApplicantPortalListPage.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../../index.css", import.meta.url), "utf8");

test("job vacancy CTA opens a job application form for the selected vacancy", () => {
  assert.match(routesSource, /jobApplicationForVacancy: \(id\) => `\/profile\/job-application\?vacancy=\$\{id\}`/);
  assert.match(marketplaceSource, /getOpportunityApplicationTarget/);
  assert.match(marketplaceSource, /to=\{applicationTarget\}/);
  assert.match(appSource, /path="\/profile\/job-application"/);
});

test("job application form reuses the internship personal information table", () => {
  assert.match(jobFormSource, /<ApplicantInternshipApplicationPage applicationType="job" \/>/);
  assert.match(internshipFormSource, /applicationType = "internship"/);
  assert.match(internshipFormSource, /const isJobApplication = applicationType === "job"/);
  assert.match(internshipFormSource, /isJobApplication \? personalInfoTab : getFirstIncompleteTab\(initialStudentInfo, currentRequiredInfoTabs\)/);
  assert.match(internshipFormSource, /<h1>\{applicationPageTitle\}<\/h1>/);
});

test("job application header includes the selected vacancy title", () => {
  assert.match(internshipFormSource, /const selectedJobTitle = isJobApplication \? String\(internshipVacancy\?\.title \|\| ""\)\.trim\(\) : ""/);
  assert.match(internshipFormSource, /selectedJobTitle\s*\?\s*`Nama Jawatan Yang Dipohon: \$\{selectedJobTitle\}`\s*:\s*applicationTitle/);
});

test("job application personal heading uses uppercase numbered label", () => {
  assert.match(internshipFormSource, /const activeInfoHeading = isJobApplication\s*\?\s*getJobInfoHeading\(activeInfoTab, currentInfoTabs\.indexOf\(activeInfoTab\)\)\s*:\s*activeInfoTab/);
  assert.match(internshipFormSource, /const renderInfoHeading = \(\) => \(/);
  assert.match(internshipFormSource, /className=\{isJobApplication && activeInfoTab === personalInfoTab \? "job-section-heading" : undefined\}/);
  assert.match(internshipFormSource, /<h2[\s\S]*>\{activeInfoHeading\}<\/h2>/);
  assert.match(
    internshipFormSource,
    /<div className="student-job-photo-guidance-row">[\s\S]*\{renderPassportPhotoUpload\(\)\}[\s\S]*<\/div>[\s\S]*\{isJobApplication \? renderInfoHeading\(\) : null\}[\s\S]*<div className="student-personal-table-wrap">/,
  );
  assert.match(internshipFormSource, /\{isJobApplication && activeInfoTab === personalInfoTab \? null : renderInfoHeading\(\)\}/);
  assert.match(cssSource, /\.student-info-form h2\.job-section-heading \{[\s\S]*text-decoration: underline;/);
});

test("job application tabs use compact labels without changing tab state values", () => {
  assert.match(internshipFormSource, /const internshipInfoTabs = \[personalInfoTab, academicInfoTab, documentSupportTab\]/);
  assert.match(internshipFormSource, /const jobSpmTab = "MAKLUMAT PEPERIKSAAN SPM\/SC\/MCE\/SPM\(V\) MENGIKUT SISTEM TERBUKA\/ UNIFIED EXAMINATION CERTIFICATE \(UEC\) ATAU SETARAF \(SILA KEMUKAKAN SEMUA MATA PELAJARAN YANG DIAMBIL\)"/);
  assert.match(internshipFormSource, /const jobInfoTabs = \[[\s\S]*personalInfoTab[\s\S]*jobSpmTab[\s\S]*jobDeclarationTab[\s\S]*documentSupportTab[\s\S]*\]/);
  assert.match(internshipFormSource, /const jobTabShortLabels = \{[\s\S]*\[personalInfoTab\]: "Peribadi"[\s\S]*\[jobSpmTab\]: "SPM\/UEC"[\s\S]*\[jobDeclarationTab\]: "Perakuan"[\s\S]*\[documentSupportTab\]: "Dokumen"[\s\S]*\}/);
  assert.match(internshipFormSource, /const currentInfoTabs = isJobApplication \? jobInfoTabs : internshipInfoTabs/);
  assert.match(internshipFormSource, /const currentRequiredInfoTabs = isJobApplication \? jobInfoTabs : internshipRequiredInfoTabs/);
  assert.match(internshipFormSource, /const getJobTabCode = \(index\) => `\(\$\{String\.fromCharCode\(65 \+ index\)\}\)`/);
  assert.match(internshipFormSource, /const getInfoTabLabel = \(tab, index\) => \{/);
  assert.match(internshipFormSource, /if \(!isJobApplication\) return tab;/);
  assert.match(internshipFormSource, /return `\$\{getJobTabCode\(index\)\} \$\{jobTabShortLabels\[tab\] \|\| tab\}`;/);
  assert.match(internshipFormSource, /const getJobInfoHeading = \(tab, index\) => `\$\{getJobTabCode\(index\)\} \$\{tab\.toUpperCase\(\)\}`/);
  assert.match(internshipFormSource, /currentInfoTabs\.map\(\(tab, index\) =>/);
  assert.match(internshipFormSource, /className=\{activeInfoTab === tab \? "active" : ""\}/);
  assert.match(internshipFormSource, /title=\{isJobApplication \? getJobInfoHeading\(tab, index\) : undefined\}/);
  assert.match(internshipFormSource, /onClick=\{\(\) => openInfoTab\(tab\)\}/);
  assert.match(internshipFormSource, /\{getInfoTabLabel\(tab, index\)\}/);
  assert.match(internshipFormSource, /activeInfoTab === documentSupportTab/);
  assert.match(cssSource, /\.student-info-tabs\.job-application-tabs \{[\s\S]*overflow-x: auto;/);
  assert.match(cssSource, /\.student-info-tabs\.job-application-tabs button \{[\s\S]*white-space: nowrap;/);
});

test("job application extra sections are mandatory before submission", () => {
  assert.match(internshipFormSource, /jobSpmDetails: ""/);
  assert.match(internshipFormSource, /jobDeclaration: ""/);
  assert.match(internshipFormSource, /\["jobSpmDetails", "Butiran Peperiksaan SPM\/SC\/MCE\/SPM\(V\)\/UEC atau setaraf"\]/);
  assert.match(internshipFormSource, /\["jobDeclaration", "Perakuan Pemohon"\]/);
  assert.match(internshipFormSource, /const renderJobSimpleSection = \(field, placeholder\) => \(/);
  assert.match(internshipFormSource, /activeInfoTab === jobSpmTab \? renderJobSimpleSection\("jobSpmDetails"/);
  assert.match(internshipFormSource, /activeInfoTab === jobDeclarationTab \? renderJobSimpleSection\("jobDeclaration"/);
});

test("job application personal table includes optional salutation row above name", () => {
  assert.match(internshipFormSource, /const salutationOptions = \["Encik", "Puan", "Cik"\]/);
  assert.match(internshipFormSource, /salutation: ""/);
  assert.match(internshipFormSource, /"salutation",[\s\S]*"address"/);
  assert.match(
    internshipFormSource,
    /isJobApplication \? renderPersonalRow\(\s*"Gelaran \(Encik\/ Puan\/ Cik\)",\s*selectInput\("salutation", salutationOptions, false\),\s*"",\s*false,\s*\) : null[\s\S]*renderPersonalRow\("Nama"/,
  );
});

test("job application personal tab shows instructions beside passport upload", () => {
  assert.match(internshipFormSource, /isJobApplication \? \(\s*<div className="student-job-photo-guidance-row">/);
  assert.match(internshipFormSource, /SILA BACA ARAHAN DI BAWAH DENGAN TELITI/);
  assert.match(internshipFormSource, /Pemohon hendaklah membaca iklan jawatan yang dipohon dengan teliti\./);
  assert.match(cssSource, /\.student-job-photo-guidance-row \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(220px, 320px\);/);
  assert.match(cssSource, /\.student-job-instructions-table \{[\s\S]*border-collapse: collapse;/);
});

test("job application personal information values are normalized to uppercase only for job applications", () => {
  assert.match(internshipFormSource, /const jobUppercasePersonalFields = new Set\(\[[\s\S]*"address"[\s\S]*"birthPlace"[\s\S]*"drivingLicense"[\s\S]*\]\)/);
  assert.match(internshipFormSource, /const normalizeJobPersonalValue = \(field, value\) =>\s*isJobApplication && jobUppercasePersonalFields\.has\(field\)[\s\S]*String\(value \|\| ""\)\.toUpperCase\(\)[\s\S]*value/);
  assert.match(internshipFormSource, /setStudentInfo\(\(current\) => \(\{ \.\.\.current, \[field\]: normalizeJobPersonalValue\(field, event\.target\.value\) \}\)\)/);
  assert.match(internshipFormSource, /const selectPlaceholder = isJobApplication \? "SILA PILIH" : "Sila pilih";/);
  assert.match(internshipFormSource, /<option value="">\{selectPlaceholder\}<\/option>/);
  assert.match(internshipFormSource, /const optionValue = normalizeJobPersonalValue\(field, option\);/);
  assert.match(internshipFormSource, /address: location\.address \? normalizeJobPersonalValue\("address", dedupeAddressText\(location\.address\)\) : current\.address/);
  assert.match(internshipFormSource, /const normalizeJobPersonalInfo = \(info\) => \{[\s\S]*jobUppercasePersonalFields\.forEach\(\(field\) => \{[\s\S]*next\[field\] = normalizeJobPersonalValue\(field, next\[field\]\);/);
  assert.match(internshipFormSource, /const normalizedStudentInfo = normalizeJobPersonalInfo\(studentInfo\);[\s\S]*buildApplicationPayload\(normalizedStudentInfo, targetVacancy, documentFiles, applicationType\)/);
  assert.match(internshipFormSource, /studentInfo: getDraftStudentInfo\(normalizeJobPersonalInfo\(studentInfo\)\)/);
});

test("draft and incomplete job applications reopen the job form", () => {
  assert.match(routesSource, /jobApplicationEdit: \(id\) => `\/profile\/job-application\?application=\$\{id\}`/);
  assert.match(listSource, /isInternshipApplication\(application\)\s*\?\s*APPLICANT_ROUTES\.internshipApplicationEdit\(application\.id\)\s*:\s*APPLICANT_ROUTES\.jobApplicationEdit\(application\.id\)/);
});

test("saved job vacancies open the selected job application form", () => {
  assert.match(listSource, /APPLICANT_ROUTES\.jobApplicationForVacancy\(selectedVacancy\.id\)/);
});

test("job back action saves a visible draft like internship applications", () => {
  assert.match(internshipFormSource, /const getJobDraftStorageKey = \(user\) =>/);
  assert.match(internshipFormSource, /loadStudentInfoDraft\(user, applicationType\)/);
  assert.doesNotMatch(internshipFormSource, /if \(isJobApplication\) \{\s*navigate\(APPLICANT_ROUTES\.jobs\);\s*return;\s*\}/);
  assert.match(internshipFormSource, /saveStudentInfoDraft\(user,[\s\S]*applicationType[\s\S]*\)/);
  assert.match(listSource, /function getJobDraftApplication\(user\)/);
  assert.match(listSource, /getJobDraftApplication\(user\)/);
  assert.match(listSource, /\[localJobDraftApplication, localInternshipDraftApplication\]/);
});
