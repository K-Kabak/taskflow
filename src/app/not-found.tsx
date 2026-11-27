import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-dvh place-items-center px-4 py-8"><div className="tf-card w-full max-w-lg p-6 text-center sm:p-9"><p className="text-sm font-semibold text-[var(--accent-ink)]">404</p><h1 className="tf-page-heading mt-2">Nie znaleziono strony</h1><p className="mt-3 text-[var(--muted)]">Ten zasób nie istnieje albo nie masz do niego dostępu.</p><Link href="/" className="tf-button-primary mt-6 inline-flex min-h-11 items-center px-4 text-sm">Wróć do TaskFlow</Link></div></main>;
}
