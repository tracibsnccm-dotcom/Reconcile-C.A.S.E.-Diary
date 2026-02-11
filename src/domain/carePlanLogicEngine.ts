// src/domain/carePlanLogicEngine.ts
// ============================================================================
// RECONCILE C.A.R.E. - CARE PLAN LOGIC ENGINE™
// ============================================================================
// 
// COPYRIGHT © 2024-2025 Nurses as Entrepreneurs / Traci B. SNCCM
// This is proprietary intellectual property. All rights reserved.
//
// VERSION: 1.0.0
// LAST UPDATED: January 13, 2026
// 
// This file serves as the SOURCE OF TRUTH for the clinical logic that drives
// care plan creation and management in the Reconcile C.A.R.E. platform.
// ============================================================================

import { TenV, TEN_VS_DICTIONARY, TEN_VS_ORDERED } from "./tenVs";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type FourPsPillar = "P1" | "P2" | "P3" | "P4";
export type StabilityScore = 1 | 2 | 3 | 4 | 5;

export interface FourPsAssessment {
  p1Physical: StabilityScore;
  p2Psychological: StabilityScore;
  p3Psychosocial: StabilityScore;
  p4Professional: StabilityScore;
  abuseRiskFlag: boolean;
  suicideRiskFlag: boolean;
  lastUpdated: string;
}

export interface TenVsAssessment {
  v: TenV;
  score: StabilityScore;
  clinicalNotes: string;
  deviationFromGuideline: boolean;
  deviationRationale?: string;
  completedAt: string;
  completedBy: string;
}

export interface CarePlanRequirements {
  mandatory: TenV[];
  triggered: TenV[];
  completed: TenV[];
  canSubmit: boolean;
  blockedBy: TenV[];
}

export type TriggerCondition =
  | "CLIENT_REFUSES_TREATMENT"
  | "PROVIDER_UNRESPONSIVE"
  | "CASE_STALLED"
  | "PATIENT_PLATEAUED"
  | "NEEDS_ADDITIONAL_SERVICES"
  | "TREATMENT_NEEDS_REVISION"
  | "CONDITION_CHANGED"
  | "PLAN_REVISION_DUE"
  | "FOLLOWUP_CALL_DUE";

export interface ActiveTrigger {
  condition: TriggerCondition;
  triggeredAt: string;
  triggeredBy: string;
  notes?: string;
  triggersVs: TenV[];
}

// ============================================================================
// CONSTANTS - THE 10Vs FRAMEWORK
// ============================================================================

/**
 * THE OFFICIAL 10Vs OF CARE MANAGEMENT
 * 
 * These are the ten dimensions of clinical assessment that guide holistic
 * care planning in the Reconcile C.A.R.E. framework.
 */
export const TEN_VS_DEFINITIONS: Record<TenV, { label: string; definition: string; purpose: string }> = {
  voice_view: {
    label: "Voice / View",
    definition: "Captures the client's lived story, self-perception, and desired outcome. Ensures the client's voice drives the case narrative.",
    purpose: "Aligns the RN and attorney with the client's goals and subjective experience to guide care and advocacy.",
  },
  viability: {
    label: "Viability",
    definition: "Assesses readiness, capacity, and stability across the 4Ps and SDOH. Measures whether the client can physically, psychologically, psychosocially, and professionally engage.",
    purpose: "Identifies barriers early so the RN can stabilize foundations before escalating care or expecting progress.",
  },
  vision: {
    label: "Vision",
    definition: "Defines shared goals and desired recovery trajectory between client, provider, RN, and attorney.",
    purpose: "Establishes direction, expected milestones, and expectations for care planning and return-to-function.",
  },
  veracity: {
    label: "Veracity",
    definition: "Focuses on integrity, accuracy, advocacy, and moral courage in clinical and legal communication.",
    purpose: "Supports negotiations, ensures records are correct, and protects the client when discrepancies or red flags arise.",
  },
  versatility: {
    label: "Versatility",
    definition: "Assesses the adaptability and flexibility of the care plan. Measures the client's and system's ability to shift as conditions change.",
    purpose: "Enables course-corrections, adjustments in treatment, and alignment with evolving goals or barriers.",
  },
  vitality: {
    label: "Vitality",
    definition: "Measures momentum, engagement, and forward movement of the plan and the client.",
    purpose: "Signals whether the case is stagnant, progressing, or regressing to guide RN actions and escalation paths.",
  },
  vigilance: {
    label: "Vigilance",
    definition: "Continuous monitoring of risk, safety, compliance, and gaps in care or documentation.",
    purpose: "Prevents harm, identifies crises early, and keeps the case within safety and quality boundaries.",
  },
  verification: {
    label: "Verification",
    definition: "Ensures accuracy, evidence, guideline alignment, and defensibility of medical facts and case actions.",
    purpose: "Supports attorneys, reinforces documentation integrity, and strengthens the case's legal foundation.",
  },
  value: {
    label: "Value",
    definition: "Quantifies benefit: outcomes, efficiency, cost stewardship, system alignment, and restored function.",
    purpose: "Measures what improvement has been achieved relative to time, effort, cost, and barriers.",
  },
  validation: {
    label: "Validation",
    definition: "Quality assurance + equity loop; ensures clinical and case management standards are upheld.",
    purpose: "Confirms the RN's actions were appropriate, equitable, timely, and aligned with organizational standards.",
  },
};

