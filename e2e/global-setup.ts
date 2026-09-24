import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

export default async function globalSetup() {
  loadEnv({ path: ".env.local" });
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Testy E2E wymagają DATABASE_URL.");
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  await db.rateLimitBucket.deleteMany();
  await db.$disconnect();
}
