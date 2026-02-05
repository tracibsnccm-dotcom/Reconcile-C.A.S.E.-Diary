// src/pages/IntakeIdentity.tsx
// Dedicated page for collecting Minimum Intake Identity (first name, last name, attorney, date of injury, PIN)
// This page creates the INT intake session BEFORE consents. ALL fields required — hard gate.

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle2, Copy, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createIntakeSession, updateIntakeSession, hashTempPin } from "@/lib/intakeSessionService";
import { supabase } from "@/integrations/supabase/client";

export default function IntakeIdentity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Attorney info from URL params (pre-populate when coming from ClientConsent)
  const attorneyIdParam = searchParams.get("attorney_id") || "";
  const attorneyCodeParam = searchParams.get("attorney_code") || "";

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfInjury, setDateOfInjury] = useState("");
  const [approximateDate, setApproximateDate] = useState(false);
  const [tempPin, setTempPin] = useState("");
  const [tempPinConfirm, setTempPinConfirm] = useState("");

  // Attorney state
  const [attorneys, setAttorneys] = useState<any[]>([]);
  const [selectedAttorneyId, setSelectedAttorneyId] = useState("");
  const [attorneyCode, setAttorneyCode] = useState("");

  // Session state
  const [intakeId, setIntakeId] = useState<string>("");
  const [createdIntakeSessionId, setCreatedIntakeSessionId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [intakeSessionCreated, setIntakeSessionCreated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Fetch attorneys on mount
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data } = await supabase.rpc("get_attorney_directory");
      const list = Array.isArray(data) ? data : data ? [data] : [];
      setAttorneys(list);
    })();
  }, []);

  // Pre-populate attorney from URL params
  useEffect(() => {
    if (attorneyIdParam && attorneys.length > 0) {
      const exists = attorneys.some(
        (a: { attorney_id?: string }) => a.attorney_id === attorneyIdParam
      );
      if (exists) {
        setSelectedAttorneyId(attorneyIdParam);
        setAttorneyCode("");
      }
    } else if (attorneyCodeParam.trim() && attorneys.length > 0) {
      const codeNorm = attorneyCodeParam.trim().toLowerCase();
      const match = attorneys.find(
        (a: { attorney_code?: string | null }) =>
          a.attorney_code && String(a.attorney_code).trim().toLowerCase() === codeNorm
      );
      if (match) {
        setSelectedAttorneyId((match as { attorney_id: string }).attorney_id);
        setAttorneyCode(attorneyCodeParam.trim());
      }
    }
  }, [attorneyIdParam, attorneyCodeParam, attorneys]);

  // Validate attorney code when user types and resolve to attorney
  useEffect(() => {
    if (!attorneyCode.trim() || attorneys.length === 0) return;
    const codeNorm = attorneyCode.trim().toLowerCase();
    const match = attorneys.find(
      (a: { attorney_code?: string | null }) =>
        a.attorney_code && String(a.attorney_code).trim().toLowerCase() === codeNorm
    );
    if (match) {
      setSelectedAttorneyId((match as { attorney_id: string }).attorney_id);
    } else {
      setSelectedAttorneyId("");
    }
  }, [attorneyCode, attorneys]);

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

  // Validation
  const pinValid = /^\d{6}$/.test(tempPin) && tempPin === tempPinConfirm;
  const attorneyResolved = !!selectedAttorneyId;
  const isValid =
    firstName.trim() &&
    lastName.trim() &&
    attorneyResolved &&
    dateOfInjury.trim() &&
    pinValid;
  const isValidWithPin = isValid;
  const submitting = isSaving;

  const showFieldError = (field: string) => {
    if (!attemptedSubmit) return false;
    switch (field) {
      case "firstName":
        return !firstName.trim();
      case "lastName":
        return !lastName.trim();
      case "attorney":
        return !attorneyResolved;
      case "dateOfInjury":
        return !dateOfInjury.trim();
      case "tempPin":
        return !/^\d{6}$/.test(tempPin);
      case "tempPinConfirm":
        return tempPin !== tempPinConfirm || !tempPinConfirm;
      default:
        return false;
    }
  };

  const handleCopyIntakeId = async () => {
    if (intakeId) {
      try {
        await navigator.clipboard.writeText(intakeId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy to clipboard:", err);
      }
    }
  };

  const handleContinue = async () => {
    if (intakeSessionCreated) {
      navigate("/client-consent");
      return;
    }

    setError(null);
    setAttemptedSubmit(true);

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }
    if (!attorneyResolved) {
      setError("Please select your attorney from the dropdown or enter a valid attorney code.");
      return;
    }
    if (!dateOfInjury.trim()) {
      setError("Please enter the date of injury.");
      return;
    }
    if (!/^\d{6}$/.test(tempPin)) {
      setError("Create a 6-digit temporary PIN (numbers only).");
      return;
    }
    if (tempPin !== tempPinConfirm) {
      setError("PIN and confirmation do not match.");
      return;
    }

    const selectedAttorney = attorneys.find(
      (a: { attorney_id?: string }) => a.attorney_id === selectedAttorneyId
    );
    const attorneyName = (selectedAttorney as { attorney_name?: string })?.attorney_name || "";

    setIsSaving(true);
    try {
      const session = await createIntakeSession({
        attorneyId: selectedAttorneyId,
        attorneyCode: attorneyCode.trim() || undefined,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: "",
      });

      setIntakeId(session.intakeId);
      setCreatedIntakeSessionId(session.id);
      setCreatedAt(session.createdAt);
      setIntakeSessionCreated(true);
      setShowSuccessCard(true);

      sessionStorage.setItem("rcms_intake_session_id", session.id);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      sessionStorage.setItem("rcms_resume_token", session.resumeToken);
      sessionStorage.setItem("rcms_current_attorney_id", selectedAttorneyId);
      sessionStorage.setItem("rcms_attorney_name", attorneyName);
      sessionStorage.setItem("rcms_client_first_name", firstName.trim());
      sessionStorage.setItem("rcms_client_last_name", lastName.trim());
      sessionStorage.setItem("rcms_client_email", "");
      sessionStorage.setItem("rcms_date_of_injury", dateOfInjury);
      sessionStorage.setItem("rcms_date_approximate", approximateDate ? "true" : "false");

      const existing = sessionStorage.getItem("rcms_intake_created_at");
      if (!existing) {
        sessionStorage.setItem("rcms_intake_created_at", session.createdAt || new Date().toISOString());
      }

      if (tempPin && /^\d{6}$/.test(tempPin)) {
        const tempPinHash = await hashTempPin(tempPin, session.intakeId);
        await updateIntakeSession(session.id, { formData: { tempPinHash } });
      }
    } catch (err: any) {
      setError(err.message || "Failed to save your information. Please try again.");
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
                We need basic contact information so we can save your intake. All fields are required.
              </p>
            </div>

            {!intakeSessionCreated && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Before you continue:</strong> We need basic contact information so we can save your intake.
                  If you leave before completing this step, your information will not be saved.
                </AlertDescription>
              </Alert>
            )}

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

            <div className="space-y-4">
              {/* First Name */}
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
                  className={showFieldError("firstName") ? "border-destructive border-2" : ""}
                />
              </div>

              {/* Last Name */}
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
                  className={showFieldError("lastName") ? "border-destructive border-2" : ""}
                />
              </div>

              {/* Attorney */}
              <div className="space-y-2">
                <Label>
                  Attorney <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedAttorneyId}
                  onValueChange={(val) => {
                    setSelectedAttorneyId(val);
                    setAttorneyCode("");
                  }}
                  disabled={intakeSessionCreated}
                >
                  <SelectTrigger
                    className={showFieldError("attorney") ? "border-destructive border-2" : ""}
                  >
                    <SelectValue placeholder="Choose your attorney..." />
                  </SelectTrigger>
                  <SelectContent>
                    {attorneys.map((a: { attorney_id: string; attorney_name?: string }) => (
                      <SelectItem key={a.attorney_id} value={a.attorney_id}>
                        {a.attorney_name || a.attorney_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Label htmlFor="attorney-code" className="text-sm font-normal text-black">
                    Or enter your attorney&apos;s code
                  </Label>
                  <Input
                    id="attorney-code"
                    value={attorneyCode}
                    onChange={(e) => setAttorneyCode(e.target.value)}
                    placeholder="e.g. ABC123"
                    disabled={intakeSessionCreated}
                  />
                </div>
              </div>

              {/* Date of Injury */}
              <div className="space-y-2">
                <Label htmlFor="date-of-injury">
                  Date of Injury <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="date-of-injury"
                  type="date"
                  value={dateOfInjury}
                  onChange={(e) => setDateOfInjury(e.target.value)}
                  placeholder="Select date of injury"
                  disabled={intakeSessionCreated}
                  max={new Date().toISOString().split("T")[0]}
                  className={showFieldError("dateOfInjury") ? "border-destructive border-2" : ""}
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="approximate-date"
                    checked={approximateDate}
                    onChange={(e) => setApproximateDate(e.target.checked)}
                    className="h-4 w-4 border-2 border-gray-600 rounded accent-blue-900"
                  />
                  <label htmlFor="approximate-date" className="text-sm text-black">
                    I&apos;m not sure of the exact date (approximate is okay)
                  </label>
                </div>
              </div>

              {!intakeSessionCreated && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="temp-pin">
                      Create PIN <span className="text-destructive">*</span>
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
                      className={showFieldError("tempPin") ? "border-destructive border-2" : ""}
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
                      className={showFieldError("tempPinConfirm") ? "border-destructive border-2" : ""}
                    />
                  </div>
                </>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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
              <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
                Back
              </Button>
              <Button
                onClick={handleContinue}
                disabled={!isValidWithPin || submitting}
                className="min-w-[140px]"
              >
                {submitting
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
