"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { DomainError, requireTaskAccess } from "@/lib/permissions";
import { actionError, type ActionResult } from "@/lib/action-result";
import { checklistCompletionSchema, checklistItemSchema } from "@/lib/validations";

const MAX_ITEMS = 100;
const success = { ok: true, data: undefined } as const;
const path = (workspaceId: string, projectId: string) => `/w/${workspaceId}/projects/${projectId}`;

async function writableTask(workspaceId: string, taskId: string) {
  try {
    return await requireTaskAccess(workspaceId, taskId, { writable: true });
  } catch (error) {
    if (error instanceof DomainError) return actionError(error.code, error.message);
    throw error;
  }
}

async function changeItem(workspaceId: string, taskId: string, itemId: string, change: { content?: string; isCompleted?: boolean; remove?: boolean }): Promise<ActionResult> {
  const access = await writableTask(workspaceId, taskId);
  if ("ok" in access) return access;
  const changed = await db.$transaction(async (tx) => {
    const item = await tx.taskChecklistItem.findFirst({ where: { id: itemId, taskId, task: { project: { workspaceId, archivedAt: null } } } });
    if (!item) return false;
    if (change.remove) await tx.taskChecklistItem.delete({ where: { id: itemId } });
    else await tx.taskChecklistItem.update({ where: { id: itemId }, data: { content: change.content, isCompleted: change.isCompleted } });
    await tx.activity.create({ data: { workspaceId, projectId: access.task.projectId, taskId, actorId: access.session.user.id, action: "TASK_UPDATED", metadataJson: { checklist: change.remove ? "removed" : change.isCompleted === undefined ? "edited" : "completed" } } });
    return true;
  });
  if (!changed) return actionError("NOT_FOUND", "Pozycja checklisty nie istnieje lub zadanie jest tylko do odczytu.");
  revalidatePath(path(workspaceId, access.task.projectId));
  return success;
}

export async function addChecklistItemAction(workspaceId: string, taskId: string, formData: FormData): Promise<ActionResult> {
  const access = await writableTask(workspaceId, taskId);
  if ("ok" in access) return access;
  const parsed = checklistItemSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw pozycję checklisty.", parsed.error.flatten().fieldErrors);
  try {
    await db.$transaction(async (tx) => {
      const current = await tx.task.findFirst({ where: { id: taskId, project: { workspaceId, archivedAt: null } }, select: { id: true } });
      if (!current) throw new DomainError("FORBIDDEN", "Zarchiwizowany projekt jest tylko do odczytu.");
      const count = await tx.taskChecklistItem.count({ where: { taskId } });
      if (count >= MAX_ITEMS) throw new DomainError("CONFLICT", "Limit 100 pozycji checklisty został osiągnięty.");
      const last = await tx.taskChecklistItem.aggregate({ where: { taskId }, _max: { position: true } });
      await tx.taskChecklistItem.create({ data: { taskId, content: parsed.data.content, position: (last._max.position ?? 0) + 1000 } });
      await tx.activity.create({ data: { workspaceId, projectId: access.task.projectId, taskId, actorId: access.session.user.id, action: "TASK_UPDATED", metadataJson: { checklist: "added" } } });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof DomainError) return actionError(error.code, error.message);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2034") return actionError("CONFLICT", "Checklista zmieniła się w innej sesji. Spróbuj ponownie.");
    throw error;
  }
  revalidatePath(path(workspaceId, access.task.projectId));
  return success;
}

export async function editChecklistItemAction(workspaceId: string, taskId: string, itemId: string, formData: FormData): Promise<ActionResult> {
  const access = await writableTask(workspaceId, taskId);
  if ("ok" in access) return access;
  const parsed = checklistItemSchema.safeParse({ content: formData.get("content") });
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw pozycję checklisty.", parsed.error.flatten().fieldErrors);
  return changeItem(workspaceId, taskId, itemId, { content: parsed.data.content });
}

export async function setChecklistItemCompletedAction(workspaceId: string, taskId: string, itemId: string, formData: FormData): Promise<ActionResult> {
  const access = await writableTask(workspaceId, taskId);
  if ("ok" in access) return access;
  const parsed = checklistCompletionSchema.safeParse({ completed: formData.get("completed") });
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Nieprawidłowy stan pozycji checklisty.");
  return changeItem(workspaceId, taskId, itemId, { isCompleted: parsed.data.completed === "true" });
}

export async function deleteChecklistItemAction(workspaceId: string, taskId: string, itemId: string): Promise<ActionResult> {
  return changeItem(workspaceId, taskId, itemId, { remove: true });
}
