/**
 * Phase 1: Client update completion signal for follow-up care plan cycle.
 * "Completed" = client submitted update OR clicked "No updates right now."
 * Call this when the client portal records either action so the due+48h attorney nudge is not sent.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Marks the given care plan's client_update_status as 'completed'.
 * Call when the client submits their update form or clicks "No updates right now."
 */
export async function recordCarePlanClientUpdateComplete(
  supabase: SupabaseClient,
  carePlanId: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("rc_care_plans")
    .update({ client_update_status: "completed", updated_at: new Date().toISOString() })
    .eq("id", carePlanId);

  if (error) {
    console.error("[recordCarePlanClientUpdateComplete]", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
