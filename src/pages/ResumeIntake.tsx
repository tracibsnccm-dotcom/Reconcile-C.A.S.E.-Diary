// src/pages/ResumeIntake.tsx
// Pre-attestation gateway: resume intake or check status via INT# + TEMP PIN or ?token=xxx.

import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import {
  getIntakeSessionByIntakeId,
  getIntakeSessionByToken,
  hashTempPin,
} from "@/lib/intakeSessionService";
import { IntakeCountdownBanner } from "@/components/IntakeCountdownBanner";
import {
  CLIENT_INTAKE_STATE_MESSAGES,
  type ClientIntakeState,
} from "@/lib/clientIntakeState";
import { INTAKE_WINDOW_DAYS } from "@/config/clientMessaging";

const SEVEN_DAYS_MS = INTAKE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const RATE_LIMIT_ATTEMPTS = 5;

export default function ResumeIntake() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const [intakeId, setIntakeId] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canonicalState, setCanonicalState] = useState<ClientIntakeState | null>(null);
  const [resolvedIntakeId, setResolvedIntakeId] = useState("");
  const attemptsRef = useRef(0);

  // Token-based resume: attempt to load session from ?token=xxx on mount
  useEffect(() => {
    if (!tokenFromUrl || tokenFromUrl.trim() === "") return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const session = await getIntakeSessionByToken(tokenFromUrl.trim());
        if (cancelled) return;

        if (!session) {
          setCanonicalState("EXPIRED_OR_INVALID");
          setLoading(false);
          return;
        }

        // 7-day window from created_at
        const created = new Date(session.createdAt).getTime();
        if (Date.now() - created > SEVEN_DAYS_MS) {
          setCanonicalState("EXPIRED_OR_INVALID");
          setLoading(false);
          return;
        }

        if (session.intakeStatus === "converted") {
          setResolvedIntakeId(session.intakeId);
          setCanonicalState("LOCKED_UNDER_REVIEW");
          setLoading(false);
          return;
        }

        if (session.intakeStatus === "submitted") {
          setResolvedIntakeId(session.intakeId);
          setCanonicalState("SUBMITTED_PENDING_REVIEW");
          setLoading(false);
          return;
        }

        // Resumable: hydrate sessionStorage and route to correct step
        setResolvedIntakeId(session.intakeId);
        sessionStorage.setItem("rcms_intake_id", session.intakeId);
        if (session.createdAt) {
          sessionStorage.setItem("rcms_intake_created_at", session.createdAt);
        }
        sessionStorage.setItem("rcms_intake_status", "in_progress");
        sessionStorage.setItem("rcms_intake_session_id", session.id);
        sessionStorage.setItem("rcms_current_attorney_id", session.attorneyId || "");
        if (session.attorneyCode) sessionStorage.setItem("rcms_attorney_code", session.attorneyCode);
        if (session.formData && typeof session.formData === "object") {
          sessionStorage.setItem("rcms_intake_form_data", JSON.stringify(session.formData));
        }

        const fd = session.formData && typeof session.formData === "object" ? session.formData : {};
        // Consents complete if explicitly set, or if HIPAA (step 5) was signed
        const consentsComplete =
          fd.consentsComplete === true ||
          (fd.consentStep === 5 && !!fd.consents?.hipaa?.signature) ||
          (fd.consentStep === 5 && !!fd.consents?.hipaa?.acknowledged);

        const attorneyParam = session.attorneyId || "";
        const codeParam = session.attorneyCode || "";

        if (consentsComplete) {
          // Go directly to /client-intake at saved step — do NOT send to consent
          const savedStep = Math.min(7, Math.max(0, session.currentStep ?? fd.step ?? 0));
          sessionStorage.setItem("rcms_intake_step", String(savedStep));
          sessionStorage.setItem("rcms_consents_completed", "true");
          navigate(
            `/client-intake?attorney_id=${encodeURIComponent(attorneyParam)}&attorney_code=${encodeURIComponent(codeParam)}&resume=true`
          );
        } else {
          sessionStorage.setItem("rcms_intake_step", "0");
          sessionStorage.setItem("rcms_consent_step", String(fd.consentStep ?? 0));
          navigate(`/client-consent?resume=true`);
        }
      } catch (err) {
        if (!cancelled) {
          setCanonicalState("EXPIRED_OR_INVALID");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tokenFromUrl, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = (intakeId || "").trim().toUpperCase();
    if (!normalized) {
      setError("Please enter your Intake ID (INT#).");
      return;
    }
    if (!(pin || "").trim()) {
      setError("Please enter your temporary PIN.");
      return;
    }

    // In-memory rate limit: 5 attempts per page load
    attemptsRef.current += 1;
    if (attemptsRef.current > RATE_LIMIT_ATTEMPTS) {
      setError("Too many attempts. Please refresh the page and try again.");
      return;
    }

    setLoading(true);
    try {
      const session = await getIntakeSessionByIntakeId(normalized);
      if (!session) {
        setError("We couldn't find that Intake ID (INT#). Please check and try again.");
        setLoading(false);
        return;
      }

      // 7-day window from created_at
      const created = new Date(session.createdAt).getTime();
      if (Date.now() - created > SEVEN_DAYS_MS) {
        setCanonicalState("EXPIRED_OR_INVALID");
        setLoading(false);
        return;
      }

      // Verify TEMP PIN: compare hash with stored tempPinHash
      const storedHash = (session.formData as any)?.tempPinHash;
      if (!storedHash) {
        setError("Incorrect PIN. Please try again.");
        setLoading(false);
        return;
      }
      const inputHash = await hashTempPin(pin, session.intakeId);
      if (inputHash !== storedHash) {
        setError("Incorrect PIN. Please try again.");
        setLoading(false);
        return;
      }

      // Success
      setResolvedIntakeId(session.intakeId);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      if (session.createdAt) {
        const existing = sessionStorage.getItem("rcms_intake_created_at");
        const dbMs = new Date(session.createdAt).getTime();
        if (!existing) {
          sessionStorage.setItem("rcms_intake_created_at", session.createdAt);
        } else {
          const existingMs = new Date(existing).getTime();
          if (Math.abs(existingMs - dbMs) > 5000) {
            sessionStorage.setItem("rcms_intake_created_at", session.createdAt);
          }
        }
      }

      if (session.intakeStatus === "converted") {
        sessionStorage.setItem("rcms_intake_status", "converted");
        setCanonicalState("LOCKED_UNDER_REVIEW");
        setLoading(false);
        return;
      }
      if (session.intakeStatus === "submitted") {
        sessionStorage.setItem("rcms_intake_status", "submitted_pending_attorney");
        setCanonicalState("SUBMITTED_PENDING_REVIEW");
        setLoading(false);
        return;
      }

      // in_progress: resume to consents or intake wizard based on stored progress
      sessionStorage.setItem("rcms_intake_status", "in_progress");
      const fd = (session.formData && typeof session.formData === "object") ? session.formData : {};
      // Consents complete if explicitly set, or if HIPAA (step 5) was signed
      const consentsComplete =
        fd.consentsComplete === true ||
        (fd.consentStep === 5 && !!fd.consents?.hipaa?.signature) ||
        (fd.consentStep === 5 && !!fd.consents?.hipaa?.acknowledged);

      sessionStorage.setItem("rcms_intake_session_id", session.id);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      sessionStorage.setItem("rcms_current_attorney_id", session.attorneyId || "");
      if (session.attorneyCode) sessionStorage.setItem("rcms_attorney_code", session.attorneyCode);
      if (session.formData && typeof session.formData === "object") {
        sessionStorage.setItem("rcms_intake_form_data", JSON.stringify(session.formData));
      }

      const attorneyParam = session.attorneyId || "";
      const codeParam = session.attorneyCode || "";

      if (consentsComplete) {
        // Go directly to /client-intake at saved step — do NOT send to consent
        const savedStep = Math.min(7, Math.max(0, session.currentStep ?? fd.step ?? 0));
        sessionStorage.setItem("rcms_intake_step", String(savedStep));
        sessionStorage.setItem("rcms_consents_completed", "true");
        navigate(
          `/client-intake?attorney_id=${encodeURIComponent(attorneyParam)}&attorney_code=${encodeURIComponent(codeParam)}&resume=true`
        );
      } else {
        sessionStorage.setItem("rcms_intake_step", "0");
        sessionStorage.setItem("rcms_consent_step", String(fd.consentStep ?? 0));
        navigate(`/client-consent?resume=true`);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const resetToForm = () => {
    setCanonicalState(null);
    setError(null);
  };

  // Canonical state screens: SUBMITTED_PENDING_REVIEW, LOCKED_UNDER_REVIEW, EXPIRED_OR_INVALID
  if (canonicalState && ["SUBMITTED_PENDING_REVIEW", "LOCKED_UNDER_REVIEW", "EXPIRED_OR_INVALID"].includes(canonicalState)) {
    const msg = CLIENT_INTAKE_STATE_MESSAGES[canonicalState];
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] py-8 px-4 flex flex-col items-center text-white">
        <IntakeCountdownBanner />
        <div className="flex-1 flex items-center justify-center w-full">
          <Card className="bg-white rounded-lg shadow-lg p-8 max-w-2xl space-y-4 text-gray-900">
            <h2 className="text-xl font-semibold">{msg.title}</h2>
            <p className="text-gray-700">{msg.body}</p>
            {resolvedIntakeId && (
              <p className="text-sm text-gray-700">
                <strong>Intake ID (INT#):</strong> <span className="font-mono font-bold text-black">{resolvedIntakeId}</span>
              </p>
            )}
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => navigate("/")}>Go Home</Button>
              {!tokenFromUrl && (
                <Button variant="outline" onClick={resetToForm}>Back</Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Token loading in progress
  if (tokenFromUrl && loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] py-8 px-4 flex items-center justify-center text-white">
        <Card className="bg-white rounded-lg shadow-lg p-8 max-w-2xl text-gray-900">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Verifying your intake session…</span>
          </div>
        </Card>
      </div>
    );
  }

  // Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] py-8 px-4 flex items-center justify-center text-white">
      <Card className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-md w-full text-gray-900">
        <h1 className="text-xl font-bold mb-2">Resume or Check Status</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your Intake ID (INT#) and temporary PIN to resume an unfinished intake or check your status.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intake-id">Intake ID (INT#)</Label>
            <Input
              id="intake-id"
              value={intakeId}
              onChange={(e) => setIntakeId(e.target.value)}
              placeholder="e.g. INT-250124-01A"
              disabled={loading}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin">Temporary PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="6 digits"
              maxLength={6}
              disabled={loading}
              autoComplete="off"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
        <div className="mt-6 flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/client-consent")}>
            Start New Intake
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
