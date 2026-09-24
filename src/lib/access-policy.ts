import type { WorkspaceRole } from "@/generated/prisma/enums";

export function canManageProjects(role: WorkspaceRole) { return role === "OWNER" || role === "ADMIN"; }
export function canChangeWorkspace(role: WorkspaceRole) { return role === "OWNER"; }
export function canDeleteTask(role: WorkspaceRole, actorId: string, creatorId: string) { return actorId === creatorId || role === "OWNER" || role === "ADMIN"; }
export function canChangeMemberRole(actorRole: WorkspaceRole, targetRole: WorkspaceRole) { return actorRole === "OWNER" && targetRole !== "OWNER"; }
export function canRemoveMember(actorRole: WorkspaceRole, targetRole: WorkspaceRole) { return targetRole !== "OWNER" && (actorRole === "OWNER" || (actorRole === "ADMIN" && targetRole === "MEMBER")); }
