import type { StatusCounts } from "@/lib/progress-metrics";
import { progressMetrics } from "@/lib/progress-metrics";

export function ProgressMetrics({ counts, overdue, title, lastActivity }: { counts: StatusCounts; overdue: number; title: string; lastActivity?: string | null }) {
  const metrics = progressMetrics(counts, overdue);
  const statuses = [
    { label: "Do zrobienia", value: counts.TODO, color: "bg-[#9ca3af]" },
    { label: "W trakcie", value: counts.IN_PROGRESS, color: "bg-[#f97316]" },
    { label: "Ukończone", value: counts.DONE, color: "bg-[#16a34a]" },
  ];
  return <section aria-label={title} className="tf-card p-4 sm:p-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-1 text-sm text-[var(--muted)]">Ukończone: {metrics.completed} z {metrics.total} zadań</p></div><p className="text-2xl font-semibold text-[var(--accent-ink)]">{metrics.completionPercent}%</p></div>
    <div role="progressbar" aria-label="Udział ukończonych zadań" aria-valuenow={metrics.completed} aria-valuemin={0} aria-valuemax={metrics.total || 1} aria-valuetext={`${metrics.completionPercent}% ukończonych`} className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--muted-surface)]"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${metrics.completionPercent}%` }} /></div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">{statuses.map((status) => <div key={status.label} className="rounded-xl bg-[var(--muted-surface)] p-3"><span className={`mr-2 inline-block size-2 rounded-full ${status.color}`} aria-hidden="true" />{status.label}<strong className="mt-1 block text-xl">{status.value}</strong></div>)}<div className="rounded-xl bg-red-50 p-3 text-red-800">Po terminie<strong className="mt-1 block text-xl">{metrics.overdue}</strong></div></div>
    {lastActivity !== undefined && <p className="mt-4 text-sm text-[var(--muted)]">Ostatnia aktywność: {lastActivity || "Brak aktywności"}</p>}
    {!metrics.total && <p className="mt-3 text-sm text-[var(--muted)]">Brak zadań do podsumowania.</p>}
  </section>;
}
