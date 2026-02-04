import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
  "w-full min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-sans";
const PROGRESS_BAR = "h-2 bg-slate-600 rounded-full overflow-hidden";
const BTN_BACK =
  "px-5 py-2.5 rounded-lg border border-slate-500 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const BTN_NEXT =
  "px-5 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const BTN_SAVE =
  "px-5 py-2.5 rounded-lg border border-slate-500 text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors";

/** Map form accidentType to RPC incidentType */
function toIncidentType(accidentType: string): "MVA" | "slip_fall" | "work_injury" | "other" {
  if (accidentType === "auto") return "MVA";
  if (accidentType === "slip_fall" || accidentType === "work_injury" || accidentType === "other") {
    return accidentType;
  }
  return "other";
}

/** Build form_data jsonb for rc_client_intake_sessions (RPC-expected structure + full form for resume) */
function buildFormData(data: IntakeFormData): Record<string, unknown> {
  const w = data.wellness;
  const s = data.sdoh;
  return {
    client: { phone: data.personal.phone?.trim() ?? "" },
    intake: {
      incidentDate: data.injury.dateOfInjury ?? "",
      incidentType: toIncidentType(data.injury.accidentType),
      accidentTypeOther: data.injury.accidentTypeOther?.trim() || null,
      description: data.injury.description?.trim() || null,
    },
    fourPs: {
      physical: w.physical,
      psychological: w.psychological,
      psychosocial: w.psychosocial,
      professional: w.professional,
    },
    sdoh: {
      housing: s.housingStability,
      food: s.foodSecurity,
      transport: s.transportation,
      insuranceGap: s.childcare,
      financial: s.financialStrain,
      employment: 3,
      social_support: 3,
      safety: s.intimatePartnerSafety,
      healthcare_access: 3,
      income_range: null as string | null,
    },
    personal: data.personal,
    attorney: data.attorney,
    injury: data.injury,
    diagnoses: data.diagnoses,
    medications: data.medications,
    wellness: data.wellness,
    consent: data.consent,
  };
}

/** Generate intake_id: INT-YYMMDD-XXX */
function generateIntakeId(): string {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `INT-${yy}${mm}${dd}-${suffix}`;
}

