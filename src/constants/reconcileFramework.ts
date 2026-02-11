// src/constants/reconcileFramework.ts

// 1–5 scale, same meaning across EVERYTHING.
// 1 = worst/very poor, 5 = best/stable.
export type SeverityScore = 1 | 2 | 3 | 4 | 5;

export interface SeverityMeta {
  score: SeverityScore;
  label: string;
  description: string;
}

export const SEVERITY_SCALE: SeverityMeta[] = [
  {
    score: 1,
    label: "Critical / Very Poor",
    description:
      "Severely compromised, crisis-level, or near failure. High risk without urgent intervention.",
  },
  {
    score: 2,
    label: "High Concern",
    description:
      "Major problems, unstable, significant risk of breakdown or failure.",
  },
  {
    score: 3,
    label: "Moderate",
    description:
      "Mixed picture; clear issues present, but some strengths or supports remain.",
  },
  {
    score: 4,
    label: "Mild / Mostly Stable",
    description:
      "Minor or intermittent issues; generally stable but not ideal.",
  },
  {
    score: 5,
    label: "Stable / Strong / Good",
    description:
      "Strong, well-supported, functioning well; minimal concern.",
  },
];

export interface FrameworkDimension {
  id: string;
  label: string; // e.g., "P1 – Physical", "V1 – Voice / View"
  shortLabel: string; // short form if needed in UI
  definition: string; // brief text you can refine later
}

// 4Ps of Wellness – names locked here
export const FOUR_PS: FrameworkDimension[] = [
  {
    id: "physical",
    label: "P1 – Physical",
    shortLabel: "Physical",
    definition:
      "Physical health, function, symptoms, and impact of injury/illness.",
  },
  {
    id: "psychological",
    label: "P2 – Psychological",
    shortLabel: "Psychological",
    definition:
      "Mood, coping, mental health factors, and psychological response.",
  },
  {
    id: "psychosocial",
    label: "P3 – Psychosocial",
    shortLabel: "Psychosocial",
    definition:
      "Support systems, roles, relationships, and social context.",
  },
  {
    id: "professional",
    label: "P4 – Professional",
    shortLabel: "Professional",
    definition:
      "Work, role performance, job demands, and vocational impact.",
  },
];

// 10-Vs of Care Management – names locked here
export const TEN_VS: FrameworkDimension[] = [
  {
    id: "voiceView",
    label: "V1 – Voice / View",
    shortLabel: "Voice / View",
    definition:
      "How the client’s story and perspective are captured and represented.",
  },
  {
    id: "viability",
    label: "V2 – Viability",
    shortLabel: "Viability",
    definition:
      "Whether the case and care plan are realistic, sustainable, and actionable.",
  },
  {
    id: "vision",
    label: "V3 – Vision",
    shortLabel: "Vision",
    definition:
      "Clarity of goals, desired outcomes, and long-term direction.",
  },
  {
    id: "veracity",
    label: "V4 – Veracity",
    shortLabel: "Veracity",
    definition:
      "Consistency, reliability, and truthfulness of the clinical information.",
  },
  {
    id: "versatility",
    label: "V5 – Versatility",
    shortLabel: "Versatility",
    definition:
      "Flexibility of the care plan and ability to adjust to changing needs.",
  },
  {
    id: "vitality",
    label: "V6 – Vitality",
    shortLabel: "Vitality",
    definition:
      "Energy, engagement, and functional stamina within the case.",
  },
  {
    id: "vigilance",
    label: "V7 – Vigilance",
    shortLabel: "Vigilance",
    definition:
      "Ongoing monitoring, follow-through, and early detection of changes.",
  },
  {
    id: "verification",
    label: "V8 – Verification",
    shortLabel: "Verification",
    definition:
      "How well key facts, records, and events are confirmed and documented.",
  },
  {
    id: "value",
    label: "V9 – Value",
    shortLabel: "Value",
    definition:
      "Clinical and financial value of care relative to risk, cost, and outcome.",
  },
  {
    id: "validation",
    label: "V10 – Validation",
    shortLabel: "Validation",
    definition:
      "How the client’s experience, responses, and outcomes are acknowledged and supported.",
  },
];

// Shared case summary shape used by RN + Attorney
export interface FourPsSummary {
  overallScore: SeverityScore;
  dimensions: { id: string; score: SeverityScore; note?: string }[];
  narrative?: string;
}

export interface TenVsSummary {
  overallScore: SeverityScore;
  dimensions: { id: string; score: SeverityScore; note?: string }[];
  narrative?: string;
}

export interface SdohSummary {
  overallScore: SeverityScore;
  narrative?: string;
}

export interface CrisisSummary {
  severityScore: SeverityScore;
}

export interface CaseSummary {
  fourPs?: FourPsSummary;
  tenVs?: TenVsSummary;
  sdoh?: SdohSummary;
  crisis?: CrisisSummary;
  updatedAt?: string;
}

// Helper: get severity label from score
export function getSeverityLabel(score: SeverityScore | null | undefined) {
  if (!score) return null;
  const found = SEVERITY_SCALE.find((s) => s.score === score);
  return found ? found.label : null;
}
// P → V mapping for priority logic
export type PId = "physical" | "psychological" | "psychosocial" | "professional";
export type VId =
  | "voiceView"
  | "viability"
  | "vision"
  | "veracity"
  | "versatility"
  | "vitality"
  | "vigilance"
  | "verification"
  | "value"
  | "validation";

export interface PToVMapping {
  pId: PId;
  vIds: VId[];
}

// Final P→V mapping (source of truth)
export const P_TO_V_MAP: PToVMapping[] = [
  // P1 – Physical → V3, V5, V6, V7, V8
  {
    pId: "physical",
    vIds: ["vision", "versatility", "vitality", "vigilance", "verification"],
  },
  // P2 – Psychological → V1, V3, V6, V9, V10
  {
    pId: "psychological",
    vIds: ["voiceView", "vision", "vitality", "value", "validation"],
  },
  // P3 – Psychosocial → V1, V5, V6, V9, V10
  {
    pId: "psychosocial",
    vIds: ["voiceView", "versatility", "vitality", "value", "validation"],
  },
  // P4 – Professional → V3, V4, V7, V8, V9
  {
    pId: "professional",
    vIds: ["vision", "veracity", "vigilance", "verification", "value"],
  },
];
