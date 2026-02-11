/**
 * RN Block 3 — Phase-1 Step 4: RN Team Change Workflow
 *
 * Supervisor/Manager initiated RN Care Manager team-change workflow.
 * Blocks the change when the outgoing RN has active cases; logs governance events.
 * No schema changes; uses audit_logs (meta.governance: true).
 */

import { supabase } from "@/integrations/supabase/client";
import { recordGovernanceEvent } from "@/lib/governanceNotes";

/** Sentinel case_id for system-level governance events (RN team change is not case-specific). */
const SYSTEM_CASE_ID = "00000000-0000-0000-0000-000000000000";

/** Sentinel to_rn_user_id when removing an RN from a team (no replacement). */
const RN_REMOVAL_TARGET = "00000000-0000-0000-0000-000000000001";

/**
 * Canonical "active" case statuses: exclude closed/released (immutable, terminal).
 * Conservative: treat any case not explicitly closed as active.
 * Uses rc_cases.case_status per existing migrations.
 */
const INACTIVE_CASE_STATUSES = ["closed", "released"] as const;

export type RnTeamChangeBlocker =
  | { kind: "none" }
  | { kind: "active_cases"; active_case_ids: string[]; active_case_count: number };

/**
 * Returns case IDs assigned to the given RN that are considered active.
 * Active = not closed/released (conservative: any case not explicitly closed).
 */
export async function getActiveCaseIdsForRn(rn_user_id: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("rc_cases")
    .select("id, case_status")
    .eq("assigned_rn_id", rn_user_id)
    .eq("is_superseded", false);

  if (error) {
    throw new Error(`Failed to fetch active cases for RN: ${error.message}`);
  }

  const rows = (data ?? []) as { id: string; case_status?: string | null }[];
  const active = rows.filter((r) => {
    const s = (r.case_status ?? "").toLowerCase();
    return !INACTIVE_CASE_STATUSES.includes(s as (typeof INACTIVE_CASE_STATUSES)[number]);
  });
  return active.map((r) => r.id);
}

function isIsoLike(s: string): boolean {
  if (!s || typeof s !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(s);
}

/**
 * Attempts an RN team change (e.g. remove RN from team).
 * If the outgoing RN has active cases, blocks and returns { ok: false, blocker }.
 * If no active cases, performs the change and returns { ok: true }.
 */
export async function attemptRnTeamChange(args: {
  actor_user_id: string;
  actor_role: "supervisor" | "manager";
  from_rn_user_id: string;
  to_rn_user_id: string;
  occurred_at?: string;
  /** Callback to perform the actual team change (e.g. delete from rn_team_members). */
  performChange: () => Promise<void>;
}): Promise<{ ok: true } | { ok: false; blocker: RnTeamChangeBlocker }> {
  const { actor_user_id, actor_role, from_rn_user_id, to_rn_user_id, performChange } = args;

  if (!actor_user_id || !actor_role || !from_rn_user_id || !to_rn_user_id) {
    throw new Error("actor_user_id, actor_role, from_rn_user_id, and to_rn_user_id are required");
  }
  if (from_rn_user_id === to_rn_user_id) {
    throw new Error("from_rn_user_id must differ from to_rn_user_id");
  }
  if (args.occurred_at !== undefined && args.occurred_at !== null) {
    if (typeof args.occurred_at !== "string" || !isIsoLike(args.occurred_at)) {
      throw new Error("occurred_at must be an ISO-like date string when provided");
    }
  }

  const occurred_at = args.occurred_at ?? new Date().toISOString();

  // Step A: record RN_TEAM_CHANGE_INITIATED
  await recordGovernanceEvent({
    event_type: "RN_TEAM_CHANGE_INITIATED",
    case_id: SYSTEM_CASE_ID,
    actor_user_id,
    actor_role,
    occurred_at,
    before: { from_rn_user_id },
    after: { to_rn_user_id },
    reason_text: "Team change requested",
  });

  // Step B: compute active cases for from_rn_user_id
  const active_case_ids = await getActiveCaseIdsForRn(from_rn_user_id);

  if (active_case_ids.length > 0) {
    await recordGovernanceEvent({
      event_type: "RN_TEAM_CHANGE_BLOCKED_ACTIVE_CASES",
      case_id: SYSTEM_CASE_ID,
      actor_user_id,
      actor_role,
      occurred_at,
      before: { from_rn_user_id },
      after: {
        to_rn_user_id,
        active_case_count: active_case_ids.length,
        active_case_ids,
      },
      reason_text:
        "Blocked: outgoing RN has active cases; requires per-case resolution (Mode C).",
    });

    return {
      ok: false,
      blocker: {
        kind: "active_cases",
        active_case_ids,
        active_case_count: active_case_ids.length,
      },
    };
  }

  // Step C: no active cases — perform the change
  await performChange();

  await recordGovernanceEvent({
    event_type: "RN_TEAM_CHANGE_COMPLETED",
    case_id: SYSTEM_CASE_ID,
    actor_user_id,
    actor_role,
    occurred_at,
    before: { from_rn_user_id },
    after: { to_rn_user_id },
    reason_text: "RN team change completed",
  });

  return { ok: true };
}

/** Use when removing an RN from a team (no replacement). */
export { RN_REMOVAL_TARGET };
