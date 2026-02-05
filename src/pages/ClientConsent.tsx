// src/pages/ClientConsent.tsx
// Updated flow: Attorney Selection (0) -> [IntakeIdentity page] -> Consents (1-5)
// Identity step is now handled by separate IntakeIdentity page

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
    updates.legal_disclosure_signature = data.signature;
    updates.legal_disclosure_attorney_name = data.attorneyName;
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

type ConsentStep = 0 | 1 | 2 | 3 | 4 | 5; // Step 0: Attorney, Steps 1-5: Consents

export default function ClientConsent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check if coming from IntakeIdentity - if intake session exists, start at consent step 1
  // Otherwise, start at attorney selection step 0
  const hasIntakeSession = sessionStorage.getItem("rcms_intake_id");
  const [step, setStep] = useState<ConsentStep>(() => {
    // If intake session exists, start at step 1 (consents), otherwise step 0 (attorney)
    return hasIntakeSession ? 1 : 0;
  });
  
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
  const [injuryDate, setInjuryDate] = useState("");

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
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);

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


  const handleDecline = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Save decline status (UI step 1 = DB step 2 = Service Agreement)
      await saveConsentStep(sessionId, 1, {
        signature: "",
        declined: true,
      });
      setShowDeclineMessage(true);
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save. Please try again.");
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    const sid = sessionStorage.getItem("rcms_intake_session_id");
    if (!sid) {
      toast.error("No intake session. Please start from the beginning.");
      return;
    }
    const consents = {
      serviceAgreement: { accepted: serviceAgreementAccepted, signature: serviceAgreementSignature },
      legalDisclosure: { authorized: legalDisclosureAuthorized, attorneyName, signature: legalDisclosureSignature },
      obtainRecords: { authorized: obtainRecordsAuthorized, injuryDate, signature: obtainRecordsSignature },
      healthcareCoord: { authorized: healthcareCoordAuthorized, pcp, specialist, therapy, signature: healthcareCoordSignature },
      hipaa: { acknowledged: hipaaAcknowledged, signature: hipaaSignature },
    };
    const existing = JSON.parse(sessionStorage.getItem("rcms_intake_form_data") || "{}");
    const merged = { ...existing, consentStep: step, consents };
    setSavingExit(true);
    setError(null);
    try {
      await updateIntakeSession(sid, { formData: { consentStep: step, consents } });
      sessionStorage.setItem("rcms_intake_form_data", JSON.stringify(merged));
      sessionStorage.setItem("rcms_consent_step", String(step));
      sessionStorage.setItem("rcms_intake_step", "0");
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

    // Validate current step
    if (step === 0) {
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
      // Store attorney selection in sessionStorage (use effective attorney_id)
      const codeToStore = selectedAttorneyId ? attorneyCode : attorneyCode.trim();
      sessionStorage.setItem("rcms_current_attorney_id", effectiveAttorneyId);
      sessionStorage.setItem("rcms_attorney_code", codeToStore);
      // Store attorney name for carry-over throughout intake
      const selectedAtty = availableAttorneys.find(a => a.attorney_id === effectiveAttorneyId);
      if (selectedAtty) {
        sessionStorage.setItem("rcms_attorney_name", selectedAtty.attorney_name || "");
      }
      // Navigate to IntakeIdentity page with attorney info
      navigate(`/intake-identity?attorney_id=${encodeURIComponent(effectiveAttorneyId)}&attorney_code=${encodeURIComponent(codeToStore)}`);
    } else if (step === 1) {
      // Service Agreement (UI step 1 = DB step 2)
      if (!serviceAgreementAccepted) {
        setError("Please confirm that you have read and agree to the Service Agreement.");
        return;
      }
      if (!validateSignature(serviceAgreementSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
      setIsSaving(true);
      try {
        await saveConsentStep(sessionId, 1, {
          signature: serviceAgreementSignature,
          declined: false,
        });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) {
          const consents = { serviceAgreement: { accepted: serviceAgreementAccepted, signature: serviceAgreementSignature }, legalDisclosure: { authorized: legalDisclosureAuthorized, attorneyName, signature: legalDisclosureSignature }, obtainRecords: { authorized: obtainRecordsAuthorized, injuryDate, signature: obtainRecordsSignature }, healthcareCoord: { authorized: healthcareCoordAuthorized, pcp, specialist, therapy, signature: healthcareCoordSignature }, hipaa: { acknowledged: hipaaAcknowledged, signature: hipaaSignature } };
          await updateIntakeSession(sid, { formData: { consentStep: 2, consents } });
        }
        setStep(2);
      } catch (err: any) {
        setError(err.message || "Failed to save. Please try again.");
      } finally {
        setIsSaving(false);
      }
    } else if (step === 2) {
      // Legal Disclosure (UI step 2 = DB step 3)
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
      setIsSaving(true);
      try {
        await saveConsentStep(sessionId, 2, {
          signature: legalDisclosureSignature,
          attorneyName: attorneyName.trim(),
        });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) {
          const consents = { serviceAgreement: { accepted: serviceAgreementAccepted, signature: serviceAgreementSignature }, legalDisclosure: { authorized: legalDisclosureAuthorized, attorneyName, signature: legalDisclosureSignature }, obtainRecords: { authorized: obtainRecordsAuthorized, injuryDate, signature: obtainRecordsSignature }, healthcareCoord: { authorized: healthcareCoordAuthorized, pcp, specialist, therapy, signature: healthcareCoordSignature }, hipaa: { acknowledged: hipaaAcknowledged, signature: hipaaSignature } };
          await updateIntakeSession(sid, { formData: { consentStep: 3, consents } });
        }
        setStep(3);
      } catch (err: any) {
        setError(err.message || "Failed to save. Please try again.");
      } finally {
        setIsSaving(false);
      }
    } else if (step === 3) {
      // Obtain Records (UI step 3 = DB step 4)
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
      setIsSaving(true);
      try {
        await saveConsentStep(sessionId, 3, {
          signature: obtainRecordsSignature,
          injuryDate,
        });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) {
          const consents = { serviceAgreement: { accepted: serviceAgreementAccepted, signature: serviceAgreementSignature }, legalDisclosure: { authorized: legalDisclosureAuthorized, attorneyName, signature: legalDisclosureSignature }, obtainRecords: { authorized: obtainRecordsAuthorized, injuryDate, signature: obtainRecordsSignature }, healthcareCoord: { authorized: healthcareCoordAuthorized, pcp, specialist, therapy, signature: healthcareCoordSignature }, hipaa: { acknowledged: hipaaAcknowledged, signature: hipaaSignature } };
          await updateIntakeSession(sid, { formData: { consentStep: 4, consents } });
        }
        setStep(4);
      } catch (err: any) {
        setError(err.message || "Failed to save. Please try again.");
      } finally {
        setIsSaving(false);
      }
    } else if (step === 4) {
      // Healthcare Coordination (UI step 4 = DB step 5)
      if (!healthcareCoordAuthorized) {
        setError("Please authorize RCMS to share information with your healthcare providers.");
        return;
      }
      if (!validateSignature(healthcareCoordSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
      setIsSaving(true);
      try {
        await saveConsentStep(sessionId, 4, {
          signature: healthcareCoordSignature,
          pcp: pcp.trim() || null,
          specialist: specialist.trim() || null,
          therapy: therapy.trim() || null,
        });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) {
          const consents = { serviceAgreement: { accepted: serviceAgreementAccepted, signature: serviceAgreementSignature }, legalDisclosure: { authorized: legalDisclosureAuthorized, attorneyName, signature: legalDisclosureSignature }, obtainRecords: { authorized: obtainRecordsAuthorized, injuryDate, signature: obtainRecordsSignature }, healthcareCoord: { authorized: healthcareCoordAuthorized, pcp, specialist, therapy, signature: healthcareCoordSignature }, hipaa: { acknowledged: hipaaAcknowledged, signature: hipaaSignature } };
          await updateIntakeSession(sid, { formData: { consentStep: 5, consents } });
        }
        setStep(5);
      } catch (err: any) {
        setError(err.message || "Failed to save. Please try again.");
      } finally {
        setIsSaving(false);
      }
    } else if (step === 5) {
      // HIPAA Privacy Notice (UI step 5 = DB step 6)
      if (!hipaaAcknowledged) {
        setError("Please acknowledge that you have received and reviewed the Notice of Privacy Practices.");
        return;
      }
      if (!validateSignature(hipaaSignature)) {
        setError("Please enter your full legal name (first and last name) as your signature.");
        return;
      }
      setIsSaving(true);
      try {
        await saveConsentStep(sessionId, 5, {
          signature: hipaaSignature,
        });
        const sid = sessionStorage.getItem("rcms_intake_session_id");
        if (sid) {
          const consents = { serviceAgreement: { accepted: serviceAgreementAccepted, signature: serviceAgreementSignature }, legalDisclosure: { authorized: legalDisclosureAuthorized, attorneyName, signature: legalDisclosureSignature }, obtainRecords: { authorized: obtainRecordsAuthorized, injuryDate, signature: obtainRecordsSignature }, healthcareCoord: { authorized: healthcareCoordAuthorized, pcp, specialist, therapy, signature: healthcareCoordSignature }, hipaa: { acknowledged: hipaaAcknowledged, signature: hipaaSignature } };
          await updateIntakeSession(sid, { formData: { consentStep: 5, consents, consentsComplete: true } });
        }
        
        // Audit: All consents signed (fire and forget - don't block navigation)
        audit({
          action: 'POLICY_ACK',
          actorRole: 'client',
          actorId: 'pre-auth',
          caseId: undefined,
          meta: { session_id: sessionId, intake_session_id: intakeSessionId }
        }).catch(e => console.error('Failed to audit consent signing:', e));
        
        // All steps complete - redirect to intake with attorney info in URL params
        const attorneyParam = selectedAttorneyId || sessionStorage.getItem("rcms_current_attorney_id") || '';
        const codeParam = attorneyCode || sessionStorage.getItem("rcms_attorney_code") || '';
        
        // Clear any previous intake submission flag to prevent reload loop
        sessionStorage.removeItem("rcms_intake_submitted");
        // Mark consents as completed
        sessionStorage.setItem("rcms_consents_completed", "true");
        
        navigate(`/client-intake?attorney_id=${encodeURIComponent(attorneyParam)}&attorney_code=${encodeURIComponent(codeParam)}`);
      } catch (err: any) {
        setError(err.message || "Failed to save. Please try again.");
        setIsSaving(false);
      }
    }
  };

  const progress = step === 0 ? 0 : ((step) / 6) * 100; // 0% for attorney, 16.67% per consent step

  // Show decline message if user declined Service Agreement
  if (showDeclineMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4 flex items-center justify-center">
        <Card className="p-8 max-w-2xl text-gray-900">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-gray-900">
              We're sorry, without agreeing to the Service Agreement, we cannot provide care
              management services. You remain a client of your attorney, but we cannot assist
              with your case. Please contact your attorney if you have questions.
            </AlertDescription>
          </Alert>
          <p className="text-sm text-gray-900">
            Redirecting to home page...
          </p>
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
              {step === 0 ? "Step 1 of 3 (Attorney Selection)" : `Step ${step + 1} of 6 (Consents)`}
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
                  <p className="text-gray-900">I voluntarily request and agree to receive care management services from Reconcile Care Management Services (RCMS). I understand that these services are designed to provide support and navigation for my clinically complex situation.</p>
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
              <div><h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization to Disclose PHI to Legal Counsel</h1></div>
              <div className="space-y-4">
                <div className="space-y-2"><Label className="text-gray-900">Attorney/Firm Name *</Label><Input id="attorney-name" value={attorneyName} onChange={(e) => setAttorneyName(e.target.value)} placeholder="Enter your attorney or firm name" required className="text-gray-900" /></div>
                <div className="flex items-start space-x-2"><Checkbox id="legal-disclosure" checked={legalDisclosureAuthorized} onCheckedChange={(c) => setLegalDisclosureAuthorized(c === true)} /><Label htmlFor="legal-disclosure" className="text-sm cursor-pointer text-gray-900">I authorize RCMS to disclose my PHI to my legal representative as described above</Label></div>
                <div className="space-y-2"><Label className="text-gray-900">Full Legal Name (Signature)</Label><Input value={legalDisclosureSignature} onChange={(e) => setLegalDisclosureSignature(e.target.value)} placeholder="Enter your full legal name" className="text-gray-900" /></div>
                <div className="space-y-2"><Label className="text-gray-900">Date</Label><Input type="text" value={currentDate} readOnly className="bg-muted text-gray-900" /></div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-6">
              <div><h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization to Obtain Protected Health Information</h1></div>
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
              <div><h1 className="text-2xl font-bold text-gray-900 mb-2">Authorization to Disclose for Healthcare Coordination</h1></div>
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
              <div><h1 className="text-2xl font-bold text-gray-900 mb-2">Notice of Privacy Practices</h1></div>
              <div className="border rounded-lg p-4 bg-muted/50 max-h-[400px] overflow-y-auto"><p className="text-sm text-gray-900">This Notice describes how Protected Health Information (PHI) about you may be used and disclosed. Please review carefully.</p></div>
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

          <div className="mt-6 flex justify-end gap-3">
            {step >= 1 && step <= 5 && (
              <Button onClick={handleSaveAndExit} disabled={isSaving || savingExit || countdownExpired} variant="outline" className="min-w-[140px]">
                {savingExit ? "Saving…" : "Save & Exit"}
              </Button>
            )}
            {step === 1 && (
              <Button onClick={handleDecline} disabled={isSaving || countdownExpired} variant="outline" className="min-w-[140px]">I Do Not Agree</Button>
            )}
            <Button
              onClick={handleContinue}
              disabled={isSaving || savingExit || countdownExpired || (step === 0 && !selectedAttorneyId && !validatedAttorneyId)}
              className="min-w-[140px]"
            >
              {isSaving ? "Saving..." : step === 0 ? "Continue" : step === 1 ? "I Agree - Continue" : step === 5 ? "Complete & Continue to Intake" : "Continue"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
