/**
 * Auth hook backed by custom AuthContext (GET /api/auth/session).
 * Exposes user, isPending, redirectToLogin, logout for compatibility with existing components.
 */

import { useAuthContext } from "@/react-app/contexts/AuthContext";

export function useAuth() {
  const { user, isLoading, signIn, signOut, refetch } = useAuthContext();

  return {
    user,
    isPending: isLoading,
    redirectToLogin: signIn,
    logout: signOut,
    refetch,
  };
}
