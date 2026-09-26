import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import type { TaskChecklistItem } from "@/generated/prisma/client";
import { ActionForm } from "@/components/shared/action-form";
import { ConfirmSubmit } from "@/components/shared/confirm-submit";
import { addChecklistItemAction, deleteChecklistItemAction, editChecklistItemAction, setChecklistItemCompletedAction } from "@/app/actions/checklist";

export function TaskChecklist({ workspaceId, taskId, items, readOnly }: { workspaceId: string; taskId: string; items: TaskChecklistItem[]; readOnly: boolean }) {
  const completed = items.filter((item) => item.isCompleted).length;
  return <section aria-labelledby="checklist-heading" className="mt-8 border-t border-[var(--border)] pt-6">
    <div className="flex items-center justify-between gap-3"><h2 id="checklist-heading" className="font-semibold">Checklista</h2>{items.length > 0 && <span className="text-sm font-medium text-[var(--muted)]">{completed} z {items.length} ukończonych</span>}</div>
    {items.length > 0 && <progress aria-label="Postęp checklisty" max={items.length} value={completed} className="mt-3 h-2 w-full accent-orange-500" />}
    {!items.length && <p className="mt-3 text-sm text-[var(--muted)]">Brak pozycji checklisty.</p>}
    <ul className="mt-3 space-y-2">{items.map((item) => <li key={item.id} className="rounded-xl border border-[var(--border)] p-3">
      <div className="flex items-start gap-2">
        {readOnly ? <span className="mt-1 text-[var(--accent-ink)]">{item.isCompleted ? <CheckCircle2 size={19} /> : <Circle size={19} />}</span> : <ActionForm action={setChecklistItemCompletedAction.bind(null, workspaceId, taskId, item.id)} className="shrink-0"><input type="hidden" name="completed" value={String(!item.isCompleted)} /><button type="submit" aria-label={`${item.isCompleted ? "Oznacz jako nieukończone" : "Oznacz jako ukończone"}: ${item.content}`} aria-pressed={item.isCompleted} className="rounded-lg p-1 text-[var(--accent-ink)] hover:bg-[var(--accent-soft)]">{item.isCompleted ? <CheckCircle2 size={19} /> : <Circle size={19} />}</button></ActionForm>}
        <span className={`min-w-0 flex-1 break-words text-sm ${item.isCompleted ? "text-[var(--muted)] line-through" : ""}`}>{item.content}</span>
        {!readOnly && <div className="flex shrink-0 items-center gap-1"><details className="relative"><summary aria-label={`Edytuj: ${item.content}`} className="cursor-pointer list-none rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--muted-surface)]"><Pencil size={16} /></summary><ActionForm action={editChecklistItemAction.bind(null, workspaceId, taskId, item.id)} className="absolute top-8 right-0 z-10 w-[min(280px,80vw)] rounded-xl border border-[var(--border)] bg-white p-3 shadow-xl"><label className="block text-xs font-medium">Treść pozycji<input name="content" required maxLength={200} defaultValue={item.content} className="tf-input mt-1 w-full text-sm" /></label><button className="tf-button-primary mt-2 px-3 py-2 text-sm">Zapisz</button></ActionForm></details><ActionForm action={deleteChecklistItemAction.bind(null, workspaceId, taskId, item.id)}><ConfirmSubmit message="Usunąć pozycję checklisty?" className="rounded-lg p-1 text-red-700 hover:bg-red-50"><span className="sr-only">Usuń: {item.content}</span><Trash2 size={16} /></ConfirmSubmit></ActionForm></div>}
      </div>
    </li>)}</ul>
    {!readOnly && items.length < 100 && <ActionForm action={addChecklistItemAction.bind(null, workspaceId, taskId)} resetOnSuccess successMessage="Dodano pozycję checklisty." className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-sm font-medium">Nowa pozycja<input name="content" required maxLength={200} placeholder="Co trzeba zrobić?" className="tf-input mt-1 w-full" /></label><button className="tf-button-primary min-h-11 px-4 py-2.5">Dodaj</button></ActionForm>}
  </section>;
}
