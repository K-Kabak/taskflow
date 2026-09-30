import { describe, expect, it } from "vitest";
import { textColorForBackground } from "@/lib/utils";

describe("czytelność inicjałów", () => {
  it("dobiera ciemny lub jasny tekst dla kolorów avatarów", () => {
    expect(textColorForBackground("#F97316")).toBe("#171717");
    expect(textColorForBackground("#1e40af")).toBe("#ffffff");
    expect(textColorForBackground("#fff")).toBe("#171717");
  });
});
