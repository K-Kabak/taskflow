import { ActionForm } from "@/components/shared/action-form";
import { createProjectAction } from "@/app/actions/domain";

export function NewProjectForm({ workspaceId }: { workspaceId: string }) {
  return <ActionForm action={createProjectAction.bind(null, workspaceId)} successMessage="Utworzono projekt." className="tf-card p-4 sm:p-5"><h2 className="tf-section-heading">Nowy projekt</h2><div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] md:items-end"><label className="text-sm font-medium">Nazwa projektu<input required minLength={2} maxLength={80} name="name" placeholder="Nazwa projektu" className="tf-input mt-1 w-full" /></label><label className="text-sm font-medium">Opis (opcjonalnie)<input maxLength={10000} name="description" placeholder="Krótki opis (opcjonalnie)" className="tf-input mt-1 w-full" /></label><button className="tf-button-primary min-h-11 px-5 py-2.5">Utwórz</button></div></ActionForm>;
}
