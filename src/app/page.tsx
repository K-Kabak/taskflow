import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ProductPreview } from "@/components/shared/product-preview";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

export default async function HomePage() {
  const session = await getCurrentSession();
  if (session?.user.id) {
    const membership = await db.workspaceMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { joinedAt: "asc" },
    });
    if (membership) redirect(`/w/${membership.workspaceId}/dashboard`);
  }
  return (
    <main className="min-h-dvh">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <nav
          aria-label="Nawigacja główna"
          className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-1 px-4 py-2.5 sm:px-8 sm:py-3"
        >
          <Link href="/" className="flex min-h-11 items-center" aria-label="TaskFlow — strona główna">
            <BrandLogo className="max-sm:w-25" />
          </Link>
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <ThemeSwitcher />
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-2 text-xs font-semibold hover:bg-[var(--hover)] sm:px-3 sm:text-sm"
            >
              Zaloguj się
            </Link>
            <Link
              href="/register"
              className="tf-button-secondary inline-flex min-h-11 items-center px-2 text-xs sm:px-3 sm:text-sm"
            >
              Utwórz konto
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-9 sm:gap-12 sm:px-8 sm:py-14 lg:min-h-[calc(100dvh-70px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:py-16">
        <div className="min-w-0">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-ink)] sm:text-sm">
            <span className="size-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
            Praca zespołowa bez chaosu
          </p>
          <h1 className="max-w-xl text-[clamp(2.3rem,1.45rem+3.2vw,4.65rem)] leading-[1.04] font-semibold tracking-[-0.065em]">
            Projekty płyną lepiej, gdy wszystko jest{" "}
            <span className="text-[var(--accent-ink)]">na swoim miejscu.</span>
          </h1>
          <p className="mt-4 max-w-[39ch] text-base leading-relaxed text-[var(--muted)] sm:mt-6 sm:text-lg">
            Planuj zadania na tablicy Kanban, pilnuj terminów i współpracuj z zespołem w jednej przestrzeni.
          </p>
          <Link
            href="/register"
            className="tf-button-primary mt-6 inline-flex min-h-12 items-center gap-2 px-5 py-3 text-sm sm:mt-8"
          >
            Zacznij bezpłatnie <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--muted)] sm:text-sm">
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-[var(--success)]" aria-hidden="true" /> Bez karty płatniczej
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={15} className="text-[var(--success)]" aria-hidden="true" /> Gotowe w minutę
            </span>
          </div>
        </div>
        <figure className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--muted-surface)] p-2 sm:p-4 lg:p-5">
          <ProductPreview />
          <figcaption className="mt-2 px-1 text-xs text-[var(--muted)] sm:mt-3">
            Przykładowa tablica projektu w TaskFlow
          </figcaption>
        </figure>
      </section>
    </main>
  );
}
