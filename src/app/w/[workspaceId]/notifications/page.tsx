import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { markNotificationReadAction } from "@/app/actions/notifications";
import { PageHeader } from "@/components/shared/page-header";
import { ActionForm } from "@/components/shared/action-form";

export default async function NotificationsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { session } = await requireWorkspaceMember(workspaceId);
  const notifications = await db.notification.findMany({
    where: { workspaceId, userId: session.user.id },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 100,
  });
  return (
    <div className="tf-page">
      <PageHeader title="Powiadomienia" description="Przypisania i komentarze dotyczące Twoich zadań." />
      <section aria-label="Lista powiadomień" className="tf-card max-w-5xl divide-y divide-[var(--border)]">
        {notifications.length ? (
          notifications.map((notification) => {
            const href =
              notification.projectId && notification.taskId
                ? `/w/${workspaceId}/projects/${notification.projectId}?task=${notification.taskId}`
                : null;
            return (
              <article
                key={notification.id}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-2 p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-5"
              >
                <span
                  className={`rounded-lg p-2 ${notification.readAt ? "bg-[var(--muted-surface)] text-[var(--muted)]" : "bg-[var(--accent-soft)] text-[var(--accent-ink)]"}`}
                >
                  <Bell size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold [overflow-wrap:anywhere]">{notification.message}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {notification.createdAt.toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })} ·{" "}
                    {notification.readAt ? "Przeczytane" : "Nieprzeczytane"}
                  </p>
                  {href && (
                    <Link
                      href={href}
                      className="tf-text-link mt-1 inline-flex min-h-9 items-center text-sm font-medium"
                    >
                      Otwórz zadanie
                    </Link>
                  )}
                </div>
                {!notification.readAt && (
                  <ActionForm
                    action={markNotificationReadAction.bind(null, workspaceId, notification.id)}
                    successMessage="Oznaczono jako przeczytane."
                    className="col-start-2 lg:col-start-3"
                  >
                    <button className="tf-button-secondary inline-flex min-h-10 items-center gap-2 px-3 py-2 text-sm">
                      <Check size={16} aria-hidden="true" />
                      Oznacz jako przeczytane
                    </button>
                  </ActionForm>
                )}
              </article>
            );
          })
        ) : (
          <p className="p-8 text-center text-sm text-[var(--muted)]">Nie masz jeszcze powiadomień.</p>
        )}
      </section>
    </div>
  );
}
