import { describe, expect, it } from "vitest";
import { moveInOrderedColumns } from "@/lib/task-order";

const items = [{ id: "a", status: "TODO" }, { id: "b", status: "TODO" }, { id: "c", status: "DONE" }] as const;

describe("porządkowanie zadań", () => {
  it("przenosi zadanie między statusami", () => { const moved = moveInOrderedColumns([...items], "a", "DONE", 1); expect(moved.filter((item) => item.status === "DONE").map((item) => item.id)).toEqual(["c", "a"]); });
  it("nie zmienia listy dla obcego id", () => { expect(moveInOrderedColumns([...items], "x", "DONE", 0)).toEqual(items); });
  it("ogranicza indeks do długości kolumny", () => { const moved = moveInOrderedColumns([...items], "b", "DONE", 99); expect(moved.at(-1)?.id).toBe("b"); });
});
