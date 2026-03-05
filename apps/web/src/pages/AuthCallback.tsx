import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import AscendLogo from "@/components/ui/AscendLogo";
import { useAuth } from "@/hooks/useAuth";
import { fetchSession } from "@/lib/authSession";

/**
 * NextAuth handles OAuth at /api/auth/callback/google. This route is for when
 * callbackUrl points here: redirect to /dashboard if session exists, else /.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    (async () => {
      const sessionUser = await fetchSession();
      await refetch?.(); // keep context in sync
      navigate(sessionUser ? "/dashboard" : "/", { replace: true });
    })();
  }, [navigate, refetch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-6 flex justify-center">
          <AscendLogo />
        </div>
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
