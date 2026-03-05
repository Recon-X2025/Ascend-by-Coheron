import type { Context, Next } from "hono";

const DEFAULT_MS = 60_000;

export function timeout(ms: number = DEFAULT_MS) {
  return async (c: Context, next: Next): Promise<void> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), ms);
    try {
      c.req.raw.signal?.addEventListener?.("abort", () => controller.abort());
      await next();
    } finally {
      clearTimeout(id);
    }
  };
}
