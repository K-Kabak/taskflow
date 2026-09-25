import { ActionForm } from "@/components/shared/action-form";
import { createProjectAction } from "@/app/actions/domain";

export function NewProjectForm({ workspaceId }: { workspaceId: string }) {
  return <ActionForm action={createProjectAction.bind(null, workspaceId)} successMessage="Utworzono projekt." className="tf-card p-5"><h2 className="font-semibold">Nowy projekt</h2><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"><label className="text-sm font-medium">Nazwa projektu<input required minLength={2} maxLength={80} name="name" placeholder="Nazwa projektu" className="tf-input mt-1 w-full" /></label><label className="text-sm font-medium">Opis (opcjonalnie)<input maxLength={10000} name="description" placeholder="Krótki opis (opcjonalnie)" className="tf-input mt-1 w-full" /></label><button className="tf-button-primary min-h-11 px-5 py-2.5">Utwórz</button></div></ActionForm>;
}
