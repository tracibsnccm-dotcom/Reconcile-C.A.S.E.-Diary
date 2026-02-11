/**
 * Client: Resolve client profile by auth_user_id.
 * Resolves via rc_users (auth_user_id) -> rc_clients (user_id = rc_users.id).
 * Source of truth for auth-based client flows. Identity is stable via auth_user_id.
 *
 * - resolveClientByAuthUserId(authUserId)
 * - No row -> CANNOT_ACCESS_ACCOUNT from clientMessaging (premium, legally neutral).
 */

import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/lib/rnUtils";
import { CANNOT_ACCESS_ACCOUNT } from "@/config/clientMessaging";

export type RcClientsRow = {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  [key: string]: unknown;
};

export type ResolveClientResult =
  | { ok: true; clientId: string; row: RcClientsRow }
  | { ok: false; error: string };

/**
 * Resolve Client from rc_users -> rc_clients by auth user id.
 * - Validates authUserId as UUID
 * - Queries rc_users by auth_user_id, then rc_clients by user_id = rc_users.id
 * - No row -> CANNOT_ACCESS_ACCOUNT (clientMessaging)
 */
export async function resolveClientByAuthUserId(authUserId: string): Promise<ResolveClientResult> {
  if (!isValidUuid(authUserId)) {
    return { ok: false, error: "Client resolve failed: Invalid auth user id." };
  }

  try {
    const { data: rcUser, error: rcUserError } = await supabase
      .from("rc_users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

    if (rcUserError) {
      return { ok: false, error: `Client resolve failed: ${rcUserError.message}` };
    }
    if (!rcUser?.id) {
      return { ok: false, error: CANNOT_ACCESS_ACCOUNT };
    }

    const { data: client, error: clientError } = await supabase
      .from("rc_clients")
      .select("id,user_id,first_name,last_name")
      .eq("user_id", rcUser.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (clientError) {
      return { ok: false, error: `Client resolve failed: ${clientError.message}` };
    }
    if (!client?.id) {
      return { ok: false, error: CANNOT_ACCESS_ACCOUNT };
    }

    const r = client as RcClientsRow;
    return { ok: true, clientId: r.id, row: r };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `Client resolve failed: ${msg}` };
  }
}
