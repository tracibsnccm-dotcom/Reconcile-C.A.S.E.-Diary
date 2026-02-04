// pages/ResumeIntake.tsx — Resume intake or check status via INT# + TEMP PIN or ?token=xxx. (Ported from C.A.R.E.)

import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import { IntakeCountdownBanner } from "@/components/intake/IntakeCountdownBanner";
import {
  CLIENT_INTAKE_STATE_MESSAGES,
  type ClientIntakeState,
} from "@/lib/clientIntakeState";
import { INTAKE_WINDOW_DAYS } from "@/config/clientMessaging";

const SEVEN_DAYS_MS = INTAKE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const RATE_LIMIT_ATTEMPTS = 5;

const WRAPPER_CLASS = "min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-sans";
const CARD_CLASS = "bg-slate-800 border border-slate-700 rounded-xl";

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

  // Token-based resume: load session from ?token=xxx on mount and redirect to /intake?resume=TOKEN
  useEffect(() => {
    if (!tokenFromUrl || tokenFromUrl.trim() === "") return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("INTAKE: ResumeIntake token from URL, fetching session");
        const session = await getIntakeSessionByToken(tokenFromUrl.trim());
        if (cancelled) return;

        if (!session) {
          setCanonicalState("EXPIRED_OR_INVALID");
          setLoading(false);
          return;
        }

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

        if (session.intakeStatus === "submitted" || session.intakeStatus === "submitted_pending_attorney") {
          setResolvedIntakeId(session.intakeId);
          setCanonicalState("SUBMITTED_PENDING_REVIEW");
          setLoading(false);
          return;
        }

        // Resumable: set sessionStorage and redirect to C.A.S.E. intake wizard
        setResolvedIntakeId(session.intakeId);
        sessionStorage.setItem("rcms_intake_id", session.intakeId);
        if (session.createdAt) sessionStorage.setItem("rcms_intake_created_at", session.createdAt);
        sessionStorage.setItem("rcms_intake_status", "in_progress");
        sessionStorage.setItem("rcms_intake_session_id", session.id);
        sessionStorage.setItem("rcms_current_attorney_id", session.attorneyId || "");
        if (session.attorneyCode) sessionStorage.setItem("rcms_attorney_code", session.attorneyCode);
        if (session.formData && typeof session.formData === "object") {
          sessionStorage.setItem("rcms_intake_form_data", JSON.stringify(session.formData));
        }
        console.log("INTAKE: ResumeIntake redirecting to /intake?resume=", session.resumeToken?.slice(0, 8) + "...");
        navigate(`/intake?resume=${encodeURIComponent(session.resumeToken)}`, { replace: true });
      } catch (err) {
        if (!cancelled) setCanonicalState("EXPIRED_OR_INVALID");
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

    attemptsRef.current += 1;
    if (attemptsRef.current > RATE_LIMIT_ATTEMPTS) {
      setError("Too many attempts. Please refresh the page and try again.");
      return;
    }

    setLoading(true);
    try {
      console.log("INTAKE: ResumeIntake INT#+PIN lookup");
      const session = await getIntakeSessionByIntakeId(normalized);
      if (!session) {
        setError("We couldn't find that Intake ID (INT#). Please check and try again.");
        setLoading(false);
        return;
      }

      const created = new Date(session.createdAt).getTime();
      if (Date.now() - created > SEVEN_DAYS_MS) {
        setCanonicalState("EXPIRED_OR_INVALID");
        setLoading(false);
        return;
      }

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

      setResolvedIntakeId(session.intakeId);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      if (session.createdAt) sessionStorage.setItem("rcms_intake_created_at", session.createdAt);

      if (session.intakeStatus === "converted") {
        sessionStorage.setItem("rcms_intake_status", "converted");
        setCanonicalState("LOCKED_UNDER_REVIEW");
        setLoading(false);
        return;
      }
      if (session.intakeStatus === "submitted" || session.intakeStatus === "submitted_pending_attorney") {
        sessionStorage.setItem("rcms_intake_status", "submitted_pending_attorney");
        setCanonicalState("SUBMITTED_PENDING_REVIEW");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("rcms_intake_status", "in_progress");
      sessionStorage.setItem("rcms_intake_session_id", session.id);
      sessionStorage.setItem("rcms_current_attorney_id", session.attorneyId || "");
      if (session.attorneyCode) sessionStorage.setItem("rcms_attorney_code", session.attorneyCode);
      if (session.formData && typeof session.formData === "object") {
        sessionStorage.setItem("rcms_intake_form_data", JSON.stringify(session.formData));
      }
      console.log("INTAKE: ResumeIntake INT#+PIN success, redirecting to /intake?resume=");
      navigate(`/intake?resume=${encodeURIComponent(session.resumeToken)}`, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const resetToForm = () => {
    setCanonicalState(null);
    setError(null);
  };

  if (canonicalState && ["SUBMITTED_PENDING_REVIEW", "LOCKED_UNDER_REVIEW", "EXPIRED_OR_INVALID"].includes(canonicalState)) {
    const msg = CLIENT_INTAKE_STATE_MESSAGES[canonicalState];
    return (
      <div className={WRAPPER_CLASS}>
        <IntakeCountdownBanner />
        <div className="flex-1 flex items-center justify-center min-h-screen py-8 px-4">
          <Card className={`${CARD_CLASS} p-8 max-w-2xl w-full space-y-4`}>
            <h2 className="text-xl font-semibold text-white">{msg.title}</h2>
            <p className="text-slate-400">{msg.body}</p>
            {resolvedIntakeId && (
              <p className="text-sm text-slate-400">
                <strong>Intake ID (INT#):</strong> {resolvedIntakeId}
              </p>
            )}
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => navigate("/")} className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent">
                Go Home
              </Button>
              {!tokenFromUrl && (
                <Button variant="outline" onClick={resetToForm} className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  Back
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (tokenFromUrl && loading) {
    return (
      <div className={`${WRAPPER_CLASS} py-8 px-4 flex items-center justify-center min-h-screen`}>
        <Card className={`${CARD_CLASS} p-8 max-w-2xl`}>
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Verifying your intake session…</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${WRAPPER_CLASS} py-8 px-4 flex items-center justify-center min-h-screen`}>
      <Card className={`${CARD_CLASS} p-6 md:p-8 max-w-md w-full`}>
        <h1 className="text-xl font-bold text-white mb-2">Resume or Check Status</h1>
        <p className="text-sm text-slate-400 mb-6">
          Enter your Intake ID (INT#) and temporary PIN to resume an unfinished intake or check your status.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intake-id" className="text-slate-300">Intake ID (INT#)</Label>
            <Input
              id="intake-id"
              value={intakeId}
              onChange={(e) => setIntakeId(e.target.value)}
              placeholder="e.g. INT-250124-01A"
              disabled={loading}
              autoComplete="off"
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-slate-300">Temporary PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="6 digits"
              maxLength={6}
              disabled={loading}
              autoComplete="off"
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            disabled={loading}
          >
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
          <Link to="/intake" className="text-orange-500 hover:underline text-sm font-medium">
            Start New Intake
          </Link>
          <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-slate-400 hover:text-white border-slate-600 bg-transparent">
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
