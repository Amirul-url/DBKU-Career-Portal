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
