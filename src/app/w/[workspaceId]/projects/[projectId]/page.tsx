import { ActionForm } from "@/components/shared/action-form";
import Link from "next/link";
import { Activity, Archive, ChevronLeft, Columns3, Link2, List, Pencil, Users } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireProjectAccess } from "@/lib/permissions";
import { KanbanBoard, type BoardTask } from "@/components/tasks/kanban-board";
import { TaskPanel } from "@/components/tasks/task-panel";
import { Avatar } from "@/components/shared/avatar";
import { formatDateOnly } from "@/lib/date-only";
import { updateProjectAction } from "@/app/actions/domain";
import {
  boardFilterCount,
  boardFilterParams,
  filterBoardTasks,
  parseBoardFilters,
  type BoardFilterQuery,
} from "@/lib/board-filters";
import { BoardFiltersForm } from "@/components/tasks/board-filters";
import { ProgressMetrics } from "@/components/dashboard/progress-metrics";
import { countTaskMetrics } from "@/lib/progress-metrics";

type ProjectTask = Prisma.TaskGetPayload<{
  include: {
    assignees: { include: { user: true } };
    labels: { include: { label: true } };
    checklistItems: { select: { isCompleted: true } };
  };
}>;
type ProjectActivity = Prisma.ActivityGetPayload<{ include: { actor: true; task: true } }>;

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string; projectId: string }>;
  searchParams: Promise<
    {
      view?: string;
      task?: string;
      status?: string;
      priority?: string;
      assignee?: string;
      q?: string;
    } & BoardFilterQuery
  >;
}) {
  const { workspaceId, projectId } = await params;
  const query = await searchParams;
  const { session, membership, project } = await requireProjectAccess(workspaceId, projectId);
  const [tasks, members, labels, activities] = await Promise.all([
    db.task.findMany({
      where: { projectId },
      orderBy: [{ status: "asc" }, { position: "asc" }],
      include: {
        assignees: { include: { user: true } },
        labels: { include: { label: true } },
        checklistItems: { select: { isCompleted: true } },
      },
    }),
    db.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    }),
    db.label.findMany({ where: { workspaceId }, orderBy: { name: "asc" } }),
    db.activity.findMany({
      where: { projectId },
      take: 50,
      orderBy: { createdAt: "desc" },
      include: { actor: true, task: true },
    }),
  ]);
  const selectedTask = query.task
    ? await db.task.findFirst({
        where: { id: query.task, projectId },
        include: {
          assignees: true,
          labels: true,
          checklistItems: { orderBy: [{ position: "asc" }, { id: "asc" }] },
          comments: { include: { author: true }, orderBy: { createdAt: "desc" } },
          links: { orderBy: { createdAt: "desc" } },
          activities: { include: { actor: true }, orderBy: { createdAt: "desc" }, take: 20 },
        },
      })
    : null;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const taskMetrics = countTaskMetrics(tasks, today);
  const boardTasks: BoardTask[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate?.toISOString() || null,
    checklist: {
      completed: task.checklistItems.filter((item) => item.isCompleted).length,
      total: task.checklistItems.length,
    },
    assignees: task.assignees.map((a) => ({ id: a.user.id, name: a.user.name, color: a.user.avatarColor })),
    labels: task.labels.map((l) => ({ id: l.label.id, name: l.label.name, color: l.label.color })),
  }));
  const boardFilters = parseBoardFilters(query);
  const activeBoardFilters = boardFilterCount(boardFilters);
  const boardFilterQuery = boardFilterParams(boardFilters).toString();
  const visibleBoardTasks = filterBoardTasks(boardTasks, boardFilters, new Date().toISOString().slice(0, 10));
  const view = ["list", "activity", "links"].includes(query.view || "") ? query.view! : "board";
  const filteredTasks = tasks.filter(
    (task) =>
      (!query.status || task.status === query.status) &&
      (!query.priority || task.priority === query.priority) &&
      (!query.assignee || task.assignees.some((item) => item.userId === query.assignee)) &&
      (!query.q || task.title.toLocaleLowerCase("pl").includes(query.q.toLocaleLowerCase("pl"))),
  );
  const tabs = [
    { id: "board", label: "Tablica", icon: Columns3 },
    { id: "list", label: "Lista", icon: List },
    { id: "activity", label: "Aktywność", icon: Activity },
    { id: "links", label: "Linki", icon: Link2 },
  ];
  return (
    <div className="tf-page">
      <Link
        href={`/w/${workspaceId}/projects`}
        className="tf-text-link mb-2 inline-flex min-h-8 items-center gap-1.5 text-sm font-medium"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Projekty
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex items-center gap-2">
            {project.archivedAt && (
              <span className="flex items-center gap-1 rounded-lg bg-[var(--muted-surface)] px-2 py-1 text-xs">
                <Archive size={12} />
                Archiwum
              </span>
            )}
          </div>
          <h1 className="tf-page-heading">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)] [overflow-wrap:anywhere]">
            {project.description || "Projekt bez opisu"}
          </p>
          {["OWNER", "ADMIN"].includes(membership.role) && !project.archivedAt && (
            <details className="mt-3">
              <summary className="tf-text-link inline-flex min-h-9 cursor-pointer list-none items-center gap-2 text-sm font-medium">
                <Pencil size={14} aria-hidden="true" />
                Edytuj projekt
              </summary>
              <ActionForm
                action={updateProjectAction.bind(null, workspaceId, projectId)}
                className="tf-card mt-2 grid max-w-xl gap-3 p-4"
              >
                <label className="text-sm font-medium">
                  Nazwa projektu
                  <input
                    required
                    minLength={2}
                    maxLength={80}
                    name="name"
                    defaultValue={project.name}
                    className="tf-input mt-1 w-full"
                  />
                </label>
                <label className="text-sm font-medium">
                  Opis projektu
                  <textarea
                    name="description"
                    defaultValue={project.description || ""}
                    maxLength={10000}
                    rows={2}
                    className="tf-input mt-1 w-full"
                  />
                </label>
                <button className="tf-button-primary min-h-11 justify-self-start px-4 text-sm">Zapisz</button>
              </ActionForm>
            </details>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((member) => (
              <Avatar key={member.userId} name={member.user.name} color={member.user.avatarColor} />
            ))}
            {members.length > 4 && (
              <span className="grid size-9 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--muted-surface)] text-xs">
                +{members.length - 4}
              </span>
            )}
          </div>
          {["OWNER", "ADMIN"].includes(membership.role) && (
            <Link
              href={`/w/${workspaceId}/team`}
              className="tf-button-secondary flex min-h-11 items-center gap-2 px-3 text-sm"
            >
              <Users size={16} />
              Zaproś
            </Link>
          )}
        </div>
      </header>
      <div className="mt-5">
        <ProgressMetrics
          title="Postęp projektu"
          collapsible
          counts={taskMetrics.counts}
          overdue={taskMetrics.overdue}
          lastActivity={activities[0]?.createdAt.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}
        />
      </div>
      <nav
        aria-label="Widoki projektu"
        className="mt-4 grid grid-cols-4 border-b border-[var(--border)] sm:flex sm:flex-wrap sm:gap-x-1"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/w/${workspaceId}/projects/${projectId}?view=${tab.id}`}
            aria-current={view === tab.id ? "page" : undefined}
            className={`flex min-h-11 min-w-0 items-center justify-center gap-1 border-b-2 px-0.5 py-2 text-xs font-medium sm:gap-2 sm:px-4 sm:text-sm ${view === tab.id ? "border-[var(--accent)] text-[var(--accent-ink)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            <tab.icon size={16} className="hidden shrink-0 min-[370px]:block" aria-hidden="true" />
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className="mt-4">
        {view === "board" && (
          <>
            <BoardFiltersForm
              projectPath={`/w/${workspaceId}/projects/${projectId}`}
              filters={boardFilters}
              members={members.map((member) => ({ userId: member.userId, name: member.user.name }))}
              labels={labels}
              resultCount={visibleBoardTasks.length}
              totalCount={boardTasks.length}
            />
            <div className="tf-board-scroll">
              <KanbanBoard
                workspaceId={workspaceId}
                projectId={projectId}
                initialTasks={visibleBoardTasks}
                readOnly={Boolean(project.archivedAt)}
                filtersActive={activeBoardFilters > 0}
                filterQuery={boardFilterQuery}
              />
            </div>
          </>
        )}
        {view === "list" && (
          <>
            <form className="tf-card mb-4 grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))_auto]">
              <input type="hidden" name="view" value="list" />
              <label className="sr-only" htmlFor="task-list-query">
                Szukaj po tytule
              </label>
              <input
                id="task-list-query"
                name="q"
                defaultValue={query.q}
                placeholder="Szukaj po tytule"
                className="tf-input text-sm"
              />
              <label className="sr-only" htmlFor="task-list-status">
                Status
              </label>
              <select
                id="task-list-status"
                name="status"
                defaultValue={query.status || ""}
                className="tf-input text-sm"
              >
                <option value="">Każdy status</option>
                <option value="TODO">Do zrobienia</option>
                <option value="IN_PROGRESS">W trakcie</option>
                <option value="DONE">Ukończone</option>
              </select>
              <label className="sr-only" htmlFor="task-list-priority">
                Priorytet
              </label>
              <select
                id="task-list-priority"
                name="priority"
                defaultValue={query.priority || ""}
                className="tf-input text-sm"
              >
                <option value="">Każdy priorytet</option>
                <option value="LOW">Niski</option>
                <option value="MEDIUM">Średni</option>
                <option value="HIGH">Wysoki</option>
                <option value="URGENT">Pilny</option>
              </select>
              <label className="sr-only" htmlFor="task-list-assignee">
                Przypisany
              </label>
              <select
                id="task-list-assignee"
                name="assignee"
                defaultValue={query.assignee || ""}
                className="tf-input text-sm"
              >
                <option value="">Każdy przypisany</option>
                {members.map((item) => (
                  <option key={item.userId} value={item.userId}>
                    {item.user.name}
                  </option>
                ))}
              </select>
              <button className="tf-button-primary min-h-11 px-4 text-sm">Filtruj</button>
            </form>
            <TaskList tasks={filteredTasks} workspaceId={workspaceId} projectId={projectId} query={query} />
          </>
        )}
        {view === "activity" && <ActivityFeed activities={activities} />}
        {view === "links" && <ProjectLinks projectId={projectId} workspaceId={workspaceId} />}
      </div>
      {selectedTask && (
        <TaskPanel
          workspaceId={workspaceId}
          projectId={projectId}
          view={view}
          boardFilterQuery={boardFilterQuery}
          searchParams={query}
          task={selectedTask}
          members={members}
          labels={labels}
          currentUserId={session.user.id}
          role={membership.role}
          readOnly={Boolean(project.archivedAt)}
        />
      )}
    </div>
  );
}

