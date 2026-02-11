// src/lib/overrides.ts

/**
 * Reconcile C.A.R.E.™ Override & Escalation Engine
 *
 * Supports:
 * - RN → Supervisor requests (1–12)
 * - Supervisor → Director requests (13–19)
 *
 * This module defines:
 * - Override types
 * - Status states
 * - Request payload shape
 * - Basic factory helpers
 *
 * In this front-end sandbox, override requests are created and logged.
 * In production, your backend will persist and route them to the
 * appropriate Supervisor / Director consoles.
 */

///////////////////////
// Type Definitions  //
///////////////////////

/**
 * Who originated the override request.
 */
export type OverrideOrigin = "RN_TO_SUPERVISOR" | "SUPERVISOR_TO_DIRECTOR";

/**
 * Current lifecycle state of the override.
 */
export type OverrideStatus =
  | "Pending"
  | "Approved"
  | "Denied"
  | "MoreInfoRequested";

/**
 * Specific override type.
 *
 * RN → Supervisor (1–12):
 * 1. SEVERITY_CHANGE_REQUEST
 * 2. WORKLOAD_LIMIT_OVERRIDE
 * 3. V_TRIGGER_EXCEPTION
 * 4. HIGH_RISK_SDOH_UNRESOLVED
 * 5. LATE_ASSESSMENT_DOCUMENTATION
 * 6. FOLLOWUP_OVERDUE
 * 7. TASK_OVERDUE
 * 8. CASE_CLOSURE_REQUEST
 * 9. CASE_REOPEN_REQUEST
 * 10. VARIANCE_USE_REQUEST (V8)
 * 11. ADMIN_CLOSURE_REASON_OVERRIDE
 * 12. CRISIS_ESCALATION
 *
 * Supervisor → Director (13–19):
 * 13. SEVERITY_CHANGE_APPROVAL
 * 14. WORKLOAD_OVERRIDE_APPROVAL
 * 15. VARIANCE_APPROVAL
 * 16. LEGAL_LOCKDOWN_APPROVAL
 * 17. COVERAGE_HANDOFF_APPROVAL
 * 18. EXTENDED_FOLLOWUP_APPROVAL
 * 19. OVERRIDE_RAG_BLOCK
 */
export type OverrideType =
  // RN → Supervisor
  | "SEVERITY_CHANGE_REQUEST"
  | "WORKLOAD_LIMIT_OVERRIDE"
  | "V_TRIGGER_EXCEPTION"
  | "HIGH_RISK_SDOH_UNRESOLVED"
  | "LATE_ASSESSMENT_DOCUMENTATION"
  | "FOLLOWUP_OVERDUE"
  | "TASK_OVERDUE"
  | "CASE_CLOSURE_REQUEST"
  | "CASE_REOPEN_REQUEST"
  | "VARIANCE_USE_REQUEST"
  | "ADMIN_CLOSURE_REASON_OVERRIDE"
  | "CRISIS_ESCALATION"
  // Supervisor → Director
  | "SEVERITY_CHANGE_APPROVAL"
  | "WORKLOAD_OVERRIDE_APPROVAL"
  | "VARIANCE_APPROVAL"
  | "LEGAL_LOCKDOWN_APPROVAL"
  | "COVERAGE_HANDOFF_APPROVAL"
  | "EXTENDED_FOLLOWUP_APPROVAL"
  | "OVERRIDE_RAG_BLOCK";

export interface OverrideDecisionLogEntry {
  actorRole: "RN" | "SUPERVISOR" | "DIRECTOR";
  actorId?: string;
  action: "REQUESTED" | "APPROVED" | "DENIED" | "MORE_INFO_REQUESTED";
  reason: string;
  at: string; // ISO timestamp
}

/**
 * Unified override request object. This is what your backend will store.
 */
export interface OverrideRequest {
  id: string;

  // Which case / client this pertains to.
  caseId: string;
  clientName?: string;

  // Actors involved.
  rnId?: string;
  supervisorId?: string;
  directorId?: string;

  origin: OverrideOrigin;
  type: OverrideType;

  // High-level category, e.g. "Workload", "Severity", "Variance".
  category: string;

  // Optional sub-reason classification for reporting, e.g.:
  // "New Comorbidity", "Worsening Condition", "SDOH Barrier", etc.
  reasonCategory?: string;

  // Required narrative from the requester.
  narrative: string;

  // Status & timestamps.
  status: OverrideStatus;
  createdAt: string;
  updatedAt: string;

