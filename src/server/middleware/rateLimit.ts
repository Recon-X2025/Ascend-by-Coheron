/**
 * In-memory rate limiter: max requests per window per key (e.g. IP or user id).
 */
import type { Context, Next } from "hono";

const store = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX = 100;

export function rateLimit(options?: { windowMs?: number; max?: number; key?: (c: Context) => string }) {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const max = options?.max ?? DEFAULT_MAX;
  const keyFn = options?.key ?? ((c: Context) => c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous");

  return async (c: Context, next: Next): Promise<void | Response> => {
    const key = keyFn(c);
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }
    entry.count++;
    if (entry.count > max) {
      return c.json({ success: false, error: "Too many requests" }, 429);
    }
    await next();
  };
}
