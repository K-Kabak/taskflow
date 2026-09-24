import Link from "next/link";
import { Archive, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { NewProjectForm } from "@/components/projects/new-project-form";
import { setProjectArchivedAction } from "@/app/actions/domain";
import { ConfirmSubmit } from "@/components/shared/confirm-submit";

export default async function ProjectsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { membership } = await requireWorkspaceMember(workspaceId);
  const projects = await db.project.findMany({ where: { workspaceId }, orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }], include: { tasks: { select: { status: true } } } });
  const canManage = ["OWNER", "ADMIN"].includes(membership.role);
  const active = projects.filter((p) => !p.archivedAt); const archived = projects.filter((p) => p.archivedAt);
  return <div className="mx-auto max-w-6xl"><div><p className="text-sm text-[#7d7d78]">Przestrzeń robocza</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Projekty</h1><p className="mt-2 text-[#777772]">Wszystkie inicjatywy zespołu w jednym miejscu.</p></div>{canManage && <div id="new" className="mt-7"><NewProjectForm workspaceId={workspaceId} /></div>}<ProjectGrid title="Aktywne" projects={active} workspaceId={workspaceId} canManage={canManage} /><ProjectGrid title="Archiwum" projects={archived} workspaceId={workspaceId} canManage={canManage} archived /></div>;
}

type ProjectCard = { id: string; name: string; description: string | null; archivedAt: Date | null; tasks: { status: string }[] };

function ProjectGrid({ title, projects, workspaceId, canManage, archived = false }: { title: string; projects: ProjectCard[]; workspaceId: string; canManage: boolean; archived?: boolean }) {
  if (!projects.length && archived) return null;
  return <section className="mt-8"><h2 className="mb-4 text-lg font-semibold">{title} <span className="ml-1 text-sm font-normal text-[#898984]">{projects.length}</span></h2>{projects.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.map((project) => {
    const done = project.tasks.filter((task) => task.status === "DONE").length;
    const progress = project.tasks.length ? Math.round((done / project.tasks.length) * 100) : 0;
    return <article key={project.id} className="rounded-2xl border border-[#ececea] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"><Link href={`/w/${workspaceId}/projects/${project.id}`}><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{project.name}</h3><p className="mt-1 line-clamp-2 text-sm text-[#7d7d78]">{project.description || "Bez opisu"}</p></div>{archived && <span className="rounded-lg bg-[#f2f2ef] px-2 py-1 text-xs">Archiwum</span>}</div><div className="mt-6"><div className="mb-2 flex justify-between text-xs text-[#7d7d78]"><span>{project.tasks.length} zadań</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#eeeeca]"><div className="h-full rounded-full bg-orange-500" style={{ width: `${progress}%` }} /></div></div></Link>{canManage && <form action={setProjectArchivedAction.bind(null, workspaceId, project.id, !archived)} className="mt-5 border-t border-[#f0f0ed] pt-4"><ConfirmSubmit message={archived ? "Przywrócić projekt?" : "Zarchiwizować projekt? Do czasu przywrócenia będzie tylko do odczytu."} className="flex items-center gap-2 text-sm text-[#6f6f6b] hover:text-orange-600">{archived ? <RotateCcw size={15} /> : <Archive size={15} />}{archived ? "Przywróć" : "Archiwizuj"}</ConfirmSubmit></form>}</article>;
  })}</div> : <div className="rounded-2xl border border-dashed border-[#dcdcd7] p-10 text-center text-[#858580]">Nie ma jeszcze aktywnych projektów.</div>}</section>;
}
