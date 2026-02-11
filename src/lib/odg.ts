// src/lib/odg.ts
// Lightweight ODG/MCG-style estimator with live delta (Adjusted – Baseline)

import { AppState } from "./models";

export type DayRange = { min: number; max: number };
export type Modifier = {
  name: string;
  effectDays: number; // can be negative
  rationale: string;
};

export type RecoveryWindow = {
  conditionKey: string;
  description: string;
  source: string; // e.g., "ODG-style heuristic"
  baselineDays: DayRange;
  totalDays: DayRange;
  deltaDays: DayRange; // total - baseline (min/max deltas)
  assumptions: string[];
  modifiers: Modifier[];
  notes?: string;
};

// --- Baseline heuristics per common injury keywords -------------------------
function baselineFor(label: string): DayRange {
  const L = (label || "").toLowerCase();

  // very light, indicative mapping; tune freely as you refine templates
  if (L.includes("whiplash") || L.includes("cervical") || L.includes("neck")) {
    return { min: 14, max: 42 }; // 2–6 weeks
  }
  if (L.includes("lumbar") || L.includes("low back") || L.includes("lbp")) {
    return { min: 21, max: 56 }; // 3–8 weeks
  }
  if (L.includes("rotator cuff") || L.includes("shoulder")) {
    return { min: 21, max: 63 }; // 3–9 weeks (non-op baseline)
  }
  if (L.includes("concussion") || L.includes("mtbi")) {
    return { min: 7, max: 28 }; // 1–4 weeks
  }
  if (L.includes("crush")) {
    return { min: 28, max: 84 }; // 4–12 weeks (high variance)
  }
  if (L.includes("laceration")) {
    return { min: 7, max: 21 };
  }
  if (L.includes("ankle sprain")) {
    return { min: 7, max: 28 };
  }

  // default “soft tissue” envelope
  return { min: 14, max: 49 };
}

// fold helpers
function addDaysRange(r: DayRange, days: number): DayRange {
  return { min: r.min + days, max: r.max + days };
}

function sumModifiers(mods: Modifier[]): number {
  return mods.reduce((acc, m) => acc + m.effectDays, 0);
}

function clampRange(r: DayRange, floor = 0): DayRange {
  return { min: Math.max(floor, r.min), max: Math.max(floor, r.max) };
}

function computeDeltaRange(baseline: DayRange, total: DayRange): DayRange {
  return { min: total.min - baseline.min, max: total.max - baseline.max };
}

// --- Public: main estimator --------------------------------------------------
export function estimateAllRecoveryWindows(state: AppState): RecoveryWindow[] {
  const injuries = state.injuries || [];
  const assumptionsGlobal: string[] = [];

  // Example: global comorbidity flags you may already carry on client
  const c = state.client || ({} as any);
  const comorbidities: string[] = Array.isArray(c.comorbidities)
    ? c.comorbidities
    : [];
  const smoker = !!c.smoker;
  const diabetic = !!c.diabetes;
  const obesity = !!c.obesity;

  if (smoker) assumptionsGlobal.push("Smoker status may slow tissue healing.");
  if (diabetic) assumptionsGlobal.push("Diabetes may prolong recovery.");
  if (obesity) assumptionsGlobal.push("Obesity may impact rehab pace.");
  if (state.sdoh?.transportation === "Barrier") {
    assumptionsGlobal.push("Transportation barrier may delay PT adherence.");
  }

  return injuries.map((inj, idx) => {
    const label = inj.label || inj.form || `Injury ${idx + 1}`;
    const baseline = baselineFor(label);

    const modifiers: Modifier[] = [];

    // --- Surgery & Post-op therapy (only add if it actually happened) ------
    if (inj.surgeryOccurred) {
      // base “surgical episode” time; you can specialize by label later
      modifiers.push({
        name: "Surgery performed",
        effectDays: 14,
        rationale: "Typical perioperative recovery (non-complicated).",
      });

      const weeks = Number(inj.postOpTherapyWeeks || 0);
      if (weeks > 0) {
        modifiers.push({
          name: "Post-op PT/OT",
          effectDays: weeks * 7,
          rationale: `${weeks} weeks of ordered therapy added.`,
        });
      }
    }

    // --- Comorbidity headwinds ------------------------------------------------
    if (diabetic) {
      modifiers.push({
        name: "Diabetes",
        effectDays: 7,
        rationale: "Evidence suggests slower wound/soft-tissue healing.",
      });
    }
    if (smoker) {
      modifiers.push({
        name: "Smoker",
        effectDays: 7,
        rationale: "Nicotine impairs perfusion and healing.",
      });
    }
    if (obesity) {
      modifiers.push({
        name: "Obesity",
        effectDays: 7,
        rationale: "Higher mechanical load; rehab progression may slow.",
      });
    }

    // --- SDOH barriers (example fields in state.client.sdoh) -----------------
    const sdoh = state.client?.sdoh || {};
    if (sdoh.transportation === "Barrier") {
      modifiers.push({
        name: "Transportation barrier",
        effectDays: 7,
        rationale: "Missed/delayed therapy or imaging appointments.",
      });
    }
    if (sdoh.financial_strain === "High") {
      modifiers.push({
        name: "Financial strain",
        effectDays: 7,
        rationale: "Medication adherence and co-pay barriers.",
      });
    }

    // (Optional) Positive deltas (reductions) can be modeled as negative days:
    // if (state.client?.excellentAdherence) {
    //   modifiers.push({
    //     name: "Excellent adherence",
    //     effectDays: -5,
    //     rationale: "Consistent HEP and therapy attendance.",
    //   });
    // }

    const totalShift = sumModifiers(modifiers);
    const total = clampRange(addDaysRange(baseline, totalShift), 0);
    const delta = computeDeltaRange(baseline, total);

    const assumptions = [
      ...assumptionsGlobal,
      "Estimates reflect typical clinical courses; individual results vary.",
    ];

    return {
      conditionKey: inj.id || `${idx}`,
      description: label,
      source: "ODG/MCG-style heuristic (curated, not a substitute for license)",
      baselineDays: baseline,
      totalDays: total,
      deltaDays: delta,
      assumptions,
      modifiers,
      notes:
        inj.surgeryOccurred
          ? "Post-op time only applied because surgery is marked as occurred."
          : undefined,
    };
  });
}
