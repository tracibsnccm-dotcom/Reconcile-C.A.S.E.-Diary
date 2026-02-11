// src/lib/workloadEnforcement.ts

/**
 * Intake Workload Enforcement (Option A — Strict Clinical Ops)
 *
 * - RN CMs cannot override workload rules.
 * - Supervisors can REQUEST override.
 * - Directors can APPROVE or DENY override.
 *
 * NOTE: In this front-end scaffold, we do not yet have
 * a real Supervisor/Director UI or persistence. This
 * module is designed so that your backend and consoles
 * can plug into it later without changing intake logic.
 */

import {
  defaultWorkloadSettings,
  getCaseComplexityPoints,
  WorkloadSettings,
  WorkloadStatus,
} from "./workload";

export interface IntakeWorkloadDecision {
  /**
   * Green / Amber / Red, based on total points vs Director-defined max.
   */
  status: WorkloadStatus;
  /**
   * Whether the intake is allowed to complete and assign the case
   * to the current RN CM.
   */
  allowAssignment: boolean;
  /**
   * Whether this case must be included in Supervisor / QMP review
   * due to rising workload (Amber or Red).
   */
  requireSupervisorReview: boolean;
  /**
   * Whether a Director override is REQUIRED for this case to be
   * assigned to the RN CM (Red status).
   */
  requireDirectorOverride: boolean;
  /**
   * Message that can be shown directly to the RN CM (no override power).
   */
  messageForRn: string;
  /**
   * Message that can be logged / shown in a Supervisor or Director console.
   */
  messageForSupervisor: string;
}

/**
 * Evaluate intake against RN workload, using Director-defined limits.
 *
 * currentPoints:
 *   The RN's current complexity points BEFORE adding this new case.
 *
 * newCaseSeverity:
 *   Severity level (1–4) suggested by the 10-Vs engine for this case.
 *
 * settings:
 *   Workload settings defined at the Director / org level.
 */
export function evaluateIntakeWorkloadForNewCase(
  currentPoints: number,
  newCaseSeverity: 1 | 2 | 3 | 4,
  settings: WorkloadSettings = defaultWorkloadSettings
): IntakeWorkloadDecision {
  const pointsForNewCase = getCaseComplexityPoints(newCaseSeverity);
  const newTotalPoints = currentPoints + pointsForNewCase;

  const maxPoints = settings.maxPointsPerRn;
  const utilizationFraction = maxPoints > 0 ? newTotalPoints / maxPoints : 0;
  const utilizationPercent = Math.round(utilizationFraction * 100);

  let status: WorkloadStatus = "Green";
  if (utilizationFraction >= 1) {
    status = "Red";
  } else if (utilizationFraction >= settings.amberThresholdFraction) {
    status = "Amber";
  }

  // Option A policy:
  //
  // Green:
  //   - Allow assignment.
  //   - No Supervisor review required solely for workload.
  //
  // Amber:
  //   - Allow assignment.
  //   - Supervisor review REQUIRED (rising workload).
  //
  // Red:
  //   - Do NOT allow assignment.
  //   - Supervisor review REQUIRED.
  //   - Director override REQUIRED to assign case to this RN.

  if (status === "Green") {
    return {
      status,
      allowAssignment: true,
      requireSupervisorReview: false,
      requireDirectorOverride: false,
      messageForRn:
        "Intake completed. Your workload is within Director-defined limits.",
      messageForSupervisor:
        `RN workload at approximately ${utilizationPercent}% of max. ` +
        `No workload-based restriction applied for this intake.`,
    };
  }

  if (status === "Amber") {
    return {
      status,
      allowAssignment: true,
      requireSupervisorReview: true,
      requireDirectorOverride: false,
      messageForRn:
        "Intake completed. Your workload is approaching the Director-defined maximum. A Supervisor review will include this case.",
      messageForSupervisor:
        `RN workload at ~${utilizationPercent}% of max after this case. ` +
        `Include this case in next Supervisor/QMP review and consider ` +
        `rebalancing caseload if additional complex cases are added.`,
    };
  }

  // Red
  return {
    status,
    allowAssignment: false,
    requireSupervisorReview: true,
    requireDirectorOverride: true,
    messageForRn:
      "Unable to complete intake: your workload would exceed the Director-defined maximum for RN caseload complexity. Please notify your Supervisor for further direction.",
    messageForSupervisor:
      `Intake blocked for RN due to workload reaching ~${utilizationPercent}% ` +
      `of Director-defined maximum. A Director override is required to assign ` +
      `this case to the current RN, or the case should be reassigned.`,
  };
}
