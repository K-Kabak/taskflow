export const THEME_STORAGE_KEY = "taskflow-theme";
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="light"||t==="dark"||t==="system")document.documentElement.dataset.theme=t}catch(e){}})()`;

export type ThemePreference = "light" | "dark" | "system";

export function parseThemePreference(value: string | null): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}
