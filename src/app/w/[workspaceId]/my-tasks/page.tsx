import Link from "next/link";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { formatDateOnly } from "@/lib/date-only";

export default async function MyTasksPage({ params, searchParams }: { params: Promise<{ workspaceId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { workspaceId } = await params; const query = await searchParams; const { session } = await requireWorkspaceMember(workspaceId);
  const status = ["TODO", "IN_PROGRESS", "DONE"].includes(query.status || "") ? query.status as "TODO" | "IN_PROGRESS" | "DONE" : undefined;
  const tasks = await db.task.findMany({ where: { project: { workspaceId, archivedAt: null }, assignees: { some: { userId: session.user.id } }, ...(status ? { status } : {}) }, include: { project: true }, orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }] });
  return <div className="mx-auto max-w-5xl"><h1 className="text-3xl font-semibold tracking-tight">Moje zadania</h1><p className="mt-2 text-[#777772]">Zadania przypisane do Ciebie w tej przestrzeni.</p><div className="mt-6 flex gap-2">{[["","Wszystkie"],["TODO","Do zrobienia"],["IN_PROGRESS","W trakcie"],["DONE","Ukończone"]].map(([id,label]) => <Link key={id} href={`?status=${id}`} className={`rounded-xl px-3 py-2 text-sm ${status === (id || undefined) ? "bg-orange-500 text-white" : "bg-white"}`}>{label}</Link>)}</div><div className="mt-5 space-y-3">{tasks.map((task) => <Link key={task.id} href={`/w/${workspaceId}/projects/${task.projectId}?task=${task.id}`} className="grid gap-2 rounded-2xl border border-[#ececea] bg-white p-4 hover:shadow-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold">{task.title}</p><p className="text-sm text-[#777772]">{task.project.name}</p></div><span className="text-sm">{statusLabel(task.status)}</span><span className="text-sm text-[#777772]">{formatDateOnly(task.dueDate)}</span></Link>)}{!tasks.length && <p className="rounded-2xl border border-dashed border-[#dcdcd7] p-10 text-center text-[#858580]">Nie masz zadań w tym widoku.</p>}</div></div>;
}
function statusLabel(value: string) { return value === "TODO" ? "Do zrobienia" : value === "IN_PROGRESS" ? "W trakcie" : "Ukończone"; }
