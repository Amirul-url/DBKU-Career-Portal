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
  assert.match(internshipFormSource, /isJobApplication \? personalInfoTab : getFirstIncompleteTab\(initialStudentInfo\)/);
  assert.match(internshipFormSource, /<h1>\{applicationPageTitle\}<\/h1>/);
});

test("job application header includes the selected vacancy title", () => {
  assert.match(internshipFormSource, /const selectedJobTitle = isJobApplication \? String\(internshipVacancy\?\.title \|\| ""\)\.trim\(\) : ""/);
  assert.match(internshipFormSource, /selectedJobTitle\s*\?\s*`Nama Jawatan Yang Dipohon: \$\{selectedJobTitle\}`\s*:\s*applicationTitle/);
});

test("job application personal tab shows instructions beside passport upload", () => {
  assert.match(internshipFormSource, /isJobApplication \? \(\s*<div className="student-job-photo-guidance-row">/);
  assert.match(internshipFormSource, /SILA BACA ARAHAN DI BAWAH DENGAN TELITI/);
  assert.match(internshipFormSource, /Pemohon hendaklah membaca iklan jawatan yang dipohon dengan teliti\./);
  assert.match(cssSource, /\.student-job-photo-guidance-row \{[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(220px, 320px\);/);
  assert.match(cssSource, /\.student-job-instructions-table \{[\s\S]*border-collapse: collapse;/);
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
