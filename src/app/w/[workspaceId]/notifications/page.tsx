import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { markNotificationReadAction } from "@/app/actions/notifications";
import { ActionForm } from "@/components/shared/action-form";

export default async function NotificationsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { session } = await requireWorkspaceMember(workspaceId);
  const notifications = await db.notification.findMany({ where: { workspaceId, userId: session.user.id }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 100 });
  return <div className="mx-auto max-w-4xl">
    <header><p className="text-sm font-medium text-[var(--accent-ink)]">Twoja przestrzeń robocza</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Powiadomienia</h1><p className="mt-2 text-sm text-[var(--muted)]">Nowe przypisania i komentarze w przypisanych zadaniach. Lista odświeża się przy otwarciu strony.</p></header>
    <section aria-label="Lista powiadomień" className="mt-6 space-y-3">
      {notifications.length ? notifications.map((notification) => {
        const href = notification.projectId && notification.taskId ? `/w/${workspaceId}/projects/${notification.projectId}?task=${notification.taskId}` : null;
        return <article key={notification.id} className={`tf-card flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap sm:p-5 ${notification.readAt ? "" : "border-orange-300"}`}>
          <span className="rounded-xl bg-[var(--accent-soft)] p-2 text-[var(--accent-ink)]"><Bell size={18} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1"><p className="font-medium">{notification.message}</p><p className="mt-1 text-xs text-[var(--muted)]">{notification.createdAt.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })} · {notification.readAt ? "Przeczytane" : "Nieprzeczytane"}</p>{href && <Link href={href} className="tf-text-link mt-2 inline-block text-sm font-medium">Otwórz zadanie</Link>}</div>
          {!notification.readAt && <ActionForm action={markNotificationReadAction.bind(null, workspaceId, notification.id)} successMessage="Oznaczono jako przeczytane."><button className="tf-button-secondary inline-flex min-h-11 items-center gap-2 px-3 py-2 text-sm"><Check size={16} aria-hidden="true" />Oznacz jako przeczytane</button></ActionForm>}
        </article>;
      }) : <p className="tf-card p-8 text-center text-sm text-[var(--muted)]">Nie masz jeszcze powiadomień.</p>}
    </section>
  </div>;
}
