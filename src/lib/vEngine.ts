// src/lib/vEngine.ts
//
// Reconcile C.A.R.E.™
// 10-Vs Clinical Logic Engine
//
// This module evaluates 4Ps + SDOH + current case context and returns:
// - Which Vs are triggered (and why)
// - Required RN CM actions (for hard-stop validation)
// - Suggested severity (L1–L4)
// - Vitality score (1–10) and RAG status
//
// NOTE: This is intentionally conservative / stringent. When in doubt,
// it pushes toward higher severity and more required actions.

import { AppState, Client, Flag, Task } from "./models";

// ---- Basic types ----

export type SeverityLevel = 1 | 2 | 3 | 4;
export type RagStatus = "RED" | "AMBER" | "GREEN";

export type VCode =
  | "V1_VOICE_VIEW"
  | "V2_VIABILITY"
  | "V3_VISION"
  | "V4_VERACITY"
  | "V5_VERSATILITY"
  | "V6_VITALITY"
  | "V7_VIGILANCE"
  | "V8_VERIFICATION"
  | "V9_VALUE"
  | "V10_VALIDATION";

export interface FourPsSnapshot {
  physical: {
    painScore?: number; // 0–10
    uncontrolledChronicCondition?: boolean; // e.g., high A1C, BP
  };
  psychological: {
    positiveDepressionAnxiety?: boolean;
    highStress?: boolean;
  };
  psychosocial: {
    hasSdohBarrier?: boolean; // transport/food/housing/safety
    limitedSupport?: boolean; // limited social support
  };
  professional: {
    unableToWork?: boolean;
    accommodationsNeeded?: boolean;
  };
  // High-level high-risk flag (e.g., from overall intake judgment)
  anyHighRiskOrUncontrolled?: boolean;
}

export interface VitalityInputs {
  engagementScore: number; // 1–10
  planProgressScore: number; // 1–10
  riskStabilityScore: number; // 1–10 (higher = more stable, less risk)
}

export interface VsTrigger {
  vCode: VCode;
  reason: string;    // human-readable reason, e.g. "Pain ≥ 7/10 (Physical)"
  source: string;    // "Physical", "Psychological", etc.
}

export interface RequiredAction {
  vCode: VCode;
  label: string;     // e.g. "Document Viability plan"
  reasonSummary: string; // combined reasons for hard-stop
  hardStop: true;
}

export interface TenVsEvaluationResult {
  triggeredVs: VsTrigger[];
  requiredActions: RequiredAction[];
  suggestedSeverity: SeverityLevel;
  vitalityScore: number;
  ragStatus: RagStatus;
}

// ---- Utility helpers ----

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clampScore(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// Deterministic pseudo-random from ID (same logic as elsewhere)
function pseudoRandomFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash % 1000) / 1000;
}

// ---- 4Ps → 10-Vs Trigger Map (MOST STRINGENT VERSION) ----
//
// This directly encodes the table you provided. If anything else in the app
// is looser, this wins.

