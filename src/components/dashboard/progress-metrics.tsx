import { ChevronDown } from "lucide-react";
import type { StatusCounts } from "@/lib/progress-metrics";
import { progressMetrics } from "@/lib/progress-metrics";

export function ProgressMetrics({
  counts,
  overdue,
  title,
  lastActivity,
  collapsible = false,
}: {
  counts: StatusCounts;
  overdue: number;
  title: string;
  lastActivity?: string | null;
  collapsible?: boolean;
}) {
  const metrics = progressMetrics(counts, overdue);
  const statuses = [
    { id: "TODO", label: "Do zrobienia", value: counts.TODO },
    { id: "IN_PROGRESS", label: "W trakcie", value: counts.IN_PROGRESS },
    { id: "DONE", label: "Ukończone", value: counts.DONE },
  ];
  const completed = `Ukończone: ${metrics.completed} z ${metrics.total} zadań`;
  const percent = (
    <span className="shrink-0 text-xl font-semibold tracking-tight text-[var(--success)] tabular-nums sm:text-2xl">
      {metrics.completionPercent}%
    </span>
  );
  const breakdown = (
    <>
      <div
        role="progressbar"
        aria-label="Udział ukończonych zadań"
        aria-valuenow={metrics.completed}
        aria-valuemin={0}
        aria-valuemax={metrics.total || 1}
        aria-valuetext={`${metrics.completionPercent}% ukończonych`}
        className="h-2 overflow-hidden rounded-full bg-[var(--muted-surface)]"
      >
        <div
          className="h-full rounded-full bg-[var(--success)]"
          style={{ width: `${metrics.completionPercent}%` }}
        />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--border)] pt-4 text-xs sm:grid-cols-4">
        {statuses.map((status) => (
          <div key={status.id} data-status={status.id} className="tf-status">
            <dt className="flex items-center gap-1.5 text-[var(--muted)]">
              <span className="tf-status-dot" aria-hidden="true" />
              {status.label}
            </dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{status.value}</dd>
          </div>
        ))}
        <div className={metrics.overdue ? "text-[var(--danger)]" : "text-[var(--muted)]"}>
          <dt>Po terminie</dt>
          <dd className="mt-1 text-lg font-semibold tabular-nums">{metrics.overdue}</dd>
        </div>
      </dl>
      {lastActivity !== undefined && (
        <p className="mt-3 text-xs text-[var(--muted)]">
          Ostatnia aktywność: {lastActivity || "Brak aktywności"}
        </p>
      )}
      {!metrics.total && <p className="mt-2 text-sm text-[var(--muted)]">Brak zadań do podsumowania.</p>}
    </>
  );

  return (
    <section aria-label={title} className="tf-card min-w-0">
      {collapsible ? (
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-[var(--radius-card)] px-3.5 py-2.5 hover:bg-[var(--hover)] sm:gap-4 sm:px-5">
            <span className="min-w-0 flex-1 sm:flex sm:flex-wrap sm:items-baseline sm:gap-3">
              <span className="block text-sm font-semibold">{title}</span>
              <span className="block text-xs text-[var(--muted)]">{completed}</span>
            </span>
            {percent}
            <ChevronDown
              size={16}
              className="shrink-0 text-[var(--muted)] group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>
          <div className="px-3.5 pt-2 pb-4 sm:px-5">{breakdown}</div>
        </details>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="tf-section-heading">{title}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{completed}</p>
            </div>
            {percent}
          </div>
          {breakdown}
        </div>
      )}
    </section>
  );
}
