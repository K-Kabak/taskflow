"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="pl"><body><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif" }}><div style={{ textAlign: "center" }}><h1>TaskFlow napotkał problem</h1><p>Odśwież widok lub spróbuj ponownie za chwilę.</p><button onClick={reset} style={{ border: 0, borderRadius: 12, background: "#F97316", color: "white", padding: "12px 18px", fontWeight: 600 }}>Spróbuj ponownie</button></div></main></body></html>;
}
