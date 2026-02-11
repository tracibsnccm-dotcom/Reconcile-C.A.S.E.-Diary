/**
 * Canonical authority resolver for MFA and other access policies.
 * Phase 1: STAGING-ONLY MFA enforcement via mustEnrollMFA and mustVerifyMFA.
 * Policy: All non-clients require MFA. Enrollment derived from verified TOTP factors.
 * AAL (getAuthenticatorAssuranceLevel) is used to detect sessions that need MFA
 * verification (aal1 with nextLevel aal2), not for enrollment.
 */

import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export type Authority = {
  requiresMFA: boolean;
  enrolled: boolean;
  enrollmentKnown: boolean;
  mustEnrollMFA: boolean;
  /** true when user has enrolled MFA but current session hasn't completed MFA challenge (AAL1) */
  mustVerifyMFA: boolean;
};

/**
 * Resolves authority for the current user.
 * - Clients: requiresMFA=false, mustEnrollMFA=false.
 * - Non-clients: requiresMFA=true.
 * - Enrollment: any totp factor with status === "verified" (from mfa.listFactors).
 * - mustEnrollMFA = requiresMFA && enrolled === false.
 * - On error: enrollmentKnown=false, enrolled=false (do not silently pass as compliant).
 */
export async function resolveAuthority(params: {
  userId: string | null;
  role: string | null;
}): Promise<Authority> {
  const { userId, role } = params;

  const r = (role ?? "").toLowerCase();
  if (r === "client") {
    return {
      requiresMFA: false,
      enrolled: false,
      enrollmentKnown: true,
      mustEnrollMFA: false,
      mustVerifyMFA: false,
    };
  }

  if (!userId || !supabase || !isSupabaseConfigured()) {
    return {
      requiresMFA: true,
      enrolled: false,
      enrollmentKnown: false,
      mustEnrollMFA: true,
      mustVerifyMFA: false,
    };
  }

  try {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      return {
        requiresMFA: true,
        enrolled: false,
        enrollmentKnown: false,
        mustEnrollMFA: true,
        mustVerifyMFA: false,
      };
    }

    const totpFactors = (data?.totp ?? []) as Array<{ status?: string }>;
    const enrolled = totpFactors.some((f) => f.status === "verified");

    const requiresMFA = true;
    const mustEnrollMFA = requiresMFA && !enrolled;

    let mustVerifyMFA = false;
    if (enrolled) {
      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!aalError && aalData) {
        if (
          aalData.currentLevel === "aal1" &&
          aalData.nextLevel === "aal2"
        ) {
          mustVerifyMFA = true;
        }
      }
    }

    return {
      requiresMFA,
      enrolled,
      enrollmentKnown: true,
      mustEnrollMFA,
      mustVerifyMFA: enrolled && mustVerifyMFA,
    };
  } catch {
    return {
      requiresMFA: true,
      enrolled: false,
      enrollmentKnown: false,
      mustEnrollMFA: true,
      mustVerifyMFA: false,
    };
  }
}
