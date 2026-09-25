"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { DomainError, requireProjectAccess, requireTaskAccess, requireWorkspaceMember, requireWorkspaceRole } from "@/lib/permissions";
import { commentSchema, labelSchema, linkSchema, moveTaskSchema, projectSchema, roleSchema, taskSchema, workspaceSchema } from "@/lib/validations";
import { parseDateOnly } from "@/lib/date-only";
import { consumeRateLimit } from "@/lib/rate-limit";
import { actionError, type ActionResult } from "@/lib/action-result";
import { canDeleteTask, canRemoveMember } from "@/lib/access-policy";

const workspacePath = (workspaceId: string) => `/w/${workspaceId}`;

class OrderConflictError extends Error {}

function sameIds(actual: { id: string }[], expected: string[]) {
  return actual.length === expected.length && actual.every((item, index) => item.id === expected[index]);
}

function isSerializationConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
}

async function writableTaskOrError(workspaceId: string, taskId: string) {
  try {
    return await requireTaskAccess(workspaceId, taskId, { writable: true });
  } catch (error) {
    if (error instanceof DomainError) return actionError(error.code, error.message);
    throw error;
  }
}

async function writableProjectOrError(workspaceId: string, projectId: string) {
  try {
    return await requireProjectAccess(workspaceId, projectId, { writable: true });
  } catch (error) {
    if (error instanceof DomainError) return actionError(error.code, error.message);
    throw error;
  }
}

export async function createProjectAction(workspaceId: string, formData: FormData) {
  const { session } = await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"]);
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw dane projektu.", parsed.error.flatten().fieldErrors);
  const project = await db.project.create({ data: { workspaceId, createdById: session.user.id, ...parsed.data } });
  revalidatePath(workspacePath(workspaceId));
  redirect(`/w/${workspaceId}/projects/${project.id}`);
}

export async function updateProjectAction(workspaceId: string, projectId: string, formData: FormData) {
  await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"]);
  const access = await writableProjectOrError(workspaceId, projectId);
  if ("ok" in access) return access;
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw dane projektu.", parsed.error.flatten().fieldErrors);
  await db.project.update({ where: { id: projectId }, data: parsed.data });
  revalidatePath(workspacePath(workspaceId));
  return { ok: true, data: undefined } as const;
}

export async function setProjectArchivedAction(workspaceId: string, projectId: string, archived: boolean) {
  const { session } = await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"]);
  await requireProjectAccess(workspaceId, projectId);
  const archivedAt = archived ? new Date() : null;
  await db.$transaction([
    db.project.update({ where: { id: projectId }, data: { archivedAt } }),
    db.activity.create({ data: { workspaceId, projectId, actorId: session.user.id, action: archived ? "PROJECT_ARCHIVED" : "PROJECT_RESTORED" } }),
  ]);
  revalidatePath(workspacePath(workspaceId));
}

export async function createTaskAction(workspaceId: string, projectId: string, status: string, formData: FormData) {
  const access = await writableProjectOrError(workspaceId, projectId);
  if ("ok" in access) return access;
  const { session } = access;
  const parsed = taskSchema.pick({ title: true, priority: true, dueDate: true }).safeParse({ title: formData.get("title"), priority: formData.get("priority") || "MEDIUM", dueDate: formData.get("dueDate") || "" });
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw dane zadania.", parsed.error.flatten().fieldErrors);
  if (status !== "TODO" && status !== "IN_PROGRESS" && status !== "DONE") return actionError("VALIDATION_ERROR", "Nieprawidłowy status zadania.");
  const validStatus = status;
  await db.$transaction(async (tx) => {
    const last = await tx.task.aggregate({ where: { projectId, status: validStatus }, _max: { position: true } });
    const task = await tx.task.create({ data: { projectId, createdById: session.user.id, title: parsed.data.title, priority: parsed.data.priority, dueDate: parseDateOnly(parsed.data.dueDate), status: validStatus, position: (last._max.position ?? 0) + 1000 } });
    await tx.activity.create({ data: { workspaceId, projectId, taskId: task.id, actorId: session.user.id, action: "TASK_CREATED", metadataJson: { title: task.title } } });
  });
  revalidatePath(`/w/${workspaceId}/projects/${projectId}`);
  return { ok: true, data: undefined } as const;
}

