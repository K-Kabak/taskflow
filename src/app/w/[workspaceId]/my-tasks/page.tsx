import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { formatDateOnly } from "@/lib/date-only";
import { PageHeader } from "@/components/shared/page-header";

const statuses = {
  TODO: "Do zrobienia",
  IN_PROGRESS: "W trakcie",
  DONE: "Ukończone",
} as const;

export default async function MyTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { workspaceId } = await params;
  const query = await searchParams;
  const { session } = await requireWorkspaceMember(workspaceId);
  const status = Object.hasOwn(statuses, query.status ?? "")
    ? (query.status as keyof typeof statuses)
    : undefined;
  const tasks = await db.task.findMany({
    where: {
      project: { workspaceId, archivedAt: null },
      assignees: { some: { userId: session.user.id } },
      ...(status ? { status } : {}),
    },
    include: { project: true },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { updatedAt: "desc" }],
  });

  return (
    <div className="tf-page">
      <PageHeader title="Moje zadania" description="Zadania przypisane do Ciebie w tej przestrzeni." />
      <nav aria-label="Status moich zadań" className="mb-4 flex flex-wrap gap-1.5">
        {[["", "Wszystkie"], ...Object.entries(statuses)].map(([id, label]) => {
          const selected = status === (id || undefined);
          return (
            <Link
              key={id}
              href={`?status=${id}`}
              aria-current={selected ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-[var(--radius-control)] px-3 text-sm font-medium ${selected ? "bg-[var(--selected)] text-[var(--accent-ink)]" : "text-[var(--muted)] hover:bg-[var(--hover)]"}`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {tasks.length ? (
        <ul className="tf-card divide-y divide-[var(--border)]">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`/w/${workspaceId}/projects/${task.projectId}?task=${task.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-lg px-4 py-3 hover:bg-[var(--hover)] sm:grid-cols-[minmax(0,1fr)_9rem_7rem_auto]"
              >
                <div className="col-span-2 min-w-0 sm:col-span-1">
                  <p className="font-semibold [overflow-wrap:anywhere]">{task.title}</p>
                  <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{task.project.name}</p>
                </div>
                <span data-status={task.status} className="tf-status tf-status-badge">
                  <span className="tf-status-dot" aria-hidden="true" />
                  {statuses[task.status]}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                  <CalendarDays size={14} aria-hidden="true" />
                  {formatDateOnly(task.dueDate)}
                </span>
                <ChevronRight size={17} className="hidden text-[var(--subtle)] sm:block" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="tf-empty">Nie masz zadań w tym widoku.</p>
      )}
    </div>
  );
}
