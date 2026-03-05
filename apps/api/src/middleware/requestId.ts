/**
 * Attach x-request-id to every request and response. Used for tracing and log correlation.
 */
import type { Context, Next } from "hono";

const HEADER = "x-request-id";

export async function requestId(c: Context<{ Variables: { requestId?: string } }>, next: Next): Promise<void> {
  const id = c.req.header(HEADER) ?? crypto.randomUUID();
  c.set("requestId", id);
  await next();
  c.res.headers.set(HEADER, id);
}
