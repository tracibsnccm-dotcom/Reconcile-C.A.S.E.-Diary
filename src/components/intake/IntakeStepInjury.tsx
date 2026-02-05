import React, { useEffect } from "react";
import type { IntakeFormData, IntakeInjury, AccidentType } from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800/95 border border-slate-600 rounded-xl shadow-xl shadow-black/30 p-6 sm:p-8 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const INPUT_CLASS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

const ACCIDENT_TYPES: { value: AccidentType; label: string }[] = [
  { value: "auto", label: "Auto accident" },
  { value: "slip_fall", label: "Slip / fall" },
  { value: "work_injury", label: "Work injury" },
  { value: "other", label: "Other" },
];

interface IntakeStepInjuryProps {
  data: IntakeFormData;
  onChange: (injury: IntakeInjury) => void;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepInjury({
  data,
  onChange,
  onValidityChange,
}: IntakeStepInjuryProps) {
  const i = data.injury;
  const valid =
    !!i.dateOfInjury.trim() &&
    !!i.accidentType &&
    (i.accidentType !== "other" || !!i.accidentTypeOther.trim()) &&
    !!i.description.trim();

  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        Accident / Injury Details
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        When and how the injury occurred, and a brief description.
      </p>
      <div className="space-y-5">
      <div>
        <label className={LABEL_CLASS}>Date of injury *</label>
        <input
          type="date"
          className={INPUT_CLASS}
          value={i.dateOfInjury}
          onChange={(e) => onChange({ ...i, dateOfInjury: e.target.value })}
        />
      </div>
      <div>
        <label className={LABEL_CLASS}>Type of accident *</label>
        <select
          className={INPUT_CLASS}
          value={i.accidentType}
          onChange={(e) =>
            onChange({ ...i, accidentType: e.target.value as AccidentType })
          }
        >
          {ACCIDENT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {i.accidentType === "other" && (
        <div>
          <label className={LABEL_CLASS}>Please describe *</label>
          <input
            type="text"
            className={INPUT_CLASS}
            value={i.accidentTypeOther}
            onChange={(e) =>
              onChange({ ...i, accidentTypeOther: e.target.value })
            }
            placeholder="Other type of accident"
        />
        </div>
      )}
      <div className="flex flex-col gap-3 p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
        <h4 className="font-semibold text-sm text-orange-200">Tell Us What Happened</h4>
        <p className="text-slate-400 text-sm">
          Describe the incident in your own words. Include important details like what happened, where, and any immediate effects you experienced.
        </p>
      </div>
      <div>
        <label className={LABEL_CLASS}>Brief description of the incident *</label>
        <textarea
          className={`${INPUT_CLASS} min-h-[120px] resize-y`}
          value={i.description}
          onChange={(e) => onChange({ ...i, description: e.target.value })}
          placeholder="What happened?"
          rows={4}
        />
      </div>
      </div>
    </div>
  );
}
