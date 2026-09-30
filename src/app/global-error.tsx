"use client";

import { ThemeInitScript } from "@/components/shared/theme-init-script";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="pl" data-theme="system" suppressHydrationWarning><head>
    <ThemeInitScript />
    <style>{`:root{color-scheme:light;--bg:#f7f7f5;--fg:#252525;--accent:#f97316;--on-accent:#252525}:root[data-theme=dark]{color-scheme:dark;--bg:#17191c;--fg:#f4f4f1;--accent:#fb923c;--on-accent:#1b120b}@media(prefers-color-scheme:dark){:root[data-theme=system]{color-scheme:dark;--bg:#17191c;--fg:#f4f4f1;--accent:#fb923c;--on-accent:#1b120b}}`}</style>
  </head><body style={{ margin: 0, background: "var(--bg)", color: "var(--fg)" }}><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif" }}><div style={{ textAlign: "center" }}><h1>TaskFlow napotkał problem</h1><p>Odśwież widok lub spróbuj ponownie za chwilę.</p><button onClick={reset} style={{ border: 0, borderRadius: 12, background: "var(--accent)", color: "var(--on-accent)", padding: "12px 18px", fontWeight: 600 }}>Spróbuj ponownie</button></div></main></body></html>;
}
