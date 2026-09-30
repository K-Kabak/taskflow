"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SunMoon } from "lucide-react";
import { parseThemePreference, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const choices: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Jasny" },
  { value: "dark", label: "Ciemny" },
  { value: "system", label: "Systemowy" },
];

function initialTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try { return parseThemePreference(localStorage.getItem(THEME_STORAGE_KEY)); }
  catch { return "system"; }
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemePreference>(initialTheme);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    function sync(event: StorageEvent) {
      if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
      const preference = parseThemePreference(event.key === null ? null : event.newValue);
      document.documentElement.setAttribute("data-theme", preference);
      setTheme(preference);
    }
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    selected.current?.focus();
    function closeOutside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function select(preference: ThemePreference) {
    document.documentElement.setAttribute("data-theme", preference);
    setTheme(preference);
    try { localStorage.setItem(THEME_STORAGE_KEY, preference); } catch { /* Keep the choice for this page. */ }
    setOpen(false);
    trigger.current?.focus();
  }

  return <div ref={root} className="relative shrink-0">
    <button ref={trigger} type="button" aria-label="Zmień motyw" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(!open)} className="grid min-h-11 min-w-11 place-items-center rounded-xl text-[var(--muted)] hover:bg-[var(--hover)] hover:text-[var(--foreground)]">
      <SunMoon size={19} aria-hidden="true" />
    </button>
    {open && <div role="dialog" aria-label="Wybierz motyw" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus(); } }} className="absolute top-full right-0 z-50 mt-2 w-48 rounded-xl border border-[var(--border)] bg-[var(--elevated-surface)] p-2 text-[var(--foreground)] shadow-xl">
      <fieldset><legend className="px-2 pb-2 text-xs font-semibold text-[var(--muted)]">Motyw wyglądu</legend>
        {choices.map((choice) => <label key={choice.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm hover:bg-[var(--hover)]">
          <input ref={theme === choice.value ? selected : undefined} type="radio" name="taskflow-theme" value={choice.value} checked={theme === choice.value} onChange={() => select(choice.value)} className="accent-[var(--accent)]" />{choice.label}
        </label>)}
      </fieldset>
    </div>}
  </div>;
}
