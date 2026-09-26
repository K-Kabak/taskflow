import { describe, expect, it } from "vitest";
import { boardFilterCount, boardFilterParams, filterBoardTasks, parseBoardFilters, type FilterableTask } from "@/lib/board-filters";

const tasks: FilterableTask[] = [
  { title: "Audyt interfejsu", status: "TODO", priority: "HIGH", dueDate: "2026-09-24T00:00:00.000Z", assignees: [{ id: "anna" }], labels: [{ id: "ui" }] },
  { title: "Test mobilny", status: "IN_PROGRESS", priority: "LOW", dueDate: "2026-09-29T00:00:00.000Z", assignees: [{ id: "ola" }], labels: [{ id: "test" }] },
  { title: "Dokumentacja", status: "DONE", priority: "MEDIUM", dueDate: null, assignees: [], labels: [] },
];

describe("filtry Kanban", () => {
  it("łączy tekst, priorytet, osobę i etykietę oraz serializuje stan do URL", () => {
    const filters = parseBoardFilters({ bq: " AUDYT ", bpriority: "HIGH", bassignee: "anna", blabel: "ui" });
    expect(filterBoardTasks(tasks, filters, "2026-09-26")).toEqual([tasks[0]]);
    expect(boardFilterCount(filters)).toBe(4);
    expect(boardFilterParams(filters).toString()).toContain("bpriority=HIGH");
  });
  it("odróżnia zaległe, nadchodzące, bez terminu i zakres dat", () => {
    expect(filterBoardTasks(tasks, parseBoardFilters({ bdue: "OVERDUE" }), "2026-09-26")).toEqual([tasks[0]]);
    expect(filterBoardTasks(tasks, parseBoardFilters({ bdue: "NEXT_7_DAYS" }), "2026-09-26")).toEqual([tasks[1]]);
    expect(filterBoardTasks(tasks, parseBoardFilters({ bdue: "NO_DATE" }), "2026-09-26")).toEqual([tasks[2]]);
    expect(filterBoardTasks(tasks, parseBoardFilters({ bfrom: "2026-09-28", bto: "2026-09-30" }), "2026-09-26")).toEqual([tasks[1]]);
  });
  it("odrzuca nieprawidłowe wartości URL bez wyjątku", () => {
    const filters = parseBoardFilters({ bpriority: "ADMIN", bdue: "INVALID", bfrom: "2026-99-99", bq: "x".repeat(500), blabel: ["ui", "other"] });
    expect(filters.priority).toBe("");
    expect(filters.due).toBe("");
    expect(filters.from).toBe("");
    expect(filters.text).toHaveLength(160);
    expect(filters.labelId).toBe("");
  });
});
