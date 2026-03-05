import { getCookie } from "hono/cookie";
import { decode } from "next-auth/jwt";
import type { Context, Next } from "hono";

const NEXTAUTH_SESSION_COOKIE = "next-auth.session-token";
const NEXTAUTH_SESSION_COOKIE_SECURE = "__Secure-next-auth.session-token";

export type AuthUser = { id: string; name?: string | null; email?: string | null; image?: string | null };

export async function requireAuth(c: Context<{ Variables: { user: AuthUser } }>, next: Next): Promise<void | Response> {
  const token = getCookie(c, NEXTAUTH_SESSION_COOKIE) ?? getCookie(c, NEXTAUTH_SESSION_COOKIE_SECURE);
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) return c.json({ error: "Unauthorized" }, 401);
  try {
    const payload = await decode({ token, secret });
    if (!payload?.sub) return c.json({ error: "Unauthorized" }, 401);
    c.set("user", {
      id: (payload.id as string) ?? payload.sub,
      name: payload.name ?? null,
      email: payload.email ?? null,
      image: payload.picture ?? null,
    });
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}

export async function optionalAuth(c: Context<{ Variables: { user?: AuthUser } }>, next: Next): Promise<void> {
  const token = getCookie(c, NEXTAUTH_SESSION_COOKIE) ?? getCookie(c, NEXTAUTH_SESSION_COOKIE_SECURE);
  if (token && (process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET)) {
    try {
      const payload = await decode({ token, secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET! });
      if (payload?.sub)
        c.set("user", {
          id: (payload.id as string) ?? payload.sub,
          name: payload.name ?? null,
          email: payload.email ?? null,
          image: payload.picture ?? null,
        });
    } catch {
      // ignore
    }
  }
  await next();
}
