// src/lib/injuryTemplates.ts

export type InjuryTemplateId =
  | "MVA"
  | "SprainStrainMSD"
  | "SlipTripFall"
  | "StruckByCaughtIn"
  | "LacerationPuncture"
  | "Overexertion"
  | "CrushInjury"
  | "DogBite"
  | "ProductLiability"
  | "MedMal"
  | "WrongfulDeath"
  | "Generic";

export interface ICD10Option {
  code: string;
  label: string;
  requiresLaterality?: boolean;
  conditionKey?: string; // e.g. "rotator_cuff_tear"
}

export interface InjuryTemplate {
  id: InjuryTemplateId;
  name: string;
  description: string;
  relatedConditions: string[]; // search hints
  icd10Suggestions: ICD10Option[];
}

export const INJURY_TEMPLATES: InjuryTemplate[] = [
  {
    id: "MVA",
    name: "Motor Vehicle Accident (MVA)",
    description:
      "Use for auto, truck, motorcycle, pedestrian, or bike collisions. Maps mechanism → injury patterns.",
    relatedConditions: [
      "whiplash",
      "concussion",
      "rib fracture",
      "seatbelt injury",
      "PTSD",
    ],
    icd10Suggestions: [
      { code: "S13.4XXA", label: "Sprain of cervical spine (Whiplash)" },
      { code: "S06.0X0A", label: "Concussion w/o LOC, initial" },
      { code: "S22.42XA", label: "Multiple rib fractures, left side" },
      { code: "M54.2", label: "Cervicalgia (neck pain)" },
      { code: "F43.10", label: "Post-traumatic stress disorder" },
    ],
  },
  {
    id: "SprainStrainMSD",
    name: "Sprains, Strains & MSDs",
    description:
      "Use for soft tissue, repetitive strain, and overuse injuries in work comp or PI.",
    relatedConditions: [
      "rotator cuff tear",
      "lumbar strain",
      "carpal tunnel",
      "tendonitis",
    ],
    icd10Suggestions: [
      {
        code: "M75.1",
        label: "Rotator cuff tear (select side)",
        requiresLaterality: true,
        conditionKey: "rotator_cuff_tear",
      },
      {
        code: "G56.0",
        label: "Carpal tunnel syndrome (select side)",
        requiresLaterality: true,
        conditionKey: "carpal_tunnel",
      },
      { code: "S33.5XXA", label: "Sprain of lumbar spine" },
      { code: "M62.830", label: "Muscle spasm of back" },
    ],
  },
  {
    id: "CrushInjury",
    name: "Crush Injury",
    description:
      "Use for compression injuries with risk of compartment syndrome, rhabdo, amputation.",
    relatedConditions: [
      "compartment syndrome",
      "rhabdomyolysis",
      "traumatic amputation",
    ],
    icd10Suggestions: [
      { code: "S28.0XXA", label: "Crushed chest" },
      { code: "S67.01XA", label: "Crushing injury of right thumb" },
      { code: "R82.1", label: "Myoglobinuria (rhabdo indicator)" },
    ],
  },
  // TODO: Add remaining templates (DogBite, ProductLiability, etc.) using your spec.
];
