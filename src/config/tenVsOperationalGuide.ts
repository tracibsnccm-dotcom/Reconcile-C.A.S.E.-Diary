export type TenVId =
  | "V1" | "V2" | "V3" | "V4" | "V5"
  | "V6" | "V7" | "V8" | "V9" | "V10";

export type TenVDef = {
  id: TenVId;
  label: string;
  literalMeaning: string;
  definition: string; // Etymology-Aligned Definition (verbatim)
};

export const TEN_VS_OPERATIONAL_GUIDE: TenVDef[] = [
  {
    id: "V1",
    label: "Voice / View",
    literalMeaning: `Voice = expression; View = perspective, way of seeing.`,
    definition: `Capture the patient's authentic voice and personal view of their condition, fears, hopes, and expectations. This establishes the lived-experience narrative that guides all clinical reasoning and ensures the plan reflects who the patient truly is — not who the system assumes them to be.`,
  },
  {
    id: "V2",
    label: "Viability",
    literalMeaning: `Capacity to live, grow, or function; feasibility.`,
    definition: `Determine whether the patient has the capacity, readiness, resources, and support to participate in the care plan. Viability clarifies whether a plan is feasible for this patient at this moment. If participation is not viable, provide supportive resources without initiating a formal plan.`,
  },
  {
    id: "V3",
    label: "Vision",
    literalMeaning: `Sight, foresight, the ability to imagine a future state.`,
    definition: `Translate the patient's needs, risks, and circumstances into a clear, personalized picture of what recovery should look like. Vision is where insight becomes strategy — a forward-looking, evidence-aligned plan built from the 4Ps and SDOH.`,
  },
  {
    id: "V4",
    label: "Veracity",
    literalMeaning: `Truthfulness, accuracy, faithfulness to reality.`,
    definition: `Deliver and document care with truth, accuracy, and fidelity to the patient's real condition and responses. Veracity ensures interventions are honest to the patient's lived reality — not exaggerated, minimized, or copied from another case. It protects clinical integrity and documentation defensibility.`,
  },
  {
    id: "V5",
    label: "Versatility",
    literalMeaning: `Ability to adapt, adjust, or change form.`,
    definition: `Continuously adapt the care plan to reflect the patient's evolving needs, barriers, and responses. Versatility prevents cookie-cutter care by ensuring the plan remains flexible, individualized, and responsive — never static or generic.`,
  },
  {
    id: "V6",
    label: "Vitality",
    literalMeaning: `Life, energy, strength, capacity to grow or recover.`,
    definition: `Assess the patient's functional "life force" — their capacity to heal, progress, and participate meaningfully in recovery. Vitality reveals whether the plan is producing real improvement or whether the patient is losing momentum, plateauing, or declining. This is the pivot where clinical truth becomes operational direction.`,
  },
  {
    id: "V7",
    label: "Vigilance",
    literalMeaning: `Watchfulness, alert attention, staying awake to change or danger.`,
    definition: `Maintain active, adaptive watchfulness over the patient's condition, risks, and progress. Vigilance means oversight is dynamic — not tied to arbitrary intervals. You stay alert to changes in symptoms, functioning, safety, adherence, and psychosocial factors, adjusting monitoring accordingly.`,
  },
  {
    id: "V8",
    label: "Verification",
    literalMeaning: `To make true; to confirm authenticity or accuracy.`,
    definition: `Confirm that care delivered and outcomes achieved are accurate, appropriate, and aligned with evidence-based guidelines and patient goals. Verification ensures medical necessity is clear, interventions match standards, and documentation reflects what actually occurred.`,
  },
  {
    id: "V9",
    label: "Value",
    literalMeaning: `Worth, usefulness, benefit, or importance.`,
    definition: `Demonstrate the clinical, functional, and financial worth of the care provided. Value shows how resources were used appropriately, risks were mitigated, and outcomes improved — making the impact of care management visible and measurable.`,
  },
  {
    id: "V10",
    label: "Validation",
    literalMeaning: `To make strong; to confirm legitimacy; to prove soundness.`,
    definition: `Ensure the entire care-management process — decisions, interventions, documentation, and outcomes — is legitimate, defensible, and audit-ready. Validation is the final confirmation that the case can withstand scrutiny and that medical necessity is evident throughout.`,
  },
];

export function getVDefinitionById(id: TenVId) {
  return TEN_VS_OPERATIONAL_GUIDE.find((v) => v.id === id);
}

export function getVDefinitionByLabel(label: string) {
  const norm = (s: string) => s.trim().toLowerCase();
  return TEN_VS_OPERATIONAL_GUIDE.find((v) => norm(v.label) === norm(label));
}
