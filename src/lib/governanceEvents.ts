// ============================================================================
// GOVERNANCE EVENT CONSTANTS — Assignment Lifecycle
// Stage 1: Constants + audit helper. No UI wiring for RN events yet.
// ============================================================================

// Active in Stage 1 (fired by code)
export const GOV_RN_ASSIGNED_TO_CASE = "RN_ASSIGNED_TO_CASE";

// Reserved for Stage 2+ (constants only, not fired yet)
export const GOV_RN_ACCEPTED_ASSIGNMENT = "RN_ACCEPTED_ASSIGNMENT";
export const GOV_RN_DECLINED_ASSIGNMENT = "RN_DECLINED_ASSIGNMENT";
export const GOV_ACK_NOTE_SENT = "ACK_NOTE_SENT";

// Stage 2.5: Supervisor operational controls
export const GOV_RN_UNASSIGNED_FROM_CASE = "RN_UNASSIGNED_FROM_CASE";
export const GOV_RN_REASSIGNED_TO_CASE = "RN_REASSIGNED_TO_CASE";
export const GOV_RN_NUDGED_BY_SUPERVISOR = "RN_NUDGED_BY_SUPERVISOR";

export type UnassignReasonCode =
  | "declined"
  | "sla_breach"
  | "coverage"
  | "supervisor_override"
  | "legacy_repair"
  | "other";

export type NudgeType =
  | "acceptance_overdue"
  | "notify_overdue"
  | "declined_followup"
  | "general";

// Reason codes for assignment
export type AssignmentReasonCode =
  | "initial_assignment"
  | "reassignment"
  | "coverage"
  | "declined_followup"
  | "supervisor_adjustment";

// Standard governance meta shape
export interface GovernanceAssignmentMeta {
  governance: true;
  assignment_epoch_id: string;
  assigned_rn_auth_user_id: string;
  assigned_rn_display: {
    rn_id: string | null;
    full_name: string | null;
  };
  reason_code: AssignmentReasonCode;
  reason_text?: string;
}

// Reserved meta shapes for Stage 2+
export interface GovernanceAcceptanceMeta {
  governance: true;
  assignment_epoch_id: string;
  assigned_rn_auth_user_id: string;
}

export interface GovernanceDeclineMeta {
  governance: true;
  assignment_epoch_id: string;
  assigned_rn_auth_user_id: string;
  reason_code: string;
  reason_text?: string;
}

export interface GovernanceAckNoteMeta {
  governance: true;
  assignment_epoch_id: string;
  assigned_rn_auth_user_id: string;
  sent_by_role: "rn" | "supervisor";
  sent_to: string[];
}

/**
 * Generate a unique epoch ID for an assignment.
 * Each new assignment or reassignment gets a fresh epoch.
 */
export function generateEpochId(): string {
  return crypto.randomUUID();
}
