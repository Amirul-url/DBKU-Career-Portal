import assert from "node:assert/strict";
import test from "node:test";

import {
  getBlockingJobApplicationForVacancy,
  getOpportunityApplicationTarget,
} from "./jobApplicationRouting.js";

const jobOpportunity = { id: 7, vacancy_type: "job" };

test("job CTA opens existing submitted application instead of a duplicate form", () => {
  const target = getOpportunityApplicationTarget(jobOpportunity, {
    actionTarget: "/profile",
    applications: [
      {
        id: 44,
        status: "submitted",
        vacancy: 7,
        vacancy_detail: { id: 7, vacancy_type: "job" },
      },
    ],
  });

  assert.equal(target, "/profile/applications/44");
});

test("job CTA resumes editable existing applications for the same vacancy", () => {
  const target = getOpportunityApplicationTarget(jobOpportunity, {
    actionTarget: "/profile",
    applications: [
      {
        id: 45,
        status: "incomplete",
        vacancy: 7,
        vacancy_detail: { id: 7, vacancy_type: "job" },
      },
    ],
  });

  assert.equal(target, "/profile/job-application?application=45");
});

test("job CTA allows reapply after rejected or withdrawn applications", () => {
  const applications = [
    { id: 46, status: "rejected", vacancy: 7, vacancy_detail: { id: 7, vacancy_type: "job" } },
    { id: 47, status: "withdrawn", vacancy: 7, vacancy_detail: { id: 7, vacancy_type: "job" } },
  ];

  assert.equal(getBlockingJobApplicationForVacancy(applications, 7), null);
  assert.equal(
    getOpportunityApplicationTarget(jobOpportunity, { actionTarget: "/profile", applications }),
    "/profile/job-application?vacancy=7",
  );
});
