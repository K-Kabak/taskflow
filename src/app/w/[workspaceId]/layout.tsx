import { AppShell } from "@/components/layout/app-shell";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { session, membership } = await requireWorkspaceMember(workspaceId);
  const [memberships, user] = await Promise.all([
    db.workspaceMember.findMany({ where: { userId: session.user.id }, include: { workspace: true }, orderBy: { joinedAt: "asc" } }),
    db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { name: true, email: true, avatarColor: true } }),
  ]);
  return <AppShell workspace={{ id: membership.workspace.id, name: membership.workspace.name }} workspaces={memberships.map((item) => ({ id: item.workspace.id, name: item.workspace.name }))} user={user}>{children}</AppShell>;
}
