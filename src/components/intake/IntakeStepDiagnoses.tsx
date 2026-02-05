import React, { useEffect } from "react";
import type { IntakeFormData, IntakeDiagnoses } from "./intakeTypes";
import { DIAGNOSES_OPTIONS } from "./diagnosesList";

const CARD_CLASS =
  "bg-slate-800/95 border border-slate-600 rounded-xl shadow-xl shadow-black/30 p-6 sm:p-8 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const INPUT_CLASS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

interface IntakeStepDiagnosesProps {
  data: IntakeFormData;
  onChange: (diagnoses: IntakeDiagnoses) => void;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepDiagnoses({
  data,
  onChange,
  onValidityChange,
}: IntakeStepDiagnosesProps) {
  const d = data.diagnoses;

  // Step is valid even with no selection (optional to have at least one)
  const valid = true;
  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        Current Diagnoses
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Select all that apply (alphabetized). Add any unlisted diagnoses in the
        box below.
      </p>
      <div className="space-y-5">
      <div>
        <label className={LABEL_CLASS}>Select diagnoses</label>
        <select
          multiple
          className={`${INPUT_CLASS} min-h-[200px]`}
          value={d.selected}
          onChange={(e) => {
            const opts = Array.from(
              e.target.selectedOptions,
              (o) => o.value
            );
            onChange({ ...d, selected: opts });
          }}
        >
          {DIAGNOSES_OPTIONS.filter((x) => x !== "Other").map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <p className="text-slate-500 text-xs mt-1">
          Hold Ctrl/Cmd to select multiple.
        </p>
      </div>
      <div>
        <label className={LABEL_CLASS}>Other / unlisted diagnoses</label>
        <textarea
          className={`${INPUT_CLASS} min-h-[80px] resize-y`}
          value={d.other}
          onChange={(e) => onChange({ ...d, other: e.target.value })}
          placeholder="List any other diagnoses not shown above"
          rows={3}
        />
      </div>
      </div>
    </div>
  );
}
