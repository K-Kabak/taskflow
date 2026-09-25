import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FolderKanban, Plus, TriangleAlert } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { formatDateOnly } from "@/lib/date-only";

export default async function DashboardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { session, membership } = await requireWorkspaceMember(workspaceId);
  const now = new Date(); now.setUTCHours(0, 0, 0, 0);
  const [projects, myOpen, overdue, done, recent, upcoming] = await Promise.all([
    db.project.count({ where: { workspaceId, archivedAt: null } }),
    db.task.count({ where: { project: { workspaceId, archivedAt: null }, status: { not: "DONE" }, assignees: { some: { userId: session.user.id } } } }),
    db.task.count({ where: { project: { workspaceId, archivedAt: null }, status: { not: "DONE" }, dueDate: { lt: now } } }),
    db.task.count({ where: { project: { workspaceId, archivedAt: null }, status: "DONE" } }),
    db.project.findMany({ where: { workspaceId, archivedAt: null }, take: 4, orderBy: { updatedAt: "desc" }, include: { _count: { select: { tasks: true } } } }),
    db.task.findMany({ where: { project: { workspaceId, archivedAt: null }, dueDate: { gte: now } }, take: 6, orderBy: { dueDate: "asc" }, include: { project: true } }),
  ]);
  const stats = [
    { label: "Aktywne projekty", value: projects, icon: FolderKanban, tone: "bg-orange-50 text-[var(--accent-ink)]" },
    { label: "Moje otwarte", value: myOpen, icon: Clock3, tone: "bg-blue-50 text-blue-800" },
    { label: "Po terminie", value: overdue, icon: TriangleAlert, tone: "bg-red-50 text-red-800" },
    { label: "Ukończone", value: done, icon: CheckCircle2, tone: "bg-green-50 text-green-800" },
  ];
  return <div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[var(--muted)]">{membership.workspace.name}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Dzień dobry, {membership.user.name.split(" ")[0]}</h1><p className="mt-2 text-sm text-[var(--muted)]">Przegląd aktualnej pracy w Twojej przestrzeni.</p></div>{["OWNER", "ADMIN"].includes(membership.role) && <Link href={`/w/${workspaceId}/projects#new`} className="tf-button-primary inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm"><Plus size={18} aria-hidden="true" />Nowy projekt</Link>}</header>

    <section aria-label="Statystyki przestrzeni" className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="tf-card min-w-0 p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><span className="text-xs font-medium text-[#55554f] sm:text-sm">{stat.label}</span><span className={`shrink-0 rounded-xl p-2 ${stat.tone}`}><stat.icon size={18} aria-hidden="true" /></span></div><p className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{stat.value}</p></div>)}</section>

    <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:gap-6">
      <section className="tf-card min-w-0 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Ostatnie projekty</h2><Link className="tf-text-link inline-flex items-center gap-1 text-sm font-medium" href={`/w/${workspaceId}/projects`}>Zobacz wszystkie <ArrowRight size={15} aria-hidden="true" /></Link></div><div className="mt-4 divide-y divide-[var(--border)]">{recent.length ? recent.map((project) => <Link key={project.id} href={`/w/${workspaceId}/projects/${project.id}`} className="flex min-w-0 items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-[var(--muted-surface)]"><div className="min-w-0"><p className="truncate font-medium">{project.name}</p><p className="truncate text-sm text-[var(--muted)]">{project.description || "Bez opisu"}</p></div><span className="shrink-0 rounded-lg bg-[var(--muted-surface)] px-2 py-1 text-xs text-[#55554f]">{project._count.tasks} zadań</span></Link>) : <Empty text="Nie ma jeszcze projektów." />}</div></section>
      <section className="tf-card min-w-0 p-4 sm:p-5"><h2 className="text-lg font-semibold">Najbliższe terminy</h2><div className="mt-4 divide-y divide-[var(--border)]">{upcoming.length ? upcoming.map((task) => <Link key={task.id} href={`/w/${workspaceId}/projects/${task.projectId}?task=${task.id}`} className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-xl px-2 py-3 hover:bg-[var(--muted-surface)]"><div className="min-w-0"><p className="truncate font-medium">{task.title}</p><p className="truncate text-sm text-[var(--muted)]">{task.project.name}</p></div><span className="shrink-0 text-sm text-[#55554f]">{formatDateOnly(task.dueDate)}</span></Link>) : <Empty text="Brak nadchodzących terminów." />}</div></section>
    </div>
  </div>;
}

function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed border-[#d4d4cf] bg-[var(--muted-surface)] p-6 text-center text-sm text-[var(--muted)]">{text}</p>; }
