// src/domain/crisisCategory.ts
// Crisis categories for Reconcile C.A.R.E. Crisis Mode

export type CrisisCategory =
  | "behavioral_suicide"
  | "medical"
  | "violence_assault"
  | "other";

export const CRISIS_CATEGORY_LABELS: Record<CrisisCategory, string> = {
  behavioral_suicide: "Behavioral / Suicide / Self-harm",
  medical: "Medical Emergency",
  violence_assault: "Violence / Assault / Safety",
  other: "Other / Unsure",
};

export const CRISIS_CATEGORY_DESCRIPTIONS: Record<CrisisCategory, string> = {
  behavioral_suicide:
    "Thoughts or behaviors related to self-harm, suicide, or acute psychiatric crisis.",
  medical:
    "Acute medical symptoms such as chest pain, stroke signs, severe breathing problems, or rapidly worsening condition.",
  violence_assault:
    "Client at risk of harm from another person, domestic violence, or active threat in the environment.",
  other:
    "Something is clearly unsafe or emergent, but it does not neatly fit into the other categories.",
};
