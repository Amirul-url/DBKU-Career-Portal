import assert from "node:assert/strict";
import test from "node:test";

import { getJobApplicationRoute, getOpportunityApplicationTarget } from "./jobApplicationRouting.js";

test("job application route keeps the selected vacancy id in the query string", () => {
  assert.equal(getJobApplicationRoute(42), "/profile/job-application?vacancy=42");
});

test("profile job marketplace opens the selected job application form", () => {
  const target = getOpportunityApplicationTarget({
    id: 17,
    vacancy_type: "job",
  }, {
    actionTarget: "/profile",
  });

  assert.equal(target, "/profile/job-application?vacancy=17");
});

test("public marketplace keeps its login target", () => {
  const target = getOpportunityApplicationTarget({
    id: 17,
    vacancy_type: "job",
  }, {
    actionTarget: "/login",
  });

  assert.equal(target, "/login");
});
