import { getCookie } from "hono/cookie";
import { decode } from "next-auth/jwt";
import type { Context, Next } from "hono";

const NEXTAUTH_SESSION_COOKIE = "next-auth.session-token";
const NEXTAUTH_SESSION_COOKIE_SECURE = "__Secure-next-auth.session-token";

export type AuthUser = { id: string; name?: string | null; email?: string | null; image?: string | null };

/** Set user on context if valid NextAuth JWT present; does not 401 if missing. */
export async function optionalAuth(c: Context<{ Variables: { user?: AuthUser } }>, next: Next): Promise<void> {
  const token = getCookie(c, NEXTAUTH_SESSION_COOKIE) ?? getCookie(c, NEXTAUTH_SESSION_COOKIE_SECURE);
  if (token) {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    if (secret) {
      try {
        const payload = await decode({ token, secret });
        if (payload?.sub) {
          c.set("user", {
            id: (payload.id as string) ?? payload.sub,
            name: payload.name ?? null,
            email: payload.email ?? null,
            image: payload.picture ?? null,
          });
        }
      } catch {
        // ignore invalid token
      }
    }
  }
  await next();
}
