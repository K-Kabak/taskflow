"use client";

import { ActionForm } from "@/components/shared/action-form";
/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and transform state during render by design. */

import { useEffect, useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { CalendarDays, GripVertical, ListChecks, Plus } from "lucide-react";
import { createTaskAction, moveTaskAction } from "@/app/actions/domain";
import { formatDateOnly } from "@/lib/date-only";
import { textColorForBackground } from "@/lib/utils";

export type BoardTask = {
  id: string;
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  checklist: { completed: number; total: number };
  assignees: { id: string; name: string; color: string }[];
  labels: { id: string; name: string; color: string }[];
};
const columns = [
  { id: "TODO" as const, title: "Do zrobienia" },
  { id: "IN_PROGRESS" as const, title: "W trakcie" },
  { id: "DONE" as const, title: "Ukończone" },
];
const priorities = { LOW: "Niski", MEDIUM: "Średni", HIGH: "Wysoki", URGENT: "Pilny" };

export function KanbanBoard({
  workspaceId,
  projectId,
  initialTasks,
  readOnly = false,
  filtersActive = false,
  filterQuery = "",
}: {
  workspaceId: string;
  projectId: string;
  initialTasks: BoardTask[];
  readOnly?: boolean;
  filtersActive?: boolean;
  filterQuery?: string;
}) {
  const [optimisticTasks, setOptimisticTasks] = useState<BoardTask[] | null>(null);
  const [saving, setSaving] = useState(false);
  const tasks = optimisticTasks ?? initialTasks;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [message]);
  const activeTask = tasks.find((task) => task.id === activeId);
  const grouped = useMemo(
    () =>
      Object.fromEntries(
        columns.map((column) => [column.id, tasks.filter((task) => task.status === column.id)]),
      ) as Record<BoardTask["status"], BoardTask[]>,
    [tasks],
  );

  function onStart(event: DragStartEvent) {
    if (!readOnly && !filtersActive && !saving) setActiveId(String(event.active.id));
  }
  async function onEnd(event: DragEndEvent) {
    setActiveId(null);
    if (!event.over || readOnly || filtersActive || saving) return;
    const moving = tasks.find((task) => task.id === event.active.id);
    if (!moving) return;
    const overTask = tasks.find((task) => task.id === event.over?.id);
    if (overTask?.id === moving.id) return;
    const targetStatus = (overTask?.status || event.over.id) as BoardTask["status"];
    if (!columns.some((column) => column.id === targetStatus)) return;
    const targetItems = grouped[targetStatus].filter((task) => task.id !== moving.id);
    const targetIndex = overTask
      ? targetItems.findIndex((task) => task.id === overTask.id)
      : targetItems.length;
    if (targetIndex < 0) return;
    let next = tasks.filter((task) => task.id !== moving.id);
    const insertAt = next.findIndex(
      (task) => task.status === targetStatus && task.id === targetItems[targetIndex]?.id,
    );
    const updated = { ...moving, status: targetStatus };
    if (insertAt === -1) next = [...next, updated];
    else next.splice(insertAt, 0, updated);
    setOptimisticTasks(next);
    setMessage(null);
    setSaving(true);
    try {
      const result = await moveTaskAction(workspaceId, {
        taskId: moving.id,
        targetStatus,
        targetIndex,
        expectedSourceIds: grouped[moving.status].map((task) => task.id),
        expectedTargetIds: grouped[targetStatus].map((task) => task.id),
      });
      if (!result.ok) setMessage({ text: result.message, error: true });
      else setMessage({ text: "Zadanie przeniesione.", error: false });
    } catch {
      setMessage({ text: "Nie udało się zapisać kolejności. Przywrócono poprzedni układ.", error: true });
    } finally {
      setOptimisticTasks(null);
      setSaving(false);
    }
  }

  return (
    <>
      <DndContext
        id={`kanban-${projectId}`}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onStart}
        onDragEnd={onEnd}
      >
        <div className="tf-board-grid">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={grouped[column.id]}
              workspaceId={workspaceId}
              projectId={projectId}
              readOnly={readOnly || saving}
              dragDisabled={filtersActive || saving}
              filtersActive={filtersActive}
              filterQuery={filterQuery}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              workspaceId={workspaceId}
              projectId={projectId}
              filterQuery={filterQuery}
              overlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {message && (
        <p
          role={message.error ? "alert" : "status"}
          className={`fixed right-5 bottom-5 z-50 rounded-xl px-4 py-3 text-sm shadow-xl ${message.error ? "bg-[var(--danger)] text-[var(--background)]" : "bg-[var(--foreground)] text-[var(--background)]"}`}
        >
          {message.text}
        </p>
      )}
    </>
  );
}

