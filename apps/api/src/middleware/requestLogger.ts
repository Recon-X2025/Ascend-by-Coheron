/**
 * Log incoming requests and responses. Includes requestId for correlation.
 */
import type { Context, Next } from "hono";
import { logger } from "../utils/logger.js";

export async function requestLogger(c: Context<{ Variables: { requestId?: string } }>, next: Next): Promise<void> {
  const requestId = c.get("requestId");
  const method = c.req.method;
  const path = c.req.path;
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  const status = c.res.status;
  logger.info({ requestId, method, path, status, ms }, "request");
}
