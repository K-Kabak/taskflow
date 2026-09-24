import Link from "next/link";
import { CheckCircle2, Clock3, FolderKanban, Plus, TriangleAlert } from "lucide-react";
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
  const stats = [{ label: "Aktywne projekty", value: projects, icon: FolderKanban }, { label: "Moje otwarte", value: myOpen, icon: Clock3 }, { label: "Po terminie", value: overdue, icon: TriangleAlert }, { label: "Ukończone", value: done, icon: CheckCircle2 }];
  return <div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-[#7d7d78]">{membership.workspace.name}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Dzień dobry, {membership.user.name.split(" ")[0]}</h1></div>{["OWNER", "ADMIN"].includes(membership.role) && <Link href={`/w/${workspaceId}/projects#new`} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white"><Plus size={18} />Nowy projekt</Link>}</div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-[#ececea] bg-white p-5"><div className="flex items-center justify-between"><span className="text-sm text-[#777772]">{stat.label}</span><span className="rounded-xl bg-orange-50 p-2 text-orange-500"><stat.icon size={18} /></span></div><p className="mt-4 text-3xl font-semibold">{stat.value}</p></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-[#ececea] bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Ostatnie projekty</h2><Link className="text-sm text-orange-600" href={`/w/${workspaceId}/projects`}>Zobacz wszystkie</Link></div><div className="mt-4 space-y-2">{recent.length ? recent.map((project) => <Link key={project.id} href={`/w/${workspaceId}/projects/${project.id}`} className="flex items-center justify-between rounded-xl p-3 hover:bg-[#fafaf8]"><div><p className="font-medium">{project.name}</p><p className="text-sm text-[#848484]">{project.description || "Bez opisu"}</p></div><span className="rounded-lg bg-[#f5f5f2] px-2 py-1 text-xs">{project._count.tasks} zadań</span></Link>) : <Empty text="Nie ma jeszcze projektów." />}</div></section>
    <section className="rounded-2xl border border-[#ececea] bg-white p-5"><h2 className="font-semibold">Najbliższe terminy</h2><div className="mt-4 space-y-2">{upcoming.length ? upcoming.map((task) => <Link key={task.id} href={`/w/${workspaceId}/projects/${task.projectId}?task=${task.id}`} className="flex items-center justify-between rounded-xl p-3 hover:bg-[#fafaf8]"><div><p className="font-medium">{task.title}</p><p className="text-sm text-[#848484]">{task.project.name}</p></div><span className="text-sm text-[#6f6f6b]">{formatDateOnly(task.dueDate)}</span></Link>) : <Empty text="Brak nadchodzących terminów." />}</div></section></div>
  </div>;
}

function Empty({ text }: { text: string }) { return <p className="rounded-xl bg-[#fafaf8] p-5 text-center text-sm text-[#848484]">{text}</p>; }