// ============================================================================
// CARE PLAN REQUIREMENTS
// ============================================================================

/**
 * MANDATORY Vs - Required for ALL care plans (initial and follow-up)
 * 
 * These six Vs must ALWAYS be completed. The RN cannot submit a care plan
 * until all mandatory Vs are satisfied.
 */
export const MANDATORY_VS: TenV[] = [
  "voice_view",   // V1 - Client's story and goals must drive every plan
  "viability",    // V2 - Must assess if client CAN engage before planning
  "vision",       // V3 - Shared goals must be established
  "verification", // V8 - Evidence and guideline alignment documented
  "value",        // V9 - Outcomes and benefit must be measured
  "validation",   // V10 - QA/equity check - was this appropriate care?
];

/**
 * TRIGGERED Vs - Conditionally required based on case circumstances
 * 
 * These Vs are activated when specific conditions are detected in the case.
 * Once triggered, they become mandatory and must be completed before
 * the care plan can be submitted.
 */
export const TRIGGERED_VS: TenV[] = [
  "veracity",     // V4 - Client refuses TX or provider unresponsive
  "versatility",  // V5 - Need to review path options, revise treatment
  "vitality",     // V6 - Case stalled, treatment stalled, patient plateaued
  "vigilance",    // V7 - Ongoing monitoring frequency tracking
];

// ============================================================================
// TRIGGER CONDITIONS MAPPING
// ============================================================================

/**
 * V4 VERACITY TRIGGERS
 * 
 * Triggered when there are issues with client engagement or provider response.
 * Focuses on integrity, accuracy, and advocacy in communication.
 */
export const V4_VERACITY_TRIGGERS: TriggerCondition[] = [
  "CLIENT_REFUSES_TREATMENT",
  "PROVIDER_UNRESPONSIVE",
];

/**
 * V5 VERSATILITY TRIGGERS
 * 
 * Triggered when the care plan needs adaptation or revision.
 * IMPORTANT: When V5 is triggered, RN must loop back to 4Ps to check
 * if any pillar scores have changed.
 * 
 * Example: Blood sugar increased → client can't afford insulin increase
 *          → This is a P3 (Psychosocial) and P4 (Professional/Financial) issue
 *          → 4Ps must be re-assessed before updating care plan
 */
export const V5_VERSATILITY_TRIGGERS: TriggerCondition[] = [
  "NEEDS_ADDITIONAL_SERVICES",
  "TREATMENT_NEEDS_REVISION",
  "CONDITION_CHANGED",
];

/**
 * V6 VITALITY TRIGGERS
 * 
 * Triggered when case momentum has stalled or declined.
 * IMPORTANT: When V6 is triggered, it ALSO re-triggers V8 (Verification)
 * and V9 (Value) for mandatory re-review.
 */
export const V6_VITALITY_TRIGGERS: TriggerCondition[] = [
  "CASE_STALLED",
  "PATIENT_PLATEAUED",
];

