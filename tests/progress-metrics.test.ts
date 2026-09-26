import { describe, expect, it } from "vitest";
import { countTaskMetrics, progressMetrics } from "@/lib/progress-metrics";

describe("progress metrics", () => {
  it("handles empty projects without dividing by zero", () => {
    expect(progressMetrics({ TODO: 0, IN_PROGRESS: 0, DONE: 0 }, 0)).toEqual({ total: 0, completed: 0, overdue: 0, completionPercent: 0 });
  });

  it("counts statuses and only open tasks before today as overdue", () => {
    const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
    expect(countTaskMetrics([
      { status: "TODO", dueDate: date("2026-09-25") },
      { status: "IN_PROGRESS", dueDate: date("2026-09-26") },
      { status: "DONE", dueDate: date("2026-09-20") },
      { status: "DONE", dueDate: null },
    ], date("2026-09-26"))).toEqual({ counts: { TODO: 1, IN_PROGRESS: 1, DONE: 2 }, total: 4, completed: 2, overdue: 1, completionPercent: 50 });
  });
});
