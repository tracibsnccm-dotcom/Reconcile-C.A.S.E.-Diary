import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CARD_CLASS = "bg-slate-800 border border-slate-700 rounded-xl p-6 text-left";
const SECTION_TITLE = "text-sm font-semibold text-orange-500 uppercase tracking-wide mb-2";
const ROW_CLASS = "text-slate-300 text-sm py-1";
const ACCIDENT_LABELS: Record<string, string> = {
  auto: "Auto accident",
  slip_fall: "Slip / fall",
  work_injury: "Work injury",
  other: "Other",
};

interface FormDataFromDb {
  personal?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    email?: string;
    phone?: string;
  };
  attorney?: { displayName?: string; attorneyCode?: string };
  injury?: {
    dateOfInjury?: string;
    accidentType?: string;
    accidentTypeOther?: string;
    description?: string;
  };
  diagnoses?: { selected?: string[]; other?: string };
  medications?: {
    rows?: Array<{
      id: string;
      name: string;
      dosage?: string;
      frequency?: string;
      isPrn?: boolean;
      prnFor?: string;
    }>;
  };
  wellness?: { physical?: number; psychological?: number; psychosocial?: number; professional?: number };
  sdoh?: {
    housing?: number;
    food?: number;
    transport?: number;
    insuranceGap?: number;
    financial?: number;
    safety?: number;
    housingStability?: number;
    foodSecurity?: number;
    transportation?: number;
    childcare?: number;
    financialStrain?: number;
    intimatePartnerSafety?: number;
  };
  consent?: { informationAccurate?: boolean; agreeToTerms?: boolean };
}

function generateCaseNumber(
  intakeId: string,
  attorneyCode: string,
  sameDayCount: number
): string {
  // Parse INT-YYMMDD-XXX → use YYMMDD, replace INT with attorney_code, use seq + random letter
  const match = intakeId.match(/^INT-(\d{6})-/);
  const yymmdd = match ? match[1] : new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const seq = String(sameDayCount + 1).padStart(2, "0");
  const letter = "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
  return `${attorneyCode}-${yymmdd}-${seq}${letter}`;
}

