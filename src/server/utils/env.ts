/**
 * Validate required server environment variables. Call at startup.
 */
import { logger } from "@/server/utils/logger";

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
] as const;

const optional = [
  "ANTHROPIC_API_KEY",
  "FIRECRAWL_API_KEY",
  "REDIS_URL",
  "CORS_ORIGIN",
  "PORT",
] as const;

export function validateEnv(): void {
  const missing = required.filter((k) => !process.env[k] || process.env[k]!.trim() === "");
  if (missing.length) {
    logger.error("Missing required env", { missing });
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
  for (const k of optional) {
    if (process.env[k] !== undefined && process.env[k]!.trim() === "") {
      logger.warn("Optional env is empty", { key: k });
    }
  }
}

export function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL?.trim() || undefined;
}
