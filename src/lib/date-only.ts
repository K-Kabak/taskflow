import { format } from "date-fns";
import { pl } from "date-fns/locale";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  if (!DATE_ONLY.test(value)) throw new Error("Nieprawidłowa data.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error("Nieprawidłowa data.");
  return date;
}

export function toDateOnly(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function formatDateOnly(value: Date | string | null | undefined) {
  if (!value) return "Bez terminu";
  const iso = value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
  const [year, month, day] = iso.split("-").map(Number);
  return format(new Date(year, month - 1, day), "d MMM yyyy", { locale: pl });
}
