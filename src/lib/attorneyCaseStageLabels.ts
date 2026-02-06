/**
 * Attorney-only: case/intake stage labels. (Ported from C.A.R.E., no RN labels.)
 */

export type AttorneyCaseStageInput = {
  attorney_attested_at?: string | null;
  assigned_rn_id?: string | null;
  care_plan_released?: boolean;
  intake_status?: string | null;
  attorney_confirm_deadline_at?: string | null;
};

export const ATTORNEY_STAGE_LABELS = {
  NOT_ATTESTED: "Intake Submitted — Awaiting Attorney Review",
  APPROVED_AWAITING_RN: "Approved — Awaiting RN Assignment",
  ASSIGNED_AWAITING_PLAN: "Assigned to RN — Awaiting Initial Care Plan",
  CARE_PLAN_RELEASED: "RN Care Plan Released",
  DECLINED: "Declined",
  EXPIRED: "Expired",
} as const;

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