function KanbanColumn({
  column,
  tasks,
  workspaceId,
  projectId,
  readOnly,
  dragDisabled,
  filtersActive,
  filterQuery,
}: {
  column: (typeof columns)[number];
  tasks: BoardTask[];
  workspaceId: string;
  projectId: string;
  readOnly: boolean;
  dragDisabled: boolean;
  filtersActive: boolean;
  filterQuery: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section
      ref={setNodeRef}
      aria-label={column.title}
      data-status={column.id}
      className={`tf-status tf-board-column rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--column)] p-2.5 transition sm:p-3 ${isOver ? "ring-2 ring-inset ring-[var(--accent)]" : ""}`}
    >
      <header className="flex items-center gap-2 px-2 py-2">
        <span className="tf-status-dot" aria-hidden="true" />
        <h2 className="text-sm font-semibold">{column.title}</h2>
        <span
          aria-label={`${tasks.length} zadań`}
          className="ml-auto grid min-h-6 min-w-6 place-items-center rounded-md bg-[var(--surface)] px-1.5 text-xs font-semibold text-[var(--muted)] tabular-nums"
        >
          {tasks.length}
        </span>
      </header>
      {!readOnly && (
        <details className="mt-1">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--accent-ink)] hover:bg-[var(--hover)]">
            <Plus size={16} aria-hidden="true" />
            Dodaj zadanie
          </summary>
          <ActionForm
            action={createTaskAction.bind(null, workspaceId, projectId, column.id)}
            resetOnSuccess
            successMessage="Dodano zadanie."
            className="tf-card my-2 grid grid-cols-1 gap-2 p-3"
          >
            <label className="block text-xs font-medium">
              Tytuł zadania
              <input
                required
                maxLength={160}
                name="title"
                placeholder="Tytuł zadania"
                className="tf-input mt-1 w-full text-sm"
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-24 flex-1 text-xs font-medium">
                Priorytet
                <select name="priority" className="tf-input mt-1 w-full text-sm">
                  <option value="MEDIUM">Średni</option>
                  <option value="LOW">Niski</option>
                  <option value="HIGH">Wysoki</option>
                  <option value="URGENT">Pilny</option>
                </select>
              </label>
              <button className="tf-button-primary min-h-10 px-3 text-sm">Dodaj</button>
            </div>
          </ActionForm>
        </details>
      )}
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-2 min-h-28 space-y-2.5">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              workspaceId={workspaceId}
              projectId={projectId}
              disabled={readOnly || dragDisabled}
              filterQuery={filterQuery}
            />
          ))}
          {!tasks.length && (
            <p className="tf-empty border-[var(--border-strong)] bg-transparent px-3 py-6">
              {filtersActive ? "Brak pasujących zadań." : "Brak zadań w tej kolumnie."}
            </p>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function SortableTaskCard({
  task,
  workspaceId,
  projectId,
  disabled,
  filterQuery,
}: {
  task: BoardTask;
  workspaceId: string;
  projectId: string;
  disabled: boolean;
  filterQuery: string;
}) {
  const sortable = useSortable({ id: task.id, disabled });
  return (
    <div
      ref={sortable.setNodeRef}
      style={{
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.3 : 1,
      }}
    >
      <TaskCard
        task={task}
        workspaceId={workspaceId}
        projectId={projectId}
        filterQuery={filterQuery}
        dragProps={disabled ? undefined : { ...sortable.attributes, ...sortable.listeners }}
      />
    </div>
  );
}

function TaskCard({
  task,
  workspaceId,
  projectId,
  filterQuery,
  overlay,
  dragProps,
}: {
  task: BoardTask;
  workspaceId: string;
  projectId: string;
  filterQuery: string;
  overlay?: boolean;
  dragProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const priorityClass =
    task.priority === "URGENT"
      ? "text-[var(--danger)] bg-[var(--danger-soft)]"
      : task.priority === "HIGH"
        ? "text-[var(--accent-ink)] bg-[var(--accent-soft)]"
        : "text-[var(--muted)] bg-[var(--muted-surface)]";
  return (
    <article
      className={`tf-card min-w-0 rounded-xl p-3.5 transition-colors ${overlay ? "rotate-2 shadow-xl" : "hover:border-[var(--border-strong)]"}`}
    >
      <div className="flex items-start justify-between gap-1">
        <Link
          href={`/w/${workspaceId}/projects/${projectId}?task=${task.id}${filterQuery ? `&${filterQuery}` : ""}`}
          className="min-w-0 py-1 font-semibold leading-snug [overflow-wrap:anywhere] hover:text-[var(--accent-ink)]"
        >
          {task.title}
        </Link>
        {dragProps && (
          <button
            {...dragProps}
            type="button"
            aria-label={`Przenieś zadanie ${task.title}`}
            className="tf-icon-button -mt-1 -mr-1 min-h-9 min-w-9 shrink-0 touch-none cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {task.labels.slice(0, 2).map((label) => (
          <span
            key={label.id}
            className="max-w-full rounded-md border border-[var(--border)] px-1.5 py-0.5 text-xs [overflow-wrap:anywhere]"
            title={label.name}
          >
            <span
              className="mr-1 inline-block size-1.5 rounded-full"
              style={{ backgroundColor: label.color }}
            />
            {label.name}
          </span>
        ))}
        <span className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${priorityClass}`}>
          Priorytet: {priorities[task.priority]}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-t border-[var(--border)] pt-2.5">
        <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <CalendarDays size={13} aria-hidden="true" />
          {formatDateOnly(task.dueDate)}
        </span>
        <div className="flex items-center gap-2">
          {task.checklist.total > 0 && (
            <span
              aria-label={`Checklista: ${task.checklist.completed} z ${task.checklist.total} ukończonych`}
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)]"
            >
              <ListChecks size={14} aria-hidden="true" />
              {task.checklist.completed}/{task.checklist.total}
            </span>
          )}
          {task.assignees.length ? (
            <div
              className="flex -space-x-1.5"
              aria-label={`Przypisani: ${task.assignees.map((person) => person.name).join(", ")}`}
            >
              {task.assignees.slice(0, 3).map((person) => (
                <span
                  title={person.name}
                  key={person.id}
                  className="grid size-6 place-items-center rounded-full border-2 border-[var(--surface)] text-[9px] font-semibold"
                  style={{ backgroundColor: person.color, color: textColorForBackground(person.color) }}
                >
                  {person.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
              ))}
              {task.assignees.length > 3 && (
                <span className="grid size-6 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--muted-surface)] text-[10px]">
                  +{task.assignees.length - 3}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-[var(--muted)]">Bez przypisania</span>
          )}
        </div>
      </div>
    </article>
  );
}
