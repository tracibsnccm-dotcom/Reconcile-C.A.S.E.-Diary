/**
 * Purge expired client intakes (7-day HIPAA compliance).
 *
 * SCHEDULING: This function should be scheduled via Supabase cron (pg_cron)
 * to run daily at midnight UTC. Configure in Supabase Dashboard:
 * Database → Extensions → pg_cron, then add a cron job that invokes this
 * Edge Function (e.g. via pg_net or external cron calling the function URL).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase env vars" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffIso = cutoff.toISOString();

  try {
    // Query rc_client_intakes where intake_status = 'submitted_pending_attorney'
    // and created_at is older than 7 days
    const { data: expiredIntakes, error: fetchErr } = await supabase
      .from("rc_client_intakes")
      .select("id, case_id, created_at")
      .eq("intake_status", "submitted_pending_attorney")
      .lt("created_at", cutoffIso);

    if (fetchErr) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch expired intakes", details: fetchErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const intakes = expiredIntakes ?? [];
    let purgedCount = 0;

    for (const intake of intakes) {
      const caseId = intake.case_id;
      if (!caseId) continue;

      // Delete associated rc_client_intake_sessions (draft/PHI data)
      const { error: deleteSessionsErr } = await supabase
        .from("rc_client_intake_sessions")
        .delete()
        .eq("case_id", caseId);

      if (deleteSessionsErr) {
        console.error(`Failed to delete sessions for case ${caseId}:`, deleteSessionsErr);
        continue;
      }

      // Update rc_client_intakes.intake_status to 'expired_purged'
      const { error: updateIntakeErr } = await supabase
        .from("rc_client_intakes")
        .update({ intake_status: "expired_purged" })
        .eq("id", intake.id);

      if (updateIntakeErr) {
        console.error(`Failed to update intake ${intake.id}:`, updateIntakeErr);
        continue;
      }

      // Update rc_cases.case_status to 'expired'
      const { error: updateCaseErr } = await supabase
        .from("rc_cases")
        .update({ case_status: "expired" })
        .eq("id", caseId);

      if (updateCaseErr) {
        console.error(`Failed to update case ${caseId}:`, updateCaseErr);
        continue;
      }

      // Write to rc_audit_logs
      await supabase.from("rc_audit_logs").insert({
        action: "intake_expired_7day_purge",
        actor_role: "system",
        actor_id: null,
        case_id: caseId,
        meta: { intake_id: intake.id, created_at: intake.created_at },
        created_at: new Date().toISOString(),
      });

      purgedCount++;
    }

    return new Response(
      JSON.stringify({ purged: purgedCount, total_expired: intakes.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Purge error:", e);
    return new Response(
      JSON.stringify({ error: "Purge failed", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
