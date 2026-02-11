// src/lib/caseClosure.ts

import { AppState, Flag, Task } from "./models";
import { calculate10VsSummary } from "./vEngine";

/**
 * Case severity levels (aligned with your spec):
 *
 * Level 1 - Simple
 * Level 2 - Moderate
 * Level 3 - Complex
 * Level 4 - Severely Complex
 */
export type CaseSeverityLevel = 1 | 2 | 3 | 4;

export type CaseClosureType =
  | "RN_CM_TASKS_COMPLETE_PENDING_SETTLEMENT"
  | "FINALIZED_SETTLEMENT"
  | "ADMINISTRATIVE_CLOSURE";

export type AdminClosureReason =
  | "LOST_TO_FOLLOW_UP"
  | "REFUSED_SERVICES"
  | "MOVED_OUT_OF_AREA"
  | "NON_RESPONSIVE_ATTORNEY"
  | "OTHER";

export interface CaseSeverityAssessment {
  level: CaseSeverityLevel;
  label: string;
  rationale: string[];
}

/**
 * A structured recommendation about whether a case is ready for closure
 * from a clinical / RN CM standpoint.
 */
export interface CaseClosureRecommendation {
  canClose: boolean;
  suggestedType: CaseClosureType | null;
  reasons: string[]; // Why / why not
  blockingFlags: Flag[];
  blockingTasks: Task[];
}

/**
 * Helper: count open flags by severity.
 */
function summarizeOpenFlags(flags: Flag[]) {
  const open = flags.filter((f) => f.status === "Open");
  const bySeverity = {
    Critical: open.filter((f) => f.severity === "Critical").length,
    High: open.filter((f) => f.severity === "High").length,
    Moderate: open.filter((f) => f.severity === "Moderate").length,
    Low: open.filter((f) => f.severity === "Low").length,
  };
  const sdoh = open.filter((f) =>
    (f.type || "").toLowerCase().includes("sdoh")
  ).length;
  const psych = open.filter((f) =>
    (f.type || "").toLowerCase().includes("psych")
  ).length;
  return { open, bySeverity, sdoh, psych };
}

/**
 * Helper: summarize open tasks (especially overdue work).
 */
function summarizeOpenTasks(tasks: Task[]) {
  const open = tasks.filter((t) => t.status === "Open");
  const today = new Date().toISOString().slice(0, 10);
  const overdue = open.filter(
    (t) => t.due_date && t.due_date < today
  );
  return { open, overdue };
}

/**
 * Compute a severity level using 10-Vs summary + flags + tasks.
 * This matches your concept:
 *
 * Level 1 - Simple
 * Level 2 - Moderate
 * Level 3 - Complex
 * Level 4 - Severely Complex
 */
export function assessCaseSeverity(state: AppState): CaseSeverityAssessment {
  const vsSummary = calculate10VsSummary(state);
  const flagSummary = summarizeOpenFlags(state.flags);
  const taskSummary = summarizeOpenTasks(state.tasks);

  const rationale: string[] = [];
  let level: CaseSeverityLevel = 1;

  const highOrCriticalFlags =
    flagSummary.bySeverity.High + flagSummary.bySeverity.Critical;
  const hasSignificantSDOH = flagSummary.sdoh > 0;
  const hasPsych = flagSummary.psych > 0;
  const hasOverdueTasks = taskSummary.overdue.length > 0;

  // Use vitality & vigilance from vEngine as indicators
  const vitality = vsSummary.vitalityScore ?? 5;
  const vigilanceRisk = vsSummary.vigilanceRiskCategory || "Moderate";

  // Start at 1 and escalate based on risk factors
  if (highOrCriticalFlags > 0 || hasSignificantSDOH || hasPsych) {
    level = 3;
    rationale.push(
      "Multiple high-risk issues (high/critical flags, SDOH barriers, or psychological comorbidity)."
    );
  }

  if (highOrCriticalFlags >= 2 || (hasSignificantSDOH && hasPsych)) {
    level = 4;
    rationale.push(
      "Severe complexity due to multiple critical risks and compounding barriers."
    );
  }

  if (vitality < 4) {
    // Red vitality
    if (level < 3) level = 3;
    rationale.push("Low vitality score (Red zone). Plan momentum is poor.");
  } else if (vitality < 8) {
    // Amber vitality
    if (level < 2) level = 2;
    rationale.push("Amber vitality score. Active issues still present.");
  } else {
    // Green vitality
    if (level < 2) {
      level = 1;
      rationale.push("High vitality score with good engagement and progress.");
    }
  }

  if (vigilanceRisk === "High") {
    if (level < 3) level = 3;
    rationale.push("High vigilance risk category from V7 (Vigilance).");
  }

  if (hasOverdueTasks) {
    if (level < 2) level = 2;
    rationale.push("Open overdue tasks require active follow-up.");
  }

  if (rationale.length === 0) {
    rationale.push("No major clinical or risk complexity identified.");
  }

  let label = "";
  switch (level) {
    case 1:
      label = "Level 1 – Simple";
      break;
    case 2:
      label = "Level 2 – Moderate";
      break;
    case 3:
      label = "Level 3 – Complex";
      break;
    case 4:
      label = "Level 4 – Severely Complex";
      break;
  }

  return { level, label, rationale };
}

