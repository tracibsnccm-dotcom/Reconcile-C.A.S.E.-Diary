import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  INITIAL_FORM_DATA,
  STEPS,
  type IntakeFormData,
  type StepIndex,
} from "./intakeTypes";
import { IntakeStepAttorney } from "./IntakeStepAttorney";
import { IntakeStepPersonal } from "./IntakeStepPersonal";
import { IntakeStepInjury } from "./IntakeStepInjury";
import { IntakeStepDiagnoses } from "./IntakeStepDiagnoses";
import { IntakeStepMedications } from "./IntakeStepMedications";
import { IntakeStepWellness } from "./IntakeStepWellness";
import { IntakeStepSDOH } from "./IntakeStepSDOH";
import { IntakeStepConsent } from "./IntakeStepConsent";
import { IntakeStepSummary } from "./IntakeStepSummary";

const TOTAL_STEPS = STEPS.length;
const WRAPPER_CLASS =
  "min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-sans";
const PROGRESS_BAR = "h-2 bg-slate-600 rounded-full overflow-hidden";
const BTN_BACK =
  "px-5 py-2.5 rounded-lg border border-slate-500 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const BTN_NEXT =
  "px-5 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const BTN_SAVE =
  "px-5 py-2.5 rounded-lg border border-slate-500 text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors";

export function IntakeWizard() {
  const navigate = useNavigate();
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_FORM_DATA);
  const [stepValid, setStepValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ intNumber: string } | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Scroll to top when step changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  const saveDraft = useCallback(async () => {
    if (!supabase) {
      toast.error("Database not configured");
      return;
    }
    setSaving(true);
    const { data, error } = sessionId
      ? await supabase
          .from("rc_client_intake_sessions")
          .update({
            session_data: formData,
            current_step: step,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sessionId)
          .select("id")
          .single()
      : await supabase
          .from("rc_client_intake_sessions")
          .insert({
            session_data: formData,
            current_step: step,
          })
          .select("id")
          .single();

    setSaving(false);
    if (error) {
      toast.error("Could not save draft: " + (error.message || "Unknown error"));
      return;
    }
    if (data?.id) setSessionId(data.id);
    toast.success("Draft saved. You can return later to continue.");
    navigate("/client-login");
  }, [formData, step, sessionId, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!supabase || !formData.attorney) {
      toast.error("Missing attorney or database");
      return;
    }
    setSubmitting(true);
    const payload = {
      attorney_id: formData.attorney.attorneyId,
      attorney_code: formData.attorney.attorneyCode,
      first_name: formData.personal.firstName.trim(),
      last_name: formData.personal.lastName.trim(),
      date_of_birth: formData.personal.dateOfBirth,
      email: formData.personal.email.trim(),
      phone: formData.personal.phone.trim(),
      date_of_injury: formData.injury.dateOfInjury,
      accident_type: formData.injury.accidentType,
      accident_type_other: formData.injury.accidentTypeOther.trim() || null,
      description: formData.injury.description.trim(),
      diagnoses: formData.diagnoses.selected,
      diagnoses_other: formData.diagnoses.other.trim() || null,
      medications: formData.medications.rows.map((r) => ({
        name: r.name,
        dosage: r.dosage,
        frequency: r.frequency,
        is_prn: r.isPrn,
        prn_for: r.prnFor || null,
      })),
      wellness_physical: formData.wellness.physical,
      wellness_psychological: formData.wellness.psychological,
      wellness_psychosocial: formData.wellness.psychosocial,
      wellness_professional: formData.wellness.professional,
      sdoh_housing_stability: formData.sdoh.housingStability,
      sdoh_food_security: formData.sdoh.foodSecurity,
      sdoh_transportation: formData.sdoh.transportation,
      sdoh_childcare: formData.sdoh.childcare,
      sdoh_financial_strain: formData.sdoh.financialStrain,
      sdoh_intimate_partner_safety: formData.sdoh.intimatePartnerSafety,
    };

    const { data: rpcData, error } = await supabase.rpc(
      "submit_intake_create_case",
      payload
    );

    setSubmitting(false);
    if (error) {
      toast.error("Submit failed: " + (error.message || "Unknown error"));
      return;
    }
    // RPC returns the generated INT case number (e.g. INT-260204-01A)
    const intNumber =
      typeof rpcData === "string"
        ? rpcData
        : (rpcData as { int_number?: string })?.int_number ?? (rpcData as { case_number?: string })?.case_number ?? String(rpcData ?? "");
    setSubmitted({ intNumber });
    toast.success("Intake submitted successfully.");
  }, [formData]);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const isLastStep = step === TOTAL_STEPS - 1;
  const canProceed = stepValid;

  // Confirmation screen after submit
  if (submitted) {
    return (
      <div className={WRAPPER_CLASS}>
        <div ref={topRef} />
        <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Intake submitted
            </h1>
            <p className="text-orange-500 font-mono text-xl mb-6">
              {submitted.intNumber}
            </p>
            <p className="text-slate-300 text-sm mb-4">
              Your attorney has been notified. Once they confirm you as their
              client, you will receive your permanent Case ID and PIN to access
              your portal.
            </p>
            <p className="text-slate-400 text-sm mb-8">
              Your intake data will be held for 7 days. If your attorney does
              not confirm within 7 days, your data will be automatically deleted
              for your privacy.
            </p>
            <button
              type="button"
              onClick={() => navigate("/client-login")}
              className={BTN_NEXT}
            >
              Return to client login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={WRAPPER_CLASS}>
      <div ref={topRef} />
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6">
          <p className="text-slate-400 text-sm mb-2">
            Step {step + 1} of {TOTAL_STEPS}
          </p>
          <div className={PROGRESS_BAR}>
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
          <p className="text-slate-300 text-sm mt-2 font-medium">
            {STEPS[step as StepIndex]}
          </p>
        </div>

        <div className="mb-6">
          {step === 0 && (
            <IntakeStepAttorney
              data={formData}
              onChange={(a) => setFormData((d) => ({ ...d, attorney: a }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 1 && (
            <IntakeStepPersonal
              data={formData}
              onChange={(p) => setFormData((d) => ({ ...d, personal: p }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 2 && (
            <IntakeStepInjury
              data={formData}
              onChange={(i) => setFormData((d) => ({ ...d, injury: i }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 3 && (
            <IntakeStepDiagnoses
              data={formData}
              onChange={(di) => setFormData((d) => ({ ...d, diagnoses: di }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 4 && (
            <IntakeStepMedications
              data={formData}
              onChange={(m) => setFormData((d) => ({ ...d, medications: m }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 5 && (
            <IntakeStepWellness
              data={formData}
              onChange={(w) => setFormData((d) => ({ ...d, wellness: w }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 6 && (
            <IntakeStepSDOH
              data={formData}
              onChange={(s) => setFormData((d) => ({ ...d, sdoh: s }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 7 && (
            <IntakeStepConsent
              data={formData}
              onChange={(c) => setFormData((d) => ({ ...d, consent: c }))}
              onValidityChange={setStepValid}
            />
          )}
          {step === 8 && (
            <IntakeStepSummary
              data={formData}
              onValidityChange={setStepValid}
            />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-700">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0}
              className={BTN_BACK}
            >
              Back
            </button>
            {!isLastStep ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canProceed}
                className={BTN_NEXT}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
                className={BTN_NEXT}
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={saveDraft}
            disabled={saving}
            className={BTN_SAVE}
          >
            {saving ? "Saving…" : "Save & Exit"}
          </button>
        </div>
      </div>
    </div>
  );
}
