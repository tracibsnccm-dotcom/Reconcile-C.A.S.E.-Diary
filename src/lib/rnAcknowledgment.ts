/**
 * RN Assignment Acceptance/Decline + Acknowledgment Gate
 *
 * All events write to rc_audit_logs (the only audit table).
 * All events include meta.governance = true and assignment_epoch_id.
 *
 * Stage 2: Replaces broken audit_logs references with rc_audit_logs + correct columns.
 */

import { supabaseInsert } from "@/lib/supabaseRest";
import { supabase } from "@/integrations/supabase/client";
import {
  GOV_RN_ASSIGNED_TO_CASE,
  GOV_RN_ACCEPTED_ASSIGNMENT,
  GOV_RN_DECLINED_ASSIGNMENT,
  GOV_ACK_NOTE_SENT,
} from "@/lib/governanceEvents";

// ── Types ──

export type DeclineReasonCode =
  | "over_limit_score"
  | "capacity_constraint"
  | "schedule_unavailable"
  | "scope_mismatch"
  | "other";

export interface AssignmentEpoch {
  epoch_id: string;
  assigned_at: string;
  assigned_rn_auth_user_id: string;
}

export type AcceptanceState =
  | { status: "no_epoch" }
  | { status: "pending"; epoch: AssignmentEpoch }
  | { status: "accepted"; epoch: AssignmentEpoch; accepted_at: string }
  | { status: "declined"; epoch: AssignmentEpoch; declined_at: string; reason_code: string }
  | { status: "ack_sent"; epoch: AssignmentEpoch; accepted_at: string; ack_sent_at: string };

// ── Read: Get current acceptance state for a case ──

export async function getAcceptanceState(
  case_id: string,
  rn_user_id: string
): Promise<AcceptanceState> {
  const { data: rows, error } = await supabase
    .from("rc_audit_logs")
    .select("action, user_id, details, created_at")
    .eq("case_id", case_id)
    .in("action", [
      GOV_RN_ASSIGNED_TO_CASE,
      GOV_RN_ACCEPTED_ASSIGNMENT,
      GOV_RN_DECLINED_ASSIGNMENT,
      GOV_ACK_NOTE_SENT,
    ])
    .order("created_at", { ascending: false });

  if (error || !rows || rows.length === 0) {
    return { status: "no_epoch" };
  }

  // Step 1: Find latest assignment epoch
  let epoch: AssignmentEpoch | null = null;
  for (const row of rows) {
    if (row.action === GOV_RN_ASSIGNED_TO_CASE) {
      const meta = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
      if (meta?.assigned_rn_auth_user_id === rn_user_id) {
        epoch = {
          epoch_id: meta.assignment_epoch_id ?? "",
          assigned_at: row.created_at,
          assigned_rn_auth_user_id: meta.assigned_rn_auth_user_id,
        };
        break;
      }
    }
  }

  if (!epoch) return { status: "no_epoch" };

  // Step 2: Find accept/decline/ack for this epoch
  let accepted_at: string | null = null;
  let declined_at: string | null = null;
  let decline_reason: string | null = null;
  let ack_sent_at: string | null = null;

  for (const row of rows) {
    const meta = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    if (meta?.assignment_epoch_id !== epoch.epoch_id) continue;

    if (row.action === GOV_RN_ACCEPTED_ASSIGNMENT && !accepted_at) {
      accepted_at = row.created_at;
    }
    if (row.action === GOV_RN_DECLINED_ASSIGNMENT && !declined_at) {
      declined_at = row.created_at;
      decline_reason = meta?.reason_code ?? "unknown";
    }
    if (row.action === GOV_ACK_NOTE_SENT && !ack_sent_at) {
      ack_sent_at = row.created_at;
    }
  }

  if (accepted_at && ack_sent_at) {
    return { status: "ack_sent", epoch, accepted_at, ack_sent_at };
  }
  if (accepted_at) {
    return { status: "accepted", epoch, accepted_at };
  }
  if (declined_at) {
    return { status: "declined", epoch, declined_at, reason_code: decline_reason ?? "unknown" };
  }
  return { status: "pending", epoch };
}

// ── Write: Accept assignment ──

export async function recordAcceptAssignment(args: {
  case_id: string;
  rn_user_id: string;
  epoch_id: string;
}): Promise<void> {
  const meta = {
    governance: true,
    assignment_epoch_id: args.epoch_id,
    assigned_rn_auth_user_id: args.rn_user_id,
  };

  const { error } = await supabaseInsert("rc_audit_logs", {
    action: GOV_RN_ACCEPTED_ASSIGNMENT,
    user_id: args.rn_user_id,
    case_id: args.case_id,
    details: JSON.stringify(meta),
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record acceptance: ${JSON.stringify(error)}`);
  }
}

// ── Write: Decline assignment ──

export async function recordDeclineAssignment(args: {
  case_id: string;
  rn_user_id: string;
  epoch_id: string;
  reason_code: DeclineReasonCode;
  reason_text?: string;
}): Promise<void> {
  const meta: Record<string, unknown> = {
    governance: true,
    assignment_epoch_id: args.epoch_id,
    assigned_rn_auth_user_id: args.rn_user_id,
    reason_code: args.reason_code,
  };
  if (args.reason_code === "other" && args.reason_text) {
    meta.reason_text = args.reason_text;
  }

  const { error } = await supabaseInsert("rc_audit_logs", {
    action: GOV_RN_DECLINED_ASSIGNMENT,
    user_id: args.rn_user_id,
    case_id: args.case_id,
    details: JSON.stringify(meta),
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record decline: ${JSON.stringify(error)}`);
  }
}

