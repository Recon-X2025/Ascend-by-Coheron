/**
 * Centralized API error handler. All responses follow { success, data?, error? }. No stack traces to client.
 */
import type { Context } from "hono";
import { logger } from "../utils/logger.js";

export function apiErrorHandler(err: Error, c: Context): Response {
  const requestId = c.get("requestId");
  logger.error({ err, requestId, path: c.req.path }, "Unhandled error");
  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  return c.json(
    {
      success: false,
      data: undefined,
      error: message,
    },
    500
  );
}
