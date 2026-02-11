// src/lib/icd10Library.ts

import { ICD10Code } from "./models";

export interface InjuryTemplateConfig {
  id: string;
  label: string;
  description: string;
  suggestedCodes: ICD10Code[];
}

// Curated ICD-10 sets for your key pathways
// (phase 1: focused, not exhaustive)
const mvaCodes: ICD10Code[] = [
  { code: "S13.4", label: "Sprain of cervical spine (Whiplash)", category: "MVA" },
  { code: "S06.0X0A", label: "Concussion w/o loss of consciousness, initial", category: "MVA" },
  { code: "M54.2", label: "Cervicalgia (Neck pain)", category: "MVA" },
  { code: "M54.51", label: "Vertebrogenic low back pain", category: "MVA" },
  { code: "F43.10", label: "Post-traumatic stress disorder, unspecified", category: "MVA" },
];

const sprainStrainCodes: ICD10Code[] = [
  { code: "S33.5XXA", label: "Sprain of lumbar spine, initial", category: "Sprain/Strain" },
  { code: "M75.11", label: "Rotator cuff tear, right shoulder", category: "Sprain/Strain" },
  { code: "M75.12", label: "Rotator cuff tear, left shoulder", category: "Sprain/Strain" },
  { code: "G56.01", label: "Carpal tunnel syndrome, right upper limb", category: "Sprain/Strain" },
  { code: "G56.02", label: "Carpal tunnel syndrome, left upper limb", category: "Sprain/Strain" },
];

const slipFallCodes: ICD10Code[] = [
  { code: "S72.002A", label: "Fracture of neck of femur, left", category: "Slip/Fall" },
  { code: "S52.501A", label: "Fracture of radial styloid process, right arm", category: "Slip/Fall" },
  { code: "S93.401A", label: "Sprain of right ankle, unspecified ligament", category: "Slip/Fall" },
];

const dogBiteCodes: ICD10Code[] = [
  { code: "W54.0XXA", label: "Bitten by dog, initial encounter", category: "Dog Bite" },
  { code: "S61.451A", label: "Open bite of right hand", category: "Dog Bite" },
];

const crushCodes: ICD10Code[] = [
  { code: "S28.0XXA", label: "Crushed chest, initial encounter", category: "Crush" },
  { code: "S67.01XA", label: "Crushing injury of right thumb", category: "Crush" },
];

export const injuryTemplates: InjuryTemplateConfig[] = [
  {
    id: "mva",
    label: "Motor Vehicle Accident (MVA)",
    description:
      "Use for car/truck/motorcycle/pedestrian collisions. Supports whiplash, concussion, rib, shoulder, spine injuries.",
    suggestedCodes: mvaCodes,
  },
  {
    id: "sprain_strain",
    label: "Sprains / Strains / MSDs",
    description:
      "Use for soft tissue, repetitive strain, work comp musculoskeletal injuries.",
    suggestedCodes: sprainStrainCodes,
  },
  {
    id: "slip_fall",
    label: "Slips, Trips & Falls",
    description:
      "Use for fall-related fractures, dislocations, head trauma, premises liability.",
    suggestedCodes: slipFallCodes,
  },
  {
    id: "dog_bite",
    label: "Dog Bites & Animal Attacks",
    description:
      "Use for bite wounds, disfigurement, infection risk, psychological trauma.",
    suggestedCodes: dogBiteCodes,
  },
  {
    id: "crush",
    label: "Crush Injuries",
    description:
      "Use for high-force compression injuries, compartment syndrome, amputation risk.",
    suggestedCodes: crushCodes,
  },
];

// Simple lookup helper
export function getTemplateById(id: string): InjuryTemplateConfig | undefined {
  return injuryTemplates.find((t) => t.id === id);
}
