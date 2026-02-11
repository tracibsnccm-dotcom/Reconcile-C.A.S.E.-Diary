// src/domain/tenVs.ts
// Reconcile C.A.R.E. — Official 10-Vs Framework (authoritative source)
//
// These definitions come directly from the finalized NAE/RCMS 10-Vs PDF.
// No substitutions, no rewording, no added concepts.
// Every screen in the platform must import from here rather than
// typing or approximating any V manually.

export interface TenVDefinition {
  key: TenV;
  label: string;
  definition: string;
  purpose: string;
}

export type TenV =
  | "voice_view"
  | "viability"
  | "vision"
  | "veracity"
  | "versatility"
  | "vitality"
  | "vigilance"
  | "verification"
  | "value"
  | "validation";

export const TEN_VS_ORDERED: TenV[] = [
  "voice_view",
  "viability",
  "vision",
  "veracity",
  "versatility",
  "vitality",
  "vigilance",
  "verification",
  "value",
  "validation",
];

export const TEN_VS_DICTIONARY: Record<TenV, TenVDefinition> = {
  voice_view: {
    key: "voice_view",
    label: "Voice / View",
    definition:
      "Captures the client’s lived story, self-perception, and desired outcome. Ensures the client's voice drives the case narrative.",
    purpose:
      "Aligns the RN and attorney with the client’s goals and subjective experience to guide care and advocacy.",
  },
  viability: {
    key: "viability",
    label: "Viability",
    definition:
      "Assesses readiness, capacity, and stability across the 4Ps and SDOH. Measures whether the client can physically, psychologically, psychosocially, and professionally engage.",
    purpose:
      "Identifies barriers early so the RN can stabilize foundations before escalating care or expecting progress.",
  },
  vision: {
    key: "vision",
    label: "Vision",
    definition:
      "Defines shared goals and desired recovery trajectory between client, provider, RN, and attorney.",
    purpose:
      "Establishes direction, expected milestones, and expectations for care planning and return-to-function.",
  },
  veracity: {
    key: "veracity",
    label: "Veracity",
    definition:
      "Focuses on integrity, accuracy, advocacy, and moral courage in clinical and legal communication.",
    purpose:
      "Supports negotiations, ensures records are correct, and protects the client when discrepancies or red flags arise.",
  },
  versatility: {
    key: "versatility",
    label: "Versatility",
    definition:
      "Assesses the adaptability and flexibility of the care plan. Measures the client’s and system’s ability to shift as conditions change.",
    purpose:
      "Enables course-corrections, adjustments in treatment, and alignment with evolving goals or barriers.",
  },
  vitality: {
    key: "vitality",
    label: "Vitality",
    definition:
      "Measures momentum, engagement, and forward movement of the plan and the client.",
    purpose:
      "Signals whether the case is stagnant, progressing, or regressing to guide RN actions and escalation paths.",
  },
  vigilance: {
    key: "vigilance",
    label: "Vigilance",
    definition:
      "Continuous monitoring of risk, safety, compliance, and gaps in care or documentation.",
    purpose:
      "Prevents harm, identifies crises early, and keeps the case within safety and quality boundaries.",
  },
  verification: {
    key: "verification",
    label: "Verification",
    definition:
      "Ensures accuracy, evidence, guideline alignment, and defensibility of medical facts and case actions.",
    purpose:
      "Supports attorneys, reinforces documentation integrity, and strengthens the case’s legal foundation.",
  },
  value: {
    key: "value",
    label: "Value",
    definition:
      "Quantifies benefit: outcomes, efficiency, cost stewardship, system alignment, and restored function.",
    purpose:
      "Measures what improvement has been achieved relative to time, effort, cost, and barriers.",
  },
  validation: {
    key: "validation",
    label: "Validation",
    definition:
      "Quality assurance + equity loop; ensures clinical and case management standards are upheld.",
    purpose:
      "Confirms the RN’s actions were appropriate, equitable, timely, and aligned with organizational standards.",
  },
};
