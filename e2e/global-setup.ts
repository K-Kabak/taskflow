import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export default async function globalSetup() {
  loadEnv({ path: ".env.local" });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !/^\/taskflow_e2e(?:_[a-z0-9]+)?$/.test(new URL(connectionString).pathname)) throw new Error("Testy E2E wymagają osobnej bazy taskflow_e2e.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  await db.rateLimitBucket.deleteMany();
  await db.$disconnect();
}
