import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { expect, test as base } from "@playwright/test";

export { expect };
export type { Page } from "@playwright/test";

export function testDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !/^\/taskflow_e2e(?:_[a-z0-9]+)?$/.test(new URL(connectionString).pathname)) {
    throw new Error("Testy E2E wymagają osobnej bazy taskflow_e2e.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const test = base.extend<{ resetRateLimits: void }>({
  resetRateLimits: [async ({}, runTest) => {
    const db = testDatabase();
    try {
      await db.rateLimitBucket.deleteMany();
      await runTest();
    } finally {
      await db.$disconnect();
    }
  }, { auto: true }],
});
