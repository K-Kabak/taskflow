import Link from "next/link";
import type { BoardFilters } from "@/lib/board-filters";
import { boardFilterCount } from "@/lib/board-filters";

export function BoardFiltersForm({ projectPath, filters, members, labels, resultCount, totalCount }: {
  projectPath: string;
  filters: BoardFilters;
  members: { userId: string; name: string }[];
  labels: { id: string; name: string }[];
  resultCount: number;
  totalCount: number;
}) {
  const activeCount = boardFilterCount(filters);
  return <section aria-label="Filtry tablicy" className="tf-card mb-4 p-4">
    <details key={activeCount ? "filtered" : "all"} open={activeCount > 0}>
      <summary className="cursor-pointer font-semibold">Filtry tablicy {activeCount > 0 && <span className="ml-2 rounded-lg bg-[var(--accent-soft)] px-2 py-1 text-xs text-[var(--accent-ink)]">{activeCount} aktywnych</span>}</summary>
      <form method="get" action={projectPath} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <input type="hidden" name="view" value="board" />
        <label className="text-sm font-medium">Tekst<input name="bq" defaultValue={filters.text} maxLength={160} placeholder="Szukaj po tytule" className="tf-input mt-1 w-full text-sm" /></label>
        <label className="text-sm font-medium">Priorytet<select name="bpriority" defaultValue={filters.priority} className="tf-input mt-1 w-full text-sm"><option value="">Wszystkie</option><option value="LOW">Niski</option><option value="MEDIUM">Średni</option><option value="HIGH">Wysoki</option><option value="URGENT">Pilny</option></select></label>
        <label className="text-sm font-medium">Przypisana osoba<select name="bassignee" defaultValue={filters.assigneeId} className="tf-input mt-1 w-full text-sm"><option value="">Wszystkie</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.name}</option>)}</select></label>
        <label className="text-sm font-medium">Etykieta<select name="blabel" defaultValue={filters.labelId} className="tf-input mt-1 w-full text-sm"><option value="">Wszystkie</option>{labels.map((label) => <option key={label.id} value={label.id}>{label.name}</option>)}</select></label>
        <label className="text-sm font-medium">Termin<select name="bdue" defaultValue={filters.due} className="tf-input mt-1 w-full text-sm"><option value="">Dowolny</option><option value="OVERDUE">Po terminie</option><option value="NEXT_7_DAYS">W ciągu 7 dni</option><option value="NO_DATE">Bez terminu</option></select></label>
        <label className="text-sm font-medium">Termin od<input type="date" name="bfrom" defaultValue={filters.from} className="tf-input mt-1 w-full text-sm" /></label>
        <label className="text-sm font-medium">Termin do<input type="date" name="bto" defaultValue={filters.to} className="tf-input mt-1 w-full text-sm" /></label>
        <div className="flex items-end gap-2"><button className="tf-button-primary min-h-11 px-4 py-2.5 text-sm">Zastosuj</button><Link href={`${projectPath}?view=board`} className="tf-button-secondary inline-flex min-h-11 items-center px-4 py-2.5 text-sm">Wyczyść filtry</Link></div>
      </form>
    </details>
    <p role="status" className="mt-3 text-sm text-[var(--muted)]">Widoczne zadania: {resultCount} z {totalCount}.{activeCount > 0 && " Przy aktywnych filtrach przeciąganie jest wyłączone; status możesz zmienić w panelu zadania."}</p>
    {activeCount > 0 && resultCount === 0 && <p className="mt-3 rounded-xl border border-dashed border-[var(--border)] p-4 text-sm">Żadne zadanie nie pasuje do filtrów. Zmień kryteria lub wyczyść filtry.</p>}
  </section>;
}
