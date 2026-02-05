import React, { useEffect } from "react";
import type { IntakeFormData, IntakeSDOH } from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800/95 border border-slate-600 rounded-xl shadow-xl shadow-black/30 p-6 sm:p-8 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const SCALE_LOW = "Significant concern";
const SCALE_HIGH = "Stable / No concern";

const SDOH_ITEMS: { key: keyof IntakeSDOH; label: string }[] = [
  { key: "housingStability", label: "Housing stability" },
  { key: "foodSecurity", label: "Food security" },
  { key: "transportation", label: "Transportation" },
  { key: "childcare", label: "Childcare" },
  { key: "financialStrain", label: "Financial strain" },
  { key: "intimatePartnerSafety", label: "Intimate partner safety" },
];

interface IntakeStepSDOHProps {
  data: IntakeFormData;
  onChange: (sdoh: IntakeSDOH) => void;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepSDOH({
  data,
  onChange,
  onValidityChange,
}: IntakeStepSDOHProps) {
  const s = data.sdoh;
  const valid = true;
  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        SDOH Screening
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Rate each area from 1 (significant concern) to 5 (stable / no concern).
        This helps connect you with resources if needed.
      </p>
      <div className="space-y-6">
        {SDOH_ITEMS.map(({ key, label }) => (
          <div key={key} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <label className={LABEL_CLASS}>{label}</label>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                value={s[key]}
                onChange={(e) =>
                  onChange({ ...s, [key]: parseInt(e.target.value, 10) })
                }
                className="flex-1 min-w-[120px] h-3 rounded-lg appearance-none bg-slate-600 accent-orange-500"
              />
              <span className="min-w-[3rem] text-center py-2 px-3 rounded-lg bg-orange-500 text-white font-bold text-lg">
                {s[key]}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>1 — {SCALE_LOW}</span>
              <span>5 — {SCALE_HIGH}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