export function IntakeWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState<IntakeFormData>(INITIAL_FORM_DATA);
  const [stepValid, setStepValid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ intNumber: string } | null>(null);
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(true);
  const hasInitializedResume = useRef(false);

  // Scroll to top when step changes
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step]);

  // Initialize: generate resume_token or load from ?resume=TOKEN
  useEffect(() => {
    if (hasInitializedResume.current) return;
    hasInitializedResume.current = true;
    const token = searchParams.get("resume");
    if (token) {
      if (!supabase) {
        setResumeLoading(false);
        return;
      }
      (async () => {
        const { data, error } = await supabase
          .from("rc_client_intake_sessions")
          .select("resume_token, form_data, current_step, intake_id")
          .eq("resume_token", token)
          .eq("intake_status", "draft")
          .maybeSingle();
        setResumeLoading(false);
        if (error || !data) return;
        setResumeToken(data.resume_token);
        setIntakeId(data.intake_id ?? null);
        setStep(Math.min(Math.max(0, data.current_step ?? 0), TOTAL_STEPS - 1));
        const fd = data.form_data as Record<string, unknown> | null;
        if (fd?.personal) {
          setFormData((prev) => ({
            ...prev,
            personal: fd.personal as IntakeFormData["personal"],
            attorney: (fd.attorney as IntakeFormData["attorney"]) ?? null,
            injury: (fd.injury as IntakeFormData["injury"]) ?? prev.injury,
            diagnoses: (fd.diagnoses as IntakeFormData["diagnoses"]) ?? prev.diagnoses,
            medications: (fd.medications as IntakeFormData["medications"]) ?? prev.medications,
            wellness: (fd.wellness as IntakeFormData["wellness"]) ?? prev.wellness,
            sdoh: (fd.sdohForm as IntakeFormData["sdoh"]) ?? prev.sdoh,
            consent: (fd.consent as IntakeFormData["consent"]) ?? prev.consent,
          }));
        }
      })();
    } else {
      setResumeToken(crypto.randomUUID());
      setIntakeId(generateIntakeId());
      setResumeLoading(false);
    }
  }, [searchParams]);

  const saveSession = useCallback(
    async (opts?: { intakeStatus?: "draft" | "pending_submit" }) => {
      if (!supabase || !resumeToken) return { error: null as Error | null };
      const status = opts?.intakeStatus ?? "draft";
      const row = {
        resume_token: resumeToken,
        intake_id: intakeId ?? generateIntakeId(),
        attorney_id: formData.attorney?.attorneyId ?? null,
        attorney_code: formData.attorney?.attorneyCode ?? null,
        first_name: formData.personal.firstName?.trim() || null,
        last_name: formData.personal.lastName?.trim() || null,
        email: formData.personal.email?.trim() || null,
        current_step: step,
        form_data: buildFormData(formData),
        intake_status: status,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from("rc_client_intake_sessions")
        .upsert(row, { onConflict: "resume_token" });
      if (!intakeId && row.intake_id) setIntakeId(row.intake_id);
      return { error: error ? new Error(error.message) : null };
    },
    [formData, step, resumeToken, intakeId]
  );

  const saveDraft = useCallback(async () => {
    if (!supabase) {
      toast.error("Database not configured");
      return;
    }
    if (!resumeToken) {
      toast.error("Session not ready. Please wait a moment and try again.");
      return;
    }
    setSaving(true);
    const { error } = await saveSession({ intakeStatus: "draft" });
    setSaving(false);
    if (error) {
      toast.error("Could not save draft: " + (error.message || "Unknown error"));
      return;
    }
    toast.success("Draft saved. You can return later to continue.");
    navigate("/client-login");
  }, [formData, step, saveSession, resumeToken, navigate]);

  const handleSubmit = useCallback(async () => {
    if (!supabase || !formData.attorney || !resumeToken) {
      toast.error("Missing attorney or database");
      return;
    }
    const clientName = [formData.personal.firstName, formData.personal.lastName]
      .filter(Boolean)
      .join(" ");
    console.log("INTAKE: Submitting...", {
      attorneyId: formData.attorney.attorneyId,
      clientName,
    });
    setSubmitting(true);
    const { error: saveErr } = await saveSession({ intakeStatus: "pending_submit" });
    if (saveErr) {
      setSubmitting(false);
      toast.error("Could not save before submit: " + saveErr.message);
      return;
    }
    const { data: rpcData, error } = await supabase.rpc("submit_intake_create_case", {
      p_resume_token: resumeToken,
    });
    setSubmitting(false);
    if (error) {
      console.error("INTAKE: FAILED", error);
      toast.error("Submit failed: " + (error.message || "Unknown error"));
      return;
    }
    const intNumber = intakeId ?? "";
    const caseId = (rpcData as { case_id?: string } | null)?.case_id ?? null;
    console.log("INTAKE: SUCCESS", { intNumber, caseId });
    setSubmitted({ intNumber });
    toast.success("Intake submitted successfully.");
  }, [formData, resumeToken, saveSession, intakeId]);

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      const nextStep = step + 1;
      console.log("INTAKE: Moving to step", nextStep + 1, STEPS[nextStep as StepIndex]);
      setStep((s) => s + 1);
      saveSession({ intakeStatus: "draft" }).then(({ error }) => {
        if (error) toast.error("Could not save progress");
      });
    }
  }, [step, saveSession]);

  const goBack = useCallback(() => {
    if (step > 0) {
      const prevStep = step - 1;
      console.log("INTAKE: Moving to step", prevStep + 1, STEPS[prevStep as StepIndex]);
      setStep((s) => s - 1);
      saveSession({ intakeStatus: "draft" }).then(({ error }) => {
        if (error) toast.error("Could not save progress");
      });
    }
  }, [step, saveSession]);

  const isLastStep = step === TOTAL_STEPS - 1;
  const canProceed = stepValid;

  if (resumeLoading) {
    return (
      <div className={WRAPPER_CLASS}>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center text-slate-400">
          Loading…
        </div>
      </div>
    );
  }

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
            <div className="rounded-lg border border-orange-500/60 bg-orange-500/10 px-4 py-3 mb-8">
              <p className="text-orange-200 text-sm font-medium">
                Your intake data will be held for 7 days. If your attorney does
                not confirm within 7 days, your data will be automatically deleted
                for your privacy.
              </p>
            </div>
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
      <div className="max-w-2xl mx-auto px-4 py-8">
        <p className="text-right mb-4">
          <Link to="/intake/resume" className="text-orange-500 hover:underline text-sm">
            Resume saved intake
          </Link>
        </p>
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
