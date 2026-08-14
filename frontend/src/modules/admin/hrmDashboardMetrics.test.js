import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildHrmDashboardMetrics } from "./hrmDashboardMetrics.js";

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
});