export async function updateTaskAction(workspaceId: string, taskId: string, formData: FormData) {
  const access = await writableTaskOrError(workspaceId, taskId);
  if ("ok" in access) return access;
  const { session, task } = access;
  const parsed = taskSchema.safeParse({
    title: formData.get("title"), description: formData.get("description"), status: formData.get("status"), priority: formData.get("priority"), dueDate: formData.get("dueDate"), assigneeIds: formData.getAll("assigneeIds"), labelIds: formData.getAll("labelIds"),
  });
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw dane zadania.", parsed.error.flatten().fieldErrors);
  const assigneeIds = [...new Set(parsed.data.assigneeIds)];
  const labelIds = [...new Set(parsed.data.labelIds)];
  const [members, labels] = await Promise.all([
    db.workspaceMember.count({ where: { workspaceId, userId: { in: assigneeIds } } }),
    db.label.count({ where: { workspaceId, id: { in: labelIds } } }),
  ]);
  if (members !== assigneeIds.length || labels !== labelIds.length) return actionError("VALIDATION_ERROR", "Wybierz członków i etykiety z bieżącej przestrzeni.");
  const previousAssignees = await db.taskAssignee.findMany({ where: { taskId }, select: { userId: true } });
  const assigneesChanged = previousAssignees.map((item) => item.userId).sort().join("|") !== [...assigneeIds].sort().join("|");

  await db.$transaction(async (tx) => {
    const targetLast = task.status === parsed.data.status ? null : await tx.task.aggregate({ where: { projectId: task.projectId, status: parsed.data.status }, _max: { position: true } });
    await tx.task.update({ where: { id: taskId }, data: { title: parsed.data.title, description: parsed.data.description, status: parsed.data.status, position: targetLast ? (targetLast._max.position ?? 0) + 1000 : undefined, priority: parsed.data.priority, dueDate: parseDateOnly(parsed.data.dueDate), assignees: { deleteMany: {}, create: assigneeIds.map((userId) => ({ userId })) }, labels: { deleteMany: {}, create: labelIds.map((labelId) => ({ labelId })) } } });
    await tx.activity.create({ data: { workspaceId, projectId: task.projectId, taskId, actorId: session.user.id, action: task.status === parsed.data.status ? "TASK_UPDATED" : "TASK_STATUS_CHANGED", metadataJson: { title: parsed.data.title, from: task.status, to: parsed.data.status } } });
    if (assigneesChanged) await tx.activity.create({ data: { workspaceId, projectId: task.projectId, taskId, actorId: session.user.id, action: "TASK_ASSIGNEES_CHANGED", metadataJson: { assigneeIds } } });
  });
  revalidatePath(workspacePath(workspaceId));
  return { ok: true, data: undefined } as const;
}

export async function deleteTaskAction(workspaceId: string, taskId: string) {
  const { session, membership, task } = await requireTaskAccess(workspaceId, taskId, { writable: true });
  if (!canDeleteTask(membership.role, session.user.id, task.createdById)) return;
  await db.task.delete({ where: { id: taskId } });
  revalidatePath(workspacePath(workspaceId));
}

