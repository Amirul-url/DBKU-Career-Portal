import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routesSource = readFileSync(new URL("../../modules/applicant/applicantRoutes.js", import.meta.url), "utf8");
const listSource = readFileSync(new URL("./ApplicantPortalListPage.jsx", import.meta.url), "utf8");
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

test("applicant rejected internship applications can apply again", () => {
  assert.match(infoSource, /reapplyAllowedApplicationStatuses = new Set\(\["rejected", "withdrawn"\]\)/);
  assert.match(infoSource, /function isBlockingInternshipApplication/);
  assert.match(
    infoSource,
    /status !== "draft"[\s\S]*!reapplyAllowedApplicationStatuses\.has\(status\)/,
  );
  assert.match(infoSource, /setHasSubmittedInternshipApplication\(applications\.some\(isBlockingInternshipApplication\)\)/);
});
