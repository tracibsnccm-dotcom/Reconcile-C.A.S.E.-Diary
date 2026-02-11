/**
 * Attorney: Resolve attorney profile from public.rc_users by auth_user_id.
 * Source of truth for Attorney portal gate. Identity is stable via auth_user_id.
 *
 * - resolveAttorneyByAuthUserId: primary path using rc_users.auth_user_id
 * - Requires role = 'attorney'
 */

import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/lib/rnUtils";

export type RcUsersAttorneyRow = {
  id: string;
  auth_user_id: string | null;
  role: string | null;
  full_name: string | null;
};

export type ResolveAttorneyResult =
  | { ok: true; row: RcUsersAttorneyRow }
  | { ok: false; error: string };

/**
 * Resolve Attorney from public.rc_users by auth user id.
 * - Validates authUserId as UUID
 * - Queries rc_users by auth_user_id and role = 'attorney'
 * - No row -> "No Attorney profile found for your auth account. Please contact your administrator."
 */
export async function resolveAttorneyByAuthUserId(authUserId: string): Promise<ResolveAttorneyResult> {
  if (!isValidUuid(authUserId)) {
    return { ok: false, error: "Attorney resolve failed: Invalid auth user id." };
  }

  try {
    const { data, error } = await supabase
      .from("rc_users")
      .select("id,auth_user_id,role,full_name")
      .eq("auth_user_id", authUserId)
      .eq("role", "attorney")
      .maybeSingle();

    if (error) {
      return { ok: false, error: `Attorney resolve failed: ${error.message}` };
    }
    if (!data) {
      return {
        ok: false,
        error: "No Attorney profile found for your auth account. Please contact your administrator.",
      };
    }

    const r = data as RcUsersAttorneyRow;
    return { ok: true, row: r };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Attorney resolve failed: ${msg}` };
  }
}
