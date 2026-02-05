import React, { useEffect } from "react";
import type { IntakeFormData, IntakeWellness4Ps } from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800/95 border border-slate-600 rounded-xl shadow-xl shadow-black/30 p-6 sm:p-8 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const SCALE_LOW = "Crisis";
const SCALE_HIGH = "Optimal";

const DOMAINS: { key: keyof IntakeWellness4Ps; label: string; description: string }[] = [
  {
    key: "physical",
    label: "Physical",
    description: "Body comfort, energy, ability to manage daily activities (Maslow: physiological)",
  },
  {
    key: "psychological",
    label: "Psychological",
    description: "Emotional comfort, coping, mental clarity (Maslow: safety, esteem)",
  },
  {
    key: "psychosocial",
    label: "Psychosocial",
    description: "Connection, support, communication (Maslow: love/belonging)",
  },
  {
    key: "professional",
    label: "Professional",
    description: "Purpose, motivation, ability to act (Maslow: self-actualization)",
  },
];

interface IntakeStepWellnessProps {
  data: IntakeFormData;
  onChange: (wellness: IntakeWellness4Ps) => void;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepWellness({
  data,
  onChange,
  onValidityChange,
}: IntakeStepWellnessProps) {
  const w = data.wellness;
  const valid = true;
  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        4Ps Wellness Self-Assessment
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Rate each area from 1 (Crisis) to 5 (Optimal). These are Maslow-based
        wellness domains.
      </p>
      <div className="space-y-6">
        {DOMAINS.map(({ key, label, description }) => (
          <div key={key} className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50">
            <label className={LABEL_CLASS}>
              {label} — {description}
            </label>
            <div className="flex flex-wrap items-center gap-4">
              <input
                type="range"
                min={1}
                max={5}
                value={w[key]}
                onChange={(e) =>
                  onChange({ ...w, [key]: parseInt(e.target.value, 10) })
                }
                className="flex-1 min-w-[120px] h-3 rounded-lg appearance-none bg-slate-600 accent-orange-500"
              />
              <span className="min-w-[3rem] text-center py-2 px-3 rounded-lg bg-orange-500 text-white font-bold text-lg">
                {w[key]}
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
