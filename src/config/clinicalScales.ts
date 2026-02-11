// src/config/clinicalScales.ts

export type PKey = "physical" | "psychological" | "psychosocial" | "professional";

export type MaslowLevel =
  | "Physiological"
  | "Safety"
  | "Love/Belonging"
  | "Esteem"
  | "Self-Actualization";

export type ScaleAnchor = {
  value: number;        // 1–5
  label: string;        // "Very poor", "Excellent", etc.
  description: string;  // RN-facing guidance
};

export type PDefinition = {
  id: PKey;
  label: string;
  shortTitle: string;
  description: string;
  maslowLevels: MaslowLevel[];
  anchors: ScaleAnchor[]; // we’ll use 1, 3, 5 to keep UI light
};

export const P_DEFS: Record<PKey, PDefinition> = {
  physical: {
    id: "physical",
    label: "Physical",
    shortTitle: "Body, function, and medical stability",
    description:
      "Pain, mobility, strength, sleep, vital organ function, medical stability, and the ability to perform basic activities of daily living.",
    maslowLevels: ["Physiological", "Safety"],
    anchors: [
      {
        value: 1,
        label: "Severely compromised",
        description:
          "Uncontrolled symptoms, frequent ED/acute care use, major functional limits, or unsafe at home without support.",
      },
      {
        value: 3,
        label: "Mixed / partially controlled",
        description:
          "Some symptoms or functional issues present but partially managed; risk if supports are removed or stressors increase.",
      },
      {
        value: 5,
        label: "Stable / well controlled",
        description:
          "Symptoms well managed, good functional capacity for current expectations, low acute risk with current plan.",
      },
    ],
  },

  psychological: {
    id: "psychological",
    label: "Psychological",
    shortTitle: "Mood, cognition, coping, and insight",
    description:
      "Depression, anxiety, trauma responses, cognition, insight into condition, coping skills, and readiness to engage in care.",
    maslowLevels: ["Safety", "Esteem", "Self-Actualization"],
    anchors: [
      {
        value: 1,
        label: "Severely distressed / impaired",
        description:
          "Severe mood or anxiety symptoms, poor insight, suicidal ideation, or cognitive issues that strongly limit self-management.",
      },
      {
        value: 3,
        label: "Variable / vulnerable",
        description:
          "Intermittent distress, inconsistent coping, some insight but easily overwhelmed by stressors.",
      },
      {
        value: 5,
        label: "Stable / resilient",
        description:
          "Mood and coping generally stable, good insight, uses healthy strategies and accepts help when needed.",
      },
    ],
  },

  psychosocial: {
    id: "psychosocial",
    label: "Psychosocial",
    shortTitle: "Family, community, money, housing, work",
    description:
      "Family and caregiver support, housing stability, food, transportation, finances, employment, and community connection.",
    maslowLevels: ["Physiological", "Safety", "Love/Belonging", "Esteem"],
    anchors: [
      {
        value: 1,
        label: "High social risk",
        description:
          "Unstable housing, food or utility insecurity, significant caregiver strain, or limited/no support network.",
      },
      {
        value: 3,
        label: "Some strain / gaps",
        description:
          "Basic needs mostly met but fragile; limited backup, financial strain, or unreliable transportation or support.",
      },
      {
        value: 5,
        label: "Supportive / stable",
        description:
          "Stable housing and basic needs, dependable support, and manageable financial/employment situation.",
      },
    ],
  },

  professional: {
    id: "professional",
    label: "Professional",
    shortTitle: "Care team, coordination, and system fit",
    description:
      "Quality of communication with providers, care coordination, benefits coverage, and system navigation fit for this client.",
    maslowLevels: ["Safety", "Esteem"],
    anchors: [
      {
        value: 1,
        label: "Fragmented / unsafe",
        description:
          "Major care gaps, unclear plans, conflicting recommendations, or benefits barriers that put outcomes at risk.",
      },
      {
        value: 3,
        label: "Inconsistent / evolving",
        description:
          "Some coordination and access, but plans are still forming or there are unresolved system barriers.",
      },
      {
        value: 5,
        label: "Coordinated / responsive",
        description:
          "Clear plan, responsive providers, good information flow, and coverage adequate for current needs.",
      },
    ],
  },
};

/**
 * 10-V DEFS – placeholder for now; we’ll wire them in later.
 * Keeping the type ready so we can plug in easily when we build the V-screen.
 */

export type VKey =
  | "v1"
  | "v2"
  | "v3"
  | "v4"
  | "v5"
  | "v6"
  | "v7"
  | "v8"
  | "v9"
  | "v10";

export type VDefinition = {
  id: VKey;
  label: string;
  shortTitle: string;
  description: string;
  anchorsPs: PKey[]; // which Ps this V is anchored to
  anchors: ScaleAnchor[];
};

export const V_DEFS: Record<VKey, VDefinition> = {
  v1: {
    id: "v1",
    label: "Primary Drivers",
    shortTitle: "Core clinical and functional drivers of the case",
    description:
      "Overall strength of the health and functional issues driving the case from a nursing perspective.",
    anchorsPs: ["physical", "psychological", "psychosocial"],
    anchors: [
      {
        value: 1,
        label: "Very high driver burden",
        description:
          "Severe, uncontrolled drivers that clearly shape the case and disability picture.",
      },
      {
        value: 3,
        label: "Mixed / moderate drivers",
        description:
          "Drivers are present but partially controlled or improving; impact varies by context.",
      },
      {
        value: 5,
        label: "Low / well-managed drivers",
        description:
          "Key drivers are well controlled with current plan; minimal additional impact expected.",
      },
    ],
  },
  // v2–v10: we’ll fill these out properly when we build the V-screen
  v2: {
    id: "v2",
    label: "V2 (placeholder)",
    shortTitle: "To be defined",
    description: "We’ll complete V2 once we design the full 10-V map in the UI.",
    anchorsPs: ["physical"],
    anchors: [],
  },
  v3: {
    id: "v3",
    label: "V3 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["psychological"],
    anchors: [],
  },
  v4: {
    id: "v4",
    label: "V4 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["psychosocial"],
    anchors: [],
  },
  v5: {
    id: "v5",
    label: "V5 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["professional"],
    anchors: [],
  },
  v6: {
    id: "v6",
    label: "V6 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["physical"],
    anchors: [],
  },
  v7: {
    id: "v7",
    label: "V7 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["psychological"],
    anchors: [],
  },
  v8: {
    id: "v8",
    label: "V8 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["psychosocial"],
    anchors: [],
  },
  v9: {
    id: "v9",
    label: "V9 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["professional"],
    anchors: [],
  },
  v10: {
    id: "v10",
    label: "V10 (placeholder)",
    shortTitle: "To be defined",
    description: "Placeholder.",
    anchorsPs: ["physical", "psychological", "psychosocial", "professional"],
    anchors: [],
  },
};
