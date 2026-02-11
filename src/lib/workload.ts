// src/lib/workload.ts

/**
 * RN Workload / Complexity Engine
 *
 * This module is intentionally designed so that:
 * - Max workload is a Director-controlled setting (not editable by RN CM or Supervisor).
 * - It uses case severity (L1–L4) from the 10-Vs engine to compute complexity points.
 * - It can later be connected to a real org_settings table and multi-case dashboard.
 */

export type WorkloadStatus = "Green" | "Amber" | "Red";

export interface WorkloadSettings {
  /** Director-controlled max complexity points per RN CM. */
  maxPointsPerRn: number;
  /**
   * Amber threshold as a fraction of max.
   * Example: 0.7 → Amber when ≥70% of maxPointsPerRn.
   */
  amberThresholdFraction: number;
}

/**
 * Default workload settings.
 *
 * NOTE: In production, this should come from an org-level settings table
 * that is editable only by Director-level users. Supervisors and RN CMs
 * should see these values as read-only.
 */
export const defaultWorkloadSettings: WorkloadSettings = {
  maxPointsPerRn: 15,
  amberThresholdFraction: 0.7,
};

/**
 * Map severity level (L1–L4) to complexity points.
 *
 * You defined:
 *  - Level 1 (Simple)           → 1 point
 *  - Level 2 (Moderate)         → 2 points
 *  - Level 3 (Complex)          → 3 points
 *  - Level 4 (Severely Complex) → 4 points
 */
export const getCaseComplexityPoints = (severityLevel: 1 | 2 | 3 | 4): number => {
  switch (severityLevel) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 3:
      return 3;
    case 4:
    default:
      return 4;
  }
};

export interface RnCaseSeverityInput {
  rnId: string;
  severityLevel: 1 | 2 | 3 | 4;
}

export interface RnWorkloadSummary {
  rnId: string;
  totalPoints: number;
  maxPoints: number;
  utilizationFraction: number; // 0.0 – 1.0
  utilizationPercent: number;  // 0 – 100
  status: WorkloadStatus;
}

/**
 * Compute complexity workload for a given RN across a set of cases.
 *
 * In the current sandbox (single-client app), you'll typically call this with
 * a single case assigned to a placeholder RN (e.g., "rn-1").
 *
 * In production, this would be called with a full case list for each RN.
 */
export function computeRnWorkload(
  cases: RnCaseSeverityInput[],
  rnId: string,
  settings: WorkloadSettings = defaultWorkloadSettings
): RnWorkloadSummary {
  const relevantCases = cases.filter((c) => c.rnId === rnId);
  const totalPoints = relevantCases.reduce(
    (sum, c) => sum + getCaseComplexityPoints(c.severityLevel),
    0
  );

  const maxPoints = settings.maxPointsPerRn;
  const utilizationFraction = maxPoints > 0 ? totalPoints / maxPoints : 0;
  const utilizationPercent = Math.round(utilizationFraction * 100);

  let status: WorkloadStatus = "Green";
  if (utilizationFraction >= 1) {
    status = "Red";
  } else if (utilizationFraction >= settings.amberThresholdFraction) {
    status = "Amber";
  }

  return {
    rnId,
    totalPoints,
    maxPoints,
    utilizationFraction,
    utilizationPercent,
    status,
  };
}
