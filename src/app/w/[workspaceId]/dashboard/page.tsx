import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { formatDateOnly } from "@/lib/date-only";
import { ProgressMetrics } from "@/components/dashboard/progress-metrics";
import type { StatusCounts } from "@/lib/progress-metrics";

export default async function DashboardPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { session, membership } = await requireWorkspaceMember(workspaceId);
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const [projects, myOpen, overdue, done, recent, upcoming, byStatus, latestActivity] = await Promise.all([
    db.project.count({ where: { workspaceId, archivedAt: null } }),
    db.task.count({
      where: {
        project: { workspaceId, archivedAt: null },
        status: { not: "DONE" },
        assignees: { some: { userId: session.user.id } },
      },
    }),
    db.task.count({
      where: { project: { workspaceId, archivedAt: null }, status: { not: "DONE" }, dueDate: { lt: now } },
    }),
    db.task.count({ where: { project: { workspaceId, archivedAt: null }, status: "DONE" } }),
    db.project.findMany({
      where: { workspaceId, archivedAt: null },
      take: 4,
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { tasks: true } } },
    }),
    db.task.findMany({
      where: { project: { workspaceId, archivedAt: null }, dueDate: { gte: now } },
      take: 6,
      orderBy: { dueDate: "asc" },
      include: { project: true },
    }),
    db.task.groupBy({
      by: ["status"],
      where: { project: { workspaceId, archivedAt: null } },
      _count: { _all: true },
    }),
    db.activity.findFirst({
      where: { workspaceId, project: { workspaceId, archivedAt: null } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  const counts: StatusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  for (const row of byStatus) counts[row.status] = row._count._all;
  const stats = [
    {
      label: "Aktywne projekty",
      value: projects,
      icon: FolderKanban,
      tone: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
    },
    { label: "Moje otwarte", value: myOpen, icon: Clock3, tone: "bg-[var(--info-soft)] text-[var(--info)]" },
    {
      label: "Po terminie",
      value: overdue,
      icon: TriangleAlert,
      tone: "bg-[var(--danger-soft)] text-[var(--danger)]",
    },
    {
      label: "Ukończone",
      value: done,
      icon: CheckCircle2,
      tone: "bg-[var(--success-soft)] text-[var(--success)]",
    },
  ];
  return (
    <div className="tf-page">
      <header className="tf-feature flex flex-wrap items-end justify-between gap-5 px-5 py-6 sm:px-8 sm:py-8">
        <div className="min-w-0">
          <p className="tf-feature-muted mb-3 text-xs font-semibold tracking-wide [overflow-wrap:anywhere]">
            {membership.workspace.name}
          </p>
          <h1 className="tf-page-heading">Dzień dobry, {membership.user.name.split(" ")[0]}</h1>
          <p className="tf-feature-muted mt-3 text-sm leading-relaxed">
            Przegląd aktualnej pracy w Twojej przestrzeni.
          </p>
        </div>
        {["OWNER", "ADMIN"].includes(membership.role) && (
          <Link
            href={`/w/${workspaceId}/projects#new`}
            className="tf-button-primary tf-feature-action inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus size={17} aria-hidden="true" />
            Nowy projekt
          </Link>
        )}
      </header>

      <section
        aria-label="Statystyki przestrzeni"
        className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="tf-card min-w-0 p-3.5 sm:p-5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg sm:size-9 ${stat.tone}`}>
                <stat.icon size={17} aria-hidden="true" />
              </span>
              <span className="text-xs leading-tight font-medium text-[var(--muted)] sm:text-sm">
                {stat.label}
              </span>
            </div>
            <p className="mt-3 text-3xl leading-none font-semibold tracking-tight tabular-nums sm:text-4xl">
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <div className="mt-4 grid items-start gap-4 sm:mt-5 sm:gap-5 xl:grid-cols-[1.15fr_1fr] xl:grid-rows-[auto_1fr]">
        <ProgressMetrics
          title="Postęp przestrzeni"
          counts={counts}
          overdue={overdue}
          lastActivity={latestActivity?.createdAt.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}
        />
        <section className="tf-card min-w-0 p-4 sm:p-5 xl:row-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="tf-section-heading">Najbliższe terminy</h2>
            <Link
              className="tf-text-link inline-flex min-h-10 items-center gap-1 text-sm font-medium"
              href={`/w/${workspaceId}/calendar`}
            >
              Kalendarz <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-2 divide-y divide-[var(--border)]">
            {upcoming.length ? (
              upcoming.map((task) => (
                <Link
                  key={task.id}
                  href={`/w/${workspaceId}/projects/${task.projectId}?task=${task.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-lg px-1.5 py-2.5 hover:bg-[var(--hover)]"
                >
                  <CalendarDays size={17} className="shrink-0 text-[var(--subtle)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{task.title}</p>
                    <p className="truncate text-xs text-[var(--muted)]">{task.project.name}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)] tabular-nums">
                    {formatDateOnly(task.dueDate)}
                  </span>
                </Link>
              ))
            ) : (
              <p className="tf-empty">Brak nadchodzących terminów.</p>
            )}
          </div>
        </section>
        <section className="tf-card min-w-0 p-4 sm:p-5 xl:col-start-1 xl:row-start-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="tf-section-heading">Ostatnie projekty</h2>
            <Link
              className="tf-text-link inline-flex min-h-10 items-center gap-1 text-sm font-medium"
              href={`/w/${workspaceId}/projects`}
            >
              Zobacz wszystkie <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-2 divide-y divide-[var(--border)]">
            {recent.length ? (
              recent.map((project) => (
                <Link
                  key={project.id}
                  href={`/w/${workspaceId}/projects/${project.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-lg px-1.5 py-2.5 hover:bg-[var(--hover)]"
                >
                  <FolderKanban size={17} className="shrink-0 text-[var(--subtle)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{project.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {project.description || "Bez opisu"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--muted)]">{project._count.tasks} zadań</span>
                </Link>
              ))
            ) : (
              <p className="tf-empty">Nie ma jeszcze projektów.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
