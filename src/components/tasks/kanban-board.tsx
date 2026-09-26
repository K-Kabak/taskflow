"use client";

import { ActionForm } from "@/components/shared/action-form";
/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and transform state during render by design. */

import { useEffect, useMemo, useState } from "react";
import { closestCorners, DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { CalendarDays, GripVertical, ListChecks, Plus } from "lucide-react";
import { createTaskAction, moveTaskAction } from "@/app/actions/domain";
import { formatDateOnly } from "@/lib/date-only";

export type BoardTask = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE"; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; dueDate: string | null; checklist: { completed: number; total: number }; assignees: { id: string; name: string; color: string }[]; labels: { id: string; name: string; color: string }[] };
const columns = [{ id: "TODO" as const, title: "Do zrobienia" }, { id: "IN_PROGRESS" as const, title: "W trakcie" }, { id: "DONE" as const, title: "Ukończone" }];
const priorities = { LOW: "Niski", MEDIUM: "Średni", HIGH: "Wysoki", URGENT: "Pilny" };

export function KanbanBoard({ workspaceId, projectId, initialTasks, readOnly = false, filtersActive = false, filterQuery = "" }: { workspaceId: string; projectId: string; initialTasks: BoardTask[]; readOnly?: boolean; filtersActive?: boolean; filterQuery?: string }) {
  const [optimisticTasks, setOptimisticTasks] = useState<BoardTask[] | null>(null);
  const [saving, setSaving] = useState(false);
  const tasks = optimisticTasks ?? initialTasks;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  useEffect(() => { if (!message) return; const timeout = setTimeout(() => setMessage(null), 5000); return () => clearTimeout(timeout); }, [message]);
  const activeTask = tasks.find((task) => task.id === activeId);
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.id, tasks.filter((task) => task.status === column.id)])) as Record<BoardTask["status"], BoardTask[]>, [tasks]);

  function onStart(event: DragStartEvent) { if (!readOnly && !filtersActive && !saving) setActiveId(String(event.active.id)); }
  async function onEnd(event: DragEndEvent) {
    setActiveId(null); if (!event.over || readOnly || filtersActive || saving) return;
    const moving = tasks.find((task) => task.id === event.active.id); if (!moving) return;
    const overTask = tasks.find((task) => task.id === event.over?.id);
    if (overTask?.id === moving.id) return;
    const targetStatus = (overTask?.status || event.over.id) as BoardTask["status"];
    if (!columns.some((column) => column.id === targetStatus)) return;
    const targetItems = grouped[targetStatus].filter((task) => task.id !== moving.id);
    const targetIndex = overTask ? targetItems.findIndex((task) => task.id === overTask.id) : targetItems.length;
    if (targetIndex < 0) return;
    let next = tasks.filter((task) => task.id !== moving.id);
    const insertAt = next.findIndex((task) => task.status === targetStatus && task.id === targetItems[targetIndex]?.id);
    const updated = { ...moving, status: targetStatus };
    if (insertAt === -1) next = [...next, updated]; else next.splice(insertAt, 0, updated);
    setOptimisticTasks(next); setMessage(null); setSaving(true);
    try {
      const result = await moveTaskAction(workspaceId, { taskId: moving.id, targetStatus, targetIndex, expectedSourceIds: grouped[moving.status].map((task) => task.id), expectedTargetIds: grouped[targetStatus].map((task) => task.id) });
      if (!result.ok) setMessage({ text: result.message, error: true });
      else setMessage({ text: "Zadanie przeniesione.", error: false });
    } catch {
      setMessage({ text: "Nie udało się zapisać kolejności. Przywrócono poprzedni układ.", error: true });
    } finally {
      setOptimisticTasks(null);
      setSaving(false);
    }
  }

  return <><DndContext id={`kanban-${projectId}`} sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragEnd={onEnd}>
    <div className="flex min-w-max gap-4 pb-4 xl:grid xl:min-w-0 xl:grid-cols-3">{columns.map((column) => <KanbanColumn key={column.id} column={column} tasks={grouped[column.id]} workspaceId={workspaceId} projectId={projectId} readOnly={readOnly || saving} dragDisabled={filtersActive || saving} filtersActive={filtersActive} filterQuery={filterQuery} />)}</div>
    <DragOverlay>{activeTask ? <TaskCard task={activeTask} workspaceId={workspaceId} projectId={projectId} filterQuery={filterQuery} overlay /> : null}</DragOverlay>
  </DndContext>{message && <p role={message.error ? "alert" : "status"} className={`fixed right-5 bottom-5 z-50 rounded-xl px-4 py-3 text-sm shadow-xl ${message.error ? "bg-red-700 text-white" : "bg-[#252525] text-white"}`}>{message.text}</p>}</>;
}

