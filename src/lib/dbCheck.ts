import { supabase } from "@/integrations/supabase/client";

/**
 * Diagnostic: test connectivity to shared Supabase (rc_users).
 * Remove after confirming connectivity.
 */
export async function testConnection(): Promise<boolean> {
  if (!supabase) {
    console.error("[dbCheck] Supabase client not configured (missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)");
    return false;
  }
  try {
    const { data, error } = await supabase.from("rc_users").select("id").limit(1);
    if (error) {
      console.error("[dbCheck] Query failed:", error.message);
      return false;
    }
    console.log("[dbCheck] Connection OK — rc_users reachable", data !== undefined ? "(rows may be empty)" : "");
    return true;
  } catch (e) {
    console.error("[dbCheck] Connection failed:", e);
    return false;
  }
}
