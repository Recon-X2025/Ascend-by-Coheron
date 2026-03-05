import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import { AscendMark } from "@/react-app/components/AscendMark";
import { CoheronMark } from "@/react-app/components/CoheronMark";
import { useAuth } from "@/react-app/hooks/useAuth";
import { fetchSession } from "@/react-app/lib/authSession";

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
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <AscendMark size={48} variant="color" />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: "'ZalandoSans', sans-serif", fontSize: "20px", fontWeight: 400, letterSpacing: "5px", textTransform: "uppercase", color: "#0A0A0A" }}>
              ASCEND
            </span>
            <CoheronMark width={120} fill="#6B7280" accentFill="#1A7A4A" />
          </div>
        </div>
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