  // Clinical/operational context at time of request.
  currentSeverityLevel?: 1 | 2 | 3 | 4;
  requestedSeverityLevel?: 1 | 2 | 3 | 4;

  currentRagStatus?: "Red" | "Amber" | "Green";
  currentVitalityScore?: number;

  currentWorkloadPercent?: number;
  rnWorkloadStatus?: "Green" | "Amber" | "Red";

  // Related 10-Vs triggers (e.g., ["V1-VoiceView", "V7-Vigilance"])
  relatedVs?: string[];

  // Free-form metadata bag for future analytics.
  metadata?: Record<string, any>;

  // Timeline of actions.
  decisionLog: OverrideDecisionLogEntry[];
}

////////////////////////////
// Internal ID generator  //
////////////////////////////

let overrideCounter = 0;

function nextOverrideId(): string {
  return `ovr-${Date.now()}-${overrideCounter++}`;
}

///////////////////////
// Factory Helpers   //
///////////////////////

interface BaseOverrideContext {
  caseId: string;
  clientName?: string;
  rnId?: string;
  supervisorId?: string;
  directorId?: string;
  relatedVs?: string[];
  currentSeverityLevel?: 1 | 2 | 3 | 4;
  requestedSeverityLevel?: 1 | 2 | 3 | 4;
  currentRagStatus?: "Red" | "Amber" | "Green";
  currentVitalityScore?: number;
  currentWorkloadPercent?: number;
  rnWorkloadStatus?: "Green" | "Amber" | "Red";
  reasonCategory?: string;
  metadata?: Record<string, any>;
}

/**
 * Generic factory for creating any override request.
 */
export function createOverrideRequest(
  origin: OverrideOrigin,
  type: OverrideType,
  category: string,
  narrative: string,
  ctx: BaseOverrideContext
): OverrideRequest {
  const now = new Date().toISOString();

  const base: OverrideRequest = {
    id: nextOverrideId(),
    caseId: ctx.caseId,
    clientName: ctx.clientName,
    rnId: ctx.rnId,
    supervisorId: ctx.supervisorId,
    directorId: ctx.directorId,
    origin,
    type,
    category,
    reasonCategory: ctx.reasonCategory,
    narrative,
    status: "Pending",
    createdAt: now,
    updatedAt: now,
    currentSeverityLevel: ctx.currentSeverityLevel,
    requestedSeverityLevel: ctx.requestedSeverityLevel,
    currentRagStatus: ctx.currentRagStatus,
    currentVitalityScore: ctx.currentVitalityScore,
    currentWorkloadPercent: ctx.currentWorkloadPercent,
    rnWorkloadStatus: ctx.rnWorkloadStatus,
    relatedVs: ctx.relatedVs,
    metadata: ctx.metadata || {},
    decisionLog: [
      {
        actorRole: origin === "RN_TO_SUPERVISOR" ? "RN" : "SUPERVISOR",
        actorId:
          origin === "RN_TO_SUPERVISOR"
            ? ctx.rnId
            : ctx.supervisorId,
        action: "REQUESTED",
        reason: narrative,
        at: now,
      },
    ],
  };

  return base;
}

/**
 * Specialized helper for RN → Supervisor workload limit override requests.
 * This is the first one we wire into the intake workload enforcement.
 */
export function createWorkloadOverrideFromIntake(params: {
  caseId: string;
  clientName?: string;
  rnId?: string;
  currentSeverityLevel: 1 | 2 | 3 | 4;
  currentWorkloadPercent: number;
  rnWorkloadStatus: "Green" | "Amber" | "Red";
  narrative?: string;
}): OverrideRequest {
  const narrative =
    params.narrative ||
    `RN workload would exceed Director-defined maximum (approx. ${params.currentWorkloadPercent}% of limit) when adding this case. RN is requesting Supervisor review and potential Director override.`;

  return createOverrideRequest(
    "RN_TO_SUPERVISOR",
    "WORKLOAD_LIMIT_OVERRIDE",
    "Workload",
    narrative,
    {
      caseId: params.caseId,
      clientName: params.clientName,
      rnId: params.rnId,
      currentSeverityLevel: params.currentSeverityLevel,
      currentWorkloadPercent: params.currentWorkloadPercent,
      rnWorkloadStatus: params.rnWorkloadStatus,
      metadata: {
        source: "IntakeWorkloadEnforcement",
      },
    }
  );
}
