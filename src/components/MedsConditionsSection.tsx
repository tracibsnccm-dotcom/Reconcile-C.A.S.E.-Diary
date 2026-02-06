import React, { useEffect, useMemo, useState } from "react";

/**
 * Reusable section to collect:
 *  - Current conditions under treatment
 *  - Full medication list (Rx, OTC, vitamins, supplements, herbals)
 *  - Allergies (meds/foods)
 *  - Required attestation checkbox
 *
 * Use in both Intake and Clinical Notes. Set `required=true` to make fields mandatory.
 *
 * Props:
 *  - mode: "intake" | "rnNotes"   (labels tweak)
 *  - initial?: { conditions?: string; meds?: string; allergies?: string; attested?: boolean }
 *  - required?: boolean
 *  - onChange: (values) => void
 *
 * Validation:
 *  - If required=true: conditions, meds, allergies must be non-empty AND attested must be true.
 *  - Accept the word "None" (case-insensitive) if nothing to report.
 */

type Values = {
  conditions: string;
  meds: string;
  allergies: string;
  attested: boolean;
};

function RequiredBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 border border-red-200">
      Required
    </span>
  );
}

function isFilled(v: string) {
  return typeof v === "string" && v.trim().length > 0;
}

export function MedsConditionsSection({
  mode = "intake",
  initial,
  required = true,
  onChange,
}: {
  mode?: "intake" | "rnNotes";
  initial?: Partial<Values>;
  required?: boolean;
  onChange: (v: Values & { valid: boolean }) => void;
}) {
  const [values, setValues] = useState<Values>({
    conditions: initial?.conditions ?? "",
    meds: initial?.meds ?? "",
    allergies: initial?.allergies ?? "",
    attested: initial?.attested ?? false,
  });

  const labels =
    mode === "intake"
      ? {
          title: "Current Conditions, Medications & Allergies",
          conditions: "What conditions are you currently being treated for?",
          meds:
            "List ALL medications you take — prescribed, over-the-counter, vitamins, supplements, and herbals (no matter how minor).",
          allergies: "Allergies (medications and foods). If none, type \"None\".",
          attestation:
            "I confirm I have listed all medications, OTC medicines, vitamins, supplements, and herbals to the best of my knowledge.",
        }
      : {
          title: "Clinical Notes — Conditions, Medications & Allergies",
          conditions: "Document current treated conditions (client report / chart).",
          meds:
            "Document complete medication list (Rx, OTC, vitamins, supplements, herbals).",
          allergies: "Allergies (medications/foods). If none, record \"None\".",
          attestation:
            "I attest this list reflects the client's current report at time of contact.",
        };

  const validity = useMemo(() => {
    if (!required)
      return { conditions: true, meds: true, allergies: true, attested: true, all: true };

    const okConditions = isFilled(values.conditions);
    const okMeds = isFilled(values.meds);
    const okAllergies = isFilled(values.allergies);
    const okAttest = values.attested === true;
    return {
      conditions: okConditions,
      meds: okMeds,
      allergies: okAllergies,
      attested: okAttest,
      all: okConditions && okMeds && okAllergies && okAttest,
    };
  }, [values, required]);

  useEffect(() => {
    onChange({ ...values, valid: validity.all });
  }, [values, validity.all, onChange]);

  const fieldBase = "mt-1 w-full rounded-md border px-3 py-2 bg-white min-h-[84px]";

  return (
    <section className="rounded-2xl border border-border p-4 bg-card/50">
      <h3 className="text-foreground font-bold text-lg">
        {labels.title} {required && <RequiredBadge />}
      </h3>

      {/* Conditions */}
      <label className="block text-sm font-semibold text-foreground mt-3">
        {labels.conditions} {required && <RequiredBadge />}
        <textarea
          aria-label="Current conditions under treatment"
          className={`${fieldBase} ${
            required && !validity.conditions ? "border-red-500" : ""
          }`}
          placeholder={
            mode === "intake"
              ? "Example: neck pain, post-concussion symptoms, anxiety"
              : "Clinical summary or client-reported conditions"
          }
          value={values.conditions}
          onChange={(e) =>
            setValues((v) => ({ ...v, conditions: e.target.value }))
          }
        />
      </label>

      {/* Medications */}
      <label className="block text-sm font-semibold text-foreground mt-3">
        {labels.meds} {required && <RequiredBadge />}
        <textarea
          aria-label="Full medication list"
          className={`${fieldBase} ${
            required && !validity.meds ? "border-red-500" : ""
          }`}
          placeholder="Example: ibuprofen 200 mg PRN; metformin 500 mg BID; vitamin D3 1000 IU daily; magnesium glycinate; elderberry"
          value={values.meds}
          onChange={(e) => setValues((v) => ({ ...v, meds: e.target.value }))}
        />
        <p className="text-xs text-black mt-1">
          If none, type <em>&quot;None&quot;</em>. Include dose/strength if known.
        </p>
      </label>

      {/* Allergies */}
      <label className="block text-sm font-semibold text-foreground mt-3">
        {labels.allergies} {required && <RequiredBadge />}
        <textarea
          aria-label="Allergies to medications and foods"
          className={`${fieldBase} ${
            required && !validity.allergies ? "border-red-500" : ""
          }`}
          placeholder="Example: penicillin (rash), shellfish (hives)"
          value={values.allergies}
          onChange={(e) =>
            setValues((v) => ({ ...v, allergies: e.target.value }))
          }
        />
      </label>

      {/* Attestation */}
      <label className="mt-3 flex items-start gap-2 text-foreground">
        <input
          type="checkbox"
          className="mt-1"
          checked={values.attested}
          onChange={(e) =>
            setValues((v) => ({ ...v, attested: e.target.checked }))
          }
          aria-required={required ? "true" : "false"}
        />
        <span className="text-sm">{labels.attestation}</span>
      </label>

      {/* Inline guidance */}
      {!validity.all && required && (
        <p className="mt-2 text-sm text-yellow-200">
          Please complete all required items and check the attestation.
        </p>
      )}
    </section>
  );
}

/* ───────────────────────────── Ready-to-use wrappers ───────────────────────────── */

export function IntakeMedConditionsSection({
  initial,
  onValidChange,
}: {
  initial?: Partial<Values>;
  onValidChange?: (v: Values & { valid: boolean }) => void;
}) {
  return (
    <MedsConditionsSection
      mode="intake"
      required={true}
      initial={initial}
      onChange={(v) => onValidChange?.(v)}
    />
  );
}

export function RNNotesMedConditionsSection({
  initial,
  required = true,
  onValidChange,
}: {
  initial?: Partial<Values>;
  required?: boolean;
  onValidChange?: (v: Values & { valid: boolean }) => void;
}) {
  return (
    <MedsConditionsSection
      mode="rnNotes"
      required={required}
      initial={initial}
      onChange={(v) => onValidChange?.(v)}
    />
  );
}
