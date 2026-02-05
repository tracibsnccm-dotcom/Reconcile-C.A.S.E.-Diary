// src/pages/ClientConsent.tsx
// Flow: IntakeIdentity (attorney + client info) -> ClientConsent (steps 1-5 consents only)
// Attorney selection lives on IntakeIdentity; this page starts at step 1 (first consent).

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { IntakeCountdownBanner } from "@/components/IntakeCountdownBanner";
import { SAVE_AND_EXIT_TOAST, RESUME_IN_PROGRESS } from "@/config/clientMessaging";
import { supabase } from "@/integrations/supabase/client";
import { audit } from '@/lib/supabaseOperations';
import { updateIntakeSession } from "@/lib/intakeSessionService";
import { toast } from "sonner";

// Generate a session ID to track consent before intake exists
function generateSessionId(): string {
  return `consent_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Public Supabase functions (no auth required)
async function saveConsentStep(sessionId: string, step: number, data: any) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // First, try to find existing consent by session_id
  const findResponse = await fetch(
    `${supabaseUrl}/rest/v1/rc_client_consents?session_id=eq.${sessionId}&select=id`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  let consentId: string | null = null;
  if (findResponse.ok) {
    const existing = await findResponse.json();
    if (existing && existing.length > 0) {
      consentId = existing[0].id;
    }
  }

  const updates: any = {
    session_id: sessionId,
    updated_at: new Date().toISOString(),
  };

  // Map step data to database fields
  // UI steps 1-5 map to DB steps 2-6 (DB step 2 = Service Agreement, etc.)
  const dbStep = step + 1; // UI step 1 -> DB step 2, UI step 2 -> DB step 3, etc.
  
  if (dbStep === 2) {
    // Service Agreement (UI step 1)
    updates.service_agreement_signed_at = new Date().toISOString();
    updates.service_agreement_signature = data.signature;
    updates.service_agreement_declined = data.declined || false;
  } else if (dbStep === 3) {
    // Legal Disclosure (UI step 2)
    updates.legal_disclosure_signed_at = new Date().toISOString();
    updates.legal_disclosure_signature = data.signature ?? "";
    updates.legal_disclosure_attorney_name = data.attorneyName ?? null;
    // Note: legal_disclosure_declined column does not exist in rc_client_consents; add it to the DB if step-2 decline tracking is needed.
  } else if (dbStep === 4) {
    // Obtain Records (UI step 3)
    updates.obtain_records_signed_at = new Date().toISOString();
    updates.obtain_records_signature = data.signature;
    updates.obtain_records_injury_date = data.injuryDate;
  } else if (dbStep === 5) {
    // Healthcare Coordination (UI step 4)
    updates.healthcare_coord_signed_at = new Date().toISOString();
    updates.healthcare_coord_signature = data.signature;
    updates.healthcare_coord_pcp = data.pcp || null;
    updates.healthcare_coord_specialist = data.specialist || null;
    updates.healthcare_coord_therapy = data.therapy || null;
  } else if (dbStep === 6) {
    // HIPAA Privacy Notice (UI step 5)
    updates.hipaa_acknowledged_at = new Date().toISOString();
    updates.hipaa_signature = data.signature;
  }

  const url = consentId
    ? `${supabaseUrl}/rest/v1/rc_client_consents?id=eq.${consentId}`
    : `${supabaseUrl}/rest/v1/rc_client_consents`;

  const method = consentId ? "PATCH" : "POST";

  const response = await fetch(url, {
    method,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to save consent step:", errorText);
    throw new Error(`Failed to save consent: ${response.status}`);
  }

  return { error: null };
}

// Validate signature: must be at least 2 words (first + last name)
function validateSignature(signature: string): boolean {
  const trimmed = signature.trim();
  const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
  return words.length >= 2;
}

// Get current date as string (YYYY-MM-DD)
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Clear all client PII and intake-related data from sessionStorage (after consent 1 or 2 decline)
function clearClientDataFromSession(): void {
  const keysToRemove = [
    "rcms_client_first_name",
    "rcms_client_last_name",
    "rcms_client_email",
    "rcms_intake_session_id",
    "rcms_intake_id",
    "rcms_resume_token",
    "rcms_intake_created_at",
    "rcms_date_of_injury",
    "rcms_date_approximate",
    "rcms_consent_session_id",
    "rcms_consents_completed",
    "rcms_current_attorney_id",
    "rcms_attorney_code",
    "rcms_attorney_name",
    "rcms_intake_form_data",
    "rcms_consent_step",
    "rcms_intake_step",
    "rcms_declined_consents",
    "rcms_given_consents",
  ];
  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

// Notify attorney and store aggregate count when consent 1 or 2 is declined (no PII stored except client_name in notification)
async function notifyAttorneyOnDecline(
  attorneyId: string | null,
  clientName: string,
  declinedStep: 1 | 2
): Promise<void> {
  const consentLabel =
    declinedStep === 1
      ? "RCMS care management services"
      : "to authorize PHI sharing with your office";
  const message = `${clientName} has declined ${consentLabel} during the intake process. The client has been advised to contact your office directly.\n\nImportant:\n- RCMS does not store this information — please keep for your records if this is an item you track.\n- If the client decides to accept services at a later date, A NEW INTAKE MUST BE COMPLETED.`;

  const payload = {
    attorney_id: attorneyId,
    client_name: clientName,
    declined_consent: declinedStep,
    message,
  };
  if (supabase) {
    const { error } = await supabase.rpc("notify_attorney_consent_decline", {
      p_attorney_id: attorneyId,
      p_notification_type: "client_declined_consent",
      p_client_name: clientName,
      p_declined_consent: declinedStep,
      p_message: message,
    });
    if (error) {
      console.log("ATTORNEY NOTIFICATION:", payload);
    }
  } else {
    console.log("ATTORNEY NOTIFICATION:", payload);
  }

  const monthYear = new Date().toISOString().slice(0, 7);
  const aggPayload = { attorney_id: attorneyId, consent_type: declinedStep, month_year: monthYear };
  if (supabase) {
    const { error: aggError } = await supabase.rpc("increment_consent_decline_stats", {
      p_attorney_id: attorneyId,
      p_consent_type: declinedStep,
      p_month_year: monthYear,
    });
    if (aggError) {
      console.log("AGGREGATE DECLINE:", aggPayload);
    }
  } else {
    console.log("AGGREGATE DECLINE:", aggPayload);
  }
}

type ConsentStep = 0 | 1 | 2 | 3 | 4 | 5; // Step 0: Attorney, Steps 1-5: Consents

export default function ClientConsent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Attorney selection is now on IntakeIdentity; always start at first consent step (1).
  const [step, setStep] = useState<ConsentStep>(1);
  
  const [sessionId] = useState<string>(() => {
    // Try to get existing session ID from sessionStorage, or generate new one
    const stored = sessionStorage.getItem("rcms_consent_session_id");
    if (stored) return stored;
    const newId = generateSessionId();
    sessionStorage.setItem("rcms_consent_session_id", newId);
    return newId;
  });

  const [intakeSessionId, setIntakeSessionId] = useState<string | null>(
    sessionStorage.getItem("rcms_intake_session_id")
  );

  // Step 1: Service Agreement
  const [serviceAgreementAccepted, setServiceAgreementAccepted] = useState(false);
  const [serviceAgreementSignature, setServiceAgreementSignature] = useState("");

  // Step 2: Legal Disclosure
  const [legalDisclosureAuthorized, setLegalDisclosureAuthorized] = useState(false);
  const [legalDisclosureSignature, setLegalDisclosureSignature] = useState("");
  const [attorneyName, setAttorneyName] = useState("");

  // Step 3: Obtain Records
  const [obtainRecordsAuthorized, setObtainRecordsAuthorized] = useState(false);
  const [obtainRecordsSignature, setObtainRecordsSignature] = useState("");
  const [injuryDate, setInjuryDate] = useState(() => {
    return sessionStorage.getItem("rcms_date_of_injury") || "";
  });

  // Step 4: Healthcare Coordination
  const [healthcareCoordAuthorized, setHealthcareCoordAuthorized] = useState(false);
  const [healthcareCoordSignature, setHealthcareCoordSignature] = useState("");
  const [pcp, setPcp] = useState("");
  const [specialist, setSpecialist] = useState("");
  const [therapy, setTherapy] = useState("");

  // Step 5: HIPAA Privacy Notice
  const [hipaaAcknowledged, setHipaaAcknowledged] = useState(false);
  const [hipaaSignature, setHipaaSignature] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [savingExit, setSavingExit] = useState(false);
  const [countdownExpired, setCountdownExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declinedConsent, setDeclinedConsent] = useState<number | null>(null);
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);
  const [declinedConsents, setDeclinedConsents] = useState<number[]>([]);
  const [givenConsents, setGivenConsents] = useState<number[]>([]);

  // Attorney selection state (from get_attorney_directory RPC)
  const [availableAttorneys, setAvailableAttorneys] = useState<{attorney_id: string, attorney_name: string, attorney_code?: string | null}[]>([]);
  const [selectedAttorneyId, setSelectedAttorneyId] = useState<string>("");
  const [attorneyCode, setAttorneyCode] = useState<string>("");
  const [attorneyLoadError, setAttorneyLoadError] = useState<string | null>(null);
  const [validatedAttorneyId, setValidatedAttorneyId] = useState<string | null>(null);

  const currentDate = getCurrentDate();

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  // Hydrate from intake session form_data on resume (sessionStorage set by ResumeIntake or Save & Exit)
  useEffect(() => {
    const raw = sessionStorage.getItem("rcms_intake_form_data");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as { consentStep?: number; consents?: Record<string, any> };
      if (typeof data.consentStep === "number") setStep(data.consentStep as ConsentStep);
      const c = data.consents;
      if (c) {
        if (c.serviceAgreement) {
          setServiceAgreementAccepted(!!c.serviceAgreement.accepted);
          setServiceAgreementSignature(c.serviceAgreement.signature || "");
        }
        if (c.legalDisclosure) {
          setLegalDisclosureAuthorized(!!c.legalDisclosure.authorized);
          setAttorneyName(c.legalDisclosure.attorneyName || "");
          setLegalDisclosureSignature(c.legalDisclosure.signature || "");
        }
        if (c.obtainRecords) {
          setObtainRecordsAuthorized(!!c.obtainRecords.authorized);
          setInjuryDate(c.obtainRecords.injuryDate || "");
          setObtainRecordsSignature(c.obtainRecords.signature || "");
        }
        if (c.healthcareCoord) {
          setHealthcareCoordAuthorized(!!c.healthcareCoord.authorized);
          setPcp(c.healthcareCoord.pcp || "");
          setSpecialist(c.healthcareCoord.specialist || "");
          setTherapy(c.healthcareCoord.therapy || "");
          setHealthcareCoordSignature(c.healthcareCoord.signature || "");
        }
        if (c.hipaa) {
          setHipaaAcknowledged(!!c.hipaa.acknowledged);
          setHipaaSignature(c.hipaa.signature || "");
        }
      }
    } catch (_) { /* ignore */ }
    const givenRaw = sessionStorage.getItem("rcms_given_consents");
    if (givenRaw) {
      try {
        const arr = JSON.parse(givenRaw);
        if (Array.isArray(arr)) setGivenConsents(arr);
      } catch (_) { /* ignore */ }
    }
    const declinedRaw = sessionStorage.getItem("rcms_declined_consents");
    if (declinedRaw) {
      try {
        const arr = JSON.parse(declinedRaw);
        if (Array.isArray(arr)) setDeclinedConsents(arr);
      } catch (_) { /* ignore */ }
    }
  }, []);

  // Load available attorneys on mount via get_attorney_directory RPC
  useEffect(() => {
    const loadAttorneys = async () => {
      setAttorneyLoadError(null);
      if (!supabase) {
        setAttorneyLoadError('Unable to load attorneys. Please refresh or contact support.');
        return;
      }
      const { data, error } = await supabase.rpc('get_attorney_directory');
      if (error || !data) {
        setAttorneyLoadError('Unable to load attorneys. Please refresh or contact support.');
        return;
      }
      const attorneys = Array.isArray(data) ? data : [data];
      setAvailableAttorneys(attorneys);
    };
    loadAttorneys();
  }, []);

  // Validate attorney code against directory when code changes (step 0 only) - case-insensitive
  useEffect(() => {
    if (step !== 0 || selectedAttorneyId) {
      setValidatedAttorneyId(null);
      return;
    }
    const code = attorneyCode.trim();
    if (!code) {
      setValidatedAttorneyId(null);
      return;
    }
    const codeNorm = code.toLowerCase();
    const match = availableAttorneys.find(
      (a) => a.attorney_code && String(a.attorney_code).trim().toLowerCase() === codeNorm
    );
    setValidatedAttorneyId(match ? match.attorney_id : null);
  }, [step, selectedAttorneyId, attorneyCode, availableAttorneys]);

  // Check if intake session exists - if not and we're past attorney step, redirect to IntakeIdentity
  useEffect(() => {
    const storedIntakeId = sessionStorage.getItem("rcms_intake_id");
    const storedSessionId = sessionStorage.getItem("rcms_intake_session_id");
    
    // If on a consent step but no intake session, redirect to identity page
    if (step > 0 && !storedIntakeId) {
      // Get attorney info to pass along
      const storedAttorneyId = sessionStorage.getItem("rcms_current_attorney_id") || "";
      const storedAttorneyCode = sessionStorage.getItem("rcms_attorney_code") || "";
      navigate(`/intake-identity?attorney_id=${encodeURIComponent(storedAttorneyId)}&attorney_code=${encodeURIComponent(storedAttorneyCode)}`);
      return;
    }
    
    if (storedSessionId) {
      setIntakeSessionId(storedSessionId);
    }
    
    // Restore attorney info if available
    const storedAttorneyId = sessionStorage.getItem("rcms_current_attorney_id");
    const storedAttorneyCode = sessionStorage.getItem("rcms_attorney_code");
    const storedAttorneyName = sessionStorage.getItem("rcms_attorney_name");
    if (storedAttorneyId) setSelectedAttorneyId(storedAttorneyId);
    if (storedAttorneyCode) setAttorneyCode(storedAttorneyCode);
    if (storedAttorneyName) setAttorneyName(storedAttorneyName);
  }, [step, navigate]);

  // Auto-populate attorney name on Step 3 of 6 (Legal Disclosure) from attorney selected in Step 1
  useEffect(() => {
    if (step !== 2) return;
    if (attorneyName.trim()) return;
    const stored = sessionStorage.getItem("rcms_attorney_name");
    if (stored) {
      setAttorneyName(stored);
      return;
    }
    const attorneyId = sessionStorage.getItem("rcms_current_attorney_id");
    if (attorneyId && availableAttorneys.length > 0) {
      const atty = availableAttorneys.find((a) => a.attorney_id === attorneyId);
      if (atty?.attorney_name) setAttorneyName(atty.attorney_name);
    }
  }, [step, attorneyName, availableAttorneys]);


  const buildConsentsPayload = () => ({
    serviceAgreement: { accepted: serviceAgreementAccepted, signature: serviceAgreementSignature },
    legalDisclosure: { authorized: legalDisclosureAuthorized, attorneyName, signature: legalDisclosureSignature },
    obtainRecords: { authorized: obtainRecordsAuthorized, injuryDate, signature: obtainRecordsSignature },
    healthcareCoord: { authorized: healthcareCoordAuthorized, pcp, specialist, therapy, signature: healthcareCoordSignature },
    hipaa: { acknowledged: hipaaAcknowledged, signature: hipaaSignature },
  });

  const handleConsent = async (consented: boolean) => {
    setError(null);
    if (step < 1 || step > 5) return;

    // --- I Do Not Consent: steps 1 or 2 → stop intake, notify attorney, clear PII
    if (!consented && (step === 1 || step === 2)) {
      setIsSaving(true);
      try {
        const attorneyId = sessionStorage.getItem("rcms_current_attorney_id");
        const first = sessionStorage.getItem("rcms_client_first_name")?.trim() || "";
        const last = sessionStorage.getItem("rcms_client_last_name")?.trim() || "";
        const clientName = [first, last].filter(Boolean).join(" ") || "Client";

        await saveConsentStep(sessionId, step, {
          signature: "",
          declined: true,
          ...(step === 2 && { attorneyName: "" }),
        });
        await notifyAttorneyOnDecline(attorneyId, clientName, step as 1 | 2);
        clearClientDataFromSession();
        setDeclinedConsent(step);
        setShowDeclineMessage(true);
      } catch (err: any) {
        setError(err.message || "Failed to save. Please try again.");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // --- I Do Not Consent: steps 3, 4, 5 → proceed with flag
    if (!consented && (step === 3 || step === 4 || step === 5)) {
      const nextDeclined = [...declinedConsents, step];
      setDeclinedConsents(nextDeclined);
      sessionStorage.setItem("rcms_declined_consents", JSON.stringify(nextDeclined));
      if (step === 5) {
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        const consents = buildConsentsPayload();
        if (sid) {
          try {
            await updateIntakeSession(sid, { formData: { consentStep: 5, consents, consentsComplete: true } });
          } catch (_) {}
        }
        sessionStorage.removeItem("rcms_intake_submitted");
        sessionStorage.setItem("rcms_consents_completed", "true");
        const attorneyParam = sessionStorage.getItem("rcms_current_attorney_id") || "";
        const codeParam = sessionStorage.getItem("rcms_attorney_code") || "";
        navigate(`/client-intake?attorney_id=${encodeURIComponent(attorneyParam)}&attorney_code=${encodeURIComponent(codeParam)}`);
      } else {
        setStep((step + 1) as ConsentStep);
      }
      return;
    }

    // --- I Consent: validate, save, track given, advance
    if (step === 1) {
      if (!serviceAgreementAccepted) {
        setError("Please confirm that you have read and agree to the Service Agreement.");
        return;
      }
      if (!validateSignature(serviceAgreementSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
    } else if (step === 2) {
      if (!attorneyName.trim()) {
        setError("Please enter your attorney or firm name.");
        return;
      }
      if (!legalDisclosureAuthorized) {
        setError("Please authorize RCMS to disclose your PHI to your legal representative.");
        return;
      }
      if (!validateSignature(legalDisclosureSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
    } else if (step === 3) {
      if (!injuryDate) {
        setError("Please enter the date of injury/incident.");
        return;
      }
      if (!obtainRecordsAuthorized) {
        setError("Please authorize the release of your records to RCMS.");
        return;
      }
      if (!validateSignature(obtainRecordsSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
    } else if (step === 4) {
      if (!healthcareCoordAuthorized) {
        setError("Please authorize RCMS to share information with your healthcare providers.");
        return;
      }
      if (!validateSignature(healthcareCoordSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
    } else if (step === 5) {
      if (!hipaaAcknowledged) {
        setError("Please acknowledge that you have received and reviewed the Notice of Privacy Practices.");
        return;
      }
      if (!validateSignature(hipaaSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
    }

    setIsSaving(true);
    try {
      const nextGiven = [...givenConsents, step];
      setGivenConsents(nextGiven);
      sessionStorage.setItem("rcms_given_consents", JSON.stringify(nextGiven));

      if (step === 1) {
        await saveConsentStep(sessionId, 1, { signature: serviceAgreementSignature, declined: false });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) await updateIntakeSession(sid, { formData: { consentStep: 2, consents: buildConsentsPayload() } });
        setStep(2);
      } else if (step === 2) {
        await saveConsentStep(sessionId, 2, { signature: legalDisclosureSignature, attorneyName: attorneyName.trim() });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) await updateIntakeSession(sid, { formData: { consentStep: 3, consents: buildConsentsPayload() } });
        setStep(3);
      } else if (step === 3) {
        await saveConsentStep(sessionId, 3, { signature: obtainRecordsSignature, injuryDate });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) await updateIntakeSession(sid, { formData: { consentStep: 4, consents: buildConsentsPayload() } });
        setStep(4);
      } else if (step === 4) {
        await saveConsentStep(sessionId, 4, {
          signature: healthcareCoordSignature,
          pcp: pcp.trim() || null,
          specialist: specialist.trim() || null,
          therapy: therapy.trim() || null,
        });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) await updateIntakeSession(sid, { formData: { consentStep: 5, consents: buildConsentsPayload() } });
        setStep(5);
      } else if (step === 5) {
        await saveConsentStep(sessionId, 5, { signature: hipaaSignature });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) {
          await updateIntakeSession(sid, { formData: { consentStep: 5, consents: buildConsentsPayload(), consentsComplete: true } });
        }
        audit({
          action: "POLICY_ACK",
          actorRole: "client",
          actorId: "pre-auth",
          caseId: undefined,
          meta: { session_id: sessionId, intake_session_id: intakeSessionId },
        }).catch((e) => console.error("Failed to audit consent signing:", e));
        sessionStorage.removeItem("rcms_intake_submitted");
        sessionStorage.setItem("rcms_consents_completed", "true");
        const attorneyParam = selectedAttorneyId || sessionStorage.getItem("rcms_current_attorney_id") || "";
        const codeParam = attorneyCode || sessionStorage.getItem("rcms_attorney_code") || "";
        navigate(`/client-intake?attorney_id=${encodeURIComponent(attorneyParam)}&attorney_code=${encodeURIComponent(codeParam)}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    const sid = sessionStorage.getItem("rcms_intake_session_id");
    if (!sid) {
      toast.error("No intake session. Please start from the beginning.");
      return;
    }
    const consents = buildConsentsPayload();
    const existing = JSON.parse(sessionStorage.getItem("rcms_intake_form_data") || "{}");
    const merged = {
      ...existing,
      consentStep: step,
      consents,
      givenConsents,
      declinedConsents,
    };
    setSavingExit(true);
    setError(null);
    try {
      await updateIntakeSession(sid, {
        formData: { consentStep: step, consents, givenConsents, declinedConsents },
      });
      sessionStorage.setItem("rcms_intake_form_data", JSON.stringify(merged));
      sessionStorage.setItem("rcms_consent_step", String(step));
      sessionStorage.setItem("rcms_intake_step", "0");
      sessionStorage.setItem("rcms_given_consents", JSON.stringify(givenConsents));
      sessionStorage.setItem("rcms_declined_consents", JSON.stringify(declinedConsents));
      toast.success(SAVE_AND_EXIT_TOAST);
      navigate("/");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save. Please try again.");
    } finally {
      setSavingExit(false);
    }
  };

  const handleContinue = async () => {
    setError(null);
    if (step !== 0) return;
    // Attorney Selection - require dropdown selection OR validated attorney code
    const effectiveAttorneyId = selectedAttorneyId || validatedAttorneyId;
    if (!effectiveAttorneyId) {
      if (attorneyCode.trim()) {
        setError("The attorney code you entered was not found. Please check the code or select your attorney from the dropdown.");
      } else {
        setError("Please select your attorney or enter a valid attorney code to continue.");
      }
      return;
    }
    const codeToStore = selectedAttorneyId ? attorneyCode : attorneyCode.trim();
    sessionStorage.setItem("rcms_current_attorney_id", effectiveAttorneyId);
    sessionStorage.setItem("rcms_attorney_code", codeToStore);
    const selectedAtty = availableAttorneys.find((a) => a.attorney_id === effectiveAttorneyId);
    if (selectedAtty) sessionStorage.setItem("rcms_attorney_name", selectedAtty.attorney_name || "");
    navigate(`/intake-identity?attorney_id=${encodeURIComponent(effectiveAttorneyId)}&attorney_code=${encodeURIComponent(codeToStore)}`);
  };

  const progress = (step / 5) * 100; // Steps 1–5 (consents only); 20% per step

  // Show decline message if user declined consent step 1 or 2 (intake cannot continue)
  if (showDeclineMessage && declinedConsent !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4 flex items-center justify-center">
        <Card className="p-8 max-w-2xl text-gray-900">
          <div className="text-center space-y-6 py-8">
            <div className="text-red-600 text-6xl">⚠️</div>
            <h2 className="text-2xl font-bold text-black">Intake Cannot Continue</h2>
            <p className="text-black">
              You have declined{" "}
              {declinedConsent === 1
                ? "RCMS care management services"
                : "to authorize your attorney to access your health information"}
              .
            </p>
            <p className="text-black">
              Please contact your attorney or legal representative to discuss your options.
            </p>
            <div className="pt-4">
              <Button onClick={() => (window.location.href = "/")} variant="outline">
                Return to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
      <IntakeCountdownBanner onExpired={setCountdownExpired} />
      <div className="max-w-4xl mx-auto">
        {searchParams.get("resume") === "true" && (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">{RESUME_IN_PROGRESS}</AlertDescription>
          </Alert>
        )}
        {searchParams.get("attorney_required") === "1" && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              Please select your attorney to continue.
            </AlertDescription>
          </Alert>
        )}
        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Step {step} of 5 (Consents)
            </h2>
            <span className="text-sm text-gray-900">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="p-6 md:p-8 text-gray-900">
          {/* Step 0: Attorney Selection */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Select Your Attorney
                </h1>
                <p className="text-sm text-gray-900">
                  Please select your attorney before proceeding.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="text-sm font-semibold mb-3 text-gray-900">Attorney Information</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-900">Select Your Attorney</Label>
                      <Select value={selectedAttorneyId} onValueChange={(val) => {
                        setSelectedAttorneyId(val);
                        // Clear attorney code when selecting from dropdown
                        setAttorneyCode("");
                        // Store attorney name for carry-over throughout intake
                        const selectedAtty = availableAttorneys.find(a => a.attorney_id === val);
                        if (selectedAtty) {
                          sessionStorage.setItem("rcms_attorney_name", selectedAtty.attorney_name || "");
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your attorney..." />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {availableAttorneys.map(attorney => (
                            <SelectItem key={attorney.attorney_id} value={attorney.attorney_id} className="text-gray-900">
                              {attorney.attorney_name}{attorney.attorney_code ? ` (${attorney.attorney_code})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {attorneyLoadError && (
                        <p className="text-sm text-destructive mt-2">{attorneyLoadError}</p>
                      )}
                    </div>
                    <div className="text-center text-sm text-gray-900">— OR —</div>
                    <div>
                      <Label htmlFor="attorney-code" className="text-gray-900">Enter Attorney Code</Label>
                      <Input
                        id="attorney-code"
                        value={attorneyCode}
                        onChange={(e) => {
                          setAttorneyCode(e.target.value);
                          setSelectedAttorneyId("");
                          if (step === 0) setError(null);
                        }}
                        placeholder="e.g., 01, 02"
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/* Returning: nested inside same card, smaller secondary */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="font-medium mb-1 text-sm text-gray-900">Returning?</p>
                <p className="text-xs text-gray-900 mb-2">Resume an unfinished intake or check your status using your Intake ID (INT#) and temporary PIN.</p>
                <a href="/resume-intake" className="text-sm font-medium text-primary hover:underline">Resume / Check Status</a>
              </div>
            </div>
          )}

          {/* Step 1: Service Agreement - content truncated for length; full content in C.A.R.E. */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Service Agreement & Informed Consent
                </h1>
                <p className="text-sm text-gray-900">
                  Please read the following service agreement carefully.
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <h3 className="text-base font-bold mb-3 text-gray-900">RECONCILE CARE MANAGEMENT SERVICES (RCMS)</h3>
                  <h4 className="text-sm font-semibold mb-4 text-gray-900">SERVICE AGREEMENT & INFORMED CONSENT FOR CARE MANAGEMENT SERVICES</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">1. Voluntary Agreement for Services:</p>
                      <p className="text-gray-900">I voluntarily request and agree to receive care management services from Reconcile Care Management Services (RCMS). I understand that these services are designed to provide support and navigation for my clinically complex situation. I am not obligated to accept these services and may decline to participate at any time.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">2. Nature of Services – The RCMS C.A.R.E. Model:</p>
                      <p className="mb-2 text-gray-900">RCMS provides clinical advocacy, resource coordination, and evidence-based support. Services may include:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                        <li>Comprehensive clinical assessment and review of medical records.</li>
                        <li>Care coordination and communication with my treating healthcare providers.</li>
                        <li>Identification of barriers to recovery and connection to community resources.</li>
                        <li>Clinical consultation and analysis for my legal team to support my case.</li>
                      </ul>
                      <p className="mt-2 text-gray-900">I understand that RCMS and its staff are Registered Nurses and Care Managers. <strong>THEY DO NOT PROVIDE LEGAL ADVICE.</strong> All legal decisions remain the responsibility of my attorney.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">3. My Responsibilities as a Client:</p>
                      <p className="mb-2 text-gray-900">I agree to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                        <li>Provide accurate and complete information about my health and circumstances.</li>
                        <li>Participate actively in the care management process.</li>
                        <li>Inform my RCMS Care Manager of significant changes in my health or treatment.</li>
                        <li>Notify RCMS if I wish to discontinue services.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">4. Financial Agreement:</p>
                      <p className="text-gray-900">I understand that RCMS services are engaged and compensated by my legal representative/law firm under a separate business agreement. I will not receive a bill or be directly charged by RCMS for these services. This financial arrangement does not influence the clinical judgment or advocacy provided by my RCMS Care Manager.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">5. Confidentiality:</p>
                      <p className="text-gray-900">I understand that my privacy is protected by law and by RCMS policies. I will receive a separate Notice of Privacy Practices that details these protections. I authorize the necessary use and disclosure of my health information through accompanying consent forms.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">6. Right to Discontinue:</p>
                      <p className="text-gray-900">I may discontinue RCMS services at any time by providing verbal or written notice to my Care Manager and my attorney.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="service-agreement"
                    checked={serviceAgreementAccepted}
                    onCheckedChange={(checked) => setServiceAgreementAccepted(checked === true)}
                  />
                  <Label htmlFor="service-agreement" className="text-sm leading-relaxed cursor-pointer text-gray-900">
                    I have read this Service Agreement, understand and agree to the terms
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-signature" className="text-gray-900">Full Legal Name (Signature)</Label>
                  <Input id="service-signature" value={serviceAgreementSignature} onChange={(e) => setServiceAgreementSignature(e.target.value)} placeholder="Enter your full legal name" className="text-gray-900" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-date" className="text-gray-900">Date</Label>
                  <Input id="service-date" type="text" value={currentDate} readOnly className="bg-muted text-gray-900" />
                </div>
              </div>
            </div>
          )}

          {/* Steps 2-5: same structure as C.A.R.E. - keeping key UI; full legal text abbreviated */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization to Disclose PHI to Legal Counsel</h1>
                <p className="text-sm text-gray-900">Please read the following authorization carefully.</p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <h3 className="text-base font-bold mb-3 text-gray-900">AUTHORIZATION FOR CLINICAL CONSULTATION & DISCLOSURE OF PROTECTED HEALTH INFORMATION TO LEGAL COUNSEL/REPRESENTATIVE</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">Coordination of Authorizations:</p>
                      <p className="text-gray-900">This is one of three distinct authorizations for Reconcile Care Management Services (RCMS). Each form serves a separate purpose: collaboration with your legal team, obtaining your records, and coordinating with your healthcare providers. These authorizations are designed to work together. Signing one does not invalidate the others. You may revoke any one authorization without affecting the others.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">RCMS&apos;s Role as a Clinical Business Associate:</p>
                      <p className="text-gray-900">Reconcile Care Management Services (RCMS) operates as a Business Associate under HIPAA to your legal team. This means we are engaged by your attorneys to provide specialized, clinical support for your case. We do not provide legal advice. Our role is to organize, interpret, and translate complex medical information into clear, actionable insights for your legal team.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Specific Authorization for Legal Collaboration:</p>
                      <p className="mb-2 text-gray-900">I specifically authorize and direct my Reconcile Care Management Services (RCMS) Care Manager to discuss, consult on, and disclose my Protected Health Information (PHI) and all pertinent clinical information with my designated legal representative for the purpose of legal case coordination and strategy.</p>
                      <p className="mb-2 text-gray-900">This includes, but is not limited to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                        <li>Verbal consultations, strategy discussions, and updates.</li>
                        <li>Written summaries, assessments, and reports.</li>
                        <li>Reviews and interpretations of medical records.</li>
                        <li>Analysis of treatment plans and future care needs.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Nurse&apos;s Fiduciary Duty & Your Rights:</p>
                      <p className="mb-2 text-gray-900">As Registered Nurses and Care Managers, we have a professional and ethical fiduciary duty to you, our client. This means our primary obligation is to act in your best interest, with loyalty, and to protect your confidential information.</p>
                      <p className="text-gray-900">You have the absolute right to revoke this authorization, in whole or in part, at any time, for any reason.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Expiration:</p>
                      <p className="text-gray-900">This authorization will expire upon the formal closure of my case with RCMS, or one (1) year from the date signed, whichever occurs first.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Re-Disclosure Notice:</p>
                      <p className="text-gray-900">I understand that information disclosed to my legal representative may be re-disclosed by them in the course of my legal proceedings and may no longer be protected by federal HIPAA regulations.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="attorney-name" className="text-gray-900">Attorney/Firm Name *</Label>
                  <Input id="attorney-name" value={attorneyName} onChange={(e) => setAttorneyName(e.target.value)} placeholder="Enter your attorney or firm name" required className="text-gray-900" />
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox id="legal-disclosure" checked={legalDisclosureAuthorized} onCheckedChange={(c) => setLegalDisclosureAuthorized(c === true)} />
                  <Label htmlFor="legal-disclosure" className="text-sm cursor-pointer text-gray-900">I authorize RCMS to disclose my PHI to my legal representative as described above</Label>
                </div>
                <div className="space-y-2"><Label className="text-gray-900">Full Legal Name (Signature)</Label><Input value={legalDisclosureSignature} onChange={(e) => setLegalDisclosureSignature(e.target.value)} placeholder="Enter your full legal name" className="text-gray-900" /></div>
                <div className="space-y-2"><Label className="text-gray-900">Date</Label><Input type="text" value={currentDate} readOnly className="bg-muted text-gray-900" /></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization to Obtain Protected Health Information</h1>
                <p className="text-sm text-gray-900">Please read the following authorization carefully.</p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <h3 className="text-base font-bold mb-3 text-gray-900">AUTHORIZATION TO OBTAIN PROTECTED HEALTH INFORMATION</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">Coordination of Authorizations:</p>
                      <p className="text-gray-900">This is one of three distinct authorizations for Reconcile Care Management Services (RCMS). Each form serves a separate purpose. You may revoke any one authorization without affecting the others.</p>
                    </div>
                    <div>
                      <p className="mb-2 text-gray-900">I hereby authorize any and all physicians, healthcare providers, hospitals, clinics, rehabilitation facilities, insurance companies, employers, and other entities to release and disclose my complete records and Protected Health Information (PHI) to Reconcile Care Management Services (RCMS) and its assigned Care Managers.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Information to Be Disclosed:</p>
                      <p className="mb-2 text-gray-900">This authorization covers all records pertaining to my condition, treatment, and related claims, including but not limited to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                        <li>All medical records, office notes, charts, and diagnoses.</li>
                        <li>Diagnostic reports (e.g., MRI, X-Ray, CT Scan, EMG).</li>
                        <li>Billing statements, itemized charges, and payment records.</li>
                        <li>Therapy records (physical, occupational, speech, cognitive).</li>
                        <li>Employment records related to job duties, wages, and injury.</li>
                        <li>Pharmacy records.</li>
                        <li>Any other documents relevant to the injury/incident.</li>
                      </ul>
                      <p className="mt-2 text-gray-900">This authorization specifically excludes &apos;psychotherapy notes&apos; as defined by HIPAA. A separate authorization is required for those notes.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Purpose:</p>
                      <p className="text-gray-900">The information is necessary for Reconcile Care Management Services to provide comprehensive care management, assessment, and coordination of services related to my case.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Important Distinction:</p>
                      <p className="text-gray-900">You may have already signed a general release with your attorney. This RCMS-specific authorization is required under HIPAA to permit healthcare entities to release your PHI directly to RCMS.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Expiration:</p>
                      <p className="text-gray-900">This authorization will expire one (1) year from the date signed, or upon the formal closure of my case with RCMS, whichever occurs first.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label className="text-gray-900">Date of Injury/Incident *</Label><Input type="date" value={injuryDate} onChange={(e) => setInjuryDate(e.target.value)} required max={currentDate} className="text-gray-900" /></div>
                <div className="flex items-start space-x-2"><Checkbox id="obtain-records" checked={obtainRecordsAuthorized} onCheckedChange={(c) => setObtainRecordsAuthorized(c === true)} /><Label htmlFor="obtain-records" className="text-sm cursor-pointer text-gray-900">I authorize the release of my records to RCMS as described above</Label></div>
                <div className="space-y-2"><Label className="text-gray-900">Full Legal Name (Signature)</Label><Input value={obtainRecordsSignature} onChange={(e) => setObtainRecordsSignature(e.target.value)} placeholder="Enter your full legal name" className="text-gray-900" /></div>
                <div className="space-y-2"><Label className="text-gray-900">Date</Label><Input type="text" value={currentDate} readOnly className="bg-muted text-gray-900" /></div>
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization to Disclose for Healthcare Coordination</h1>
                <p className="text-sm text-gray-900">Please read the following authorization carefully.</p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <h3 className="text-base font-bold mb-3 text-gray-900">AUTHORIZATION TO DISCLOSE INFORMATION FOR HEALTHCARE COORDINATION</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2">Coordination of Authorizations:</p>
                      <p className="text-gray-900">This is one of three distinct authorizations for Reconcile Care Management Services (RCMS). You may revoke any one authorization without affecting the others.</p>
                    </div>
                    <div>
                      <p className="mb-2 text-gray-900">I hereby authorize Reconcile Care Management Services (RCMS) and its assigned Care Managers to disclose, release, and discuss the Protected Health Information (PHI) and professional Care Management work product they create, compile, or review in the course of managing my case.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Information to Be Disclosed:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                        <li>Care Management Assessments, Initial Evaluations, and Clinical Reviews.</li>
                        <li>Progress Reports, Summaries, and Correspondence.</li>
                        <li>Reviews and summaries of medical records and other PHI.</li>
                        <li>Treatment plan and resource recommendations.</li>
                        <li>Functional capacity evaluations or work status opinions (if performed).</li>
                        <li>Identification of barriers to recovery and care plan coordination.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Specific Authorized Recipients:</p>
                      <p className="text-gray-900">This information may be disclosed ONLY to my treating healthcare providers for the purpose of coordinating my care. This includes my current and future treating physicians, therapists, and other healthcare providers.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Purpose:</p>
                      <p className="text-gray-900">This authorization allows RCMS to coordinate my healthcare by sharing relevant assessments and recommendations with my treating medical team to support a unified approach to my treatment and recovery.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Expiration:</p>
                      <p className="text-gray-900">This authorization will expire upon the formal closure of my case with RCMS, or one (1) year from the date signed, whichever occurs first.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><Label className="text-gray-900">Primary Care Physician (Optional)</Label><Input value={pcp} onChange={(e) => setPcp(e.target.value)} placeholder="Enter primary care physician name" className="text-gray-900" /></div>
                <div className="space-y-2"><Label className="text-gray-900">Specialist(s) (Optional)</Label><Input value={specialist} onChange={(e) => setSpecialist(e.target.value)} placeholder="Enter specialist name(s)" className="text-gray-900" /></div>
                <div className="space-y-2"><Label className="text-gray-900">Therapy Provider(s) (Optional)</Label><Input value={therapy} onChange={(e) => setTherapy(e.target.value)} placeholder="Enter therapy provider name(s)" className="text-gray-900" /></div>
                <div className="flex items-start space-x-2"><Checkbox id="healthcare-coord" checked={healthcareCoordAuthorized} onCheckedChange={(c) => setHealthcareCoordAuthorized(c === true)} /><Label htmlFor="healthcare-coord" className="text-sm cursor-pointer text-gray-900">I authorize RCMS to share information with my healthcare providers as described above</Label></div>
                <div className="space-y-2"><Label className="text-gray-900">Full Legal Name (Signature)</Label><Input value={healthcareCoordSignature} onChange={(e) => setHealthcareCoordSignature(e.target.value)} placeholder="Enter your full legal name" className="text-gray-900" /></div>
                <div className="space-y-2"><Label className="text-gray-900">Date</Label><Input type="text" value={currentDate} readOnly className="bg-muted text-gray-900" /></div>
              </div>
            </div>
          )}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Notice of Privacy Practices</h1>
                <p className="text-sm text-gray-900">Please read the following privacy notice carefully.</p>
              </div>
              <div className="border rounded-lg p-4 bg-muted/50 max-h-[500px] overflow-y-auto">
                <div className="prose prose-sm max-w-none text-gray-900">
                  <h3 className="text-base font-bold mb-2 text-gray-900">NOTICE OF PRIVACY PRACTICES</h3>
                  <p className="text-sm mb-1 text-gray-900">Reconcile Care Management Services (RCMS)</p>
                  <p className="text-sm mb-4 text-gray-900">Effective Date: 01/01/2026</p>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-2 text-gray-900">THIS NOTICE DESCRIBES HOW PROTECTED HEALTH INFORMATION (PHI) ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION. PLEASE REVIEW THE FOLLOWING CAREFULLY.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Our Commitment to Your Privacy:</p>
                      <p className="text-gray-900">This Notice describes the privacy practices of Reconcile Care Management Services (RCMS). Our primary goal is to provide you with exceptional care management and advocacy. A critical part of that service is protecting the confidentiality and security of your health information.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">OUR PLEDGE REGARDING YOUR PROTECTED HEALTH INFORMATION (PHI):</p>
                      <p className="mb-2 text-gray-900">At RCMS, we are committed to protecting the privacy of your health information. We are required by law to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                        <li>Maintain the privacy of your Protected Health Information (PHI);</li>
                        <li>Provide you with this Notice of our legal duties and privacy practices;</li>
                        <li>Abide by the terms of this Notice currently in effect;</li>
                        <li>Notify you following a breach of your unsecured PHI.</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">HOW WE MAY USE AND DISCLOSE YOUR PHI:</p>
                      <div className="ml-4 space-y-3">
                        <div>
                          <p className="font-semibold mb-1 text-gray-900">1. For Treatment, Payment, or Healthcare Operations</p>
                          <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                            <li><strong>Treatment:</strong> We may use and disclose your PHI to provide, coordinate, or manage your healthcare.</li>
                            <li><strong>Payment:</strong> We may use and disclose your PHI to obtain payment for services.</li>
                            <li><strong>Healthcare Operations:</strong> We may use your PHI for quality assessment and business planning.</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold mb-1 text-gray-900">2. With Your Written Authorization</p>
                          <p className="text-gray-900">We will not use or disclose your PHI for purposes not described in this Notice without your written authorization. You may revoke an authorization at any time in writing.</p>
                        </div>
                        <div>
                          <p className="font-semibold mb-1 text-gray-900">3. Without Your Authorization – As Permitted by Law</p>
                          <p className="text-gray-900">We may use or disclose your PHI when required by law, for public health activities, health oversight, judicial proceedings, law enforcement, to avert serious threats to health or safety, and other purposes permitted by law.</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">YOUR RIGHTS REGARDING YOUR PHI:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 text-gray-900">
                        <li>Right to Inspect and Copy your PHI</li>
                        <li>Right to Amend your PHI if incorrect</li>
                        <li>Right to an Accounting of Disclosures</li>
                        <li>Right to Request Restrictions on uses</li>
                        <li>Right to Request Confidential Communications</li>
                        <li>Right to a Paper Copy of This Notice</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">COMPLAINTS:</p>
                      <p className="text-gray-900">If you believe your privacy rights have been violated, you may file a complaint with us or with the Secretary of the U.S. Department of Health and Human Services. You will not be penalized for filing a complaint.</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Questions or Concerns:</p>
                      <p className="mb-1 text-gray-900">Contact our Privacy Officer:</p>
                      <p className="mb-1 text-gray-900">Traci Johnson, BSN RN CCM</p>
                      <p className="mb-1 text-gray-900">251 Clearlake Dr., Grand Prairie, TX 75054</p>
                      <p className="mb-1 text-gray-900">Phone: 682-556-8472</p>
                      <p className="text-gray-900">Email: traci.johnson@rcmspllc.com</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-2"><Checkbox id="hipaa-ack" checked={hipaaAcknowledged} onCheckedChange={(c) => setHipaaAcknowledged(c === true)} /><Label htmlFor="hipaa-ack" className="text-sm cursor-pointer text-gray-900">I acknowledge that I have received and reviewed this Notice of Privacy Practices</Label></div>
                <div className="space-y-2"><Label className="text-gray-900">Full Legal Name (Signature)</Label><Input value={hipaaSignature} onChange={(e) => setHipaaSignature(e.target.value)} placeholder="Enter your full legal name" className="text-gray-900" /></div>
                <div className="space-y-2"><Label className="text-gray-900">Date</Label><Input type="text" value={currentDate} readOnly className="bg-muted text-gray-900" /></div>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            {step >= 1 && step <= 5 && (
              <div className="flex justify-end">
                <Button onClick={handleSaveAndExit} disabled={isSaving || savingExit || countdownExpired} variant="outline" className="min-w-[140px]">
                  {savingExit ? "Saving…" : "Save & Exit"}
                </Button>
              </div>
            )}
            {step === 0 && (
              <div className="flex justify-end">
                <Button
                  onClick={handleContinue}
                  disabled={savingExit || countdownExpired || (!selectedAttorneyId && !validatedAttorneyId)}
                  className="min-w-[140px]"
                >
                  Continue
                </Button>
              </div>
            )}
            {step >= 1 && step <= 5 && (
              <div className="flex gap-4 mt-2">
                <Button
                  onClick={() => handleConsent(true)}
                  disabled={isSaving || savingExit || countdownExpired}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white"
                >
                  I Consent
                </Button>
                <Button
                  onClick={() => handleConsent(false)}
                  disabled={isSaving || savingExit || countdownExpired}
                  variant="outline"
                  className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
                >
                  I Do Not Consent
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
