import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildHrmDashboardMetrics, buildRecentApplicationsView } from "./hrmDashboardMetrics.js";

describe("buildHrmDashboardMetrics", () => {
  it("counts active DBKU job ads separately from internship vacancies", () => {
    const metrics = buildHrmDashboardMetrics(
      [
        {
          id: 1,
          vacancy_type: "internship",
          status: "open",
          is_open: true,
        },
        {
          id: 2,
          vacancy_type: "internship",
          status: "open",
          is_open: true,
        },
      ],
      [],
    );

    assert.equal(metrics.summary.activeJobAds, 0);
    assert.equal(metrics.job.open, 0);
    assert.equal(metrics.internship.open, 2);
    assert.equal(metrics.all.open, 2);
  });

  it("does not count expired open-status jobs as active", () => {
    const metrics = buildHrmDashboardMetrics(
      [
        {
          id: 1,
          vacancy_type: "job",
          status: "open",
          is_open: false,
        },
      ],
      [],
    );

    assert.equal(metrics.summary.activeJobAds, 0);
    assert.equal(metrics.job.open, 0);
  });

  it("counts incomplete applications as visible HRM applications", () => {
    const metrics = buildHrmDashboardMetrics(
      [{ id: 1, vacancy_type: "internship", status: "open", is_open: true }],
      [{ id: 1, vacancy: 1, status: "incomplete" }],
    );

    assert.equal(metrics.summary.totalApplications, 1);
    assert.equal(metrics.internship.total, 1);
  });
});

describe("buildRecentApplicationsView", () => {
  const applications = Array.from({ length: 7 }, (_, index) => ({
    id: index + 1,
    submitted_at: `2026-08-${String(14 - index).padStart(2, "0")}T00:00:00Z`,
  })).concat([
    { id: 8, submitted_at: "2026-07-20T00:00:00Z" },
    { id: 9, submitted_at: "2025-08-20T00:00:00Z" },
  ]);

  it("shows five recent applications per page", () => {
    const view = buildRecentApplicationsView(applications, {
      month: "all",
      page: 1,
      pageSize: 5,
      year: "all",
    });

    assert.deepEqual(view.visibleApplications.map((application) => application.id), [1, 2, 3, 4, 5]);
    assert.equal(view.totalPages, 2);
    assert.equal(view.visibleStart, 1);
    assert.equal(view.visibleEnd, 5);
  });

  it("filters recent applications by month and year", () => {
    const view = buildRecentApplicationsView(applications, {
      month: "8",
      page: 2,
      pageSize: 5,
      year: "2026",
    });

    assert.deepEqual(view.visibleApplications.map((application) => application.id), [6, 7]);
    assert.equal(view.total, 7);
    assert.equal(view.totalPages, 2);
    assert.equal(view.activePage, 2);
  });

  it("clamps an out-of-range page to the last available page", () => {
    const view = buildRecentApplicationsView(applications, {
      month: "7",
      page: 4,
      pageSize: 5,
      year: "2026",
    });

    assert.deepEqual(view.visibleApplications.map((application) => application.id), [8]);
    assert.equal(view.activePage, 1);
    assert.equal(view.totalPages, 1);
  });
});
