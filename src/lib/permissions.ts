import "server-only";
import { notFound, redirect } from "next/navigation";
import type { WorkspaceRole } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export class DomainError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT", message: string) { super(message); }
}

export async function getWorkspaceMembership(workspaceId: string, userId: string) {
  return db.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId, userId } }, include: { workspace: true, user: true } });
}

export async function requireWorkspaceMember(workspaceId: string) {
  const session = await requireSession();
  const membership = await getWorkspaceMembership(workspaceId, session.user.id);
  if (!membership) notFound();
  return { session, membership };
}

export async function requireWorkspaceRole(workspaceId: string, roles: WorkspaceRole[]) {
  const context = await requireWorkspaceMember(workspaceId);
  if (!roles.includes(context.membership.role)) redirect(`/w/${workspaceId}/dashboard?error=forbidden`);
  return context;
}

export async function requireProjectAccess(workspaceId: string, projectId: string, options?: { writable?: boolean }) {
  const context = await requireWorkspaceMember(workspaceId);
  const project = await db.project.findFirst({ where: { id: projectId, workspaceId } });
  if (!project) notFound();
  if (options?.writable && project.archivedAt) throw new DomainError("FORBIDDEN", "Zarchiwizowany projekt jest tylko do odczytu.");
  return { ...context, project };
}

export async function requireTaskAccess(workspaceId: string, taskId: string, options?: { writable?: boolean }) {
  const context = await requireWorkspaceMember(workspaceId);
  const task = await db.task.findFirst({ where: { id: taskId, project: { workspaceId } }, include: { project: true } });
  if (!task) notFound();
  if (options?.writable && task.project.archivedAt) throw new DomainError("FORBIDDEN", "Zarchiwizowany projekt jest tylko do odczytu.");
  return { ...context, task };
}
