"use client";

import { ActionForm } from "@/components/shared/action-form";
/* eslint-disable react-hooks/refs -- dnd-kit exposes callback refs and transform state during render by design. */

import { useMemo, useState } from "react";
import { closestCorners, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, useDroppable } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { CalendarDays, GripVertical, Plus } from "lucide-react";
import { createTaskAction, moveTaskAction } from "@/app/actions/domain";
import { formatDateOnly } from "@/lib/date-only";

export type BoardTask = { id: string; title: string; status: "TODO" | "IN_PROGRESS" | "DONE"; priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; dueDate: string | null; assignees: { id: string; name: string; color: string }[]; labels: { id: string; name: string; color: string }[] };
const columns = [{ id: "TODO" as const, title: "Do zrobienia" }, { id: "IN_PROGRESS" as const, title: "W trakcie" }, { id: "DONE" as const, title: "Ukończone" }];
const priorities = { LOW: "Niski", MEDIUM: "Średni", HIGH: "Wysoki", URGENT: "Pilny" };

export function KanbanBoard({ workspaceId, projectId, initialTasks, readOnly = false }: { workspaceId: string; projectId: string; initialTasks: BoardTask[]; readOnly?: boolean }) {
  const [optimisticTasks, setOptimisticTasks] = useState<BoardTask[] | null>(null);
  const [saving, setSaving] = useState(false);
  const tasks = optimisticTasks ?? initialTasks;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const activeTask = tasks.find((task) => task.id === activeId);
  const grouped = useMemo(() => Object.fromEntries(columns.map((column) => [column.id, tasks.filter((task) => task.status === column.id)])) as Record<BoardTask["status"], BoardTask[]>, [tasks]);

  function onStart(event: DragStartEvent) { if (!readOnly && !saving) setActiveId(String(event.active.id)); }
  async function onEnd(event: DragEndEvent) {
    setActiveId(null); if (!event.over || readOnly || saving) return;
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
      if (!result.ok) setMessage(result.message);
    } catch {
      setMessage("Nie udało się zapisać kolejności. Przywrócono poprzedni układ.");
    } finally {
      setOptimisticTasks(null);
      setSaving(false);
    }
  }

  return <><DndContext id={`kanban-${projectId}`} sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragEnd={onEnd}>
    <div className="flex min-w-max gap-4 pb-4 xl:grid xl:min-w-0 xl:grid-cols-3">{columns.map((column) => <KanbanColumn key={column.id} column={column} tasks={grouped[column.id]} workspaceId={workspaceId} projectId={projectId} readOnly={readOnly || saving} />)}</div>
    <DragOverlay>{activeTask ? <TaskCard task={activeTask} workspaceId={workspaceId} projectId={projectId} overlay /> : null}</DragOverlay>
  </DndContext>{message && <p role="alert" className="fixed right-5 bottom-5 z-50 rounded-xl bg-red-600 px-4 py-3 text-sm text-white shadow-xl">{message}</p>}</>;
}

function KanbanColumn({ column, tasks, workspaceId, projectId, readOnly }: { column: (typeof columns)[number]; tasks: BoardTask[]; workspaceId: string; projectId: string; readOnly: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return <section ref={setNodeRef} className={`w-[310px] rounded-[20px] border border-[#efefec] bg-[#fafaf8] p-3 transition sm:w-[340px] xl:w-auto ${isOver ? "ring-2 ring-orange-200" : ""}`}><header className="flex items-center justify-between px-2 py-2"><h2 className="font-semibold">{column.title}</h2><span className="grid size-7 place-items-center rounded-lg bg-white text-xs text-[#777772]">{tasks.length}</span></header><SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}><div className="mt-2 min-h-32 space-y-3">{tasks.map((task) => <SortableTaskCard key={task.id} task={task} workspaceId={workspaceId} projectId={projectId} disabled={readOnly} />)}</div></SortableContext>{!readOnly && <details className="group mt-3"><summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-2 text-sm text-[#777772] hover:bg-white"><Plus size={16} />Dodaj zadanie</summary><ActionForm action={createTaskAction.bind(null, workspaceId, projectId, column.id)} resetOnSuccess className="mt-2 space-y-2 rounded-xl bg-white p-3"><input required maxLength={160} name="title" placeholder="Tytuł zadania" className="w-full rounded-lg border border-[#deded9] px-3 py-2 text-sm" /><div className="flex gap-2"><select name="priority" className="min-w-0 flex-1 rounded-lg border border-[#deded9] px-2 text-sm"><option value="MEDIUM">Średni</option><option value="LOW">Niski</option><option value="HIGH">Wysoki</option><option value="URGENT">Pilny</option></select><button className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white">Dodaj</button></div></ActionForm></details>}</section>;
}

function SortableTaskCard({ task, workspaceId, projectId, disabled }: { task: BoardTask; workspaceId: string; projectId: string; disabled: boolean }) {
  const sortable = useSortable({ id: task.id, disabled });
  return <div ref={sortable.setNodeRef} style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition, opacity: sortable.isDragging ? 0.3 : 1 }}><TaskCard task={task} workspaceId={workspaceId} projectId={projectId} dragProps={{ ...sortable.attributes, ...sortable.listeners }} /></div>;
}

function TaskCard({ task, workspaceId, projectId, overlay, dragProps }: { task: BoardTask; workspaceId: string; projectId: string; overlay?: boolean; dragProps?: React.HTMLAttributes<HTMLButtonElement> }) {
  const priorityClass = task.priority === "URGENT" ? "text-red-700 bg-red-50" : task.priority === "HIGH" ? "text-orange-700 bg-orange-50" : "text-[#777772] bg-white/80";
  return <article className={`rounded-2xl border border-white bg-gradient-to-br from-white via-white to-orange-50/50 p-4 shadow-[0_8px_24px_rgba(37,37,37,0.05)] ${overlay ? "rotate-2 shadow-xl" : ""}`}><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-xs text-[#777772]"><CalendarDays size={13} />{formatDateOnly(task.dueDate)}</span>{dragProps && <button {...dragProps} aria-label={`Przenieś zadanie ${task.title}`} className="cursor-grab rounded p-1 text-[#aaa] hover:bg-white active:cursor-grabbing"><GripVertical size={15} /></button>}</div><Link href={`/w/${workspaceId}/projects/${projectId}?task=${task.id}`} className="mt-4 block font-semibold hover:text-orange-600">{task.title}</Link><div className="mt-5 flex items-end justify-between gap-3"><div className="flex -space-x-2">{task.assignees.slice(0, 3).map((person) => <span title={person.name} key={person.id} className="grid size-7 place-items-center rounded-full border-2 border-white text-[9px] font-semibold text-white" style={{ backgroundColor: person.color }}>{person.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>)}</div><div className="flex flex-wrap justify-end gap-1">{task.labels.slice(0, 2).map((label) => <span key={label.id} className="rounded-lg bg-white/80 px-2 py-1 text-[10px]" style={{ color: label.color }}>#{label.name}</span>)}<span className={`rounded-lg px-2 py-1 text-[10px] font-medium ${priorityClass}`}>{priorities[task.priority]}</span></div></div></article>;
}
