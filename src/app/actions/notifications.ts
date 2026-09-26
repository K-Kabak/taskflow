"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { actionError, type ActionResult } from "@/lib/action-result";

const notificationIdSchema = z.string().min(1).max(128);

export async function markNotificationReadAction(workspaceId: string, notificationId: string): Promise<ActionResult> {
  const { session } = await requireWorkspaceMember(workspaceId);
  const parsed = notificationIdSchema.safeParse(notificationId);
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Nieprawidłowe powiadomienie.");
  const notification = await db.notification.findFirst({ where: { id: parsed.data, workspaceId, userId: session.user.id }, select: { id: true } });
  if (!notification) return actionError("NOT_FOUND", "Powiadomienie nie istnieje.");
  await db.notification.updateMany({ where: { id: parsed.data, workspaceId, userId: session.user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath(`/w/${workspaceId}`, "layout");
  return { ok: true, data: undefined };
}
