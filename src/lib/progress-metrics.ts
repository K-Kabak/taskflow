export type StatusCounts = { TODO: number; IN_PROGRESS: number; DONE: number };

export function progressMetrics(counts: StatusCounts, overdue: number) {
  const total = counts.TODO + counts.IN_PROGRESS + counts.DONE;
  return { total, completed: counts.DONE, overdue, completionPercent: total ? Math.round((counts.DONE / total) * 100) : 0 };
}

export function countTaskMetrics(tasks: { status: keyof StatusCounts; dueDate: Date | null }[], today: Date) {
  const counts: StatusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
  let overdue = 0;
  for (const task of tasks) {
    counts[task.status] += 1;
    if (task.status !== "DONE" && task.dueDate && task.dueDate < today) overdue += 1;
  }
  return { counts, ...progressMetrics(counts, overdue) };
}
