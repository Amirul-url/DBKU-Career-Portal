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

test("job application section headings stay inside official tables", () => {
  assert.match(internshipFormSource, /const activeInfoHeading = isJobApplication\s*\?\s*getJobInfoHeading\(activeInfoTab, currentInfoTabs\.indexOf\(activeInfoTab\)\)\s*:\s*activeInfoTab/);
  assert.match(internshipFormSource, /const renderInfoHeading = \(\) => \(/);
  assert.match(internshipFormSource, /<h2[\s\S]*>\{activeInfoHeading\}<\/h2>/);
  assert.doesNotMatch(internshipFormSource, /\{isJobApplication \? renderInfoHeading\(\) : null\}[\s\S]*<div className="student-personal-table-wrap">/);
  assert.doesNotMatch(internshipFormSource, /\{isJobApplication && activeInfoTab === personalInfoTab \? null : renderInfoHeading\(\)\}/);
  assert.match(internshipFormSource, /\{!isJobApplication \? renderInfoHeading\(\) : null\}/);
  assert.match(internshipFormSource, /<thead>\s*\{isJobApplication \? \(\s*<tr className="student-personal-section-heading">[\s\S]*<th colSpan=\{2\}>\{activeInfoHeading\}<\/th>/);
  assert.match(internshipFormSource, /<thead>\s*<tr>\s*<th className="student-job-spm-heading" colSpan=\{4\}>\{activeInfoHeading\}<\/th>/);
  assert.match(cssSource, /\.student-personal-table \.student-personal-section-heading th \{[\s\S]*background: #d9d9d9;/);
  assert.match(cssSource, /\.student-personal-table \.student-personal-section-heading th \{[\s\S]*text-decoration: underline;/);
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
  assert.doesNotMatch(internshipFormSource, /\["jobSpmDetails", "Butiran Peperiksaan SPM\/SC\/MCE\/SPM\(V\)\/UEC atau setaraf"\]/);
  assert.match(internshipFormSource, /\["jobDeclaration", "Perakuan Pemohon"\]/);
  assert.match(internshipFormSource, /const renderJobSimpleSection = \(field, placeholder\) => \(/);
  assert.doesNotMatch(internshipFormSource, /activeInfoTab === jobSpmTab \? renderJobSimpleSection\("jobSpmDetails"/);
  assert.match(internshipFormSource, /activeInfoTab === jobDeclarationTab \? renderJobSimpleSection\("jobDeclaration"/);
});

test("job application SPM section renders the official subject and grade table", () => {
  assert.match(internshipFormSource, /const jobSpmSubjectRowCount = 12/);
  assert.match(internshipFormSource, /const minimumJobSpmSubjectRows = 3/);
  assert.match(internshipFormSource, /jobSpmSchool: ""/);
  assert.match(internshipFormSource, /jobSpmYear: ""/);
  assert.match(internshipFormSource, /jobSpmExamName: ""/);
  assert.match(internshipFormSource, /jobSpmSubjects: Array\.from\(\{ length: jobSpmSubjectRowCount \}/);
  assert.match(internshipFormSource, /\["jobSpmSchool", "Sekolah"\]/);
  assert.match(internshipFormSource, /\["jobSpmYear", "Tahun"\]/);
  assert.match(internshipFormSource, /\["jobSpmExamName", "Nama Peperiksaan"\]/);
  assert.doesNotMatch(internshipFormSource, /\["jobSpmDetails", "Butiran Peperiksaan SPM\/SC\/MCE\/SPM\(V\)\/UEC atau setaraf"\]/);
  assert.match(internshipFormSource, /function getJobSpmValidation\(studentInfo = \{\}\) \{/);
  assert.match(internshipFormSource, /completedRows\.length < minimumJobSpmSubjectRows/);
  assert.match(internshipFormSource, /`Sekurang-kurangnya \$\{minimumJobSpmSubjectRows\} mata pelajaran bersama gred`/);
  assert.match(internshipFormSource, /`Lengkapkan Mata Pelajaran dan Gred pada baris \$\{partialRows\.join\(", "\)\}`/);
  assert.match(internshipFormSource, /if \(tab === jobSpmTab\) return isJobSpmTabComplete\(studentInfo\);/);
  assert.match(internshipFormSource, /if \(tab === jobSpmTab\) \{[\s\S]*const jobSpmValidation = getJobSpmValidation\(studentInfo\);[\s\S]*missingFields\.push\(\.\.\.jobSpmValidation\.missingFields\);/);
  assert.match(internshipFormSource, /const renderJobSpmSection = \(\) => \(/);
  assert.match(internshipFormSource, /className="student-job-spm-table"/);
  assert.match(internshipFormSource, /<th className="student-job-spm-heading" colSpan=\{4\}>\{activeInfoHeading\}<\/th>/);
  assert.match(internshipFormSource, /UNTUK KEGUNAAN\s*URUSETIA\s*\(BHG HRM\)/);
  assert.match(internshipFormSource, /getJobSpmSubjects\(studentInfo\)\.map\(\(row, index\) =>/);
  assert.match(internshipFormSource, /updateJobSpmSubjectRow\(index, "subject"\)/);
  assert.match(internshipFormSource, /updateJobSpmSubjectRow\(index, "grade"\)/);
  assert.match(internshipFormSource, /activeInfoTab === jobSpmTab \? renderJobSpmSection\(\) : null/);
  assert.match(cssSource, /\.student-job-spm-table \{[\s\S]*border-collapse: collapse;/);
  assert.match(cssSource, /\.student-job-spm-table \.hrm-use-cell \{[\s\S]*background: #d9d9d9;/);
  assert.match(cssSource, /\.student-job-spm-table \.hrm-use-cell \{[\s\S]*min-width: 210px;[\s\S]*width: 210px;/);
  assert.match(cssSource, /\.student-job-spm-table thead th\.student-job-spm-heading \{[\s\S]*padding-left: 38px;[\s\S]*text-align: left;[\s\S]*text-indent: -24px;/);
});

test("job application BM July, Math July and STPM sections render official tables", () => {
  assert.match(internshipFormSource, /const jobStpmSubjectRowCount = 5/);
  assert.match(internshipFormSource, /const minimumJobStpmSubjectRows = 3/);
  assert.match(internshipFormSource, /jobBmJulyYear: ""/);
  assert.match(internshipFormSource, /jobBmJulyExamName: ""/);
  assert.match(internshipFormSource, /jobBmJulyGradeDecision: ""/);
  assert.match(internshipFormSource, /jobBmJulyOralExam: ""/);
  assert.match(internshipFormSource, /jobMathJulyYear: ""/);
  assert.match(internshipFormSource, /jobMathJulyGradeDecision: ""/);
  assert.match(internshipFormSource, /jobStpmSchool: ""/);
  assert.match(internshipFormSource, /jobStpmYear: ""/);
  assert.match(internshipFormSource, /jobStpmExamName: ""/);
  assert.match(internshipFormSource, /jobStpmSubjects: Array\.from\(\{ length: jobStpmSubjectRowCount \}/);
  assert.match(internshipFormSource, /\["jobBmJulyYear", "Tahun"\]/);
  assert.match(internshipFormSource, /\["jobBmJulyExamName", "Nama Peperiksaan"\]/);
  assert.match(internshipFormSource, /\["jobBmJulyGradeDecision", "Keputusan Gred"\]/);
  assert.match(internshipFormSource, /\["jobBmJulyOralExam", "Ujian Lisan"\]/);
  assert.match(internshipFormSource, /\["jobMathJulyYear", "Tahun"\]/);
  assert.match(internshipFormSource, /\["jobMathJulyGradeDecision", "Keputusan Gred"\]/);
  assert.match(internshipFormSource, /\["jobStpmSchool", "Sekolah"\]/);
  assert.match(internshipFormSource, /\["jobStpmYear", "Tahun"\]/);
  assert.match(internshipFormSource, /\["jobStpmExamName", "Nama Peperiksaan"\]/);
  assert.doesNotMatch(internshipFormSource, /\["jobBmJulyDetails", "Butiran BM Kertas Julai\/STPM\/Universiti atau setaraf"\]/);
  assert.doesNotMatch(internshipFormSource, /\["jobMathJulyDetails", "Butiran Peperiksaan Matematik Kertas Julai"\]/);
  assert.doesNotMatch(internshipFormSource, /\["jobStpmDetails", "Butiran Peperiksaan STPM\/STAM\/STP\/HSC\/Sijil Matrikulasi"\]/);
  assert.match(internshipFormSource, /function getJobStpmValidation\(studentInfo = \{\}\) \{/);
  assert.match(internshipFormSource, /completedRows\.length < minimumJobStpmSubjectRows/);
  assert.match(internshipFormSource, /`Sekurang-kurangnya \$\{minimumJobStpmSubjectRows\} mata pelajaran bersama gred`/);
  assert.match(internshipFormSource, /if \(tab === jobStpmTab\) return isJobStpmTabComplete\(studentInfo\);/);
  assert.match(internshipFormSource, /const renderJobBmJulySection = \(\) => \(/);
  assert.match(internshipFormSource, /student-job-bm-july-table/);
  assert.match(internshipFormSource, /<colgroup>\s*<col \/>\s*<col \/>\s*<col \/>\s*<col \/>\s*<\/colgroup>/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Tahun"\)[\s\S]*jobBmJulyYear/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Nama Peperiksaan"\)[\s\S]*jobBmJulyExamName/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Keputusan Gred"\)[\s\S]*jobBmJulyGradeDecision/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Ujian Lisan"\)[\s\S]*jobBmJulyOralExam/);
  assert.match(internshipFormSource, /const renderJobMathJulySection = \(\) => \(/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Tahun"\)[\s\S]*jobMathJulyYear/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Keputusan Gred"\)[\s\S]*jobMathJulyGradeDecision/);
  assert.match(internshipFormSource, /const renderJobStpmSection = \(\) => \(/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Sekolah"\)[\s\S]*jobStpmSchool/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Tahun"\)[\s\S]*jobStpmYear/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Nama Peperiksaan"\)[\s\S]*jobStpmExamName/);
  assert.match(internshipFormSource, /activeInfoTab === jobBmJulyTab \? renderJobBmJulySection\(\) : null/);
  assert.match(internshipFormSource, /activeInfoTab === jobMathJulyTab \? renderJobMathJulySection\(\) : null/);
  assert.match(internshipFormSource, /activeInfoTab === jobStpmTab \? renderJobStpmSection\(\) : null/);
  assert.doesNotMatch(internshipFormSource, /activeInfoTab === jobBmJulyTab \? renderJobSimpleSection\("jobBmJulyDetails"/);
  assert.doesNotMatch(internshipFormSource, /activeInfoTab === jobMathJulyTab \? renderJobSimpleSection\("jobMathJulyDetails"/);
  assert.doesNotMatch(internshipFormSource, /activeInfoTab === jobStpmTab \? renderJobSimpleSection\("jobStpmDetails"/);
});

test("job application higher education section renders the official qualification table", () => {
  assert.match(internshipFormSource, /const jobHigherEducationRowCount = 2/);
  assert.match(internshipFormSource, /jobHigherEducationQualifications: Array\.from\(\{ length: jobHigherEducationRowCount \}/);
  assert.match(internshipFormSource, /certificateName: ""/);
  assert.match(internshipFormSource, /entryDate: ""/);
  assert.match(internshipFormSource, /completionDate: ""/);
  assert.match(internshipFormSource, /specialization: ""/);
  assert.match(internshipFormSource, /const jobHigherEducationRequiredFields = \[/);
  assert.match(internshipFormSource, /function getJobHigherEducationValidation\(studentInfo = \{\}\) \{/);
  assert.match(internshipFormSource, /rows\.flatMap\(\(row, rowIndex\) =>/);
  assert.match(internshipFormSource, /Semua maklumat Kelulusan Pengajian Tinggi wajib diisi/);
  assert.match(internshipFormSource, /if \(tab === jobHigherEducationTab\) return isJobHigherEducationTabComplete\(studentInfo\);/);
  assert.match(internshipFormSource, /const renderJobHigherEducationSection = \(\) => \(/);
  assert.match(internshipFormSource, /student-job-higher-education-table/);
  assert.match(internshipFormSource, /Sila lengkapkan maklumat kelulusan pendidikan tinggi jika jawatan yang dipohon memerlukan kelayakan tersebut/);
  assert.match(internshipFormSource, /getJobHigherEducationQualifications\(studentInfo\)\.map\(\(row, index\) =>/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Nama Sijil"\)/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Tarikh Masuk"\)/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("CGPA"\)/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Tarikh Tamat Pengajian"\)/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Institusi"\)/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Pengkhususan"\)/);
  assert.match(internshipFormSource, /updateJobHigherEducationRow\(index, "certificateName"\)/);
  assert.match(internshipFormSource, /updateJobHigherEducationRow\(index, "completionDate"\)/);
  assert.match(internshipFormSource, /activeInfoTab === jobHigherEducationTab \? renderJobHigherEducationSection\(\) : null/);
  assert.doesNotMatch(internshipFormSource, /activeInfoTab === academicInfoTab \|\| activeInfoTab === jobHigherEducationTab \? renderAcademicFields\(\) : null/);
});

test("job application required exam table labels show required markers", () => {
  assert.match(internshipFormSource, /const renderJobRequiredTableLabel = \(label\) => \(/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Sekolah"\)[\s\S]*jobSpmSchool/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Tahun"\)[\s\S]*jobSpmYear/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Nama Peperiksaan"\)[\s\S]*jobSpmExamName/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Mata Pelajaran"\)/);
  assert.match(internshipFormSource, /renderJobRequiredTableLabel\("Gred"\)/);
});

test("job application language and computer sections render official skill tables", () => {
  assert.match(internshipFormSource, /const minimumJobComputerSkillRows = 2/);
  assert.match(internshipFormSource, /jobLanguageSkillRows: getDefaultJobLanguageSkillRows\(\)/);
  assert.match(internshipFormSource, /jobComputerSkillRows: Array\.from\(\{ length: jobComputerSkillRowCount \}/);
  assert.match(internshipFormSource, /\[jobLanguageSkillsTab\]: \[\]/);
  assert.match(internshipFormSource, /\[jobComputerSkillsTab\]: \[\]/);
  assert.match(internshipFormSource, /function getJobLanguageSkillsValidation\(studentInfo = \{\}\) \{/);
  assert.match(internshipFormSource, /row\.required && \(!row\.speaking \|\| !row\.writing\)/);
  assert.match(internshipFormSource, /Bahasa Malaysia dan Bahasa Inggeris wajib lengkap untuk Pertuturan dan Penulisan/);
  assert.match(internshipFormSource, /function getJobComputerSkillsValidation\(studentInfo = \{\}\) \{/);
  assert.match(internshipFormSource, /completedRows\.length < minimumJobComputerSkillRows/);
  assert.match(internshipFormSource, /`Sekurang-kurangnya \$\{minimumJobComputerSkillRows\} nama perisian bersama tahap kemahiran`/);
  assert.match(internshipFormSource, /if \(tab === jobLanguageSkillsTab\) return isJobLanguageSkillsTabComplete\(studentInfo\);/);
  assert.match(internshipFormSource, /if \(tab === jobComputerSkillsTab\) return isJobComputerSkillsTabComplete\(studentInfo\);/);
  assert.match(internshipFormSource, /const renderJobLanguageSkillsSection = \(\) => \(/);
  assert.match(internshipFormSource, /student-job-language-table/);
  assert.match(internshipFormSource, /Bahasa Malaysia/);
  assert.match(internshipFormSource, /Bahasa Inggeris/);
  assert.match(internshipFormSource, /updateJobLanguageSkillRow\(index, "speaking"/);
  assert.match(internshipFormSource, /updateJobLanguageSkillRow\(index, "writing"/);
  assert.match(internshipFormSource, /const renderJobComputerSkillsSection = \(\) => \(/);
  assert.match(internshipFormSource, /student-job-computer-table/);
  assert.match(internshipFormSource, /updateJobComputerSkillRow\(index, "softwareName"/);
  assert.match(internshipFormSource, /updateJobComputerSkillRow\(index, "level"/);
  assert.match(internshipFormSource, /activeInfoTab === jobLanguageSkillsTab \? renderJobLanguageSkillsSection\(\) : null/);
  assert.match(internshipFormSource, /activeInfoTab === jobComputerSkillsTab \? renderJobComputerSkillsSection\(\) : null/);
  assert.doesNotMatch(internshipFormSource, /activeInfoTab === jobLanguageSkillsTab \? renderJobSimpleSection\("jobLanguageSkills"/);
  assert.doesNotMatch(internshipFormSource, /activeInfoTab === jobComputerSkillsTab \? renderJobSimpleSection\("jobComputerSkills"/);
});

test("job application personal table includes required salutation row above name", () => {
  assert.match(internshipFormSource, /const salutationOptions = \["Encik", "Puan", "Cik"\]/);
  assert.match(internshipFormSource, /salutation: ""/);
  assert.match(internshipFormSource, /"salutation",[\s\S]*"address"/);
  assert.match(
    internshipFormSource,
    /isJobApplication \? renderPersonalRow\(\s*"Gelaran \(Encik\/ Puan\/ Cik\)",\s*selectInput\("salutation", salutationOptions\),\s*\) : null[\s\S]*renderPersonalRow\("Nama"/,
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
