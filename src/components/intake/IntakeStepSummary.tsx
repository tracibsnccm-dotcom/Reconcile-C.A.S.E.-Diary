import React, { useEffect } from "react";
import type { IntakeFormData } from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800 border border-slate-700 rounded-xl p-6 text-left";
const SECTION_TITLE = "text-sm font-semibold text-orange-500 uppercase tracking-wide mb-2";
const ROW_CLASS = "text-slate-300 text-sm py-1";
const ACCIDENT_LABELS: Record<string, string> = {
  auto: "Auto accident",
  slip_fall: "Slip / fall",
  work_injury: "Work injury",
  other: "Other",
};

interface IntakeStepSummaryProps {
  data: IntakeFormData;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepSummary({
  data,
  onValidityChange,
}: IntakeStepSummaryProps) {
  useEffect(() => {
    onValidityChange(true);
  }, [onValidityChange]);

  const { attorney, personal, injury, diagnoses, medications, wellness, sdoh } =
    data;

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        Summary & Submit
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Review your information below. Click Submit to send your intake to your
        attorney.
      </p>
      <div className="space-y-6">
        {attorney && (
          <div>
            <div className={SECTION_TITLE}>Attorney</div>
            <p className={ROW_CLASS}>{attorney.displayName}</p>
            {attorney.attorneyCode && (
              <p className="text-slate-500 text-xs">{attorney.attorneyCode}</p>
            )}
          </div>
        )}
        <div>
          <div className={SECTION_TITLE}>Personal Information</div>
          <p className={ROW_CLASS}>
            {personal.firstName} {personal.lastName}
          </p>
          <p className={ROW_CLASS}>DOB: {personal.dateOfBirth}</p>
          <p className={ROW_CLASS}>{personal.email}</p>
          <p className={ROW_CLASS}>{personal.phone}</p>
        </div>
        <div>
          <div className={SECTION_TITLE}>Accident / Injury</div>
          <p className={ROW_CLASS}>Date: {injury.dateOfInjury}</p>
          <p className={ROW_CLASS}>
            Type:{" "}
            {injury.accidentType === "other"
              ? injury.accidentTypeOther || "Other"
              : ACCIDENT_LABELS[injury.accidentType] ?? injury.accidentType}
          </p>
          <p className={ROW_CLASS}>{injury.description}</p>
        </div>
        <div>
          <div className={SECTION_TITLE}>Diagnoses</div>
          {diagnoses.selected.length > 0 ? (
            <p className={ROW_CLASS}>{diagnoses.selected.join(", ")}</p>
          ) : null}
          {diagnoses.other.trim() ? (
            <p className={ROW_CLASS}>Other: {diagnoses.other}</p>
          ) : null}
          {!diagnoses.selected.length && !diagnoses.other.trim() && (
            <p className="text-slate-500 text-sm">None listed</p>
          )}
        </div>
        <div>
          <div className={SECTION_TITLE}>Medications</div>
          {medications.rows.length === 0 ? (
            <p className="text-slate-500 text-sm">None listed</p>
          ) : (
            <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
              {medications.rows.map((r) => (
                <li key={r.id}>
                  {r.name} {r.dosage && `— ${r.dosage}`}{" "}
                  {r.frequency && `(${r.frequency})`}
                  {r.isPrn && r.prnFor && ` — PRN: ${r.prnFor}`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className={SECTION_TITLE}>4Ps Wellness</div>
          <p className={ROW_CLASS}>
            Physical {wellness.physical} · Psychological {wellness.psychological}{" "}
            · Psychosocial {wellness.psychosocial} · Professional{" "}
            {wellness.professional}
          </p>
        </div>
        <div>
          <div className={SECTION_TITLE}>SDOH</div>
          <p className={ROW_CLASS}>
            Housing {sdoh.housingStability} · Food {sdoh.foodSecurity} ·
            Transportation {sdoh.transportation} · Childcare {sdoh.childcare} ·
            Financial {sdoh.financialStrain} · Partner safety{" "}
            {sdoh.intimatePartnerSafety}
          </p>
        </div>
      </div>
    </div>
  );
}
