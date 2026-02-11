import { useState } from "react";
import { useAuth } from "../auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { RCMS, btn } from "../constants/brand";

export default function Access() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const switchMode = params.has("switch");
  const redirectTo = params.get("redirect") || "/client-portal";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // If already signed in, redirect to requested route or client-portal unless explicitly switching accounts
  if (session && user && !switchMode) {
    return <Navigate to={redirectTo} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setErr(null);
    
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password: pw,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        setMsg("Account created! You can now log in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: pw,
        });
        if (error) throw error;
        // Redirect to requested route or default to /client-portal
        navigate(redirectTo, { replace: true });
        return;
      }
    } catch (ex: any) {
      setErr(ex.message || String(ex));
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-extrabold" style={{color: RCMS.brandNavy}}>
          Access Reconcile C.A.R.E.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in or create an account. New users receive the <span className="font-semibold">CLIENT</span> role by default; firms can add additional roles.
        </p>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex gap-2">
            <button
              className={`${btn.base} ${btn.sm} ${mode==="login" ? "text-white" : "text-muted-foreground"} ${mode==="login" ? "" : "bg-muted"} `}
              style={{ backgroundColor: mode==="login" ? RCMS.brandNavy : undefined }}
              type="button"
              onClick={()=>setMode("login")}
            >
              Log in
            </button>
            <button
              className={`${btn.base} ${btn.sm} ${mode==="signup" ? "text-white" : "text-muted-foreground"} ${mode==="signup" ? "" : "bg-muted"} `}
              style={{ backgroundColor: mode==="signup" ? RCMS.brandTeal : undefined }}
              type="button"
              onClick={()=>setMode("signup")}
            >
              Sign up
            </button>
          </div>

          {/* Login Instructions */}
          <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-foreground font-medium mb-1">
              Login requires Email + Password.
            </p>
            <p className="text-xs text-muted-foreground">
              Attorney/Nurse number is not a login credential (used for identification only).
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Email</label>
              <input
                type="email"
                required
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none focus:border-ring"
                value={pw}
                onChange={(e)=>setPw(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`${btn.base} ${btn.lg} text-white w-full`}
              style={{ backgroundColor: loading ? "#9ca3af" : RCMS.attorneyOrange }}
            >
              {mode==="signup" ? "Create account" : "Log in"}
            </button>
          </form>

          {msg && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}

          <div className="mt-6">
            <a href="/logout" className="text-xs underline text-muted-foreground">Sign out</a>
          </div>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          By continuing, you agree to RCMS's Minimum Necessary Data Policy and Terms.
        </p>
      </div>
    </div>
  );
}
