/**
 * RN-only: Resolve RN role from public.rc_rns by auth_user_id (primary) or email (fallback).
 * Source of truth for RN portal gate. Identity is stable via auth_user_id.
 *
 * - resolveRNByAuthUserId: primary path using rc_rns.auth_user_id
 * - resolveRNByEmail: fallback only; requires is_active = true
 * - Clears stale RN role/profile cache keys before resolving
 */

import { supabase } from "@/integrations/supabase/client";
import { isValidUuid } from "@/lib/rnUtils";

const RN_CACHE_KEYS = ["rn_profile", "staff_profile", "staff_role"] as const;

/**
 * Clear stale RN role/profile cache keys from sessionStorage and localStorage.
 * Do NOT touch rcms_active_case_id or other unrelated keys.
 */
export function clearRNRoleProfileCache(): void {
  if (typeof sessionStorage === "undefined" && typeof localStorage === "undefined") return;
  for (const k of RN_CACHE_KEYS) {
    try {
      sessionStorage?.removeItem(k);
      localStorage?.removeItem(k);
    } catch {
      // ignore
    }
  }
}

export type RcRnsRow = {
  id: string;
  rn_id: string | null;
  email: string | null;
  is_active: boolean | null;
  is_supervisor: boolean | null;
  supervisor_id: string | null;
  auth_user_id?: string | null;
};

export type ResolveRNResult =
  | { ok: true; is_supervisor: boolean; row: RcRnsRow }
  | { ok: false; error: string };

/**
 * Resolve RN from public.rc_rns by auth user id (primary path for login/supervisor gate).
 * - Validates authUserId as UUID
 * - Queries rc_rns by auth_user_id and is_active = true
 * - No row -> "No RN profile found for your auth account. Please contact your administrator."
 */
export async function resolveRNByAuthUserId(authUserId: string): Promise<ResolveRNResult> {
  if (!isValidUuid(authUserId)) {
    return { ok: false, error: "RN resolve failed: Invalid auth user id." };
  }
  clearRNRoleProfileCache();

  try {
    const { data, error } = await supabase
      .from("rc_rns")
      .select("id,rn_id,email,is_active,is_supervisor,supervisor_id,auth_user_id")
      .eq("auth_user_id", authUserId)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return { ok: false, error: `RN resolve failed: ${error.message}` };
    }
    if (!data) {
      return {
        ok: false,
        error: "No RN profile found for your auth account. Please contact your administrator.",
      };
    }

    const r = data as RcRnsRow;
    return {
      ok: true,
      is_supervisor: !!r.is_supervisor,
      row: r,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `RN resolve failed: ${msg}` };
  }
}

/**
 * Resolve RN from public.rc_rns by auth email (fallback only; prefer resolveRNByAuthUserId).
 * - normalizedEmail = email.trim().toLowerCase()
 * - Filter: lower(trim(email)) ~* normalizedEmail via ilike; is_active = true
 * - No row -> "No RN profile found for this account. Please contact your administrator."
 */
export async function resolveRNByEmail(email: string): Promise<ResolveRNResult> {
  const normalizedEmail = (email ?? "").trim().toLowerCase();
  clearRNRoleProfileCache();

  try {
    const { data, error } = await supabase
      .from("rc_rns")
      .select("id,rn_id,email,is_active,is_supervisor,supervisor_id")
      .ilike("email", normalizedEmail)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      return { ok: false, error: `RN resolve failed: ${error.message}` };
    }
    if (!data) {
      return {
        ok: false,
        error: "No RN profile found for this account. Please contact your administrator.",
      };
    }

    const r = data as RcRnsRow;
    return {
      ok: true,
      is_supervisor: !!r.is_supervisor,
      row: r,
    };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: `RN resolve failed: ${msg}` };
  }
}
