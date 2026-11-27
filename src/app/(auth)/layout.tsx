import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
import { ProductPreview } from "@/components/shared/product-preview";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh max-w-[100rem] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
      <div className="flex min-w-0 flex-col bg-[var(--surface)]">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-[var(--border)] px-4 sm:px-8">
          <Link href="/" className="flex min-h-11 items-center" aria-label="TaskFlow — strona główna">
            <BrandLogo />
          </Link>
          <ThemeSwitcher />
        </header>
        <div className="grid flex-1 place-items-center px-5 py-8 sm:px-8 sm:py-12">
          <div className="tf-auth-form w-full max-w-sm">{children}</div>
        </div>
      </div>
      <aside className="tf-feature m-4 hidden items-center rounded-[20px] lg:grid">
        <div className="mx-auto w-full max-w-2xl px-8 py-10 xl:px-14">
          <h2 className="max-w-[16ch] text-4xl leading-[1.08] font-semibold tracking-[-0.05em] xl:text-5xl">
            Projekty i zadania w jednym miejscu
          </h2>
          <p className="tf-feature-muted mt-4 max-w-sm text-sm leading-relaxed">
            Sprawdzaj, kto pracuje nad zadaniem i na kiedy jest zaplanowane.
          </p>
          <div className="mt-8">
            <ProductPreview compact />
          </div>
        </div>
      </aside>
    </main>
  );
}
