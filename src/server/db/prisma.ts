/**
 * Prisma client singleton for the server. Use this instead of instantiating PrismaClient in each module.
 */
import { PrismaClient } from "@prisma/client";
import { logger } from "@/server/utils/logger";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? [{ emit: "event", level: "query" }, { emit: "stdout", level: "error" }]
      : [{ emit: "stdout", level: "error" }],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (process.env.NODE_ENV === "development" && prisma.$connect) {
  prisma.$connect().catch((e) => logger.error("Prisma connect error", { error: String(e) }));
}
