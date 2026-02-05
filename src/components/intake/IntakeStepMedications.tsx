import React, { useEffect, useCallback } from "react";
import type {
  IntakeFormData,
  IntakeMedications,
  MedicationRow,
} from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800/95 border border-slate-600 rounded-xl shadow-xl shadow-black/30 p-6 sm:p-8 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const INPUT_CLASS =
  "w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";
const BTN_OUTLINE =
  "px-4 py-2 rounded-lg border border-slate-500 text-slate-300 hover:bg-slate-700 transition-colors";
const BTN_ORANGE =
  "px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors";

function newRow(): MedicationRow {
  return {
    id: crypto.randomUUID?.() ?? `med-${Date.now()}-${Math.random()}`,
    name: "",
    dosage: "",
    frequency: "",
    isPrn: false,
    prnFor: "",
  };
}

interface IntakeStepMedicationsProps {
  data: IntakeFormData;
  onChange: (medications: IntakeMedications) => void;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepMedications({
  data,
  onChange,
  onValidityChange,
}: IntakeStepMedicationsProps) {
  const m = data.medications;
  const addRow = useCallback(() => {
    onChange({ ...m, rows: [...m.rows, newRow()] });
  }, [m, onChange]);
  const removeRow = useCallback(
    (id: string) => {
      onChange({ ...m, rows: m.rows.filter((r) => r.id !== id) });
    },
    [m, onChange]
  );
  const updateRow = useCallback(
    (id: string, patch: Partial<MedicationRow>) => {
      onChange({
        ...m,
        rows: m.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      });
    },
    [m, onChange]
  );

  // Medications step is valid even with zero rows
  const valid = true;
  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        Current Medications
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Add each medication with name, dosage, and frequency. Use PRN for
        as-needed medications and describe what it&apos;s for.
      </p>
      <div className="space-y-5">
        {m.rows.map((row) => (
          <div
            key={row.id}
            className="p-4 rounded-lg bg-slate-700/30 border border-slate-600 space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Medication</span>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL_CLASS}>Name</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                  placeholder="Medication name"
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Dosage</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={row.dosage}
                  onChange={(e) => updateRow(row.id, { dosage: e.target.value })}
                  placeholder="e.g. 10 mg"
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS}>Frequency</label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={row.frequency}
                onChange={(e) =>
                  updateRow(row.id, { frequency: e.target.value })
                }
                placeholder="e.g. Twice daily, Every 8 hours"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={row.isPrn}
                onChange={(e) =>
                  updateRow(row.id, { isPrn: e.target.checked })
                }
                className="rounded border-slate-500 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-slate-300 text-sm">PRN (as needed)</span>
            </label>
            {row.isPrn && (
              <div>
                <label className={LABEL_CLASS}>What it&apos;s for</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={row.prnFor}
                  onChange={(e) => updateRow(row.id, { prnFor: e.target.value })}
                  placeholder="e.g. Pain, Sleep"
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className={`mt-4 ${BTN_ORANGE}`}
      >
        + Add medication
      </button>
    </div>
  );
}
