import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routesSource = readFileSync(new URL("../../modules/applicant/applicantRoutes.js", import.meta.url), "utf8");
const listSource = readFileSync(new URL("./ApplicantPortalListPage.jsx", import.meta.url), "utf8");
const viewSource = readFileSync(new URL("./ApplicantApplicationViewPage.jsx", import.meta.url), "utf8");
const formSource = readFileSync(new URL("./ApplicantInternshipApplicationPage.jsx", import.meta.url), "utf8");

test("applicant incomplete applications can be reopened for editing", () => {
  assert.match(routesSource, /internshipApplicationEdit: \(id\) => `\/profile\/internship-application\?application=\$\{id\}`/);
  assert.match(listSource, /status === "draft" \|\| status === "incomplete"/);
  assert.match(listSource, /status === "incomplete" \? "Kemaskini" : "Teruskan"/);
  assert.match(viewSource, /status === "incomplete"/);
  assert.match(viewSource, /Kemaskini Permohonan/);
  assert.match(formSource, /useSearchParams/);
  assert.match(formSource, /editableApplicationStatuses\.has/);
});
