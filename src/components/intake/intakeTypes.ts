/** Shared types for the client intake wizard. */

export interface IntakeAttorney {
  attorneyId: string;
  attorneyCode: string;
  displayName: string;
}

export interface IntakePersonal {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
}

export type AccidentType = "auto" | "slip_fall" | "work_injury" | "other";

export interface IntakeInjury {
  dateOfInjury: string;
  accidentType: AccidentType;
  accidentTypeOther: string;
  description: string;
}

export interface IntakeDiagnoses {
  selected: string[];
  other: string;
}

export interface MedicationRow {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  isPrn: boolean;
  prnFor: string;
}

export interface IntakeMedications {
  rows: MedicationRow[];
}

export interface IntakeWellness4Ps {
  physical: number;
  psychological: number;
  psychosocial: number;
  professional: number;
}

export interface IntakeSDOH {
  housingStability: number;
  foodSecurity: number;
  transportation: number;
  childcare: number;
  financialStrain: number;
  intimatePartnerSafety: number;
}

export interface IntakeConsent {
  informationAccurate: boolean;
  agreeToTerms: boolean;
}

export interface IntakeFormData {
  attorney: IntakeAttorney | null;
  personal: IntakePersonal;
  injury: IntakeInjury;
  diagnoses: IntakeDiagnoses;
  medications: IntakeMedications;
  wellness: IntakeWellness4Ps;
  sdoh: IntakeSDOH;
  consent: IntakeConsent;
}

export const INITIAL_PERSONAL: IntakePersonal = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  email: "",
  phone: "",
};

export const INITIAL_INJURY: IntakeInjury = {
  dateOfInjury: "",
  accidentType: "auto",
  accidentTypeOther: "",
  description: "",
};

export const INITIAL_DIAGNOSES: IntakeDiagnoses = {
  selected: [],
  other: "",
};

export const INITIAL_MEDICATIONS: IntakeMedications = {
  rows: [],
};

export const INITIAL_WELLNESS: IntakeWellness4Ps = {
  physical: 3,
  psychological: 3,
  psychosocial: 3,
  professional: 3,
};

export const INITIAL_SDOH: IntakeSDOH = {
  housingStability: 3,
  foodSecurity: 3,
  transportation: 3,
  childcare: 3,
  financialStrain: 3,
  intimatePartnerSafety: 3,
};

export const INITIAL_CONSENT: IntakeConsent = {
  informationAccurate: false,
  agreeToTerms: false,
};

export const INITIAL_FORM_DATA: IntakeFormData = {
  attorney: null,
  personal: INITIAL_PERSONAL,
  injury: INITIAL_INJURY,
  diagnoses: INITIAL_DIAGNOSES,
  medications: INITIAL_MEDICATIONS,
  wellness: INITIAL_WELLNESS,
  sdoh: INITIAL_SDOH,
  consent: INITIAL_CONSENT,
};

export const STEPS = [
  "Attorney Selection",
  "Personal Information",
  "Accident/Injury Details",
  "Current Diagnoses",
  "Current Medications",
  "4Ps Wellness Self-Assessment",
  "SDOH Screening",
  "Consent & Attestation",
  "Summary & Submit",
] as const;

export type StepIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
