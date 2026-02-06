/**
 * Attorney: Resolve attorney profile from public.rc_users by auth_user_id.
 */
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export type RcUsersAttorneyRow = {
  id: string;
  auth_user_id: string | null;
  role: string | null;
  full_name: string | null;
};

export type ResolveAttorneyResult =
  | { ok: true; row: RcUsersAttorneyRow }
  | { ok: false; error: string };

export async function resolveAttorneyByAuthUserId(authUserId: string): Promise<ResolveAttorneyResult> {
  if (!isValidUuid(authUserId)) {
    return { ok: false, error: "Attorney resolve failed: Invalid auth user id." };
  }
  try {
    const { data, error } = await supabase
      .from("rc_users")
      .select("id,auth_user_id,role,full_name")
      .eq("auth_user_id", authUserId)
      .ilike("role", "attorney")
      .maybeSingle();
    if (error) return { ok: false, error: `Attorney resolve failed: ${error.message}` };
    if (!data) {
      return { ok: false, error: "No Attorney profile found for your auth account. Please contact your administrator." };
    }
    return { ok: true, row: data as RcUsersAttorneyRow };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Attorney resolve failed: ${msg}` };
  }
}
