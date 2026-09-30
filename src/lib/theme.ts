export const THEME_STORAGE_KEY = "taskflow-theme";

export type ThemePreference = "light" | "dark" | "system";

export function parseThemePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}
