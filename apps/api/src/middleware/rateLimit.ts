import type { Context, Next } from "hono";

const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(options: { windowMs?: number; max?: number }) {
  const windowMs = options.windowMs ?? 60_000;
  const max = options.max ?? 100;
  return async (c: Context, next: Next): Promise<void | Response> => {
    const key = c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip") ?? "anonymous";
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || now >= entry.resetAt) entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
    entry.count++;
    if (entry.count > max) {
      return c.json({ success: false, data: undefined, error: "Too many requests" }, 429);
    }
    await next();
  };
}

/** Stricter rate limit for AI / resume / job-fit endpoints: 20 requests per minute per IP. */
export const rateLimitStrict = rateLimit({ windowMs: 60_000, max: 20 });