/**
 * V7 VIGILANCE - ONGOING MONITORING
 * 
 * Unlike other triggered Vs, V7 is always active as a monitoring function.
 * It tracks:
 * - How often the plan is revised
 * - How often client is followed up with via phone calls
 * - Compliance with scheduled check-ins
 */
export const V7_VIGILANCE_TRACKING = {
  planRevisionFrequency: "As needed, minimum monthly review",
  clientFollowUpFrequency: "Per care plan schedule",
  triggers: [
    "PLAN_REVISION_DUE",
    "FOLLOWUP_CALL_DUE",
  ] as TriggerCondition[],
};

// ============================================================================
// CORE LOGIC FUNCTIONS
// ============================================================================

/**
 * Determines which Vs are required for a care plan based on current triggers.
 * 
 * @param activeTriggers - Array of currently active trigger conditions
 * @param completedVs - Array of Vs that have already been completed
 * @returns CarePlanRequirements object with mandatory, triggered, and blocking info
 */
export function getCarePlanRequirements(
  activeTriggers: ActiveTrigger[],
  completedVs: TenV[]
): CarePlanRequirements {
  const triggered: TenV[] = [];
  
  // Check each trigger condition and add corresponding Vs
  for (const trigger of activeTriggers) {
    // V4 Veracity triggers
    if (V4_VERACITY_TRIGGERS.includes(trigger.condition)) {
      if (!triggered.includes("veracity")) {
        triggered.push("veracity");
      }
    }
    
    // V5 Versatility triggers
    if (V5_VERSATILITY_TRIGGERS.includes(trigger.condition)) {
      if (!triggered.includes("versatility")) {
        triggered.push("versatility");
      }
    }
    
    // V6 Vitality triggers (also re-triggers V8 and V9)
    if (V6_VITALITY_TRIGGERS.includes(trigger.condition)) {
      if (!triggered.includes("vitality")) {
        triggered.push("vitality");
      }
      // V6 also forces re-review of V8 and V9
      // (They're already mandatory, but this flags them for re-assessment)
    }
    
    // V7 Vigilance triggers
    if (V7_VIGILANCE_TRACKING.triggers.includes(trigger.condition)) {
      if (!triggered.includes("vigilance")) {
        triggered.push("vigilance");
      }
    }
  }
  
  // Combine mandatory and triggered Vs
  const allRequired = [...MANDATORY_VS, ...triggered];
  const uniqueRequired = [...new Set(allRequired)];
  
  // Determine which Vs are blocking submission
  const blockedBy = uniqueRequired.filter(v => !completedVs.includes(v));
  
  return {
    mandatory: MANDATORY_VS,
    triggered,
    completed: completedVs,
    canSubmit: blockedBy.length === 0,
    blockedBy,
  };
}

/**
 * Checks if V5 (Versatility) is triggered and returns instruction to
 * loop back to 4Ps assessment.
 * 
 * @param activeTriggers - Array of currently active trigger conditions
 * @returns Object indicating if 4Ps re-assessment is required
 */
export function checkFourPsReassessmentRequired(
  activeTriggers: ActiveTrigger[]
): { required: boolean; reason: string | null } {
  const versatilityTriggered = activeTriggers.some(
    t => V5_VERSATILITY_TRIGGERS.includes(t.condition)
  );
  
  if (versatilityTriggered) {
    return {
      required: true,
      reason: "V5 (Versatility) triggered - Must re-assess 4Ps before updating care plan. Check if P1-P4 scores have changed due to new circumstances.",
    };
  }
  
  return { required: false, reason: null };
}

/**
 * Checks if V6 (Vitality) is triggered and returns instruction to
 * re-review V8 and V9.
 * 
 * @param activeTriggers - Array of currently active trigger conditions
 * @returns Object indicating if V8/V9 re-review is required
 */
export function checkVerificationValueReviewRequired(
  activeTriggers: ActiveTrigger[]
): { required: boolean; reason: string | null } {
  const vitalityTriggered = activeTriggers.some(
    t => V6_VITALITY_TRIGGERS.includes(t.condition)
  );
  
  if (vitalityTriggered) {
    return {
      required: true,
      reason: "V6 (Vitality) triggered - Case stalled or plateaued. Must re-review V8 (Verification) and V9 (Value) to assess if current treatment path is still appropriate.",
    };
  }
  
  return { required: false, reason: null };
}