function KanbanColumn({ column, tasks, workspaceId, projectId, readOnly, dragDisabled, filtersActive, filterQuery }: { column: (typeof columns)[number]; tasks: BoardTask[]; workspaceId: string; projectId: string; readOnly: boolean; dragDisabled: boolean; filtersActive: boolean; filterQuery: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return <section ref={setNodeRef} aria-label={column.title} className={`w-[min(310px,calc(100vw-48px))] rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--column)] p-3 transition sm:w-[340px] xl:w-auto ${isOver ? "ring-2 ring-orange-300" : ""}`}><header className="flex items-center justify-between px-2 py-2"><h2 className="text-sm font-semibold tracking-wide">{column.title}</h2><span aria-label={`${tasks.length} zadań`} className="grid size-7 place-items-center rounded-lg bg-white text-xs text-[var(--muted)]">{tasks.length}</span></header><SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}><div className="mt-2 min-h-32 space-y-3">{tasks.map((task) => <SortableTaskCard key={task.id} task={task} workspaceId={workspaceId} projectId={projectId} disabled={readOnly || dragDisabled} filterQuery={filterQuery} />)}{!tasks.length && <p className="rounded-xl border border-dashed border-[#d4d4cf] px-4 py-8 text-center text-sm text-[var(--muted)]">{filtersActive ? "Brak pasujących zadań." : "Brak zadań w tej kolumnie."}</p>}</div></SortableContext>{!readOnly && <details className="group mt-3"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-[var(--accent-ink)] hover:bg-white"><Plus size={16} />Dodaj zadanie</summary><ActionForm action={createTaskAction.bind(null, workspaceId, projectId, column.id)} resetOnSuccess successMessage="Dodano zadanie." className="mt-2 space-y-2 rounded-xl bg-white p-3"><label className="block text-xs font-medium">Tytuł zadania<input required maxLength={160} name="title" placeholder="Tytuł zadania" className="tf-input mt-1 w-full text-sm" /></label><div className="flex gap-2"><label className="min-w-0 flex-1 text-xs font-medium">Priorytet<select name="priority" className="tf-input mt-1 w-full text-sm"><option value="MEDIUM">Średni</option><option value="LOW">Niski</option><option value="HIGH">Wysoki</option><option value="URGENT">Pilny</option></select></label><button className="tf-button-primary self-end px-3 py-2.5 text-sm">Dodaj</button></div></ActionForm></details>}</section>;
}

function SortableTaskCard({ task, workspaceId, projectId, disabled, filterQuery }: { task: BoardTask; workspaceId: string; projectId: string; disabled: boolean; filterQuery: string }) {
  const sortable = useSortable({ id: task.id, disabled });
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.3 : 1 }}><TaskCard task={task} workspaceId={workspaceId} projectId={projectId} filterQuery={filterQuery} dragProps={disabled ? undefined : { ...sortable.attributes, ...sortable.listeners }} /></div>;
}

function TaskCard({ task, workspaceId, projectId, filterQuery, overlay, dragProps }: { task: BoardTask; workspaceId: string; projectId: string; filterQuery: string; overlay?: boolean; dragProps?: React.HTMLAttributes<HTMLButtonElement> }) {
  const priorityClass = task.priority === "URGENT" ? "text-red-800 bg-red-50" : task.priority === "HIGH" ? "text-[var(--accent-ink)] bg-[var(--accent-soft)]" : "text-[#55554f] bg-[#f4f4f1]";
  return <article className={`rounded-2xl border border-[#e9e9e4] bg-white p-4 shadow-[0_6px_20px_rgba(37,37,37,0.05)] ${overlay ? "rotate-2 shadow-xl" : ""}`}><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-xs text-[var(--muted)]"><CalendarDays size={13} aria-hidden="true" />{formatDateOnly(task.dueDate)}</span>{dragProps && <button {...dragProps} type="button" aria-label={`Przenieś zadanie ${task.title}`} className="min-h-9 min-w-9 cursor-grab rounded-lg p-2 text-[#666660] hover:bg-[var(--muted-surface)] active:cursor-grabbing"><GripVertical size={16} /></button>}</div><Link href={`/w/${workspaceId}/projects/${projectId}?task=${task.id}${filterQuery ? `&${filterQuery}` : ""}`} className="mt-3 block font-semibold leading-snug hover:text-[var(--accent-ink)]">{task.title}</Link><div className="mt-4 flex flex-wrap gap-1">{task.labels.slice(0, 2).map((label) => <span key={label.id} className="rounded-lg border border-[#ececea] px-2 py-1 text-[11px]" title={label.name}><span className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: label.color }} />{label.name}</span>)}<span className={`rounded-lg px-2 py-1 text-[11px] font-medium ${priorityClass}`}>Priorytet: {priorities[task.priority]}</span></div><div className="mt-4 flex items-center gap-3 border-t border-[var(--border)] pt-3"><div className="flex -space-x-2" aria-label={task.assignees.length ? `Przypisani: ${task.assignees.map((person) => person.name).join(", ")}` : "Nikt nie jest przypisany"}>{task.assignees.slice(0, 3).map((person) => <span title={person.name} key={person.id} className="grid size-7 place-items-center rounded-full border-2 border-white text-[9px] font-semibold text-white" style={{ backgroundColor: person.color }}>{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>)}{task.assignees.length > 3 && <span className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#eeeeca] text-[10px]">+{task.assignees.length - 3}</span>}</div>{!task.assignees.length && <span className="text-xs text-[var(--muted)]">Bez przypisania</span>}{task.checklist.total > 0 && <span aria-label={`Checklista: ${task.checklist.completed} z ${task.checklist.total} ukończonych`} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)]"><ListChecks size={14} aria-hidden="true" />{task.checklist.completed}/{task.checklist.total}</span>}</div></article>;
}
