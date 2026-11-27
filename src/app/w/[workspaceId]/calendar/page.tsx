import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { db } from "@/lib/db";
import { requireWorkspaceMember } from "@/lib/permissions";

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const { workspaceId } = await params;
  const query = await searchParams;
  await requireWorkspaceMember(workspaceId);
  const requestedMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "")
    ? new Date(`${query.month}-01T12:00:00`)
    : null;
  const current = requestedMonth && !Number.isNaN(requestedMonth.getTime()) ? requestedMonth : new Date();
  const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
  const tasks = await db.task.findMany({
    where: { project: { workspaceId, archivedAt: null }, dueDate: { gte: start, lte: end } },
    include: { project: true },
    orderBy: { dueDate: "asc" },
  });
  const byDay = new Map<string, typeof tasks>();
  tasks.forEach((task) => {
    const key = task.dueDate!.toISOString().slice(0, 10);
    byDay.set(key, [...(byDay.get(key) || []), task]);
  });
  const monthParam = (date: Date) => format(date, "yyyy-MM");
  const selected = query.day ? byDay.get(query.day) || [] : [];
  const today = format(new Date(), "yyyy-MM-dd");
  const monthLabel = format(current, "LLLL yyyy", { locale: pl });
  return (
    <div className="tf-page">
      <PageHeader title="Kalendarz" description="Terminy zadań w aktywnych projektach." />
      <section aria-label="Widok miesiąca" className="tf-card min-w-0">
        <div className="flex items-center justify-between gap-1 px-3 py-2.5 sm:px-5">
          <h2 className="tf-section-heading capitalize">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <Link
              aria-label="Poprzedni miesiąc"
              href={`?month=${monthParam(subMonths(current, 1))}`}
              className="tf-icon-button"
            >
              <ChevronLeft size={19} aria-hidden="true" />
            </Link>
            <Link
              aria-label="Następny miesiąc"
              href={`?month=${monthParam(addMonths(current, 1))}`}
              className="tf-icon-button"
            >
              <ChevronRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-7 border-t border-[var(--border)] bg-[var(--muted-surface)] text-center text-xs font-semibold text-[var(--muted)]">
          {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"].map((day) => (
            <div key={day} className="py-2.5">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 overflow-hidden rounded-b-[var(--radius-card)]">
          {eachDayOfInterval({ start, end }).map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const items = byDay.get(key) || [];
            const inMonth = day.getMonth() === current.getMonth();
            const selected = query.day === key;
            const dayLabel = format(day, "d MMMM yyyy", { locale: pl });
            return (
              <Link
                href={`?month=${monthParam(current)}&day=${key}`}
                key={key}
                aria-label={`${dayLabel}. Liczba zadań: ${items.length}${key === today ? ". Dzisiaj" : ""}`}
                aria-current={selected ? "date" : undefined}
                className={`flex min-h-14 min-w-0 flex-col items-center border-t border-r border-[var(--border)] px-0.5 py-1.5 outline-offset-[-3px] nth-[7n]:border-r-0 hover:bg-[var(--hover)] sm:min-h-24 sm:items-stretch sm:p-2 ${selected ? "bg-[var(--selected)]" : ""} ${inMonth ? "" : "text-[var(--subtle)]"}`}
              >
                <span
                  className={`grid size-6 place-items-center rounded-md text-xs font-semibold tabular-nums ${key === today ? "bg-[var(--accent)] text-[var(--on-accent)]" : ""}`}
                >
                  {format(day, "d")}
                </span>
                {items.length > 0 && (
                  <span
                    aria-hidden="true"
                    className="mt-0.5 rounded-sm bg-[var(--accent-soft)] px-1 text-[11px] font-semibold text-[var(--accent-ink)] sm:hidden"
                  >
                    {items.length}
                  </span>
                )}
                <div className="mt-1 hidden min-w-0 space-y-0.5 sm:block">
                  {items.slice(0, 2).map((task) => (
                    <p
                      key={task.id}
                      title={task.title}
                      className="truncate rounded bg-[var(--accent-soft)] px-1.5 py-0.5 text-xs text-[var(--accent-ink)]"
                    >
                      {task.title}
                    </p>
                  ))}
                  {items.length > 2 && <p className="text-xs text-[var(--muted)]">+{items.length - 2}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      {query.day && (
        <section className="tf-card mt-4 p-4 sm:p-5">
          <h2 className="tf-section-heading flex items-center gap-2 [overflow-wrap:anywhere]">
            <CalendarDays size={17} className="shrink-0 text-[var(--accent-ink)]" aria-hidden="true" />
            Zadania: {query.day}
          </h2>
          <div className="mt-3 divide-y divide-[var(--border)]">
            {selected.map((task) => (
              <Link
                key={task.id}
                href={`/w/${workspaceId}/projects/${task.projectId}?task=${task.id}`}
                className="block rounded-lg p-2 [overflow-wrap:anywhere] hover:bg-[var(--hover)]"
              >
                <strong className="text-sm">{task.title}</strong>
                <p className="text-xs text-[var(--muted)]">{task.project.name}</p>
              </Link>
            ))}
            {!selected.length && <p className="text-sm text-[var(--muted)]">Brak zadań tego dnia.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