function TaskList({
  tasks,
  workspaceId,
  projectId,
  query,
}: {
  tasks: ProjectTask[];
  workspaceId: string;
  projectId: string;
  query: { status?: string; priority?: string; assignee?: string; q?: string };
}) {
  const href = (taskId: string) => {
    const params = new URLSearchParams({ view: "list", task: taskId });
    for (const key of ["status", "priority", "assignee", "q"] as const)
      if (query[key]) params.set(key, query[key]);
    return `/w/${workspaceId}/projects/${projectId}?${params}`;
  };
  return (
    <div className="tf-card overflow-hidden">
      <table className="hidden w-full table-fixed text-left text-sm lg:table">
        <thead className="bg-[var(--muted-surface)] text-[var(--muted)]">
          <tr>
            <th className="w-[35%] p-4">Zadanie</th>
            <th className="p-2">Status</th>
            <th className="p-2">Priorytet</th>
            <th className="p-2">Termin</th>
            <th className="p-2 pr-4">Przypisani</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-[var(--border)] hover:bg-[var(--hover)]">
              <td className="p-4 font-medium [overflow-wrap:anywhere]">
                <Link className="tf-text-link" href={href(task.id)}>
                  {task.title}
                </Link>
              </td>
              <td className="p-2">
                <span data-status={task.status} className="tf-status tf-status-badge">
                  {statusLabel(task.status)}
                </span>
              </td>
              <td className="p-2">{priorityLabel(task.priority)}</td>
              <td className="p-2">{formatDateOnly(task.dueDate)}</td>
              <td className="p-2 pr-4 [overflow-wrap:anywhere]">
                {task.assignees.map((a) => a.user.name).join(", ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="divide-y divide-[var(--border)] lg:hidden">
        {tasks.map((task) => (
          <Link key={task.id} href={href(task.id)} className="block p-4 hover:bg-[var(--muted-surface)]">
            <span className="font-semibold [overflow-wrap:anywhere]">{task.title}</span>
            <span className="mt-2 block text-sm text-[var(--muted)]">
              {statusLabel(task.status)} · {priorityLabel(task.priority)} · {formatDateOnly(task.dueDate)}
            </span>
            <span className="mt-1 block text-xs text-[var(--muted)] [overflow-wrap:anywhere]">
              {task.assignees.map((a) => a.user.name).join(", ") || "Bez przypisania"}
            </span>
          </Link>
        ))}
      </div>
      {!tasks.length && (
        <p className="p-10 text-center text-[var(--muted)]">Brak zadań pasujących do wybranych kryteriów.</p>
      )}
    </div>
  );
}
function ActivityFeed({ activities }: { activities: ProjectActivity[] }) {
  return (
    <div className="tf-card max-w-3xl px-4 sm:px-5">
      {activities.map((item) => (
        <div key={item.id} className="flex gap-4 border-b border-[var(--border)] py-4 last:border-0">
          <Avatar name={item.actor.name} color={item.actor.avatarColor} />
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <p className="text-sm">
              <strong>{item.actor.name}</strong> · {item.action.toLowerCase().replaceAll("_", " ")}
            </p>
            {item.task && <p className="mt-1 text-sm text-[var(--muted)]">{item.task.title}</p>}
            <time className="mt-1 block text-xs text-[var(--subtle)]">
              {item.createdAt.toLocaleString("pl-PL")}
            </time>
          </div>
        </div>
      ))}
      {!activities.length && (
        <p className="py-8 text-center text-[var(--subtle)]">Aktywność pojawi się po pierwszej zmianie.</p>
      )}
    </div>
  );
}
async function ProjectLinks({ projectId, workspaceId }: { projectId: string; workspaceId: string }) {
  const links = await db.taskLink.findMany({
    where: { task: { projectId } },
    include: { task: true, createdBy: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="tf-card max-w-4xl px-4 sm:px-5">
      {links.map((link) => (
        <div
          key={link.id}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] py-4 last:border-0"
        >
          <div className="min-w-0 [overflow-wrap:anywhere]">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--accent-ink)]"
            >
              {link.title}
            </a>
            <p className="text-sm text-[var(--muted)]">
              {link.task.title} · {link.createdBy.name}
            </p>
          </div>
          <Link className="text-sm" href={`/w/${workspaceId}/projects/${projectId}?task=${link.taskId}`}>
            Otwórz zadanie
          </Link>
        </div>
      ))}
      {!links.length && <p className="py-8 text-center text-[var(--subtle)]">Brak linków w projekcie.</p>}
    </div>
  );
}
function statusLabel(value: string) {
  return value === "TODO" ? "Do zrobienia" : value === "IN_PROGRESS" ? "W trakcie" : "Ukończone";
}
function priorityLabel(value: string) {
  return ({ LOW: "Niski", MEDIUM: "Średni", HIGH: "Wysoki", URGENT: "Pilny" } as Record<string, string>)[
    value
  ];
}
