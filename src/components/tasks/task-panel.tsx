import { ActionForm } from "@/components/shared/action-form";
import { ExternalLink, Trash2 } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import type { WorkspaceRole } from "@/generated/prisma/enums";
import { addCommentAction, addLinkAction, createLabelAction, deleteTaskAction, removeLinkAction, updateTaskAction } from "@/app/actions/domain";
import { toDateOnly } from "@/lib/date-only";
import { ConfirmSubmit } from "@/components/shared/confirm-submit";
import { TaskDialogFrame } from "@/components/tasks/task-dialog-frame";

type TaskPanelTask = Prisma.TaskGetPayload<{ include: { assignees: true; labels: true; comments: { include: { author: true } }; links: true; activities: { include: { actor: true } } } }>;
type WorkspaceMemberWithUser = Prisma.WorkspaceMemberGetPayload<{ include: { user: true } }>;
type TaskPanelProps = { workspaceId: string; projectId: string; view: string; searchParams: { status?: string; priority?: string; assignee?: string; q?: string }; task: TaskPanelTask; members: WorkspaceMemberWithUser[]; labels: Prisma.LabelModel[]; currentUserId: string; role: WorkspaceRole; readOnly: boolean };

export function TaskPanel({ workspaceId, projectId, view, searchParams, task, members, labels, currentUserId, role, readOnly }: TaskPanelProps) {
  const canDelete = task.createdById === currentUserId || ["OWNER", "ADMIN"].includes(role);
  const query = new URLSearchParams();
  if (view !== "board") query.set("view", view);
  if (view === "list") for (const key of ["status", "priority", "assignee", "q"] as const) if (searchParams[key]) query.set(key, searchParams[key]);
  const returnHref = `/w/${workspaceId}/projects/${projectId}${query.size ? `?${query}` : ""}`;

  return <TaskDialogFrame taskId={task.id} returnHref={returnHref}>
    <ActionForm action={updateTaskAction.bind(null, workspaceId, task.id)} className="mt-6 space-y-5">
      <label className="block"><span className="mb-2 block text-sm font-medium">Tytuł</span><input disabled={readOnly} required name="title" defaultValue={task.title} maxLength={160} className="tf-input w-full text-lg font-semibold" /></label>
      <label className="block"><span className="mb-2 block text-sm font-medium">Opis</span><textarea disabled={readOnly} name="description" defaultValue={task.description || ""} maxLength={10000} rows={5} className="tf-input w-full resize-y" /></label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectField disabled={readOnly} label="Status" name="status" value={task.status} options={[["TODO", "Do zrobienia"], ["IN_PROGRESS", "W trakcie"], ["DONE", "Ukończone"]]} />
        <SelectField disabled={readOnly} label="Priorytet" name="priority" value={task.priority} options={[["LOW", "Niski"], ["MEDIUM", "Średni"], ["HIGH", "Wysoki"], ["URGENT", "Pilny"]]} />
      </div>
      <label className="block"><span className="mb-2 block text-sm font-medium">Termin</span><input disabled={readOnly} type="date" name="dueDate" defaultValue={toDateOnly(task.dueDate) || ""} className="tf-input w-full" /></label>
      <fieldset disabled={readOnly}><legend className="mb-2 text-sm font-medium">Przypisani</legend><div className="flex flex-wrap gap-2">{members.map((member) => <label key={member.user.id} className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"><input type="checkbox" name="assigneeIds" value={member.user.id} defaultChecked={task.assignees.some((a) => a.userId === member.user.id)} />{member.user.name}</label>)}</div></fieldset>
      <fieldset disabled={readOnly}><legend className="mb-2 text-sm font-medium">Etykiety</legend><div className="flex flex-wrap gap-2">{labels.map((label) => <label key={label.id} className="flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm"><input type="checkbox" name="labelIds" value={label.id} defaultChecked={task.labels.some((item) => item.labelId === label.id)} /><span className="size-2 rounded-full" style={{ background: label.color }} />{label.name}</label>)}</div></fieldset>
      {!readOnly && <button className="tf-button-primary w-full px-4 py-3">Zapisz zmiany</button>}
    </ActionForm>

    {!readOnly && <details className="mt-6 rounded-xl border border-[var(--border)] p-4"><summary className="cursor-pointer font-medium">Nowa etykieta</summary><ActionForm action={createLabelAction.bind(null, workspaceId)} resetOnSuccess successMessage="Dodano etykietę." className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end"><label className="text-xs font-medium">Nazwa etykiety<input name="name" required maxLength={40} className="tf-input mt-1 w-full" /></label><label className="text-xs font-medium">Kolor<input type="color" name="color" defaultValue="#F97316" className="mt-1 block h-11 w-12" /></label><button className="rounded-lg bg-[#252525] px-3 py-3 text-sm text-white">Dodaj</button></ActionForm></details>}

    <Section title={`Komentarze (${task.comments.length})`}>{task.comments.map((comment) => <div key={comment.id} className="rounded-xl bg-[var(--muted-surface)] p-3"><p className="text-xs font-semibold">{comment.author.name}</p><p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p></div>)}{!task.comments.length && <p className="text-sm text-[var(--muted)]">Brak komentarzy.</p>}{!readOnly && <ActionForm action={addCommentAction.bind(null, workspaceId, task.id)} resetOnSuccess successMessage="Dodano komentarz." className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-medium">Dodaj komentarz<input required maxLength={2000} name="body" className="tf-input mt-1 w-full" /></label><button className="rounded-xl bg-[#252525] px-3 py-3 text-sm text-white">Dodaj</button></ActionForm>}</Section>
    <Section title={`Linki (${task.links.length})`}>{task.links.map((link) => <div key={link.id} className="flex items-center gap-2 rounded-xl bg-[var(--muted-surface)] p-3"><a target="_blank" rel="noopener noreferrer" href={link.url} className="tf-text-link min-w-0 flex-1 truncate text-sm font-medium">{link.title} <ExternalLink className="inline" size={13} /></a>{!readOnly && <form action={removeLinkAction.bind(null, workspaceId, link.id)}><button aria-label={`Usuń link ${link.title}`} className="rounded-lg p-2 text-red-700 hover:bg-red-50"><Trash2 size={15} /></button></form>}</div>)}{!task.links.length && <p className="text-sm text-[var(--muted)]">Brak linków.</p>}{!readOnly && <ActionForm action={addLinkAction.bind(null, workspaceId, task.id)} resetOnSuccess successMessage="Dodano link." className="grid gap-2"><label className="text-xs font-medium">Nazwa linku<input required maxLength={160} name="title" className="tf-input mt-1 w-full" /></label><label className="text-xs font-medium">Adres URL<input required type="url" name="url" placeholder="https://…" className="tf-input mt-1 w-full" /></label><button className="justify-self-start rounded-xl bg-[#252525] px-4 py-2 text-sm text-white">Dodaj link</button></ActionForm>}</Section>
    <Section title="Ostatnia aktywność">{task.activities.map((activity) => <p key={activity.id} className="border-l-2 border-orange-300 pl-3 text-sm"><span className="font-medium">{activity.actor.name}</span> · {activity.action.toLowerCase().replaceAll("_", " ")}</p>)}{!task.activities.length && <p className="text-sm text-[var(--muted)]">Brak aktywności.</p>}</Section>
    {!readOnly && canDelete && <form action={deleteTaskAction.bind(null, workspaceId, task.id)} className="mt-8"><ConfirmSubmit message="Usunąć to zadanie? Tej operacji nie można cofnąć." className="flex items-center gap-2 text-sm font-medium text-red-700"><Trash2 size={16} />Usuń zadanie</ConfirmSubmit></form>}
  </TaskDialogFrame>;
}

function SelectField({ label, name, value, options, disabled }: { label: string; name: string; value: string; options: string[][]; disabled: boolean }) { return <label><span className="mb-2 block text-sm font-medium">{label}</span><select disabled={disabled} name={name} defaultValue={value} className="tf-input w-full">{options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-8 border-t border-[var(--border)] pt-6"><h2 className="mb-3 font-semibold">{title}</h2><div className="space-y-3">{children}</div></section>; }
