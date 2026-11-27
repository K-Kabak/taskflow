"use client";

import { ThemeInitScript } from "@/components/shared/theme-init-script";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="pl" data-theme="system" suppressHydrationWarning><head>
    <ThemeInitScript />
    <style>{`:root{color-scheme:light;--bg:#f7f6f3;--fg:#252722;--accent:#ad3d20;--on-accent:#ffffff}:root[data-theme=dark]{color-scheme:dark;--bg:#181a17;--fg:#f4f2eb;--accent:#ff9d7c;--on-accent:#31170f}@media(prefers-color-scheme:dark){:root[data-theme=system]{color-scheme:dark;--bg:#181a17;--fg:#f4f2eb;--accent:#ff9d7c;--on-accent:#31170f}}`}</style>
  </head><body style={{ margin: 0, background: "var(--bg)", color: "var(--fg)" }}><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif" }}><div style={{ textAlign: "center" }}><h1>TaskFlow napotkał problem</h1><p>Odśwież widok lub spróbuj ponownie za chwilę.</p><button onClick={reset} style={{ border: 0, borderRadius: 9, background: "var(--accent)", color: "var(--on-accent)", padding: "12px 18px", fontWeight: 600 }}>Spróbuj ponownie</button></div></main></body></html>;
}
