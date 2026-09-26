import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { db } from "@/lib/db";

type LimitOptions = { scope: string; identifier: string; limit: number; windowMs: number };

const cleanupIntervalMs = 15 * 60_000;
let nextCleanupAt = 0;

async function clientIp() {
  if (process.env.VERCEL !== "1") return null;
  // Vercel sets this header itself. Other forwarded headers may contain client input.
  const forwarded = (await headers()).get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  return forwarded && isIP(forwarded) ? forwarded : null;
}

async function pruneExpiredBuckets(now: Date) {
  if (process.env.VERCEL !== "1" || now.getTime() < nextCleanupAt) return;
  nextCleanupAt = now.getTime() + cleanupIntervalMs;
  try {
    await db.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } });
  } catch (error) {
    // A failed maintenance pass must not disable authentication limits.
    nextCleanupAt = 0;
    console.error("Rate-limit cleanup failed", error);
  }
}

export async function consumeClientIpRateLimit(options: Omit<LimitOptions, "identifier">) {
  const ip = await clientIp();
  if (!ip) return { allowed: true, retryAfterSeconds: 0 };
  return consumeRateLimit({ ...options, identifier: ip });
}

export async function consumeRateLimit({ scope, identifier, limit, windowMs }: LimitOptions) {
  const trustedIp = (await clientIp()) || "";
  const secret = process.env.RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Brak sekretu rate limitu.");
  const key = createHmac("sha256", secret).update(`${scope}:${identifier.trim().toLowerCase()}:${trustedIp}`).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);
  await pruneExpiredBuckets(now);

  const [bucket] = await db.$queryRaw<{ count: number; expiresAt: Date }[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "expiresAt")
    VALUES (${key}, 1, ${now}, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${now} ELSE "RateLimitBucket"."windowStart" END,
      "expiresAt" = CASE WHEN "RateLimitBucket"."expiresAt" <= ${now} THEN ${expiresAt} ELSE "RateLimitBucket"."expiresAt" END
    RETURNING "count", "expiresAt"
  `;
  if (!bucket) throw new Error("Nie udało się zaktualizować limitu.");

  return { allowed: bucket.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt.getTime() - now.getTime()) / 1000)) };
}