function generatePin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function AttestationReview() {
  const { intakeId } = useParams<{ intakeId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormDataFromDb | null>(null);
  const [intakeIdDisplay, setIntakeIdDisplay] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [confirmed, setConfirmed] = useState<{ caseNumber: string; pin: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "attorney" || !user || !intakeId || !supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data, error: fetchErr } = await supabase
        .from("rc_client_intake_sessions")
        .select("resume_token, intake_id, case_id, form_data")
        .eq("resume_token", intakeId)
        .in("intake_status", ["submitted", "submitted_pending_attorney"])
        .maybeSingle();

      if (fetchErr || !data) {
        setError("Intake not found or already processed.");
        setLoading(false);
        return;
      }

      setFormData((data.form_data as FormDataFromDb) ?? null);
      setIntakeIdDisplay(data.intake_id ?? "");
      setCaseId(data.case_id);
      setLoading(false);
    })();
  }, [intakeId, user, role]);

  const handleConfirm = async () => {
    if (!supabase || !user || !intakeId || !caseId) return;

    // Get attorney's rc_users record
    const { data: attorneyRow, error: attorneyErr } = await supabase
      .from("rc_users")
      .select("id, attorney_code")
      .eq("auth_user_id", user.id)
      .ilike("role", "attorney")
      .maybeSingle();

    if (attorneyErr || !attorneyRow?.attorney_code) {
      toast.error("Attorney record not found.");
      return;
    }

    setConfirming(true);

    // Count same-day cases for this attorney (for sequence)
    const intakeIdMatch = intakeIdDisplay.match(/^INT-(\d{6})/);
    const yymmdd = intakeIdMatch ? intakeIdMatch[1] : "";
    const { count } = await supabase
      .from("rc_cases")
      .select("id", { count: "exact", head: true })
      .eq("attorney_id", attorneyRow.id)
      .not("case_number", "is", null)
      .like("case_number", `${attorneyRow.attorney_code}-${yymmdd}%`);

    const sameDayCount = count ?? 0;
    const caseNumber = generateCaseNumber(intakeIdDisplay, attorneyRow.attorney_code, sameDayCount);
    const clientPin = generatePin();
    const now = new Date().toISOString();

    try {
      // Update rc_client_intake_sessions (intake_status)
      const { error: sessionErr } = await supabase
        .from("rc_client_intake_sessions")
        .update({
          intake_status: "attorney_confirmed",
          updated_at: now,
        })
        .eq("resume_token", intakeId);

      if (sessionErr) {
        toast.error("Failed to update intake: " + sessionErr.message);
        setConfirming(false);
        return;
      }

      // Update rc_client_intakes if it exists (attorney_attested_at, intake_status)
      void supabase
        .from("rc_client_intakes")
        .update({
          intake_status: "attorney_confirmed",
          attorney_attested_at: now,
        })
        .eq("case_id", caseId);

      // Update rc_cases (case_number, client_pin)
      const { error: caseErr } = await supabase
        .from("rc_cases")
        .update({
          case_number: caseNumber,
          client_pin: clientPin,
          case_status: "active",
          updated_at: now,
        })
        .eq("id", caseId);

      if (caseErr) {
        toast.error("Failed to update case: " + caseErr.message);
        setConfirming(false);
        return;
      }

      // Write to rc_audit_logs
      await supabase.from("rc_audit_logs").insert({
        action: "attorney_confirmed",
        actor_role: "attorney",
        actor_id: user.id,
        case_id: caseId,
        meta: { intake_session_id: intakeId, case_number: caseNumber },
        created_at: now,
      });

      setConfirmed({ caseNumber, pin: clientPin });
      toast.success("Client confirmed successfully.");
    } catch (e) {
      toast.error("Attestation failed.");
      setConfirming(false);
    } finally {
      setConfirming(false);
    }
  };

  const handleDecline = async () => {
    if (!supabase || !intakeId) return;
    setDeclining(true);

    const { error: declineErr } = await supabase
      .from("rc_client_intake_sessions")
      .update({
        intake_status: "declined",
        updated_at: new Date().toISOString(),
      })
      .eq("resume_token", intakeId);

    setDeclining(false);
    if (declineErr) {
      toast.error("Failed to decline: " + declineErr.message);
      return;
    }
    toast.success("Intake declined.");
    navigate("/attorney/dashboard");
  };

  if (role !== "attorney" || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-md">
          <p className="text-slate-300 mb-4">Please log in to access this page.</p>
          <button
            onClick={() => navigate("/attorney-login")}
            className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center">
        <p className="text-slate-400">Loading intake…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 text-center max-w-md">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/attorney/dashboard")}
            className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Success state after confirm
  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6">
        <div className="max-w-xl mx-auto">
          <div className={CARD_CLASS}>
            <h1 className="text-2xl font-bold text-white mb-2">Client confirmed</h1>
            <p className="text-slate-300 mb-4">
              Case ID: <span className="text-orange-500 font-mono font-semibold">{confirmed.caseNumber}</span>
            </p>
            <p className="text-slate-300 mb-4">
              PIN: <span className="text-orange-500 font-mono font-semibold">{confirmed.pin}</span>
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Share these credentials with your client so they can access their portal.
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Care plan generation will begin automatically.
            </p>
            <button
              onClick={() => navigate("/attorney/dashboard")}
              className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fd = formData ?? {};
  const personal = fd.personal ?? {};
  const injury = fd.injury ?? {};
  const diagnoses = fd.diagnoses ?? { selected: [], other: "" };
  const medications = fd.medications ?? { rows: [] };
  const wellness = fd.wellness ?? {};
  const sdoh = fd.sdoh ?? {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/attorney/dashboard")}
            className="text-slate-400 hover:text-white text-sm"
          >
            ← Back to Dashboard
          </button>
          <span className="text-orange-500 font-mono text-sm">{intakeIdDisplay}</span>
        </div>

        <div className={CARD_CLASS}>
          <h1 className="text-xl font-semibold text-white mb-2">Review & Attest</h1>
          <p className="text-slate-400 text-sm mb-6">
            Review the client intake below. Confirm if this is your client, or decline if not.
          </p>

          <div className="space-y-6">
            {fd.attorney && (
              <div>
                <div className={SECTION_TITLE}>Attorney</div>
                <p className={ROW_CLASS}>{fd.attorney.displayName}</p>
                {fd.attorney.attorneyCode && (
                  <p className="text-slate-500 text-xs">{fd.attorney.attorneyCode}</p>
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
                  : ACCIDENT_LABELS[injury.accidentType ?? ""] ?? injury.accidentType}
              </p>
              <p className={ROW_CLASS}>{injury.description || "—"}</p>
            </div>
            <div>
              <div className={SECTION_TITLE}>Diagnoses</div>
              {(diagnoses.selected?.length ?? 0) > 0 ? (
                <p className={ROW_CLASS}>{diagnoses.selected!.join(", ")}</p>
              ) : null}
              {diagnoses.other?.trim() ? (
                <p className={ROW_CLASS}>Other: {diagnoses.other}</p>
              ) : null}
              {!diagnoses.selected?.length && !diagnoses.other?.trim() && (
                <p className="text-slate-500 text-sm">None listed</p>
              )}
            </div>
            <div>
              <div className={SECTION_TITLE}>Medications</div>
              {(medications.rows?.length ?? 0) === 0 ? (
                <p className="text-slate-500 text-sm">None listed</p>
              ) : (
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                  {medications.rows!.map((r) => (
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
                Physical {wellness.physical} · Psychological {wellness.psychological} ·
                Psychosocial {wellness.psychosocial} · Professional {wellness.professional}
              </p>
            </div>
            <div>
              <div className={SECTION_TITLE}>SDOH</div>
              <p className={ROW_CLASS}>
                Housing {sdoh.housing ?? sdoh.housingStability} · Food {sdoh.food ?? sdoh.foodSecurity} ·
                Transportation {sdoh.transport ?? sdoh.transportation} · Childcare {sdoh.insuranceGap ?? sdoh.childcare} ·
                Financial {sdoh.financial ?? sdoh.financialStrain} · Partner safety {sdoh.safety ?? sdoh.intimatePartnerSafety}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-slate-700">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-6 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 disabled:opacity-50"
            >
              {confirming ? "Confirming…" : "Confirm — This is my client"}
            </button>
            <button
              onClick={handleDecline}
              disabled={declining}
              className="px-6 py-2.5 rounded-lg border border-slate-500 text-slate-300 hover:bg-slate-700 disabled:opacity-50"
            >
              {declining ? "Declining…" : "Decline — This is NOT my client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
