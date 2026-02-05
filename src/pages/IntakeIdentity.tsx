// src/pages/IntakeIdentity.tsx
// Dedicated page for collecting Minimum Intake Identity (first name, last name, email)
// This page creates the INT intake session BEFORE consents

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle2, Copy, X } from "lucide-react";
import { createIntakeSession, updateIntakeSession, hashTempPin } from "@/lib/intakeSessionService";
import { supabase } from "@/integrations/supabase/client";

export default function IntakeIdentity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get attorney info from URL params (set by ClientConsent step 0)
  const attorneyIdParam = searchParams.get("attorney_id") || "";
  const attorneyCodeParam = searchParams.get("attorney_code") || "";

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfInjury, setDateOfInjury] = useState("");
  const [tempPin, setTempPin] = useState("");
  const [tempPinConfirm, setTempPinConfirm] = useState("");
  
  // Session state
  const [intakeId, setIntakeId] = useState<string>("");
  const [createdIntakeSessionId, setCreatedIntakeSessionId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [intakeSessionCreated, setIntakeSessionCreated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);

  // Load existing session if returning
  useEffect(() => {
    const storedIntakeId = sessionStorage.getItem("rcms_intake_id");
    const storedSessionId = sessionStorage.getItem("rcms_intake_session_id");
    const storedCreatedAt = sessionStorage.getItem("rcms_intake_created_at");
    
    if (storedIntakeId && storedIntakeId.startsWith("INT-")) {
      setIntakeId(storedIntakeId);
      setCreatedIntakeSessionId(storedSessionId || "");
      setCreatedAt(storedCreatedAt || "");
      setIntakeSessionCreated(true);
      setShowSuccessCard(true);
    }
  }, []);

  // Guard: require attorney selection before creating new session
  useEffect(() => {
    if (intakeSessionCreated) return;
    if (attorneyIdParam || attorneyCodeParam.trim()) return;
    navigate("/client-consent?attorney_required=1", { replace: true });
  }, [intakeSessionCreated, attorneyIdParam, attorneyCodeParam, navigate]);

  // Validate form (temp PIN required when creating new session; 6 digits)
  const pinValid = /^\d{6}$/.test(tempPin) && tempPin === tempPinConfirm;
  const isValid = firstName.trim() && lastName.trim() && email.trim() && email.includes("@");
  const isValidWithPin = isValid && (intakeSessionCreated || pinValid);

  const handleCopyIntakeId = async () => {
    if (intakeId) {
      try {
        await navigator.clipboard.writeText(intakeId);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

  const handleContinue = async () => {
    // If session already created, navigate to consents
    if (intakeSessionCreated) {
      navigate("/client-consent");
      return;
    }

    setError(null);

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    // Temp PIN required when creating new session (6 digits, must match)
    if (!intakeSessionCreated) {
      if (!/^\d{6}$/.test(tempPin)) {
        setError("Create a 6-digit temporary PIN (numbers only).");
        return;
      }
      if (tempPin !== tempPinConfirm) {
        setError("PIN and confirmation do not match.");
        return;
      }
    }

    // Resolve attorney via get_attorney_directory only (no rc_users)
    let resolvedAttorneyId = attorneyIdParam || undefined;
    let resolvedAttorneyCode = attorneyCodeParam.trim() || undefined;
    if (supabase && (resolvedAttorneyId || resolvedAttorneyCode)) {
      const { data } = await supabase.rpc("get_attorney_directory");
      const attorneys = Array.isArray(data) ? data : data ? [data] : [];
      if (resolvedAttorneyId) {
        const exists = attorneys.some((a: { attorney_id?: string }) => a.attorney_id === resolvedAttorneyId);
        if (!exists) {
          setError("Attorney selection is required. Please go back and select your attorney.");
          return;
        }
      } else if (resolvedAttorneyCode) {
        const codeNorm = resolvedAttorneyCode.toLowerCase();
        const match = attorneys.find(
          (a: { attorney_code?: string | null }) =>
            a.attorney_code && String(a.attorney_code).trim().toLowerCase() === codeNorm
        );
        if (match) {
          resolvedAttorneyId = (match as { attorney_id: string }).attorney_id;
        } else {
          setError("Attorney selection is required. Please go back and select your attorney.");
          return;
        }
      }
    }
    if (!resolvedAttorneyId && !resolvedAttorneyCode) {
      setError("Attorney selection is required. Please go back and select your attorney.");
      return;
    }

    setIsSaving(true);
    try {
      // Create or upsert INT intake session (persist attorney_id to rc_client_intake_sessions)
      const session = await createIntakeSession({
        attorneyId: resolvedAttorneyId,
        attorneyCode: resolvedAttorneyCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
      });

      setIntakeId(session.intakeId);
      setCreatedIntakeSessionId(session.id);
      setCreatedAt(session.createdAt);
      setIntakeSessionCreated(true);
      setShowSuccessCard(true);

      // Store session ID and intake ID in sessionStorage
      sessionStorage.setItem("rcms_intake_session_id", session.id);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      sessionStorage.setItem("rcms_resume_token", session.resumeToken);
      sessionStorage.setItem("rcms_current_attorney_id", resolvedAttorneyId || session.attorneyId || "");
      sessionStorage.setItem("rcms_attorney_code", resolvedAttorneyCode || session.attorneyCode || "");
      // Anchor: set only if missing so it is never overwritten on subsequent loads
      const existing = sessionStorage.getItem("rcms_intake_created_at");
      if (!existing) {
        sessionStorage.setItem("rcms_intake_created_at", session.createdAt || new Date().toISOString());
      }
      // Store client info for fallback in IntakeWizard
      sessionStorage.setItem("rcms_client_first_name", session.firstName || "");
      sessionStorage.setItem("rcms_client_last_name", session.lastName || "");
      sessionStorage.setItem("rcms_client_email", session.email || "");
      // Store date of injury for later use
      if (dateOfInjury) {
        sessionStorage.setItem("rcms_date_of_injury", dateOfInjury);
      }

      // Store temp PIN hash in form_data (for resume/status via INT# + PIN only; no email links)
      if (tempPin && /^\d{6}$/.test(tempPin)) {
        const tempPinHash = await hashTempPin(tempPin, session.intakeId);
        await updateIntakeSession(session.id, { formData: { tempPinHash } });
      }
    } catch (err: any) {
      setError(err.message || "Failed to save your information. Please try again.");
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Basic Contact Information
              </h1>
              <p className="text-sm text-black">
                We need basic contact information so we can save your intake.
              </p>
            </div>

            {/* BEFORE message - only show if session not created */}
            {!intakeSessionCreated && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Before you continue:</strong> We need basic contact information so we can save your intake.
                  If you leave before completing this step, your information will not be saved.
                </AlertDescription>
              </Alert>
            )}

            {/* Persistent Success Card - shown after session creation */}
            {showSuccessCard && intakeSessionCreated && intakeId && (
              <Card className="bg-green-50 border-green-200 border-2">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-green-900 mb-2">
                          Your intake has been saved!
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-green-800">
                              <strong>Intake ID:</strong>
                            </span>
                            <span className="font-mono font-bold text-green-900 bg-green-100 px-2 py-1 rounded">
                              {intakeId}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyIntakeId}
                              className="h-7 text-xs"
                            >
                              {copied ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy ID
                                </>
                              )}
                            </Button>
                          </div>
                          {createdAt && (
                            <p className="text-xs text-green-700">
                              Created: {new Date(createdAt).toLocaleString()}
                            </p>
                          )}
                          <p className="text-sm text-green-800">
                            You can leave and return anytime using your Intake ID and temporary PIN.
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuccessCard(false)}
                      className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                  disabled={intakeSessionCreated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                  disabled={intakeSessionCreated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={intakeSessionCreated}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-of-injury">
                  Date of Injury / Date of Loss
                </Label>
                <Input
                  id="date-of-injury"
                  type="date"
                  value={dateOfInjury}
                  onChange={(e) => setDateOfInjury(e.target.value)}
                  placeholder="Select date of injury"
                  disabled={intakeSessionCreated}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {!intakeSessionCreated && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="temp-pin">
                      Create a temporary PIN <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="temp-pin"
                      type="password"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={tempPin}
                      onChange={(e) => setTempPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="6 digits"
                    />
                    <p className="text-xs text-black">
                      Use this with your Intake ID to resume or check status. 6 digits only.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temp-pin-confirm">Confirm PIN</Label>
                    <Input
                      id="temp-pin-confirm"
                      type="password"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={tempPinConfirm}
                      onChange={(e) => setTempPinConfirm(e.target.value.replace(/\D/g, ""))}
                      placeholder="6 digits"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              {intakeSessionCreated && (
                <Button
                  variant="outline"
                  onClick={() => setShowSuccessCard(true)}
                  disabled={showSuccessCard}
                >
                  Show Details
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSaving}
              >
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isSaving || (!isValidWithPin && !intakeSessionCreated)}
                className="min-w-[140px]"
              >
                {isSaving
                  ? "Saving..."
                  : intakeSessionCreated
                  ? "Continue to Consents"
                  : "Continue"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
