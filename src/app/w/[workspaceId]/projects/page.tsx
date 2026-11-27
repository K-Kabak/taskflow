import Link from "next/link";
import { Archive, ArrowUpRight, FolderKanban, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { NewProjectForm } from "@/components/projects/new-project-form";
import { setProjectArchivedAction } from "@/app/actions/domain";
import { PageHeader } from "@/components/shared/page-header";
import { ConfirmSubmit } from "@/components/shared/confirm-submit";

export default async function ProjectsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { membership } = await requireWorkspaceMember(workspaceId);
  const projects = await db.project.findMany({
    where: { workspaceId },
    orderBy: [{ archivedAt: "asc" }, { updatedAt: "desc" }],
    include: { tasks: { select: { status: true } } },
  });
  const canManage = ["OWNER", "ADMIN"].includes(membership.role);
  const active = projects.filter((p) => !p.archivedAt);
  const archived = projects.filter((p) => p.archivedAt);
  return (
    <div className="tf-page">
      <PageHeader title="Projekty" description="Aktywne i zarchiwizowane projekty zespołu." />
      {canManage && (
        <div id="new" className="scroll-mt-4">
          <NewProjectForm workspaceId={workspaceId} />
        </div>
      )}
      <ProjectGrid title="Aktywne" projects={active} workspaceId={workspaceId} canManage={canManage} />
      <ProjectGrid
        title="Archiwum"
        projects={archived}
        workspaceId={workspaceId}
        canManage={canManage}
        archived
      />
    </div>
  );
}

type ProjectCard = {
  id: string;
  name: string;
  description: string | null;
  archivedAt: Date | null;
  tasks: { status: string }[];
};

function ProjectGrid({
  title,
  projects,
  workspaceId,
  canManage,
  archived = false,
}: {
  title: string;
  projects: ProjectCard[];
  workspaceId: string;
  canManage: boolean;
  archived?: boolean;
}) {
  if (!projects.length && archived) return null;
  return (
    <section className="mt-8">
      <h2 className="tf-section-heading mb-3">
        {title} <span className="ml-1 text-sm font-normal text-[var(--subtle)]">{projects.length}</span>
      </h2>
      {projects.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => {
            const done = project.tasks.filter((task) => task.status === "DONE").length;
            const progress = project.tasks.length ? Math.round((done / project.tasks.length) * 100) : 0;
            return (
              <article key={project.id} className="tf-card flex min-w-0 flex-col p-4 sm:p-5">
                <Link
                  href={`/w/${workspaceId}/projects/${project.id}`}
                  className="group block flex-1 rounded-lg"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="grid size-9 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                      <FolderKanban size={18} aria-hidden="true" />
                    </span>
                    <ArrowUpRight
                      size={17}
                      className="text-[var(--subtle)] group-hover:text-[var(--accent-ink)]"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold [overflow-wrap:anywhere] group-hover:text-[var(--accent-ink)]">
                        {project.name}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm [overflow-wrap:anywhere] text-[var(--muted)]">
                        {project.description || "Bez opisu"}
                      </p>
                    </div>
                    {archived && (
                      <span className="rounded-lg bg-[var(--muted-surface)] px-2 py-1 text-xs">Archiwum</span>
                    )}
                  </div>
                  <div className="mt-6">
                    <div className="mb-2 flex justify-between text-xs text-[var(--muted)]">
                      <span>{project.tasks.length} zadań</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[var(--muted-surface)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
                {canManage && (
                  <form
                    action={setProjectArchivedAction.bind(null, workspaceId, project.id, !archived)}
                    className="mt-4 border-t border-[var(--border)] pt-2"
                  >
                    <ConfirmSubmit
                      message={
                        archived
                          ? "Przywrócić projekt?"
                          : "Zarchiwizować projekt? Do czasu przywrócenia będzie tylko do odczytu."
                      }
                      className="flex min-h-10 items-center gap-2 rounded-md text-sm text-[var(--muted)] hover:text-[var(--accent-ink)]"
                    >
                      {archived ? <RotateCcw size={15} /> : <Archive size={15} />}
                      {archived ? "Przywróć" : "Archiwizuj"}
                    </ConfirmSubmit>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="tf-empty">Nie ma jeszcze aktywnych projektów.</div>
      )}
    </section>
  );
}
