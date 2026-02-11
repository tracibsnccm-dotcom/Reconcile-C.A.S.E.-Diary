/**
 * RN Block 3 — Phase-1 Step 1: System Governance Note Generator
 *
 * Immutable governance events for RN team changes, case team changes,
 * supervisor handoffs, etc. Stored in audit_logs (no schema changes).
 *
 * @example (Step 2+ usage — supervisor handoff initiation)
 * ```ts
 * await recordGovernanceEvent({
 *   event_type: 'SUPERVISOR_HANDOFF_INITIATED',
 *   case_id: caseId,
 *   actor_user_id: currentSupervisorId,
 *   actor_role: 'supervisor',
 *   before: { assigned_rn_id: oldRnId, supervisor_id: currentSupervisorId },
 *   after: { assigned_rn_id: null, handoff_pending_to: newRnId },
 *   reason_code: 'WORKLOAD_REBALANCE',
 *   reason_text: 'Handoff for workload rebalance',
 * });
 * ```
 */

import { supabase } from "@/integrations/supabase/client";

export type GovernanceEventType =
  | "RN_TEAM_CHANGED"
  | "CASE_TEAM_CHANGED"
  | "RN_ASSIGNED_TO_CASE"
  | "RN_REMOVED_FROM_CASE"
  | "SUPERVISOR_HANDOFF_INITIATED"
  | "SUPERVISOR_HANDOFF_ACCEPTED"
  | "RN_CASE_ACKNOWLEDGED"
  | "RN_TEAM_CHANGE_INITIATED"
  | "RN_TEAM_CHANGE_BLOCKED_ACTIVE_CASES"
  | "RN_TEAM_CHANGE_COMPLETED"
  | "MODE_C_STARTED"
  | "MODE_C_DECISIONS_APPLIED"
  | "MODE_C_COMPLETED"
  | "RN_OUTREACH_ATTEMPT_RECORDED";

export type GovernanceActorRole = "supervisor" | "manager" | "director";

export interface GovernanceEventPayload {
  event_type: GovernanceEventType;
  case_id: string;
  actor_user_id: string;
  actor_role: GovernanceActorRole;
  occurred_at?: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  reason_code?: string;
  reason_text?: string;
}

const VALID_EVENT_TYPES: GovernanceEventType[] = [
  "RN_TEAM_CHANGED",
  "CASE_TEAM_CHANGED",
  "RN_ASSIGNED_TO_CASE",
  "RN_REMOVED_FROM_CASE",
  "SUPERVISOR_HANDOFF_INITIATED",
  "SUPERVISOR_HANDOFF_ACCEPTED",
  "RN_CASE_ACKNOWLEDGED",
  "RN_TEAM_CHANGE_INITIATED",
  "RN_TEAM_CHANGE_BLOCKED_ACTIVE_CASES",
  "RN_TEAM_CHANGE_COMPLETED",
  "MODE_C_STARTED",
  "MODE_C_DECISIONS_APPLIED",
  "MODE_C_COMPLETED",
  "RN_OUTREACH_ATTEMPT_RECORDED",
];

const VALID_ACTOR_ROLES: GovernanceActorRole[] = [
  "supervisor",
  "manager",
  "director",
];

function validatePayload(payload: unknown): asserts payload is GovernanceEventPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("GovernanceEventPayload must be a non-null object");
  }
  const p = payload as Record<string, unknown>;

  if (!p.event_type || typeof p.event_type !== "string") {
    throw new Error("GovernanceEventPayload.event_type is required and must be a string");
  }
  if (!VALID_EVENT_TYPES.includes(p.event_type as GovernanceEventType)) {
    throw new Error(
      `GovernanceEventPayload.event_type must be one of: ${VALID_EVENT_TYPES.join(", ")}`
    );
  }

  if (!p.case_id || typeof p.case_id !== "string") {
    throw new Error("GovernanceEventPayload.case_id is required and must be a string");
  }

  if (!p.actor_user_id || typeof p.actor_user_id !== "string") {
    throw new Error("GovernanceEventPayload.actor_user_id is required and must be a string");
  }

  if (!p.actor_role || typeof p.actor_role !== "string") {
    throw new Error("GovernanceEventPayload.actor_role is required and must be a string");
  }
  if (!VALID_ACTOR_ROLES.includes(p.actor_role as GovernanceActorRole)) {
    throw new Error(
      `GovernanceEventPayload.actor_role must be one of: ${VALID_ACTOR_ROLES.join(", ")}`
    );
  }

  if (p.before === undefined || p.before === null) {
    throw new Error("GovernanceEventPayload.before is required");
  }
  if (typeof p.before !== "object" || Array.isArray(p.before)) {
    throw new Error("GovernanceEventPayload.before must be an object");
  }

  if (p.after === undefined || p.after === null) {
    throw new Error("GovernanceEventPayload.after is required");
  }
  if (typeof p.after !== "object" || Array.isArray(p.after)) {
    throw new Error("GovernanceEventPayload.after must be an object");
  }
}

/**
 * Records an immutable governance event. Uses audit_logs table (authenticated session).
 * Governance notes are system records and are not editable by users.
 */
export async function recordGovernanceEvent(
  payload: GovernanceEventPayload
): Promise<{ id: string }> {
  validatePayload(payload);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("recordGovernanceEvent requires an authenticated session");
  }

  const meta: Record<string, any> = {
    governance: true,
    before: payload.before,
    after: payload.after,
  };
  if (payload.reason_code) meta.reason_code = payload.reason_code;
  if (payload.reason_text) meta.reason_text = payload.reason_text;
  if (payload.occurred_at) meta.occurred_at = payload.occurred_at;

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      action: payload.event_type,
      actor_id: payload.actor_user_id,
      actor_role: payload.actor_role,
      case_id: payload.case_id,
      meta,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to record governance event: ${error.message}`);
  }

  return { id: String(data.id) };
}
