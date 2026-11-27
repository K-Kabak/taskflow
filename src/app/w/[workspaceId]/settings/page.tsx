import { ActionForm } from "@/components/shared/action-form";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";
import { updateProfileAction, updateWorkspaceAction } from "@/app/actions/domain";

export default async function SettingsPage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const { session, membership } = await requireWorkspaceMember(workspaceId);
  const user = await db.user.findUniqueOrThrow({ where: { id: session.user.id } });
  const canManageWorkspace = membership.role === "OWNER";

  return (
    <div className="tf-page">
      <PageHeader title="Ustawienia" />
      <div className="grid max-w-5xl items-start gap-4 xl:grid-cols-2">
        <section aria-labelledby="profile-heading" className="tf-card p-4 sm:p-6">
          <h2 id="profile-heading" className="tf-section-heading border-b border-[var(--border)] pb-3">
            Profil
          </h2>
          <ActionForm
            action={updateProfileAction.bind(null, workspaceId)}
            className="mt-4 grid grid-cols-1 gap-4"
          >
            <Field label="Imię" name="name" value={user.name} />
            <Field label="E-mail" name="email" value={user.email} disabled />
            <button className="tf-button-primary min-h-11 justify-self-start px-4 text-sm">
              Zapisz profil
            </button>
          </ActionForm>
        </section>
        <section aria-labelledby="workspace-heading" className="tf-card p-4 sm:p-6">
          <h2 id="workspace-heading" className="tf-section-heading border-b border-[var(--border)] pb-3">
            Przestrzeń robocza
          </h2>
          <ActionForm
            action={updateWorkspaceAction.bind(null, workspaceId)}
            className="mt-4 grid grid-cols-1 gap-4"
          >
            <Field
              label="Nazwa przestrzeni"
              name="name"
              value={membership.workspace.name}
              disabled={!canManageWorkspace}
            />
            {canManageWorkspace && (
              <button className="tf-button-secondary min-h-11 justify-self-start px-4 text-sm">
                Zapisz nazwę
              </button>
            )}
          </ActionForm>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  disabled = false,
}: {
  label: string;
  name: string;
  value: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        required
        minLength={2}
        maxLength={80}
        name={name}
        defaultValue={value}
        disabled={disabled}
        className="tf-input w-full"
      />
    </label>
  );
}