/**
 * Creates a new trigger and returns the Vs it activates.
 * 
 * @param condition - The trigger condition that occurred
 * @param triggeredBy - User ID of who triggered it
 * @param notes - Optional notes about the trigger
 * @returns ActiveTrigger object with the Vs it triggers
 */
export function createTrigger(
  condition: TriggerCondition,
  triggeredBy: string,
  notes?: string
): ActiveTrigger {
  let triggersVs: TenV[] = [];
  
  if (V4_VERACITY_TRIGGERS.includes(condition)) {
    triggersVs.push("veracity");
  }
  if (V5_VERSATILITY_TRIGGERS.includes(condition)) {
    triggersVs.push("versatility");
  }
  if (V6_VITALITY_TRIGGERS.includes(condition)) {
    triggersVs.push("vitality");
  }
  if (V7_VIGILANCE_TRACKING.triggers.includes(condition)) {
    triggersVs.push("vigilance");
  }
  
  return {
    condition,
    triggeredAt: new Date().toISOString(),
    triggeredBy,
    notes,
    triggersVs,
  };
}

// ============================================================================
// 4Ps TO 10Vs MAPPING
// ============================================================================

/**
 * 4Ps PILLAR DEFINITIONS
 * 
 * The 4Ps of Wellness framework based on Maslow's Hierarchy of Needs.
 * Each pillar is scored 1-5 where:
 *   1 = Crisis / Survival Mode
 *   2 = Emergent Instability
 *   3 = Managed / Maintenance
 *   4 = Sustainable / Growth
 *   5 = Optimal / Fulfillment
 */
export const FOUR_PS_DEFINITIONS = {
  P1: {
    label: "Physical Wellness",
    description: "Physical health, pain levels, functional capacity, medical conditions",
  },
  P2: {
    label: "Psychological Wellness", 
    description: "Mental health, emotional state, coping capacity, cognitive function",
  },
  P3: {
    label: "Psychosocial Wellness",
    description: "Social support, environment, housing, food security, relationships, SDOH factors",
  },
  P4: {
    label: "Professional Wellness",
    description: "Work capacity, financial stability, vocational function, economic factors",
  },
};

/**
 * 4Ps → 10Vs INFLUENCE MAPPING
 * 
 * This defines which 10Vs are most influenced by each 4P pillar.
 * Used to guide RN attention to relevant Vs based on 4Ps assessment.
 * 
 * NOTE: This is for GUIDANCE, not automatic calculation. The RN uses
 * clinical judgment to assess each V, informed by the 4Ps scores.
 */
export const FOUR_PS_TO_TEN_VS_INFLUENCE: Record<FourPsPillar, TenV[]> = {
  P1: [
    "viability",    // V2 - Physical capacity to engage
    "vitality",     // V6 - Physical momentum and energy
    "verification", // V8 - Medical evidence alignment
    "value",        // V9 - Functional outcomes
  ],
  P2: [
    "voice_view",   // V1 - Client's psychological perspective
    "viability",    // V2 - Psychological capacity to engage
    "vigilance",    // V7 - Safety and mental health monitoring
    "vitality",     // V6 - Emotional momentum
  ],
  P3: [
    "viability",    // V2 - Social/environmental capacity to engage
    "versatility",  // V5 - Need for SDOH interventions
    "vigilance",    // V7 - Safety in environment
    "validation",   // V10 - Equity considerations
  ],
  P4: [
    "vision",       // V3 - Return-to-work goals
    "viability",    // V2 - Financial capacity to engage
    "value",        // V9 - Economic outcomes
    "verification", // V8 - Vocational/legal documentation
  ],
};

/**
 * CRITICAL SCORE THRESHOLDS
 * 
 * When any 4P pillar score is at these levels, specific actions are required.
 */
export const CRITICAL_THRESHOLDS = {
  CRISIS: 1,        // Immediate intervention required
  EMERGENT: 2,      // Urgent attention needed
  STABLE_MIN: 4,    // Minimum for "stable" designation
};

