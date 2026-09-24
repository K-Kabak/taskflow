"use server";

import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { actionError, type ActionResult } from "@/lib/action-result";
import { consumeRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations";

export async function registerAction(input: unknown): Promise<ActionResult<{ email: string; workspaceId: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return actionError("VALIDATION_ERROR", "Popraw zaznaczone pola.", parsed.error.flatten().fieldErrors);
  const limit = await consumeRateLimit({ scope: "register", identifier: parsed.data.email, limit: 20, windowMs: 15 * 60_000 });
  if (!limit.allowed) return actionError("RATE_LIMITED", `Spróbuj ponownie za ${limit.retryAfterSeconds} s.`);

  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return actionError("CONFLICT", "Nie udało się utworzyć konta z podanymi danymi.");

  const passwordHash = await hash(parsed.data.password, { algorithm: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  try {
    const result = await db.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash } });
      const workspace = await tx.workspace.create({ data: { name: `${parsed.data.name} — przestrzeń`, ownerId: user.id } });
      await tx.workspaceMember.create({ data: { workspaceId: workspace.id, userId: user.id, role: "OWNER" } });
      return { email: user.email, workspaceId: workspace.id };
    });
    return { ok: true, data: result };
  } catch {
    return actionError("CONFLICT", "Nie udało się utworzyć konta z podanymi danymi.");
  }
}
