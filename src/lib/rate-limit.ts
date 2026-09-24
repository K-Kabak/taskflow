import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

type LimitOptions = { scope: string; identifier?: string; limit: number; windowMs: number };

export async function consumeRateLimit({ scope, identifier = "", limit, windowMs }: LimitOptions) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "local";
  const secret = process.env.RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Brak sekretu rate limitu.");
  const key = createHmac("sha256", secret).update(`${scope}:${ip}:${identifier.toLowerCase()}`).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

  const bucket = await db.$transaction(async (tx) => {
    const current = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!current || current.expiresAt <= now) {
      return tx.rateLimitBucket.upsert({ where: { key }, create: { key, count: 1, windowStart: now, expiresAt }, update: { count: 1, windowStart: now, expiresAt } });
    }
    return tx.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
  });

  return { allowed: bucket.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)) };
}