// ── Write: ACK note sent ──

export async function recordAckNoteSent(args: {
  case_id: string;
  sender_user_id: string;
  sender_role: "rn" | "supervisor";
  epoch_id: string;
  assigned_rn_auth_user_id: string;
  sent_to: string[];
}): Promise<void> {
  const meta = {
    governance: true,
    assignment_epoch_id: args.epoch_id,
    assigned_rn_auth_user_id: args.assigned_rn_auth_user_id,
    sent_by_role: args.sender_role,
    sent_to: args.sent_to,
  };

  const { error } = await supabaseInsert("rc_audit_logs", {
    action: GOV_ACK_NOTE_SENT,
    user_id: args.sender_user_id,
    case_id: args.case_id,
    details: JSON.stringify(meta),
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record ack note sent: ${JSON.stringify(error)}`);
  }
}

// ── Gate: Assert RN has accepted before clinical actions ──

export async function assertRnAcceptanceGate(args: {
  case_id: string;
  rn_user_id: string;
}): Promise<void> {
  const state = await getAcceptanceState(args.case_id, args.rn_user_id);
  if (state.status === "pending") {
    throw new Error(
      "Assignment acceptance required: Please accept this assignment before performing clinical actions."
    );
  }
  if (state.status === "no_epoch") {
    throw new Error(
      "No assignment event found for this case. Contact your supervisor."
    );
  }
  if (state.status === "declined") {
    throw new Error(
      "This assignment was declined. Contact your supervisor for reassignment."
    );
  }
}

// ── Write: Unassign RN ──

export async function recordUnassign(args: {
  case_id: string;
  supervisor_user_id: string;
  epoch_id: string;
  assigned_rn_auth_user_id: string;
  reason_code: string;
  reason_text?: string;
}): Promise<void> {
  const meta: Record<string, unknown> = {
    governance: true,
    assignment_epoch_id: args.epoch_id,
    assigned_rn_auth_user_id: args.assigned_rn_auth_user_id,
    reason_code: args.reason_code,
  };
  if (args.reason_text) meta.reason_text = args.reason_text;

  const { error } = await supabaseInsert("rc_audit_logs", {
    action: "RN_UNASSIGNED_FROM_CASE",
    user_id: args.supervisor_user_id,
    case_id: args.case_id,
    details: JSON.stringify(meta),
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record unassign: ${JSON.stringify(error)}`);
  }
}

// ── Write: Reassign (metadata event — new RN_ASSIGNED_TO_CASE follows separately) ──

export async function recordReassign(args: {
  case_id: string;
  supervisor_user_id: string;
  old_epoch_id: string | null;
  new_epoch_id: string;
  old_rn_auth_user_id: string;
  new_rn_auth_user_id: string;
  new_rn_display: { rn_id: string | null; full_name: string | null };
  reason_code: string;
  reason_text?: string;
}): Promise<void> {
  const meta: Record<string, unknown> = {
    governance: true,
    previous_assignment_epoch_id: args.old_epoch_id,
    assignment_epoch_id: args.new_epoch_id,
    old_assigned_rn_auth_user_id: args.old_rn_auth_user_id,
    assigned_rn_auth_user_id: args.new_rn_auth_user_id,
    assigned_rn_display: args.new_rn_display,
    reason_code: args.reason_code,
  };
  if (args.reason_text) meta.reason_text = args.reason_text;

  const { error } = await supabaseInsert("rc_audit_logs", {
    action: "RN_REASSIGNED_TO_CASE",
    user_id: args.supervisor_user_id,
    case_id: args.case_id,
    details: JSON.stringify(meta),
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record reassign: ${JSON.stringify(error)}`);
  }
}

// ── Write: Nudge RN ──

export async function recordNudge(args: {
  case_id: string;
  supervisor_user_id: string;
  epoch_id: string;
  assigned_rn_auth_user_id: string;
  nudge_type: string;
  message: string;
}): Promise<void> {
  const meta = {
    governance: true,
    assignment_epoch_id: args.epoch_id,
    assigned_rn_auth_user_id: args.assigned_rn_auth_user_id,
    nudge_type: args.nudge_type,
    message: args.message,
  };

  const { error } = await supabaseInsert("rc_audit_logs", {
    action: "RN_NUDGED_BY_SUPERVISOR",
    user_id: args.supervisor_user_id,
    case_id: args.case_id,
    details: JSON.stringify(meta),
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to record nudge: ${JSON.stringify(error)}`);
  }
}

// ── Legacy epoch repair ──

export async function repairLegacyEpoch(args: {
  case_id: string;
  supervisor_user_id: string;
  assigned_rn_auth_user_id: string;
  assigned_rn_display: { rn_id: string | null; full_name: string | null };
}): Promise<string> {
  const { generateEpochId } = await import("@/lib/governanceEvents");
  const epochId = generateEpochId();

  const meta = {
    governance: true,
    assignment_epoch_id: epochId,
    assigned_rn_auth_user_id: args.assigned_rn_auth_user_id,
    assigned_rn_display: args.assigned_rn_display,
    reason_code: "legacy_repair",
    reason_text: "Epoch created retroactively for legacy assignment without governance event",
  };

  const { error } = await supabaseInsert("rc_audit_logs", {
    action: "RN_ASSIGNED_TO_CASE",
    user_id: args.supervisor_user_id,
    case_id: args.case_id,
    details: JSON.stringify(meta),
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to repair legacy epoch: ${JSON.stringify(error)}`);
  }

  return epochId;
}
