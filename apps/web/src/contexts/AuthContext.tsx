/**
 * Custom auth context for Vite SPA: uses GET /api/auth/session (no NextAuth SessionProvider).
 * Exposes user, isLoading, signIn(), signOut(), and refetch().
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchSession, type AuthUser } from "@/lib/authSession";

export type { AuthUser };

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    const sessionUser = await fetchSession();
    setUser(sessionUser);
    return undefined;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const sessionUser = await fetchSession();
      if (!cancelled) {
        setUser(sessionUser);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(() => {
    window.location.href = "/api/auth/signin/google";
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/signout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    signIn,
    signOut,
    refetch,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// Hook exported from same file as provider; fast-refresh prefers hooks in a separate file but AuthProvider needs the context
// eslint-disable-next-line react-refresh/only-export-components -- useAuthContext is the public hook consumed by useAuth
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
