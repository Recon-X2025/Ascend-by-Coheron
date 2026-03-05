import type { Context } from "hono";
import { logger } from "@/server/utils/logger";

export function apiErrorHandler(err: Error, c: Context): Response {
  logger.error("Unhandled error", { error: err.message, path: c.req.path });
  return c.json(
    {
      success: false,
      error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
    },
    500
  );
}
