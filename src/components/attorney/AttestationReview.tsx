import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet, supabaseUpdate } from "@/lib/supabaseRest";
import { audit } from "@/lib/supabaseOperations";
import { toast } from "sonner";

const CARD_CLASS = "bg-white rounded-lg shadow-lg p-6 text-left text-gray-900";
const SECTION_TITLE = "text-sm font-semibold text-orange-500 uppercase tracking-wide mb-2";
const ROW_CLASS = "text-gray-700 text-sm py-1";
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

/** Generate 4-digit PIN, excluding weak patterns (C.A.R.E. logic) */
function generatePIN(): string {
  const excluded = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321"];
  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (excluded.includes(pin));
  return pin;
}

export function AttestationReview() {
  const { intakeId } = useParams<{ intakeId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormDataFromDb | null>(null);
  const [intakeIdDisplay, setIntakeIdDisplay] = useState("");
  const [caseId, setCaseId] = useState<string | null>(null);
  const [clientDisplayName, setClientDisplayName] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [confirmed, setConfirmed] = useState<{ caseNumber: string; pin: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "attorney" || !user || !intakeId) {
      setLoading(false);
      return;
    }

    (async () => {
      // Support both resume_token and intake_id (UUID) — intakeId from URL matches the clicked record
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(intakeId || "").trim());
      let session: any = null;
      let caseIdFromSession: string | null = null;

      if (isUuid) {
        // Load by rc_client_intakes.id — get case_id from the intake record that was clicked
        const { data: intakeData, error: intakeErr } = await supabaseGet(
          "rc_client_intakes",
          `id=eq.${intakeId}&select=id,case_id,intake_json,intake_submitted_at&limit=1`
        );
        const intakeRow = Array.isArray(intakeData) ? intakeData[0] : intakeData;
        if (intakeErr || !intakeRow?.case_id) {
          setError("Intake not found or already processed.");
          setLoading(false);
          return;
        }
        caseIdFromSession = intakeRow.case_id;
        setFormData((intakeRow.intake_json as FormDataFromDb) ?? null);
        setIntakeIdDisplay(intakeRow.intake_json?.rcmsId ?? intakeId);
        setCaseId(caseIdFromSession);
        // Fetch client name from SAME case record (rc_cases + rc_clients)
        let nameToDisplay = "";
        try {
          const { data: caseWithClient } = await supabaseGet(
            "rc_cases",
            `id=eq.${caseIdFromSession}&is_superseded=eq.false&select=id,client_id&limit=1`
          );
          const caseRow = Array.isArray(caseWithClient) ? caseWithClient[0] : caseWithClient;
          const clientId = caseRow?.client_id;
          if (clientId) {
            const { data: clientData } = await supabaseGet(
              "rc_clients",
              `id=eq.${clientId}&select=first_name,last_name&limit=1`
            );
            const client = Array.isArray(clientData) ? clientData[0] : clientData;
            nameToDisplay = [client?.first_name ?? "", client?.last_name ?? ""].filter(Boolean).join(" ").trim();
          }
        } catch (_) {}
        if (!nameToDisplay) {
          const identity = intakeRow.intake_json?.identity ?? intakeRow.intake_json?.client_identity ?? intakeRow.intake_json?.client ?? {};
          const fn = identity.first_name ?? identity.firstName ?? identity.client_first_name ?? "";
          const ln = identity.last_name ?? identity.lastName ?? identity.client_last_name ?? "";
          nameToDisplay = [fn, ln].filter(Boolean).join(" ").trim() || "Client";
        }
        setClientDisplayName(nameToDisplay);
        // Fetch session for form_data if available
        const { data: sessData } = await supabaseGet(
          "rc_client_intake_sessions",
          `case_id=eq.${caseIdFromSession}&select=form_data,intake_status&order=created_at.desc&limit=1`
        );
        const sess = Array.isArray(sessData) ? sessData[0] : sessData;
        if (sess?.form_data) setFormData((sess.form_data as FormDataFromDb) ?? null);
        const status = sess?.intake_status ?? "submitted_pending_attorney";
        // DEBUG: Log what's being loaded to diagnose client name mapping
        console.log("AttestationReview loaded (UUID path):", {
          url_param: intakeId,
          loaded_intake: { id: intakeRow.id, case_id: intakeRow.case_id },
          loaded_client: nameToDisplay,
          case_id: caseIdFromSession,
        });
        setLoading(false);
        return;
      }

      // Load session by resume_token (C.A.S.E. route uses resume_token)
      const { data: sessionData, error: sessionErr } = await supabaseGet(
        "rc_client_intake_sessions",
        `resume_token=eq.${intakeId}&select=resume_token,intake_id,case_id,form_data,intake_status&limit=1`
      );
      session = Array.isArray(sessionData) ? sessionData[0] : sessionData;

      if (sessionErr || !session?.case_id) {
        setError("Intake not found or already processed.");
        setLoading(false);
        return;
      }

      const status = session.intake_status;
      if (!["submitted", "submitted_pending_attorney"].includes(status)) {
        setError("Intake not found or already processed.");
        setLoading(false);
        return;
      }

      setFormData((session.form_data as FormDataFromDb) ?? null);
      setIntakeIdDisplay(session.intake_id ?? "");
      setCaseId(session.case_id);

      // Fetch client name from canonical source (rc_cases + rc_clients) — SAME record as clicked in list
      caseIdFromSession = session.case_id;
      let nameToDisplayResume = "";
      if (caseIdFromSession) {
        try {
          const { data: caseWithClient } = await supabaseGet(
            "rc_cases",
            `id=eq.${caseIdFromSession}&is_superseded=eq.false&select=id,client_id&limit=1`
          );
          const caseRow = Array.isArray(caseWithClient) ? caseWithClient[0] : caseWithClient;
          const clientId = caseRow?.client_id;
          if (clientId) {
            const { data: clientData } = await supabaseGet(
              "rc_clients",
              `id=eq.${clientId}&select=first_name,last_name&limit=1`
            );
            const client = Array.isArray(clientData) ? clientData[0] : clientData;
            nameToDisplayResume = [client?.first_name ?? "", client?.last_name ?? ""].filter(Boolean).join(" ").trim();
          }
        } catch (_) {}
        if (!nameToDisplayResume) {
          const { data: intakes } = await supabaseGet(
            "rc_client_intakes",
            `case_id=eq.${caseIdFromSession}&select=intake_json&order=intake_submitted_at.desc&limit=1`
          );
          const intakeRow = Array.isArray(intakes) ? intakes[0] : intakes;
          const identity = intakeRow?.intake_json?.identity ?? intakeRow?.intake_json?.client_identity ?? {};
          const fn = identity.first_name ?? identity.firstName ?? identity.client_first_name ?? "";
          const ln = identity.last_name ?? identity.lastName ?? identity.client_last_name ?? "";
          nameToDisplayResume = [fn, ln].filter(Boolean).join(" ").trim() || "Client";
        }
        setClientDisplayName(nameToDisplayResume);
      }

      // DEBUG: Log what's being loaded (resume_token path)
      console.log("AttestationReview loaded (resume_token path):", {
        url_param: intakeId,
        loaded_intake: session?.intake_id,
        loaded_client: nameToDisplayResume,
        case_id: session?.case_id,
      });

      setLoading(false);
    })();
  }, [intakeId, user, role]);

  const handleConfirm = async () => {
    if (!user || !intakeId || !caseId) return;

    setConfirming(true);
    try {
      // 1. Get attorney's rc_users record (C.A.R.E. logic)
      const { data: rcUsers, error: rcUsersError } = await supabaseGet(
        "rc_users",
        `select=id,attorney_code&auth_user_id=eq.${user.id}&role=eq.attorney&limit=1`
      );
      if (rcUsersError) throw new Error(`Failed to get attorney: ${rcUsersError.message}`);
      const rcUser = Array.isArray(rcUsers) ? rcUsers[0] : rcUsers;
      if (!rcUser?.id || !rcUser?.attorney_code) throw new Error("Attorney record not found");

      const attorneyId = rcUser.id;
      const attorneyCode = rcUser.attorney_code;

      // 2. Get rc_client_intakes by case_id (canonical intake record)
      const { data: intakes, error: intakesError } = await supabaseGet(
        "rc_client_intakes",
        `select=id,case_id,intake_json,attorney_attested_at&case_id=eq.${caseId}&intake_status=in.(submitted_pending_attorney,attorney_confirmed)&order=intake_submitted_at.desc&limit=1`
      );
      if (intakesError) throw new Error(`Failed to get intake: ${intakesError.message}`);
      const intake = Array.isArray(intakes) ? intakes[0] : intakes;
      if (!intake?.case_id) throw new Error("Intake not found");

      const intakeRecordId = intake.id;

      // 3. Get rc_cases row (C.A.R.E. logic)
      const { data: caseData, error: caseDataError } = await supabaseGet(
        "rc_cases",
        `select=id,case_number,client_pin,case_status&id=eq.${caseId}&is_superseded=eq.false&limit=1`
      );
      if (caseDataError) throw new Error(`Failed to get case: ${caseDataError.message}`);
      const existingCase = Array.isArray(caseData) ? caseData[0] : caseData;
      const existingCaseNumber = existingCase?.case_number;

      // Idempotency: if already confirmed, return existing credentials
      const alreadyConfirmed =
        !!intake.attorney_attested_at ||
        (!!existingCase?.client_pin && existingCase?.case_status === "attorney_confirmed");
      if (alreadyConfirmed && existingCase?.case_number) {
        const caseNumber = existingCase.case_number;
        const clientPin = existingCase.client_pin ?? "";
        setConfirmed({ caseNumber, pin: clientPin });
        toast.success("Already confirmed. Displaying existing case number and PIN.");
        setConfirming(false);
        return;
      }

      if (!existingCaseNumber) throw new Error("Case number not found");

      // Convert INT number to attorney case number (C.A.R.E. logic)
      let caseNumber: string;
      if (existingCaseNumber.startsWith("INT-")) {
        caseNumber = existingCaseNumber.replace(/^INT-/, `${attorneyCode}-`);
      } else {
        caseNumber = existingCaseNumber;
      }
      const clientPin = generatePIN();
      const now = new Date().toISOString();

      // 4. Update rc_cases (case_number, client_pin, case_status)
      const { error: caseErr } = await supabaseUpdate("rc_cases", `id=eq.${caseId}`, {
        case_number: caseNumber,
        client_pin: clientPin,
        case_status: "attorney_confirmed",
      });
      if (caseErr) throw new Error(`Failed to update case: ${caseErr.message}`);

      // 5. Update rc_client_intakes (attorney_attested_at, intake_status, intake_json)
      const existingJson = intake.intake_json || {};
      const updatedJson = {
        ...existingJson,
        compliance: {
          ...(existingJson.compliance || {}),
          attorney_confirmation_receipt: {
            action: "CONFIRMED",
            confirmed_at: now,
            confirmed_by: attorneyId,
          },
        },
        attorney_attestation: {
          status: "confirmed",
          confirmed_at: now,
        },
      };

      const { error: intakeErr } = await supabaseUpdate(
        "rc_client_intakes",
        `id=eq.${intakeRecordId}`,
        {
          attorney_attested_at: now,
          attorney_attested_by: attorneyId,
          attorney_confirm_deadline_at: null,
          intake_status: "attorney_confirmed",
          intake_json: updatedJson,
        }
      );
      if (intakeErr) throw new Error(`Failed to update intake: ${intakeErr.message}`);

      // 6. Update rc_client_intake_sessions (intake_status)
      const { error: sessionErr } = await supabaseUpdate(
        "rc_client_intake_sessions",
        `resume_token=eq.${intakeId}`,
        { intake_status: "attorney_confirmed", updated_at: now }
      );
      if (sessionErr) {
        console.warn("Session update failed (non-blocking):", sessionErr.message);
      }

      // 7. Audit (C.A.S.E. uses rc_audit_log via audit())
      await audit({
        action: "attorney_confirmed",
        actorRole: "attorney",
        actorId: user.id,
        caseId,
        meta: { intake_id: intakeRecordId, case_number: caseNumber },
      });

      setConfirmed({ caseNumber, pin: clientPin });
      toast.success("Client confirmed successfully.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Attestation failed.";
      console.error("ATTEST: FAILED", e);
      toast.error(msg);
    } finally {
      setConfirming(false);
    }
  };

  const handleDecline = async () => {
    if (!user || !intakeId || !caseId) return;
    setDeclining(true);
    try {
      const now = new Date().toISOString();

      // Get rc_client_intakes by case_id (C.A.R.E. decline logic)
      const { data: intakes } = await supabaseGet(
        "rc_client_intakes",
        `select=id,intake_json&case_id=eq.${caseId}&intake_status=in.(submitted_pending_attorney,attorney_confirmed)&order=intake_submitted_at.desc&limit=1`
      );
      const intake = Array.isArray(intakes) ? intakes[0] : intakes;
      if (!intake) throw new Error("Intake not found");

      const existingJson = intake.intake_json || {};
      const updatedJson = {
        ...existingJson,
        attorney_attestation: { status: "declined", declined_at: now },
      };

      const { error: intakeErr } = await supabaseUpdate(
        "rc_client_intakes",
        `id=eq.${intake.id}`,
        {
          intake_status: "attorney_declined_not_client",
          attorney_confirm_deadline_at: null,
          intake_json: updatedJson,
        }
      );
      if (intakeErr) throw new Error(intakeErr.message);

      await supabaseUpdate("rc_client_intake_sessions", `resume_token=eq.${intakeId}`, {
        intake_status: "declined",
        updated_at: now,
      });

      await audit({
        action: "attorney_declined",
        actorRole: "attorney",
        actorId: user.id,
        caseId,
        meta: { intake_id: intake.id },
      });

      toast.success("Intake declined.");
      navigate("/attorney/dashboard");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to decline.";
      toast.error(msg);
    } finally {
      setDeclining(false);
    }
  };

  if (role !== "attorney" || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] flex items-center justify-center p-4 text-white">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md text-gray-900">
          <p className="text-gray-700 mb-4">Please log in to access this page.</p>
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
      <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] flex items-center justify-center text-white">
        <p>Loading intake…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] flex items-center justify-center p-4 text-white">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md text-gray-900">
          <p className="text-red-700 mb-4">{error}</p>
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
      <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] p-6 text-white">
        <div className="max-w-xl mx-auto">
          <div className={CARD_CLASS}>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Client confirmed</h1>
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
              <p className="text-gray-700 mb-1 font-medium">Case Number</p>
              <p className="text-2xl font-mono font-bold text-black mb-4">{confirmed.caseNumber}</p>
              <p className="text-gray-700 mb-1 font-medium">PIN</p>
              <p className="text-2xl font-mono font-bold text-black mb-4">{confirmed.pin}</p>
              <p className="text-gray-600 text-sm mt-4">
                Share these credentials with your client so they can access their portal.
              </p>
            </div>
            <p className="text-gray-700 font-medium mb-4">
              The AI Care Plan Builder is now generating the care plan. You will be notified when it&apos;s ready.
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
    <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] p-6 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/attorney/dashboard")}
            className="text-white hover:bg-white/20 text-sm"
          >
            ← Back to Dashboard
          </button>
          <span className="text-white font-mono text-sm">{intakeIdDisplay}</span>
        </div>

        <div className={CARD_CLASS}>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Review & Attest</h1>
          <p className="text-gray-600 text-sm mb-6">
            Review the client intake below. Confirm if this is your client, or decline if not.
          </p>

          <div className="space-y-6">
            {fd.attorney && (
              <div>
                <div className={SECTION_TITLE}>Attorney</div>
                <p className={ROW_CLASS}>{fd.attorney.displayName}</p>
                {fd.attorney.attorneyCode && (
                  <p className="text-gray-500 text-xs">{fd.attorney.attorneyCode}</p>
                )}
              </div>
            )}
            <div>
              <div className={SECTION_TITLE}>Personal Information</div>
              <p className={ROW_CLASS}>
                {clientDisplayName || `${personal.firstName ?? ""} ${personal.lastName ?? ""}`.trim() || "—"}
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
                <p className="text-gray-500 text-sm">None listed</p>
              )}
            </div>
            <div>
              <div className={SECTION_TITLE}>Medications</div>
              {(medications.rows?.length ?? 0) === 0 ? (
                <p className="text-gray-500 text-sm">None listed</p>
              ) : (
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
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

          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
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
              className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              {declining ? "Declining…" : "Decline — This is NOT my client"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
