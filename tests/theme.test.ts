import { describe, expect, it } from "vitest";
import { parseThemePreference, THEME_STORAGE_KEY } from "@/lib/theme";

describe("preferencja motywu", () => {
  it("akceptuje trzy tryby i używa Systemowego dla nieznanej wartości", () => {
    expect(THEME_STORAGE_KEY).toBe("taskflow-theme");
    expect(parseThemePreference("light")).toBe("light");
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
    expect(parseThemePreference(null)).toBe("system");
    expect(parseThemePreference("DARK")).toBe("system");
    expect(parseThemePreference("<script>")).toBe("system");
  });
});
