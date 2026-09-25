import Link from "next/link";
import { ArrowRight, CheckCircle2, Columns3, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { BrandLogo } from "@/components/shared/brand-logo";

export default async function HomePage() {
  const session = await getCurrentSession();
  if (session?.user.id) {
    const membership = await db.workspaceMember.findFirst({ where: { userId: session.user.id }, orderBy: { joinedAt: "asc" } });
    if (membership) redirect(`/w/${membership.workspaceId}/dashboard`);
  }
  return (
    <main className="min-h-screen overflow-hidden px-5 py-6 sm:px-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-semibold" aria-label="TaskFlow — strona główna">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-medium hover:bg-white">Zaloguj się</Link>
          <Link href="/register" className="rounded-xl bg-[#252525] px-4 py-2 text-sm font-medium text-white hover:bg-black">Utwórz konto</Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[calc(100vh-96px)] max-w-6xl items-center gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-sm font-medium text-orange-700">Praca zespołowa bez chaosu</span>
          <h1 className="mt-6 max-w-xl text-5xl leading-[1.05] font-semibold tracking-[-0.045em] sm:text-6xl">Projekty płyną lepiej, gdy wszystko jest na swoim miejscu.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-[#6f6f6b]">TaskFlow łączy tablicę Kanban, zadania, terminy i współpracę w spokojnym, czytelnym interfejsie.</p>
          <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600">
            Zacznij bezpłatnie <ArrowRight size={18} />
          </Link>
          <div className="mt-9 flex flex-wrap gap-5 text-sm text-[#6f6f6b]">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-orange-500" /> Bez karty płatniczej</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-orange-500" /> Gotowe w minutę</span>
          </div>
        </div>

        <div className="relative rounded-[28px] border border-white bg-white/80 p-5 shadow-[0_30px_100px_rgba(249,115,22,0.18)] backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div><p className="font-semibold">Przebudowa strony</p><p className="text-sm text-[#848484]">Tablica projektu</p></div>
            <div className="flex -space-x-2"><span className="size-8 rounded-full border-2 border-white bg-orange-200" /><span className="size-8 rounded-full border-2 border-white bg-blue-200" /><span className="size-8 rounded-full border-2 border-white bg-violet-200" /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[{ title: "Do zrobienia", icon: Columns3, task: "Nowa nawigacja", bg: "from-violet-50" }, { title: "W trakcie", icon: Users, task: "Widok mobilny", bg: "from-blue-50" }, { title: "Ukończone", icon: CheckCircle2, task: "Badania użytkowników", bg: "from-orange-50" }].map((column) => (
              <div key={column.title} className="min-h-64 rounded-2xl bg-[#f7f7f5] p-3">
                <p className="mb-4 flex items-center gap-2 text-sm font-semibold"><column.icon size={15} />{column.title}</p>
                <div className={`rounded-2xl border border-white bg-gradient-to-br ${column.bg} to-white p-4 shadow-sm`}>
                  <span className="text-xs text-[#848484]">Termin: 24 września</span>
                  <p className="mt-5 font-semibold">{column.task}</p>
                  <span className="mt-6 inline-flex rounded-lg bg-white px-2 py-1 text-xs text-[#6f6f6b]"># Design</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
