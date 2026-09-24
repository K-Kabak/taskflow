import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

type LimitOptions = { scope: string; identifier: string; limit: number; windowMs: number };

export async function consumeRateLimit({ scope, identifier, limit, windowMs }: LimitOptions) {
  const requestHeaders = await headers();
  // Vercel replaces this header at its edge. Outside Vercel it may be client controlled.
  const trustedIp = process.env.VERCEL === "1" ? requestHeaders.get("x-vercel-forwarded-for") || requestHeaders.get("x-forwarded-for") || "" : "";
  const secret = process.env.RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Brak sekretu rate limitu.");
  const key = createHmac("sha256", secret).update(`${scope}:${identifier.trim().toLowerCase()}:${trustedIp}`).digest("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + windowMs);

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
