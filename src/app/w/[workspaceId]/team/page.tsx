import { ActionForm } from "@/components/shared/action-form";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { Avatar } from "@/components/shared/avatar";
import { InviteButton } from "@/components/team/invite-button";
import { changeMemberRoleAction, removeMemberAction, revokeInviteAction } from "@/app/actions/domain";

const roleLabels = { OWNER: "Właściciel", ADMIN: "Administrator", MEMBER: "Członek" };

export default async function TeamPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { membership } = await requireWorkspaceMember(workspaceId);
  const [members, invites] = await Promise.all([
    db.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: "asc" },
    }),
    db.workspaceInvite.findMany({
      where: { workspaceId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const canManage = ["OWNER", "ADMIN"].includes(membership.role);

  return (
    <div className="tf-page">
      <PageHeader title="Zespół" description="Członkowie i zaproszenia do przestrzeni roboczej." />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        <section aria-labelledby="members-heading" className="tf-card min-w-0">
          <h2
            id="members-heading"
            className="tf-section-heading border-b border-[var(--border)] px-4 py-4 sm:px-5"
          >
            Członkowie <span className="ml-1 text-sm font-medium text-[var(--muted)]">{members.length}</span>
          </h2>
          <ul className="divide-y divide-[var(--border)]">
            {members.map((item) => (
              <li key={item.userId} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Avatar name={item.user.name} color={item.user.avatarColor} />
                  <div className="min-w-0 flex-1 basis-28 [overflow-wrap:anywhere]">
                    <p className="font-semibold">{item.user.name}</p>
                    <p className="text-xs text-[var(--muted)]">{item.user.email}</p>
                  </div>
                  <span className="rounded-md bg-[var(--muted-surface)] px-2 py-1 text-xs font-medium text-[var(--muted)]">
                    {roleLabels[item.role]}
                  </span>
                </div>
                {canManage &&
                  item.role !== "OWNER" &&
                  !(membership.role === "ADMIN" && item.role === "ADMIN") && (
                    <div className="mt-2 flex flex-wrap items-start gap-x-3 gap-y-2 sm:ml-12">
                      {membership.role === "OWNER" && (
                        <ActionForm
                          action={changeMemberRoleAction.bind(null, workspaceId, item.userId)}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <select
                            aria-label={`Rola: ${item.user.name}`}
                            name="role"
                            defaultValue={item.role}
                            className="tf-input max-w-full px-2 py-1.5 text-sm"
                          >
                            <option value="MEMBER">Członek</option>
                            <option value="ADMIN">Administrator</option>
                          </select>
                          <button className="tf-button-secondary min-h-10 px-2.5 text-sm">Zmień</button>
                        </ActionForm>
                      )}
                      <form action={removeMemberAction.bind(null, workspaceId, item.userId)}>
                        <button className="min-h-10 rounded-lg px-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                          Usuń
                        </button>
                      </form>
                    </div>
                  )}
              </li>
            ))}
          </ul>
        </section>
        {canManage && (
          <div className="space-y-4">
            <section className="tf-card p-4 sm:p-5">
              <h2 className="tf-section-heading">Zaproś współpracownika</h2>
              <p className="mt-2 mb-4 text-sm leading-relaxed text-[var(--muted)]">
                Link działa raz i jest ważny 7 dni. Skopiuj go przed opuszczeniem tej strony.
              </p>
              <InviteButton workspaceId={workspaceId} />
            </section>
            {invites.length > 0 && (
              <section className="tf-card p-4 sm:p-5">
                <h2 className="tf-section-heading mb-2">Aktywne zaproszenia</h2>
                <ul className="divide-y divide-[var(--border)]">
                  {invites.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex flex-wrap items-center justify-between gap-x-3 py-1.5 text-sm"
                    >
                      <span className="text-[var(--muted)]">
                        Wygasa {invite.expiresAt.toLocaleDateString("pl-PL")}
                      </span>
                      <form action={revokeInviteAction.bind(null, workspaceId, invite.id)}>
                        <button className="min-h-10 rounded-lg px-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]">
                          Unieważnij
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
