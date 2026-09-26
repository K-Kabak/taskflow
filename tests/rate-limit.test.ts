// @vitest-environment node
import { createHmac, randomUUID } from "node:crypto";
import { config } from "dotenv";
import { afterAll, describe, expect, it, vi } from "vitest";

config({ path: ".env.local" });
const request = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => request.headers }));

const { db } = await import("@/lib/db");
const { consumeClientIpRateLimit, consumeRateLimit } = await import("@/lib/rate-limit");

const originalVercel = process.env.VERCEL;
afterAll(async () => {
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  await db.$disconnect();
});

function bucketKey(scope: string, identifier: string) {
  const secret = process.env.RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Brak sekretu testowego.");
  return createHmac("sha256", secret).update(`${scope}:${identifier}:`).digest("hex");
}

describe("rate limit PostgreSQL", () => {
  it("liczy równoczesne próby atomowo i resetuje wygasłe okno", async () => {
    delete process.env.VERCEL;
    const scope = `test-${randomUUID()}`;
    const identifier = "test@example.test";
    const key = bucketKey(scope, identifier);
    try {
      const results = await Promise.all(Array.from({ length: 25 }, () => consumeRateLimit({ scope, identifier, limit: 10, windowMs: 60_000 })));
      expect(results.filter((result) => result.allowed)).toHaveLength(10);
      expect((await db.rateLimitBucket.findUniqueOrThrow({ where: { key } })).count).toBe(25);
      await db.rateLimitBucket.update({ where: { key }, data: { expiresAt: new Date(Date.now() - 1_000) } });
      expect((await consumeRateLimit({ scope, identifier, limit: 10, windowMs: 60_000 })).allowed).toBe(true);
      expect((await db.rateLimitBucket.findUniqueOrThrow({ where: { key } })).count).toBe(1);
    } finally {
      await db.rateLimitBucket.deleteMany({ where: { key } });
    }
  });

  it("ignoruje niezweryfikowane nagłówki proxy poza Vercel", async () => {
    delete process.env.VERCEL;
    const scope = `test-${randomUUID()}`;
    const identifier = "test@example.test";
    const key = bucketKey(scope, identifier);
    try {
      request.headers = new Headers({ "x-forwarded-for": "192.0.2.1" });
      expect((await consumeRateLimit({ scope, identifier, limit: 1, windowMs: 60_000 })).allowed).toBe(true);
      request.headers = new Headers({ "x-forwarded-for": "192.0.2.2" });
      expect((await consumeRateLimit({ scope, identifier, limit: 1, windowMs: 60_000 })).allowed).toBe(false);
    } finally {
      await db.rateLimitBucket.deleteMany({ where: { key } });
    }
  });

  it("ogranicza próby z jednego adresu Vercel niezależnie od zmiany e-maila", async () => {
    process.env.VERCEL = "1";
    const scope = `test-ip-${randomUUID()}`;
    const ip = "192.0.2.30";
    const secret = process.env.RATE_LIMIT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("Brak sekretu testowego.");
    const key = createHmac("sha256", secret).update(`${scope}:${ip}:${ip}`).digest("hex");
    const cleanup = vi.spyOn(db.rateLimitBucket, "deleteMany").mockResolvedValue({ count: 0 });
    try {
      request.headers = new Headers({ "x-vercel-forwarded-for": ip, "x-forwarded-for": "198.51.100.1" });
      expect((await consumeClientIpRateLimit({ scope, limit: 1, windowMs: 60_000 })).allowed).toBe(true);
      expect((await consumeClientIpRateLimit({ scope, limit: 1, windowMs: 60_000 })).allowed).toBe(false);
      expect(cleanup).toHaveBeenCalledWith({ where: { expiresAt: { lt: expect.any(Date) } } });
    } finally {
      cleanup.mockRestore();
      await db.rateLimitBucket.deleteMany({ where: { key } });
      delete process.env.VERCEL;
    }
  });

  it("nie ufa nagłówkowi X-Forwarded-For bez nagłówka Vercel", async () => {
    process.env.VERCEL = "1";
    request.headers = new Headers({ "x-forwarded-for": "192.0.2.31" });
    try {
      expect((await consumeClientIpRateLimit({ scope: "test", limit: 1, windowMs: 60_000 })).allowed).toBe(true);
    } finally {
      delete process.env.VERCEL;
    }
  });
});