function buildTriggersFromFourPs(
  fourPs: FourPsSnapshot,
  client: Client
): VsTrigger[] {
  const triggers: VsTrigger[] = [];

  // Physical: Pain Score ≥ 7/10 → V2 (Viability), V3 (Vision), V7 (Vigilance)
  if (fourPs.physical.painScore !== undefined && fourPs.physical.painScore >= 7) {
    triggers.push(
      {
        vCode: "V2_VIABILITY",
        reason: "Pain ≥ 7/10 (Physical)",
        source: "Physical",
      },
      {
        vCode: "V3_VISION",
        reason: "Pain ≥ 7/10 (Physical)",
        source: "Physical",
      },
      {
        vCode: "V7_VIGILANCE",
        reason: "Pain ≥ 7/10 (Physical) – High risk for deterioration",
        source: "Physical",
      }
    );
  }

  // Physical: Uncontrolled Chronic Condition → V2, V3, V8
  if (fourPs.physical.uncontrolledChronicCondition) {
    triggers.push(
      {
        vCode: "V2_VIABILITY",
        reason: "Uncontrolled chronic condition (Physical)",
        source: "Physical",
      },
      {
        vCode: "V3_VISION",
        reason: "Uncontrolled chronic condition – requires clearer trajectory",
        source: "Physical",
      },
      {
        vCode: "V8_VERIFICATION",
        reason: "Uncontrolled chronic condition – verify guideline alignment & payer expectations",
        source: "Physical",
      }
    );
  }

  // Psychological: Positive Depression/Anxiety → V2, V3, V4, V7
  if (fourPs.psychological.positiveDepressionAnxiety) {
    triggers.push(
      {
        vCode: "V2_VIABILITY",
        reason: "Positive depression/anxiety screen",
        source: "Psychological",
      },
      {
        vCode: "V3_VISION",
        reason: "Positive depression/anxiety – recovery vision affected",
        source: "Psychological",
      },
      {
        vCode: "V4_VERACITY",
        reason: "Positive depression/anxiety – requires clear documentation & advocacy",
        source: "Psychological",
      },
      {
        vCode: "V7_VIGILANCE",
        reason: "Positive depression/anxiety – increased vigilance needed",
        source: "Psychological",
      }
    );
  }

  // Psychological: High Stress → V2, V3
  if (fourPs.psychological.highStress) {
    triggers.push(
      {
        vCode: "V2_VIABILITY",
        reason: "Reported high stress",
        source: "Psychological",
      },
      {
        vCode: "V3_VISION",
        reason: "Reported high stress – impacts client’s ability to pursue plan",
        source: "Psychological",
      }
    );
  }

  // Psychosocial: Any SDOH Barrier → V2, V4, V3
  if (fourPs.psychosocial.hasSdohBarrier) {
    triggers.push(
      {
        vCode: "V2_VIABILITY",
        reason: "SDOH barrier present (transport/food/housing/safety)",
        source: "Psychosocial",
      },
      {
        vCode: "V4_VERACITY",
        reason: "SDOH barrier – advocacy & documentation required",
        source: "Psychosocial",
      },
      {
        vCode: "V3_VISION",
        reason: "SDOH barrier – plan path may need adjustment",
        source: "Psychosocial",
      }
    );
  }

  // Psychosocial: Limited Social Support → V2, V7
  if (fourPs.psychosocial.limitedSupport) {
    triggers.push(
      {
        vCode: "V2_VIABILITY",
        reason: "Limited social support",
        source: "Psychosocial",
      },
      {
        vCode: "V7_VIGILANCE",
        reason: "Limited social support – higher risk of decompensation",
        source: "Psychosocial",
      }
    );
  }

  // Professional: Unable to Work / Role Disruption → V3, V2
  if (fourPs.professional.unableToWork) {
    triggers.push(
      {
        vCode: "V3_VISION",
        reason: "Unable to work / role disruption",
        source: "Professional",
      },
      {
        vCode: "V2_VIABILITY",
        reason: "Unable to work – financial/role viability impacted",
        source: "Professional",
      }
    );
  }

  // Professional: Workplace Accommodations Needed → V3, V4
  if (fourPs.professional.accommodationsNeeded) {
    triggers.push(
      {
        vCode: "V3_VISION",
        reason: "Workplace accommodations needed",
        source: "Professional",
      },
      {
        vCode: "V4_VERACITY",
        reason: "Workplace accommodations – advocacy & documentation required",
        source: "Professional",
      }
    );
  }

  // Any/All: Client's direct quote or goal → V1 (Voice/View)
  // We assume if client.voiceView exists or client has goals, we always trigger V1.
  if ((client as any).voiceView || (client as any).goals?.length) {
    triggers.push({
      vCode: "V1_VOICE_VIEW",
      reason: "Client’s direct voice/view and goals present",
      source: "Client",
    });
  }

  // Any/All: Any high-risk or uncontrolled finding → V7 (Vigilance)
  if (fourPs.anyHighRiskOrUncontrolled) {
    triggers.push({
      vCode: "V7_VIGILANCE",
      reason: "High-risk/uncontrolled finding (overall clinical impression)",
      source: "Global",
    });
  }

  return triggers;
}

// ---- Severity suggestion (Levels 1–4, conservative) ----
//
// We assign points based on risk features, then map to a severity level.

function suggestSeverity(
  fourPs: FourPsSnapshot,
  flags: Flag[]
): SeverityLevel {
  let points = 0;

  if (
    fourPs.physical.painScore !== undefined &&
    fourPs.physical.painScore >= 7
  ) {
    points += 1;
  }
  if (fourPs.physical.uncontrolledChronicCondition) points += 1;
  if (fourPs.psychological.positiveDepressionAnxiety) points += 1;
  if (fourPs.psychological.highStress) points += 1;
  if (fourPs.psychosocial.hasSdohBarrier) points += 1;
  if (fourPs.psychosocial.limitedSupport) points += 1;
  if (fourPs.professional.unableToWork) points += 1;
  if (fourPs.professional.accommodationsNeeded) points += 1;
  if (fourPs.anyHighRiskOrUncontrolled) points += 1;

  const openFlags = flags.filter((f) => f.status === "Open");
  const highCrit = openFlags.filter(
    (f) => f.severity === "High" || f.severity === "Critical"
  );
  if (highCrit.length > 0) points += 2; // strong weight for high/critical flags

  // Map points → severity (conservative: err on higher levels)
  if (points <= 1) return 1;     // Simple
  if (points <= 3) return 2;     // Moderate
  if (points <= 5) return 3;     // Complex
  return 4;                      // Severely Complex
}

