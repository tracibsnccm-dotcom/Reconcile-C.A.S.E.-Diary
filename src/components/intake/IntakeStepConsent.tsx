import React, { useEffect } from "react";
import type { IntakeFormData, IntakeConsent } from "./intakeTypes";

const CARD_CLASS =
  "bg-slate-800/95 border border-slate-600 rounded-xl shadow-xl shadow-black/30 p-6 sm:p-8 text-left";
const LABEL_CLASS = "block text-sm font-medium text-slate-300 mb-2";
const CHECKBOX_CLASS =
  "rounded border-slate-500 text-orange-500 focus:ring-orange-500 bg-slate-700/50";

interface IntakeStepConsentProps {
  data: IntakeFormData;
  onChange: (consent: IntakeConsent) => void;
  onValidityChange: (valid: boolean) => void;
}

export function IntakeStepConsent({
  data,
  onChange,
  onValidityChange,
}: IntakeStepConsentProps) {
  const c = data.consent;
  const valid = c.informationAccurate && c.agreeToTerms;
  useEffect(() => {
    onValidityChange(valid);
  }, [valid, onValidityChange]);

  return (
    <div className={CARD_CLASS}>
      <h2 className="text-xl font-semibold text-white mb-2">
        Consent & Attestation
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Please confirm the following before submitting your intake.
      </p>
      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={c.informationAccurate}
            onChange={(e) =>
              onChange({ ...c, informationAccurate: e.target.checked })
            }
            className={`mt-1 ${CHECKBOX_CLASS}`}
          />
          <span className="text-slate-300 text-sm">
            I confirm that the information I have provided in this intake is
            accurate to the best of my knowledge.
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={c.agreeToTerms}
            onChange={(e) =>
              onChange({ ...c, agreeToTerms: e.target.checked })
            }
            className={`mt-1 ${CHECKBOX_CLASS}`}
          />
          <span className="text-slate-300 text-sm">
            I agree to the terms of use and privacy practices described for
            Reconcile C.A.S.E. and understand that my information will be shared
            with my selected attorney and used to support my case and care
            planning.
          </span>
        </label>
      </div>
    </div>
  );
}
