/**
 * Attorney-only: Single source of truth for case/intake stage labels.
 * Used across attorney dashboard, intake list, case detail, and status cards.
 * DO NOT change workflow behavior — display mapping only.
 *
 * Input: Data already available in attorney views (attorney_attested_at, assigned_rn_id).
 * No new API calls. Optional carePlanReleased if already fetched elsewhere.
 */

export type AttorneyCaseStageInput = {
  /** From rc_client_intakes.attorney_attested_at */
  attorney_attested_at?: string | null;
  /** From rc_cases.assigned_rn_id */
  assigned_rn_id?: string | null;
  /** Optional: if rc_care_plans has submitted/approved for this case (only if already fetched) */
  care_plan_released?: boolean;
  /** Optional: intake_status for edge cases (declined, expired) */
  intake_status?: string | null;
  /** Optional: attorney_confirm_deadline_at for expired check */
  attorney_confirm_deadline_at?: string | null;
};

/** Authoritative attorney-facing stage labels */
export const ATTORNEY_STAGE_LABELS = {
  NOT_ATTESTED: "Intake Submitted — Awaiting Attorney Review",
  APPROVED_AWAITING_RN: "Approved — Awaiting RN Assignment",
  ASSIGNED_AWAITING_PLAN: "Assigned to RN — Awaiting Initial Care Plan",
  CARE_PLAN_RELEASED: "RN Care Plan Released",
  DECLINED: "Declined",
  EXPIRED: "Expired",
} as const;

/**
 * Returns the authoritative stage label for attorney views.
 */
export function getAttorneyCaseStageLabel(input: AttorneyCaseStageInput): string {
  const attested = !!input.attorney_attested_at;
  const hasAssignedRn = !!input.assigned_rn_id;
  const isDeclined = input.intake_status === "attorney_declined_not_client";
  const isExpired =
    !attested &&
    !isDeclined &&
    !!input.attorney_confirm_deadline_at &&
    new Date(input.attorney_confirm_deadline_at).getTime() < Date.now();

  if (isDeclined) return ATTORNEY_STAGE_LABELS.DECLINED;
  if (isExpired) return ATTORNEY_STAGE_LABELS.EXPIRED;
  if (!attested) return ATTORNEY_STAGE_LABELS.NOT_ATTESTED;
  if (input.care_plan_released) return ATTORNEY_STAGE_LABELS.CARE_PLAN_RELEASED;
  if (hasAssignedRn) return ATTORNEY_STAGE_LABELS.ASSIGNED_AWAITING_PLAN;
  return ATTORNEY_STAGE_LABELS.APPROVED_AWAITING_RN;
}
