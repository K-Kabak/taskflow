import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { getWorkspaceMembership } from "@/lib/permissions";
import { db } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params; const session = await getCurrentSession();
  if (!session?.user.id || !(await getWorkspaceMembership(workspaceId, session.user.id))) return NextResponse.json({ message: "Nie znaleziono." }, { status: 404 });
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 100) || "";
  if (q.length < 2) return NextResponse.json({ projects: [], tasks: [] });
  const [projects, tasks] = await Promise.all([
    db.project.findMany({ where: { workspaceId, archivedAt: null, name: { contains: q, mode: "insensitive" } }, take: 6, orderBy: { updatedAt: "desc" }, select: { id: true, name: true } }),
    db.task.findMany({ where: { project: { workspaceId, archivedAt: null }, title: { contains: q, mode: "insensitive" } }, take: 8, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, projectId: true, project: { select: { name: true } } } }),
  ]);
  return NextResponse.json({ projects: projects.map((item) => ({ ...item, href: `/w/${workspaceId}/projects/${item.id}` })), tasks: tasks.map((item) => ({ id: item.id, title: item.title, projectName: item.project.name, href: `/w/${workspaceId}/projects/${item.projectId}?task=${item.id}` })) });
}