// ---- Vitality Score & RAG ----
//
// We take explicit inputs for engagement/progress/riskStability if provided.
// If not, we infer riskStability from flags as a conservative approximation.

function computeVitality(
  client: Client,
  flags: Flag[],
  vitalityInputs?: Partial<VitalityInputs>
): { vitalityScore: number; ragStatus: RagStatus } {
  const openFlags = flags.filter((f) => f.status === "Open");
  const highCrit = openFlags.filter(
    (f) => f.severity === "High" || f.severity === "Critical"
  );

  // Defaults if not provided:
  const engagement = clampScore(vitalityInputs?.engagementScore ?? 5, 1, 10);
  const progress = clampScore(vitalityInputs?.planProgressScore ?? 5, 1, 10);

  // Risk & Stability: if there are high/critical flags, we weight stability down.
  let inferredRiskStability = 7;
  if (highCrit.length > 0) inferredRiskStability = 3;
  else if (openFlags.length > 0) inferredRiskStability = 5;

  const riskStability = clampScore(
    vitalityInputs?.riskStabilityScore ?? inferredRiskStability,
    1,
    10
  );

  // Weighted average – can be tuned, but we start with equal weights.
  const vitalityScoreRaw =
    (engagement + progress + riskStability) / 3.0;

  const vitalityScore = Number(vitalityScoreRaw.toFixed(1));

  let ragStatus: RagStatus;
  if (vitalityScore < 4.0 || highCrit.length > 0) ragStatus = "RED";
  else if (vitalityScore < 8.0 || openFlags.length > 0) ragStatus = "AMBER";
  else ragStatus = "GREEN";

  return { vitalityScore, ragStatus };
}

// ---- Build required actions for hard-stop validation ----
//
// We group triggers by VCode and generate one required action per VCode.
// RN CM must document an action & rationale for each.

function buildRequiredActions(triggers: VsTrigger[]): RequiredAction[] {
  const byV = new Map<VCode, VsTrigger[]>();

  for (const t of triggers) {
    const arr = byV.get(t.vCode) ?? [];
    arr.push(t);
    byV.set(t.vCode, arr);
  }

  const actions: RequiredAction[] = [];
  for (const [vCode, vs] of byV.entries()) {
    // Human-friendly label for V
    const label =
      vCode === "V1_VOICE_VIEW"
        ? "Document Voice/View plan"
        : vCode === "V2_VIABILITY"
        ? "Document Viability plan"
        : vCode === "V3_VISION"
        ? "Document Vision (trajectory of care) plan"
        : vCode === "V4_VERACITY"
        ? "Document Veracity (advocacy, integrity, documentation) plan"
        : vCode === "V5_VERSATILITY"
        ? "Document Versatility (individualized approach) plan"
        : vCode === "V6_VITALITY"
        ? "Document Vitality (momentum & engagement) plan"
        : vCode === "V7_VIGILANCE"
        ? "Document Vigilance (risk monitoring) plan"
        : vCode === "V8_VERIFICATION"
        ? "Document Verification (guidelines & payer alignment) plan"
        : vCode === "V9_VALUE"
        ? "Document Value (outcomes/ROI) plan"
        : "Document Validation (quality & oversight) plan";

    const reasonSummary = vs
      .map((t) => t.reason)
      .filter((r, idx, arr) => arr.indexOf(r) === idx)
      .join("; ");

    actions.push({
      vCode,
      label,
      reasonSummary,
      hardStop: true,
    });
  }

  return actions;
}

// ---- Main entry point ----

export function evaluateTenVs(
  params: {
    appState?: AppState; // optional, if you want access to entire state
    client: Client;
    flags: Flag[];
    tasks: Task[];
    fourPs: FourPsSnapshot;
    vitalityInputs?: Partial<VitalityInputs>;
  }
): TenVsEvaluationResult {
  const { client, flags, fourPs, vitalityInputs } = params;

  const triggeredVs = buildTriggersFromFourPs(fourPs, client);
  const requiredActions = buildRequiredActions(triggeredVs);
  const suggestedSeverity = suggestSeverity(fourPs, flags);
  const { vitalityScore, ragStatus } = computeVitality(
    client,
    flags,
    vitalityInputs
  );

  return {
    triggeredVs,
    requiredActions,
    suggestedSeverity,
    vitalityScore,
    ragStatus,
  };
}

