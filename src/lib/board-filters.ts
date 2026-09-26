export type BoardFilterQuery = {
  bq?: string | string[];
  bpriority?: string | string[];
  bassignee?: string | string[];
  blabel?: string | string[];
  bdue?: string | string[];
  bfrom?: string | string[];
  bto?: string | string[];
};

export type BoardFilters = {
  text: string;
  priority: "" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId: string;
  labelId: string;
  due: "" | "OVERDUE" | "NEXT_7_DAYS" | "NO_DATE";
  from: string;
  to: string;
};

export type FilterableTask = {
  title: string;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  assignees: { id: string }[];
  labels: { id: string }[];
};

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function parseBoardFilters(query: BoardFilterQuery): BoardFilters {
  const value = (input: string | string[] | undefined) => typeof input === "string" ? input : "";
  const priorityInput = value(query.bpriority);
  const dueInput = value(query.bdue);
  const fromInput = value(query.bfrom);
  const toInput = value(query.bto);
  const priority = ["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priorityInput) ? priorityInput as BoardFilters["priority"] : "";
  const due = ["OVERDUE", "NEXT_7_DAYS", "NO_DATE"].includes(dueInput) ? dueInput as BoardFilters["due"] : "";
  return {
    text: value(query.bq).trim().slice(0, 160),
    priority,
    assigneeId: value(query.bassignee).slice(0, 128),
    labelId: value(query.blabel).slice(0, 128),
    due,
    from: validDate(fromInput) ? fromInput : "",
    to: validDate(toInput) ? toInput : "",
  };
}

export function boardFilterCount(filters: BoardFilters) {
  return Object.values(filters).filter(Boolean).length;
}

export function boardFilterParams(filters: BoardFilters) {
  const params = new URLSearchParams();
  if (filters.text) params.set("bq", filters.text);
  if (filters.priority) params.set("bpriority", filters.priority);
  if (filters.assigneeId) params.set("bassignee", filters.assigneeId);
  if (filters.labelId) params.set("blabel", filters.labelId);
  if (filters.due) params.set("bdue", filters.due);
  if (filters.from) params.set("bfrom", filters.from);
  if (filters.to) params.set("bto", filters.to);
  return params;
}

export function filterBoardTasks<T extends FilterableTask>(tasks: T[], filters: BoardFilters, today: string): T[] {
  const end = new Date(`${today}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 7);
  const nextWeek = end.toISOString().slice(0, 10);
  const text = filters.text.toLocaleLowerCase("pl");
  return tasks.filter((task) => {
    const dueDate = task.dueDate?.slice(0, 10) || "";
    return (!text || task.title.toLocaleLowerCase("pl").includes(text))
      && (!filters.priority || task.priority === filters.priority)
      && (!filters.assigneeId || task.assignees.some((person) => person.id === filters.assigneeId))
      && (!filters.labelId || task.labels.some((label) => label.id === filters.labelId))
      && (filters.due !== "NO_DATE" || !dueDate)
      && (filters.due !== "OVERDUE" || Boolean(dueDate && dueDate < today && task.status !== "DONE"))
      && (filters.due !== "NEXT_7_DAYS" || Boolean(dueDate && dueDate >= today && dueDate <= nextWeek && task.status !== "DONE"))
      && (!filters.from || Boolean(dueDate && dueDate >= filters.from))
      && (!filters.to || Boolean(dueDate && dueDate <= filters.to));
  });
}
