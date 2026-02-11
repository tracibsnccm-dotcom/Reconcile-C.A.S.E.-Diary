// src/lib/legalLockdown.ts

import { AppState, Flag, Task } from "./models";
import { calculate10VsSummary } from "./vEngine";

/**
 * Legal & Compliance "Lock-Down" Engine
 *
 * Purpose:
 *  - Decide whether it is safe to generate / release external reports
 *    (e.g., attorney summary, provider report, payer-facing report).
 *  - Enforce your rule:
 *      "No report goes out if critical clinical/safety checks are missing."
 *
 * This does NOT replace clinical judgment. It provides a consistent,
 * defensible checklist that Supervisor / QMP / RN CM can see.
 */

export type LockdownRiskLevel = "LOW" | "MODERATE" | "HIGH";

export interface LockdownIssue {
  code:
    | "OPEN_CRITICAL_FLAGS"
    | "OPEN_HIGH_FLAGS"
    | "UNRESOLVED_VIGILANCE"
    | "LOW_VITALITY"
    | "OPEN_TASKS"
    | "OVERDUE_TASKS"
    | "MISSING_VERACITY_ATTESTATION"
    | "MISSING_VERIFICATION_REVIEW"
    | "MISSING_CLIENT_ACK"
    | "OTHER";
  message: string;
  severity: "INFO" | "WARN" | "BLOCK";
}

export interface LegalLockdownResult {
  canRelease: boolean;
  riskLevel: LockdownRiskLevel;
  issues: LockdownIssue[];
}

/**
 * Helper: summarize open flags.
 */
function summarizeOpenFlags(flags: Flag[]) {
  const open = flags.filter((f) => f.status === "Open");
  const critical = open.filter((f) => f.severity === "Critical");
  const high = open.filter((f) => f.severity === "High");
  const vigilanceFlags = open.filter((f) =>
    (f.type || "").toLowerCase().includes("vigilance")
  );
  return { open, critical, high, vigilanceFlags };
}

/**
 * Helper: summarize open / overdue tasks.
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
 * Placeholder for Veracity (V4) and Verification (V8) checks.
 * In the future, this can be wired to explicit fields in the model.
 */
function checkVeracityAndVerification(state: AppState): LockdownIssue[] {
  const issues: LockdownIssue[] = [];

  // If you later add explicit fields like:
  // state.client.veracityAttested, state.client.verificationReviewComplete, etc.
  // you can replace this logic with real checks.

  // For now, we create WARN-level placeholders that remind QMP to confirm.
  issues.push({
    code: "MISSING_VERACITY_ATTESTATION",
    severity: "WARN",
    message:
      "Veracity (V4) attestation not explicitly recorded. QMP / Supervisor should confirm integrity and completeness of clinical narrative before external release.",
  });

  issues.push({
    code: "MISSING_VERIFICATION_REVIEW",
    severity: "WARN",
    message:
      "Verification (V8) guideline/variance review is not explicitly recorded. Confirm any ODG/MCG variances and payer-related decisions are documented.",
  });

  return issues;
}

/**
 * Placeholder for client acknowledgment / consent checks.
 */
function checkClientAcknowledgement(state: AppState): LockdownIssue[] {
  const issues: LockdownIssue[] = [];

  // In future, this should look at a real acknowledgment log / latest follow-up.
  // For now, we enforce a WARN-level reminder.
  issues.push({
    code: "MISSING_CLIENT_ACK",
    severity: "WARN",
    message:
      "Most recent client acknowledgment / consent status is not explicitly linked to this report. Confirm that client has been informed and consent status is current before release.",
  });

  return issues;
}

/**
 * Core Legal Lock-Down decision.
 *
 * BLOCK conditions:
 *  - Any open Critical flags.
 *  - Any open High flags directly tied to safety / vigilance.
 *  - Vitality in the Red zone (< 4.0) without explanation.
 *  - Overdue clinical/safety tasks.
 *
 * WARN conditions:
 *  - Amber vitality.
 *  - Open non-safety tasks.
 *  - Missing explicit Veracity/Verification checks.
 */
export function evaluateLegalLockdown(state: AppState): LegalLockdownResult {
  const issues: LockdownIssue[] = [];

  const flagSummary = summarizeOpenFlags(state.flags);
  const taskSummary = summarizeOpenTasks(state.tasks);
  const vsSummary = calculate10VsSummary(state);

  const vitality = vsSummary.vitalityScore ?? 5;
  const ragStatus = vsSummary.ragStatus || "Amber";
  const vigilanceRisk = vsSummary.vigilanceRiskCategory || "Moderate";

  // 1) Hard BLOCKS – these must be resolved or explicitly overridden
  if (flagSummary.critical.length > 0) {
    issues.push({
      code: "OPEN_CRITICAL_FLAGS",
      severity: "BLOCK",
      message:
        "There are open CRITICAL flags. Resolve or document explicit exception before releasing external reports.",
    });
  }

  if (flagSummary.high.length > 0) {
    issues.push({
      code: "OPEN_HIGH_FLAGS",
      severity: "BLOCK",
      message:
        "There are open HIGH severity flags. These should be resolved, downgraded with rationale, or clearly addressed before report release.",
    });
  }

  if (vigilanceRisk === "High") {
    issues.push({
      code: "UNRESOLVED_VIGILANCE",
      severity: "BLOCK",
      message:
        "Vigilance risk is HIGH. Confirm that safety/monitoring plans are current and clearly documented before releasing reports.",
    });
  }

  const overdueTasks = taskSummary.overdue;
  if (overdueTasks.length > 0) {
    issues.push({
      code: "OVERDUE_TASKS",
      severity: "BLOCK",
      message:
        "There are overdue clinical or safety tasks. Reports should not be released until overdue tasks are addressed or exception-documented.",
    });
  }

  if (vitality < 4) {
    issues.push({
      code: "LOW_VITALITY",
      severity: "BLOCK",
      message:
        "Vitality is in the Red zone (< 4.0). Case appears clinically unstable or stalled; external reporting should reflect current instability or be delayed until reassessed.",
    });
  }

  // 2) WARN-level issues (do not strictly block, but should be reviewed)
  if (vitality >= 4 && vitality < 8) {
    issues.push({
      code: "LOW_VITALITY",
      severity: "WARN",
      message:
        "Vitality is in the Amber zone (4.0–7.9). Ensure that external reports accurately reflect active issues and ongoing interventions.",
    });
  }

  if (taskSummary.open.length > 0) {
    issues.push({
      code: "OPEN_TASKS",
      severity: "WARN",
      message:
        "There are open RN CM tasks. Confirm that these are appropriately described in the report or clearly documented as ongoing work.",
    });
  }

  // 3) Veracity & Verification checks (placeholders)
  issues.push(...checkVeracityAndVerification(state));

  // 4) Client acknowledgment / consent checks (placeholder)
  issues.push(...checkClientAcknowledgement(state));

  // Determine overall risk level and canRelease
  const hasBlock = issues.some((i) => i.severity === "BLOCK");
  const hasWarn = issues.some((i) => i.severity === "WARN");

  let riskLevel: LockdownRiskLevel = "LOW";
  if (hasBlock) {
    riskLevel = "HIGH";
  } else if (hasWarn) {
    riskLevel = "MODERATE";
  }

  return {
    canRelease: !hasBlock,
    riskLevel,
    issues,
  };
}
