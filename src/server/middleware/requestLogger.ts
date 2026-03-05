import type { Context, Next } from "hono";
import { logger } from "@/server/utils/logger";

export async function requestLogger(c: Context, next: Next): Promise<void> {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  await next();
  const ms = Date.now() - start;
  const status = c.res.status;
  logger.info("request", { method, path, status, ms });
}
