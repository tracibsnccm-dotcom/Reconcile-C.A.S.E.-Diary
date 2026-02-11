// src/lib/necessityDriver.ts

import { InjuryInstance, ODGProfileSnapshot } from "./models";

/**
 * Example stub: In production, this would be backed by licensed ODG/MCG data.
 * Here we encode YOUR intent:
 * - Use guidelines to SUPPORT and EXPLAIN, not to deny.
 */
export function buildOdgProfileForInjury(
  injury: InjuryInstance,
  options: {
    hasDiabetes?: boolean;
    hasCardiacDisease?: boolean;
    hasObesity?: boolean;
    hasCOPD?: boolean;
    surgeriesCompleted?: number;
    postOpRehabCompleted?: boolean;
  } = {}
): ODGProfileSnapshot {
  // Base example values (placeholder; real values come from licensed content)
  let baseMin = 4;
  let baseMax = 12;

  if (injury.templateId === "CrushInjury") {
    baseMin = 12;
    baseMax = 52;
  }

  let comorbidityAdd = 0;
  if (options.hasDiabetes) comorbidityAdd += 2;
  if (options.hasCardiacDisease) comorbidityAdd += 2;
  if (options.hasObesity) comorbidityAdd += 1;
  if (options.hasCOPD) comorbidityAdd += 1;

  let surgeryAdd = 0;
  if (options.surgeriesCompleted && options.surgeriesCompleted > 0) {
    surgeryAdd += 4 * options.surgeriesCompleted; // example: +4 weeks per surgery
  }

  let rehabAdd = 0;
  if (options.postOpRehabCompleted) {
    rehabAdd += 2; // example: document structured rehab period
  }

  return {
    guidelineName: "ODG/MCG-derived (illustrative placeholder)",
    baseLodWeeksMin: baseMin,
    baseLodWeeksMax: baseMax,
    comorbidityAdjustmentsWeeks: comorbidityAdd,
    surgeryAddedWeeks: surgeryAdd,
    rehabAddedWeeks: rehabAdd,
    notes:
      "For advocacy use only. These ranges support explanation of why care is reasonable; they must never be used to auto-terminate care.",
  };
}

/**
 * Helper: decide if current case duration is outside expected range,
 * so RN CM can explain variance (not deny care).
 */
export function isVarianceFromGuideline(
  weeksSinceInjury: number,
  odg: ODGProfileSnapshot
): boolean {
  const max =
    (odg.baseLodWeeksMax || 0) +
    (odg.comorbidityAdjustmentsWeeks || 0) +
    (odg.surgeryAddedWeeks || 0) +
    (odg.rehabAddedWeeks || 0);
  return max > 0 && weeksSinceInjury > max;
}
