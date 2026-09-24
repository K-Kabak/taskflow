import { describe, expect, it } from "vitest";
import { formatDateOnly, parseDateOnly, toDateOnly } from "@/lib/date-only";

describe("data kalendarzowa", () => {
  it("zachowuje dzień bez przesunięcia strefy", () => { expect(toDateOnly(parseDateOnly("2026-09-24"))).toBe("2026-09-24"); });
  it("odrzuca nieistniejącą datę", () => { expect(() => parseDateOnly("2026-02-31")).toThrow(); });
  it("formatuje po polsku", () => { expect(formatDateOnly("2026-09-24")).toContain("wrz"); });
});
