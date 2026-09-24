import { z } from "zod";

const trimmed = (min: number, max: number, label: string) => z.string().trim().min(min, `${label}: minimum ${min} znaki.`).max(max, `${label}: maksimum ${max} znaków.`);

export const registerSchema = z
  .object({
    name: trimmed(2, 80, "Imię"),
    email: z.string().trim().toLowerCase().pipe(z.email("Podaj poprawny adres e-mail.")),
    password: z.string().min(10, "Hasło musi mieć co najmniej 10 znaków.").max(128),
    confirmPassword: z.string(),
    inviteToken: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, { message: "Hasła muszą być identyczne.", path: ["confirmPassword"] });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(128),
});

export const workspaceSchema = z.object({ name: trimmed(2, 80, "Nazwa przestrzeni") });

export const projectSchema = z.object({
  name: trimmed(2, 80, "Nazwa projektu"),
  description: z.string().trim().max(10_000).optional().transform((value) => value || null),
});

export const taskSchema = z.object({
  title: trimmed(1, 160, "Tytuł zadania"),
  description: z.string().max(10_000).optional().transform((value) => value?.trim() || null),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.union([z.literal(""), z.iso.date()]).optional().transform((value) => value || null),
  assigneeIds: z.array(z.string()).max(50).default([]),
  labelIds: z.array(z.string()).max(20).default([]),
});

export const commentSchema = z.object({ body: trimmed(1, 2000, "Komentarz") });

export const linkSchema = z.object({
  title: trimmed(1, 160, "Nazwa linku"),
  url: z.url("Podaj poprawny adres URL.").refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Dozwolone są tylko adresy HTTP i HTTPS."),
});

export const labelSchema = z.object({
  name: trimmed(1, 40, "Nazwa etykiety"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Nieprawidłowy kolor."),
});

export const moveTaskSchema = z.object({
  taskId: z.string().min(1),
  targetStatus: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  targetIndex: z.number().int().min(0),
});

export const roleSchema = z.object({ role: z.enum(["ADMIN", "MEMBER"]) });