export async function moveTaskAction(workspaceId: string, input: unknown): Promise<ActionResult> {
  const parsed = moveTaskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION_ERROR", message: "Nieprawidłowe położenie zadania." };
  const access = await writableTaskOrError(workspaceId, parsed.data.taskId);
  if ("ok" in access) return access;
  const { session, task } = access;
  const boardPath = `/w/${workspaceId}/projects/${task.projectId}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await db.$transaction(async (tx) => {
        const current = await tx.task.findFirst({ where: { id: task.id, projectId: task.projectId, project: { workspaceId, archivedAt: null } }, select: { status: true } });
        if (!current) throw new OrderConflictError();
        const source = await tx.task.findMany({ where: { projectId: task.projectId, status: current.status }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
        const target = current.status === parsed.data.targetStatus ? source : await tx.task.findMany({ where: { projectId: task.projectId, status: parsed.data.targetStatus }, orderBy: [{ position: "asc" }, { id: "asc" }], select: { id: true } });
        if (!sameIds(source, parsed.data.expectedSourceIds) || !sameIds(target, parsed.data.expectedTargetIds)) throw new OrderConflictError();

        const sourceWithout = source.filter((item) => item.id !== task.id);
        const targetWithout = current.status === parsed.data.targetStatus ? sourceWithout : target;
        if (parsed.data.targetIndex > targetWithout.length) throw new OrderConflictError();
        const orderedTarget = [...targetWithout];
        orderedTarget.splice(parsed.data.targetIndex, 0, { id: task.id });
        await tx.task.update({ where: { id: task.id }, data: { status: parsed.data.targetStatus } });
        for (const [index, item] of orderedTarget.entries()) await tx.task.update({ where: { id: item.id }, data: { position: (index + 1) * 1000 } });
        if (current.status !== parsed.data.targetStatus) {
          for (const [index, item] of sourceWithout.entries()) await tx.task.update({ where: { id: item.id }, data: { position: (index + 1) * 1000 } });
          await tx.activity.create({ data: { workspaceId, projectId: task.projectId, taskId: task.id, actorId: session.user.id, action: "TASK_STATUS_CHANGED", metadataJson: { from: current.status, to: parsed.data.targetStatus } } });
        }
      }, { isolationLevel: "Serializable" });
      revalidatePath(boardPath);
      return { ok: true, data: undefined };
    } catch (error) {
      if (isSerializationConflict(error) && attempt < 2) continue;
      revalidatePath(boardPath);
      if (error instanceof OrderConflictError || isSerializationConflict(error)) return { ok: false, code: "CONFLICT", message: "Tablica zmieniła się w innej sesji. Odświeżono układ; spróbuj ponownie." };
      console.error("Nie udało się zapisać kolejności zadania:", error instanceof Error ? error.name : "nieznany błąd");
      return { ok: false, code: "INTERNAL_ERROR", message: "Nie udało się zapisać kolejności. Przywrócono poprzedni układ." };
    }
  }
  return { ok: false, code: "CONFLICT", message: "Tablica zmieniła się w innej sesji. Spróbuj ponownie." };
}

export async function createLabelAction(workspaceId: string, formData: FormData) {
  await requireWorkspaceMember(workspaceId);
  const parsed = labelSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw dane etykiety.", parsed.error.flatten().fieldErrors);
  await db.label.upsert({ where: { workspaceId_name: { workspaceId, name: parsed.data.name } }, create: { workspaceId, ...parsed.data }, update: { color: parsed.data.color } });
  revalidatePath(workspacePath(workspaceId));
  return { ok: true, data: undefined } as const;
}

export async function addCommentAction(workspaceId: string, taskId: string, formData: FormData) {
  const access = await writableTaskOrError(workspaceId, taskId);
  if ("ok" in access) return access;
  const { session, task } = access;
  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw komentarz.", parsed.error.flatten().fieldErrors);
  await db.$transaction(async (tx) => {
    await tx.comment.create({ data: { taskId, authorId: session.user.id, body: parsed.data.body } });
    await tx.activity.create({ data: { workspaceId, projectId: task.projectId, taskId, actorId: session.user.id, action: "COMMENT_ADDED" } });
  });
  revalidatePath(workspacePath(workspaceId));
  return { ok: true, data: undefined } as const;
}

export async function addLinkAction(workspaceId: string, taskId: string, formData: FormData) {
  const access = await writableTaskOrError(workspaceId, taskId);
  if ("ok" in access) return access;
  const { session, task } = access;
  const parsed = linkSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw dane linku.", parsed.error.flatten().fieldErrors);
  await db.$transaction(async (tx) => {
    await tx.taskLink.create({ data: { taskId, createdById: session.user.id, ...parsed.data } });
    await tx.activity.create({ data: { workspaceId, projectId: task.projectId, taskId, actorId: session.user.id, action: "LINK_ADDED", metadataJson: { title: parsed.data.title } } });
  });
  revalidatePath(workspacePath(workspaceId));
  return { ok: true, data: undefined } as const;
}

export async function removeLinkAction(workspaceId: string, linkId: string) {
  const { session } = await requireWorkspaceMember(workspaceId);
  const link = await db.taskLink.findFirst({ where: { id: linkId, task: { project: { workspaceId, archivedAt: null } } }, include: { task: true } });
  if (!link) return;
  await db.$transaction([db.taskLink.delete({ where: { id: linkId } }), db.activity.create({ data: { workspaceId, projectId: link.task.projectId, taskId: link.taskId, actorId: session.user.id, action: "LINK_REMOVED", metadataJson: { title: link.title } } })]);
  revalidatePath(workspacePath(workspaceId));
}

export async function createInviteAction(workspaceId: string): Promise<ActionResult<{ url: string }>> {
  const { session } = await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"]);
  const limit = await consumeRateLimit({ scope: "invite-create", identifier: session.user.id, limit: 10, windowMs: 60 * 60_000 });
  if (!limit.allowed) return { ok: false, code: "RATE_LIMITED", message: "Limit zaproszeń został osiągnięty." };
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db.workspaceInvite.create({ data: { workspaceId, createdById: session.user.id, tokenHash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000) } });
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  revalidatePath(`/w/${workspaceId}/team`);
  return { ok: true, data: { url: `${baseUrl}/invite/${token}` } };
}

export async function revokeInviteAction(workspaceId: string, inviteId: string) {
  await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"]);
  await db.workspaceInvite.updateMany({ where: { id: inviteId, workspaceId, acceptedAt: null }, data: { revokedAt: new Date() } });
  revalidatePath(`/w/${workspaceId}/team`);
}

export async function acceptInviteAction(token: string) {
  const { session } = await requireWorkspaceMemberForInvite();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const limit = await consumeRateLimit({ scope: "invite-accept", identifier: session.user.id, limit: 20, windowMs: 60 * 60_000 });
  if (!limit.allowed) return;
  const workspaceId = await db.$transaction(async (tx) => {
    const invite = await tx.workspaceInvite.findUnique({ where: { tokenHash } });
    if (!invite || invite.acceptedAt || invite.revokedAt || invite.expiresAt <= new Date()) return null;
    const claimed = await tx.workspaceInvite.updateMany({ where: { id: invite.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, data: { acceptedAt: new Date(), acceptedById: session.user.id } });
    if (claimed.count !== 1) throw new Error("Zaproszenie zostało już wykorzystane.");
    await tx.workspaceMember.upsert({ where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: session.user.id } }, create: { workspaceId: invite.workspaceId, userId: session.user.id, role: "MEMBER" }, update: {} });
    return invite.workspaceId;
  }, { isolationLevel: "Serializable" });
  if (workspaceId) redirect(`/w/${workspaceId}/dashboard`);
}

async function requireWorkspaceMemberForInvite() {
  const { requireSession } = await import("@/lib/auth/session");
  return { session: await requireSession() };
}

export async function changeMemberRoleAction(workspaceId: string, userId: string, formData: FormData) {
  const { membership } = await requireWorkspaceRole(workspaceId, ["OWNER"]);
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Wybierz poprawną rolę.", parsed.error.flatten().fieldErrors);
  if (membership.userId === userId) return actionError("FORBIDDEN", "Nie możesz zmienić własnej roli.");
  await db.workspaceMember.updateMany({ where: { workspaceId, userId, role: { not: "OWNER" } }, data: { role: parsed.data.role } });
  revalidatePath(`/w/${workspaceId}/team`);
  return { ok: true, data: undefined } as const;
}

export async function removeMemberAction(workspaceId: string, userId: string) {
  const { membership } = await requireWorkspaceRole(workspaceId, ["OWNER", "ADMIN"]);
  const target = await db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } } });
  if (!target || !canRemoveMember(membership.role, target.role)) return;
  await db.workspaceMember.delete({ where: { workspaceId_userId: { workspaceId, userId } } });
  revalidatePath(`/w/${workspaceId}/team`);
}

export async function updateWorkspaceAction(workspaceId: string, formData: FormData) {
  await requireWorkspaceRole(workspaceId, ["OWNER"]);
  const parsed = workspaceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw nazwę przestrzeni.", parsed.error.flatten().fieldErrors);
  await db.workspace.update({ where: { id: workspaceId }, data: parsed.data });
  revalidatePath(workspacePath(workspaceId));
  return { ok: true, data: undefined } as const;
}

export async function updateProfileAction(workspaceId: string, formData: FormData) {
  const { session } = await requireWorkspaceMember(workspaceId);
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2 || name.length > 80) return actionError("VALIDATION_ERROR", "Imię musi mieć od 2 do 80 znaków.", { name: ["Imię musi mieć od 2 do 80 znaków."] });
  await db.user.update({ where: { id: session.user.id }, data: { name } });
  revalidatePath(workspacePath(workspaceId));
  return { ok: true, data: undefined } as const;
}
