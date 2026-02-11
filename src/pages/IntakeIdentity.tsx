// src/pages/IntakeIdentity.tsx
// C.A.S.E.: Minimum Intake Identity (attorney, first name, last name, PIN). No email here — email is collected later in the intake wizard.
// This page creates the INT intake session BEFORE consents. Client uses INT# + PIN to resume/check status.

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Info, CheckCircle2, Copy } from "lucide-react";
import { createIntakeSession, updateIntakeSession, hashTempPin } from "@/lib/intakeSessionService";
import { supabase } from "@/integrations/supabase/client";

type AttorneyOption = { attorney_id: string; attorney_name: string; attorney_code?: string | null };

export default function IntakeIdentity() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const attorneyIdParam = searchParams.get("attorney_id") || "";
  const attorneyCodeParam = searchParams.get("attorney_code") || "";

  const [availableAttorneys, setAvailableAttorneys] = useState<AttorneyOption[]>([]);
  const [selectedAttorneyId, setSelectedAttorneyId] = useState(attorneyIdParam);
  const [attorneyCode, setAttorneyCode] = useState(attorneyCodeParam);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tempPin, setTempPin] = useState("");
  const [tempPinConfirm, setTempPinConfirm] = useState("");

  const [intakeId, setIntakeId] = useState<string>("");
  const [createdIntakeSessionId, setCreatedIntakeSessionId] = useState<string>("");
  const [createdAt, setCreatedAt] = useState<string>("");
  const [intakeSessionCreated, setIntakeSessionCreated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const storedIntakeId = sessionStorage.getItem("rcms_intake_id");
    const storedSessionId = sessionStorage.getItem("rcms_intake_session_id");
    const storedCreatedAt = sessionStorage.getItem("rcms_intake_created_at");

    if (storedIntakeId && storedIntakeId.startsWith("INT-")) {
      setIntakeId(storedIntakeId);
      setCreatedIntakeSessionId(storedSessionId || "");
      setCreatedAt(storedCreatedAt || "");
      setIntakeSessionCreated(true);
    }
  }, []);

  useEffect(() => {
    if (!attorneyIdParam && !attorneyCodeParam) return;
    setSelectedAttorneyId((prev) => prev || attorneyIdParam);
    setAttorneyCode((prev) => prev || attorneyCodeParam);
  }, [attorneyIdParam, attorneyCodeParam]);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      const { data } = await supabase.rpc("get_attorney_directory");
      const list = Array.isArray(data) ? data : data ? [data] : [];
      setAvailableAttorneys(list);
    };
    load();
  }, []);

  useEffect(() => {
    if (intakeSessionCreated) return;
    const hasAttorney = selectedAttorneyId || attorneyCode.trim();
    if (hasAttorney) return;
    navigate("/client-consent?attorney_required=1", { replace: true });
  }, [intakeSessionCreated, selectedAttorneyId, attorneyCode, navigate]);

  const pinValid = /^\d{6}$/.test(tempPin) && tempPin === tempPinConfirm;
  const hasAttorney = !!(selectedAttorneyId || attorneyCode.trim());
  const isValid = hasAttorney && firstName.trim() && lastName.trim() && (intakeSessionCreated || pinValid);

  const handleCopyIntakeId = async () => {
    if (!intakeId) return;
    try {
      await navigator.clipboard.writeText(intakeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const resolveAttorney = async (): Promise<{ attorneyId?: string; attorneyCode?: string } | null> => {
    const resolvedId = selectedAttorneyId || undefined;
    const resolvedCode = attorneyCode.trim() || undefined;
    if (!supabase || (!resolvedId && !resolvedCode)) return { attorneyId: resolvedId, attorneyCode: resolvedCode };
    const { data } = await supabase.rpc("get_attorney_directory");
    const attorneys = Array.isArray(data) ? data : data ? [data] : [];
    if (resolvedId) {
      const exists = attorneys.some((a: { attorney_id?: string }) => a.attorney_id === resolvedId);
      if (!exists) return null;
      return { attorneyId: resolvedId, attorneyCode: resolvedCode };
    }
    const codeNorm = resolvedCode!.toLowerCase();
    const match = attorneys.find(
      (a: { attorney_code?: string | null }) =>
        a.attorney_code && String(a.attorney_code).trim().toLowerCase() === codeNorm
    );
    if (!match) return null;
    return { attorneyId: (match as { attorney_id: string }).attorney_id, attorneyCode: resolvedCode };
  };

  const handleSubmit = async () => {
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
    if (!/^\d{6}$/.test(tempPin)) {
      setError("Create a 6-digit PIN (numbers only).");
      return;
    }
    if (tempPin !== tempPinConfirm) {
      setError("PIN and confirmation do not match.");
      return;
    }

    const resolved = await resolveAttorney();
    if (!resolved || (!resolved.attorneyId && !resolved.attorneyCode)) {
      setError("Please select your attorney or enter a valid attorney code.");
      return;
    }

    setIsSaving(true);
    try {
      const session = await createIntakeSession({
        attorneyId: resolved.attorneyId,
        attorneyCode: resolved.attorneyCode,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        // C.A.S.E.: no email; session lookup is INT# + PIN
      });

      setIntakeId(session.intakeId);
      setCreatedIntakeSessionId(session.id);
      setCreatedAt(session.createdAt || "");
      setIntakeSessionCreated(true);

      sessionStorage.setItem("rcms_intake_session_id", session.id);
      sessionStorage.setItem("rcms_intake_id", session.intakeId);
      sessionStorage.setItem("rcms_resume_token", session.resumeToken);
      sessionStorage.setItem("rcms_current_attorney_id", resolved.attorneyId || session.attorneyId || "");
      sessionStorage.setItem("rcms_attorney_code", resolved.attorneyCode || session.attorneyCode || "");
      const existing = sessionStorage.getItem("rcms_intake_created_at");
      if (!existing) {
        sessionStorage.setItem("rcms_intake_created_at", session.createdAt || new Date().toISOString());
      }
      sessionStorage.setItem("rcms_client_first_name", session.firstName || "");
      sessionStorage.setItem("rcms_client_last_name", session.lastName || "");
      sessionStorage.setItem("rcms_client_email", session.email || "");

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

  // INT# confirmation screen after submit
  if (intakeSessionCreated && intakeId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 md:p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">Your Intake ID (INT#)</h1>
                  <p className="text-sm text-muted-foreground mb-4">
                    Save your Intake ID (INT#) and PIN. You will need these to resume your intake, check your status, and access the system.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="font-mono font-bold text-lg bg-muted px-3 py-2 rounded">
                      {intakeId}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleCopyIntakeId}>
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  {createdAt && (
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(createdAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => navigate("/client-consent")} className="min-w-[140px]">
                  Continue
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-secondary-light to-primary py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Basic Contact Information
              </h1>
              <p className="text-sm text-muted-foreground">
                We need basic information to create your intake. You will use your Intake ID (INT#) and PIN to resume and check status.
              </p>
            </div>

            {!intakeSessionCreated && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>Before you continue:</strong> Complete this step so we can save your intake. If you leave before finishing, your information will not be saved.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Your Attorney</Label>
                <Select
                  value={selectedAttorneyId}
                  onValueChange={(val) => {
                    setSelectedAttorneyId(val);
                    setAttorneyCode("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your attorney..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAttorneys.map((a) => (
                      <SelectItem key={a.attorney_id} value={a.attorney_id}>
                        {a.attorney_name}
                        {a.attorney_code ? ` (${a.attorney_code})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="attorney-code">Attorney code</Label>
                <Input
                  id="attorney-code"
                  value={attorneyCode}
                  onChange={(e) => {
                    setAttorneyCode(e.target.value);
                    setSelectedAttorneyId("");
                  }}
                  placeholder="e.g., 01, 02"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="first-name">
                  First name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last-name">
                  Last name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="temp-pin">
                  6-digit PIN <span className="text-destructive">*</span>
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
                <p className="text-xs text-muted-foreground">
                  Use with your Intake ID to resume or check status. 6 digits only.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temp-pin-confirm">
                  Confirm PIN <span className="text-destructive">*</span>
                </Label>
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
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={isSaving}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSaving || !isValid}
                className="min-w-[140px]"
              >
                {isSaving ? "Saving..." : "Continue"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
