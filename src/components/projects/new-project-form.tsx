import { ActionForm } from "@/components/shared/action-form";
import { createProjectAction } from "@/app/actions/domain";

export function NewProjectForm({ workspaceId }: { workspaceId: string }) {
  return <ActionForm action={createProjectAction.bind(null, workspaceId)} className="rounded-2xl border border-[#ececea] bg-white p-5"><h2 className="font-semibold">Nowy projekt</h2><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"><input required minLength={2} maxLength={80} name="name" placeholder="Nazwa projektu" className="rounded-xl border border-[#deded9] px-3 py-2.5" /><input maxLength={10000} name="description" placeholder="Krótki opis (opcjonalnie)" className="rounded-xl border border-[#deded9] px-3 py-2.5" /><button className="rounded-xl bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600">Utwórz</button></div></ActionForm>;
}
