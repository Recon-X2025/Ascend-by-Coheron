/**
 * Session fetch for SPA. Kept separate so AuthContext only exports the provider and hook.
 */

export type AuthUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  google_user_data?: { given_name?: string; picture?: string; name?: string } | null;
};

export async function fetchSession(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.user ?? null;
}