/**
 * Analyzes 4Ps assessment and returns which 10Vs need priority attention.
 * 
 * @param fourPs - The client's 4Ps assessment scores
 * @returns Object with priority Vs and recommendations
 */
export function analyzeFourPsForTenVsPriority(
  fourPs: FourPsAssessment
): {
  priorityVs: TenV[];
  criticalFlags: string[];
  recommendations: string[];
} {
  const priorityVs: TenV[] = [];
  const criticalFlags: string[] = [];
  const recommendations: string[] = [];
  
  // Check P1 Physical
  if (fourPs.p1Physical <= CRITICAL_THRESHOLDS.EMERGENT) {
    priorityVs.push("viability", "vitality", "verification");
    criticalFlags.push(`P1 Physical at ${fourPs.p1Physical} - Physical crisis/instability`);
    recommendations.push("Prioritize medical stabilization before aggressive treatment planning");
  }
  
  // Check P2 Psychological
  if (fourPs.p2Psychological <= CRITICAL_THRESHOLDS.EMERGENT) {
    priorityVs.push("voice_view", "viability", "vigilance");
    criticalFlags.push(`P2 Psychological at ${fourPs.p2Psychological} - Mental health concern`);
    recommendations.push("Assess mental health support needs; consider behavioral health referral");
  }
  
  // Check P3 Psychosocial
  if (fourPs.p3Psychosocial <= CRITICAL_THRESHOLDS.EMERGENT) {
    priorityVs.push("viability", "versatility", "vigilance", "validation");
    criticalFlags.push(`P3 Psychosocial at ${fourPs.p3Psychosocial} - SDOH barriers present`);
    recommendations.push("Address SDOH barriers BEFORE expecting treatment compliance");
  }
  
  // Check P4 Professional
  if (fourPs.p4Professional <= CRITICAL_THRESHOLDS.EMERGENT) {
    priorityVs.push("vision", "viability", "value");
    criticalFlags.push(`P4 Professional at ${fourPs.p4Professional} - Work/financial crisis`);
    recommendations.push("Coordinate with employer/attorney on accommodations; address financial barriers");
  }
  
  // Safety flags
  if (fourPs.abuseRiskFlag) {
    priorityVs.push("vigilance", "veracity");
    criticalFlags.push("ABUSE RISK FLAG - Safety protocol required");
    recommendations.push("Activate safety protocol; document carefully; consider mandatory reporting");
  }
  
  if (fourPs.suicideRiskFlag) {
    priorityVs.push("vigilance", "viability");
    criticalFlags.push("SUICIDE RISK FLAG - Immediate intervention required");
    recommendations.push("Crisis intervention required; do not proceed with standard care planning until stabilized");
  }
  
  // Remove duplicates
  const uniquePriorityVs = [...new Set(priorityVs)];
  
  return {
    priorityVs: uniquePriorityVs,
    criticalFlags,
    recommendations,
  };
}

// ============================================================================
// CONDITION OVERLAYS (PLACEHOLDER)
// ============================================================================

/**
 * CONDITION OVERLAYS
 * 
 * These modify the 4Ps → 10Vs logic based on specific injury/condition types.
 * Each overlay adjusts expectations and triggers based on the clinical
 * realities of that condition.
 * 
 * TODO: Implement condition overlays once documentation is provided.
 * Expected conditions:
 * - Traumatic Brain Injury (TBI)
 * - Spinal Cord Injury
 * - Orthopedic injuries (upper/lower extremity)
 * - Chronic Pain Syndrome
 * - Psychological/PTSD
 * - etc.
 */
export interface ConditionOverlay {
  conditionId: string;
  conditionName: string;
  description: string;
  modifiesVs: TenV[];
  expectedTimelineAdjustment: string;
  specialConsiderations: string[];
  guidelineReference?: string; // ODG/MCG/InterQual reference
}

// Placeholder - to be populated with actual condition overlays
export const CONDITION_OVERLAYS: Record<string, ConditionOverlay> = {
  // Will be populated when overlay documentation is provided
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  TEN_VS_DICTIONARY,
  TEN_VS_ORDERED,
} from "./tenVs";
