import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

function getConnectionString() {
  // ✅ Vercel 배포 환경
  if (process.env.VERCEL === "1") {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required on Vercel");
    }
    return process.env.DATABASE_URL; // transaction pooler
  }

  // ✅ 로컬 개발 환경
  if (!process.env.DIRECT_URL) {
    throw new Error("DIRECT_URL is required locally");
  }
  return process.env.DIRECT_URL; // session pooler
}

const connectionString = getConnectionString();

const adapter = new PrismaPg({
  connectionString,
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
