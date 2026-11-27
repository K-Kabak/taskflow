import { CalendarDays, Columns3 } from "lucide-react";

const columns = [
  {
    status: "TODO",
    name: "Do zrobienia",
    tasks: [
      { title: "Nowa nawigacja", label: "Design" },
      { title: "Treści strony głównej", label: "Treść" },
    ],
  },
  {
    status: "IN_PROGRESS",
    name: "W trakcie",
    tasks: [
      { title: "Widok mobilny", label: "UI" },
      { title: "System komponentów", label: "Design" },
    ],
  },
  { status: "DONE", name: "Ukończone", tasks: [{ title: "Badania użytkowników", label: "Research" }] },
];

export function ProductPreview({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden={compact || undefined}
      className="tf-card w-full min-w-0 overflow-hidden text-[var(--foreground)] shadow-[0_18px_60px_-34px_rgb(31_28_22/36%)]"
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-ink)] sm:size-9">
          <Columns3 size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold sm:text-base">Przebudowa strony</p>
          <p className="text-xs text-[var(--muted)]">Tablica projektu</p>
        </div>
        <div aria-hidden="true" className="hidden -space-x-1.5 sm:flex">
          <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-[#f2c0a9] text-[9px] font-semibold text-[#492518]">
            AK
          </span>
          <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-[#c5d4ec] text-[9px] font-semibold text-[#213b61]">
            MN
          </span>
          <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-[#cde0cd] text-[9px] font-semibold text-[#23482f]">
            OW
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 items-stretch gap-1.5 bg-[var(--background)] p-2 sm:gap-2.5 sm:p-3.5">
        {columns.map((column) => (
          <div
            key={column.status}
            data-status={column.status}
            className="tf-status min-w-0 rounded-lg border border-[var(--border)] bg-[var(--column)] p-1.5 sm:p-2.5"
          >
            <p className="mb-2 flex items-center gap-1 text-[10px] leading-tight font-semibold sm:gap-1.5 sm:text-xs">
              <span className="tf-status-dot size-1.5 sm:size-2" aria-hidden="true" />
              {column.name}
            </p>
            <div className="space-y-2">
              {column.tasks.slice(0, compact ? 1 : undefined).map((task, index) => (
                <div
                  key={task.title}
                  className={`min-w-0 rounded-md border border-[var(--border)] bg-[var(--surface)] p-1.5 sm:p-2.5 ${index === 0 ? "" : "hidden sm:block"}`}
                >
                  <p className="text-[11px] leading-snug font-semibold sm:text-xs lg:text-sm">{task.title}</p>
                  <span className="mt-2 inline-block rounded-sm bg-[var(--status-soft)] px-1 py-0.5 text-[10px] text-[var(--status-ink)]">
                    {task.label}
                  </span>
                  {!compact && (
                    <p className="mt-2 hidden items-center gap-1 border-t border-[var(--border)] pt-2 text-[10px] text-[var(--muted)] sm:flex">
                      <CalendarDays size={12} aria-hidden="true" />
                      24 września
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