/**
 * Recommend whether the case can be closed from the RN CM standpoint.
 *
 * This does NOT make any legal or settlement decision. It simply checks:
 * - Any open high-risk flags?
 * - Any open or overdue tasks?
 * - 10-Vs vitality / vigilance results
 */
export function recommendCaseClosure(
  state: AppState
): CaseClosureRecommendation {
  const flagSummary = summarizeOpenFlags(state.flags);
  const taskSummary = summarizeOpenTasks(state.tasks);
  const vsSummary = calculate10VsSummary(state);

  const blockingFlags: Flag[] = [];
  const blockingTasks: Task[] = [];
  const reasons: string[] = [];

  // Block if any open Critical or High flags
  const highCritical = flagSummary.open.filter(
    (f) => f.severity === "High" || f.severity === "Critical"
  );
  if (highCritical.length > 0) {
    blockingFlags.push(...highCritical);
    reasons.push(
      "Open High/Critical flags must be addressed or safely closed before case closure."
    );
  }

  // Block if SDOH barriers remain untreated
  if (flagSummary.sdoh > 0) {
    reasons.push(
      "Unresolved SDOH barriers remain. Document disposition or mitigation plan before closure."
    );
  }

  // Block if any open tasks
  if (taskSummary.open.length > 0) {
    blockingTasks.push(...taskSummary.open);
    reasons.push("There are open RN CM tasks that must be resolved or closed.");
  }

  // Block if overdue tasks
  if (taskSummary.overdue.length > 0) {
    reasons.push(
      "One or more tasks are overdue. Overdue items must be resolved or brought current."
    );
  }

  // Consider vitality & vigilance
  const vitality = vsSummary.vitalityScore ?? 5;
  const vigilanceRisk = vsSummary.vigilanceRiskCategory || "Moderate";

  if (vitality < 4) {
    reasons.push(
      "Vitality is in the Red zone. Case should remain open for active management."
    );
  }

  if (vigilanceRisk === "High") {
    reasons.push(
      "Vigilance risk is High. RN CM monitoring is still recommended."
    );
  }

  const hasBlocking =
    blockingFlags.length > 0 ||
    blockingTasks.length > 0 ||
    vitality < 4 ||
    vigilanceRisk === "High";

  if (hasBlocking) {
    return {
      canClose: false,
      suggestedType: null,
      reasons,
      blockingFlags,
      blockingTasks,
    };
  }

  // If no blocking items, from the RN CM standpoint we can recommend:
  // "RN CM Tasks Complete – Pending Settlement"
  reasons.push(
    "All RN CM tasks and high-risk items are resolved. Case may be closed from the RN CM perspective, pending settlement or administrative disposition."
  );

  return {
    canClose: true,
    suggestedType: "RN_CM_TASKS_COMPLETE_PENDING_SETTLEMENT",
    reasons,
    blockingFlags,
    blockingTasks,
  };
}
