import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

export default function Logout() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const run = async () => {
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (e) {
        console.warn('Sign out failed', e);
      } finally {
        setDone(true);
      }
    };
    run();
  }, []);
  return done ? <Navigate to="/access?switch=1" replace /> : <div className="p-6 text-sm text-muted-foreground">Signing you out…</div>;
}
