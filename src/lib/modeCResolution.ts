/**
 * RN Block 3 — Step 5: Mode C Per-Case Resolution
 *
 * Supervisor/Manager initiated per-case resolution when RN team change is blocked
 * by active cases. No defaults; mixed decisions allowed. Uses existing audit_logs
 * governance persistence. No schema changes.
 */

import { supabase } from "@/integrations/supabase/client";
import { recordGovernanceEvent } from "@/lib/governanceNotes";
import { notifyCareTeamUpdated } from "@/lib/externalCareTeamUpdate";
import {
  getActiveCaseIdsForRn,
  RN_REMOVAL_TARGET,
} from "@/lib/rnTeamChangeWorkflow";

/** Sentinel case_id for system-level governance events. */
const SYSTEM_CASE_ID = "00000000-0000-0000-0000-000000000000";

export type ModeCDecision =
  | "keep_with_outgoing"
  | "move_to_incoming"
  | "unassign";

export type ModeCCaseDecisionMap = Record<string, ModeCDecision>;

const VALID_DECISIONS: ModeCDecision[] = [
  "keep_with_outgoing",
  "move_to_incoming",
  "unassign",
];

function isIsoLike(s: string): boolean {
  if (!s || typeof s !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(
    s
  );
}

/**
 * Records MODE_C_STARTED governance event.
 */
export async function recordModeCStarted(args: {
  actor_user_id: string;
  actor_role: "supervisor" | "manager";
  from_rn_user_id: string;
  to_rn_user_id?: string;
  active_case_ids: string[];
  occurred_at?: string;
}): Promise<{ id: string }> {
  const {
    actor_user_id,
    actor_role,
    from_rn_user_id,
    to_rn_user_id,
    active_case_ids,
    occurred_at,
  } = args;

  if (!from_rn_user_id || typeof from_rn_user_id !== "string") {
    throw new Error("from_rn_user_id is required");
  }
  if (!active_case_ids || !Array.isArray(active_case_ids)) {
    throw new Error("active_case_ids must be a non-empty array");
  }
  if (active_case_ids.length === 0) {
    throw new Error("active_case_ids must not be empty");
  }
  if (occurred_at !== undefined && occurred_at !== null) {
    if (typeof occurred_at !== "string" || !isIsoLike(occurred_at)) {
      throw new Error("occurred_at must be an ISO-like date string when provided");
    }
  }

  const occurred = occurred_at ?? new Date().toISOString();

  return recordGovernanceEvent({
    event_type: "MODE_C_STARTED",
    case_id: SYSTEM_CASE_ID,
    actor_user_id,
    actor_role,
    occurred_at: occurred,
    before: { from_rn_user_id },
    after: {
      to_rn_user_id: to_rn_user_id ?? null,
      active_case_count: active_case_ids.length,
      active_case_ids,
    },
    reason_text: "Mode C per-case resolution started",
  });
}

/**
 * Applies per-case Mode C decisions. Recomputes active cases; validates every
 * active case has a decision; applies only explicitly chosen actions.
 */
export async function applyModeCDecisions(args: {
  actor_user_id: string;
  actor_role: "supervisor" | "manager";
  from_rn_user_id: string;
  to_rn_user_id?: string;
  decisions: ModeCCaseDecisionMap;
  occurred_at?: string;
}): Promise<{ ok: true }> {
  const {
    actor_user_id,
    actor_role,
    from_rn_user_id,
    to_rn_user_id,
    decisions,
    occurred_at,
  } = args;

  if (!from_rn_user_id || typeof from_rn_user_id !== "string") {
    throw new Error("from_rn_user_id is required");
  }
  if (!decisions || typeof decisions !== "object" || Array.isArray(decisions)) {
    throw new Error("decisions must be a non-empty object");
  }
  if (Object.keys(decisions).length === 0) {
    throw new Error("decisions must not be empty");
  }
  if (occurred_at !== undefined && occurred_at !== null) {
    if (typeof occurred_at !== "string" || !isIsoLike(occurred_at)) {
      throw new Error("occurred_at must be an ISO-like date string when provided");
    }
  }

  const occurred = occurred_at ?? new Date().toISOString();

  // Recompute active cases (single source of truth)
  const active_case_ids = await getActiveCaseIdsForRn(from_rn_user_id);

  // Ensure decisions includes EVERY currently active case id
  for (const caseId of active_case_ids) {
    if (!(caseId in decisions)) {
      throw new Error(
        "Mode C requires decisions for all active cases. Missing decision for case: " +
          caseId
      );
    }
    const d = decisions[caseId];
    if (!VALID_DECISIONS.includes(d)) {
      throw new Error(
        `Invalid decision for case ${caseId}: must be one of ${VALID_DECISIONS.join(", ")}`
      );
    }
  }

  // move_to_incoming requires to_rn_user_id (and must not be removal sentinel)
  const hasMoveToIncoming = active_case_ids.some(
    (id) => decisions[id] === "move_to_incoming"
  );
  if (hasMoveToIncoming) {
    if (!to_rn_user_id || to_rn_user_id === RN_REMOVAL_TARGET) {
      throw new Error(
        "move_to_incoming requires a valid incoming RN (to_rn_user_id). Removal-only flow does not support move_to_incoming."
      );
    }
  }

  let applied_case_count = 0;

  for (const caseId of active_case_ids) {
    const decision = decisions[caseId];
    if (decision === "keep_with_outgoing") {
      // do nothing
      continue;
    }
    if (decision === "move_to_incoming") {
      if (!to_rn_user_id || to_rn_user_id === RN_REMOVAL_TARGET) {
        throw new Error(
          "move_to_incoming requires to_rn_user_id to be present and valid"
        );
      }
      const { error } = await supabase
        .from("rc_cases")
        .update({ assigned_rn_id: to_rn_user_id })
        .eq("id", caseId)
        .eq("is_superseded", false);

      if (error) {
        throw new Error(
          `Failed to move case ${caseId} to incoming RN: ${error.message}`
        );
      }
      await notifyCareTeamUpdated({
        case_id: caseId,
        old_rn_user_id: from_rn_user_id,
        new_rn_user_id: to_rn_user_id,
        actor_user_id,
        actor_role,
        occurred_at: occurred,
      });
      applied_case_count++;
    }
    if (decision === "unassign") {
      const { error } = await supabase
        .from("rc_cases")
        .update({ assigned_rn_id: null })
        .eq("id", caseId)
        .eq("is_superseded", false);

      if (error) {
        throw new Error(
          `Failed to unassign RN from case ${caseId}: ${error.message}`
        );
      }
      applied_case_count++;
    }
  }

  // Log MODE_C_DECISIONS_APPLIED
  await recordGovernanceEvent({
    event_type: "MODE_C_DECISIONS_APPLIED",
    case_id: SYSTEM_CASE_ID,
    actor_user_id,
    actor_role,
    occurred_at: occurred,
    before: { from_rn_user_id },
    after: {
      to_rn_user_id: to_rn_user_id ?? null,
      decisions,
      applied_case_count,
    },
    reason_text: "Mode C per-case decisions applied",
  });

  // Log MODE_C_COMPLETED
  await recordGovernanceEvent({
    event_type: "MODE_C_COMPLETED",
    case_id: SYSTEM_CASE_ID,
    actor_user_id,
    actor_role,
    occurred_at: occurred,
    before: { from_rn_user_id },
    after: { to_rn_user_id: to_rn_user_id ?? null },
    reason_text: "Mode C per-case resolution completed",
  });

  return { ok: true };
}
