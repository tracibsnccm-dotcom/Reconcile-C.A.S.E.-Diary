import { useState, useEffect } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

const FRIENDLY_NAME = "Reconcile CARE";

type MfaFactor = { id: string; status?: string };

/**
 * Logs MFA events to rc_security_audit.
 * Table must exist - see migration 20260201120000_rc_security_audit.sql
 */
async function logMfaEvent(
  userId: string,
  eventType: "mfa_enrolled" | "mfa_verified"
): Promise<void> {
  try {
    const userAgent =
      typeof navigator !== "undefined" ? navigator.userAgent : null;
    const { error } = await supabase!.from("rc_security_audit").insert({
      user_id: userId,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      ip_address: null,
      user_agent: userAgent,
    });
    if (error) {
      console.error("[MFAEnrollment] Failed to log audit:", error);
    }
  } catch (e) {
    console.error("[MFAEnrollment] Audit log exception:", e);
  }
}

type FlowState =
  | { kind: "checking" }
  | { kind: "enroll"; enrollData: { factorId: string; qrCode: string; secret: string } }
  | { kind: "verify"; factorId: string }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function MFAEnrollment() {
  const [flowState, setFlowState] = useState<FlowState>({ kind: "checking" });
  const [code, setCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  console.log("[MFA] Render state:", {
    qrCode: flowState.kind === "enroll" ? !!flowState.enrollData.qrCode : false,
    secret: flowState.kind === "enroll" ? flowState.enrollData.secret : undefined,
    factorId:
      flowState.kind === "enroll"
        ? flowState.enrollData.factorId
        : flowState.kind === "verify"
          ? flowState.factorId
          : undefined,
    error: flowState.kind === "error" ? flowState.message : null,
    loading: flowState.kind === "checking",
    existingVerifiedFactor: flowState.kind === "verify",
  });

  useEffect(() => {
    console.log("[MFA] Starting MFA check...");
    if (!supabase || !isSupabaseConfigured()) {
      setFlowState({
        kind: "error",
        message: "Authentication is not configured.",
      });
      return;
    }

    let cancelled = false;

    async function init() {
      setFlowState({ kind: "checking" });
      setCode("");

      try {
        const { data, error: listError } = await supabase!.auth.mfa.listFactors();
        console.log("[MFA] Existing factors:", data);

        if (cancelled) return;

        if (listError) {
          setFlowState({
            kind: "error",
            message: listError.message ?? "Failed to check MFA status.",
          });
          return;
        }

        const totpFactors = (data?.totp ?? []) as MfaFactor[];
        const verifiedFactor = totpFactors.find((f) => f.status === "verified");
        const unverifiedFactor = totpFactors.find(
          (f) => f.status === "unverified"
        );

        if (verifiedFactor) {
          setFlowState({ kind: "verify", factorId: verifiedFactor.id });
          return;
        }

        if (unverifiedFactor) {
          let enrollData: { factorId: string; qrCode: string; secret: string } | null =
            null;

          console.log("[MFA] Calling enroll...");
          const { data: enrollResult, error: enrollError } =
            await supabase!.auth.mfa.enroll({
              factorType: "totp",
              friendlyName: FRIENDLY_NAME,
            });

          if (cancelled) return;

          if (enrollError) {
            const msg = (enrollError.message ?? "").toLowerCase();
            const factorExists =
              msg.includes("factor") ||
              msg.includes("already") ||
              msg.includes("exists");

            if (factorExists) {
              const { error: unenrollError } =
                await supabase!.auth.mfa.unenroll({
                  factorId: unverifiedFactor.id,
                });

              if (cancelled) return;

              if (unenrollError) {
                setFlowState({
                  kind: "error",
                  message:
                    unenrollError.message ??
                    "Could not remove previous MFA setup. Please try again.",
                });
                return;
              }

              console.log("[MFA] Calling enroll... (retry after unenroll)");
              const { data: retryResult, error: retryError } =
                await supabase!.auth.mfa.enroll({
                  factorType: "totp",
                  friendlyName: FRIENDLY_NAME,
                });

              if (cancelled) return;

              if (retryError) {
                console.log("[MFA] Enroll error:", retryError);
                setFlowState({
                  kind: "error",
                  message:
                    retryError.message ?? "Failed to start MFA enrollment.",
                });
                return;
              }

              console.log("[MFA] Enroll success:", retryResult);
              console.log("[MFA] QR Code URI:", retryResult?.totp?.qr_code);
              console.log("[MFA] Secret:", retryResult?.totp?.secret);
              const totp = retryResult?.totp as
                | { qr_code?: string; secret?: string }
                | undefined;
              const factorId = retryResult?.id;

              if (!factorId || !totp?.qr_code || !totp?.secret) {
                setFlowState({
                  kind: "error",
                  message: "Invalid enrollment response. Please try again.",
                });
                return;
              }

              enrollData = {
                factorId,
                qrCode: totp.qr_code,
                secret: totp.secret,
              };
              console.log("[MFA] Setting qrCode state to:", enrollData.qrCode);
            } else {
              setFlowState({
                kind: "error",
                message: enrollError.message ?? "Failed to start MFA enrollment.",
              });
              return;
            }
          } else {
            console.log("[MFA] Enroll success:", enrollResult);
            console.log("[MFA] QR Code URI:", enrollResult?.totp?.qr_code);
            console.log("[MFA] Secret:", enrollResult?.totp?.secret);
            const totp = enrollResult?.totp as
              | { qr_code?: string; secret?: string }
              | undefined;
            const factorId = enrollResult?.id;

            if (!factorId || !totp?.qr_code || !totp?.secret) {
              setFlowState({
                kind: "error",
                message: "Invalid enrollment response. Please try again.",
              });
              return;
            }

            enrollData = {
              factorId,
              qrCode: totp.qr_code,
              secret: totp.secret,
            };
            console.log("[MFA] Setting qrCode state to:", enrollData.qrCode);
          }

          if (enrollData) {
            setFlowState({ kind: "enroll", enrollData });
          }
          return;
        }

        const { data: enrollResult, error: enrollError } =
          await supabase!.auth.mfa.enroll({
            factorType: "totp",
            friendlyName: FRIENDLY_NAME,
          });

        if (cancelled) return;

        if (enrollError) {
          setFlowState({
            kind: "error",
            message:
              enrollError.message ?? "Failed to start MFA enrollment.",
          });
          return;
        }

        const totp = enrollResult?.totp as
          | { qr_code?: string; secret?: string }
          | undefined;
        const factorId = enrollResult?.id;

        if (!factorId || !totp?.qr_code || !totp?.secret) {
          setFlowState({
            kind: "error",
            message: "Invalid enrollment response. Please try again.",
          });
          return;
        }

        console.log("[MFA] Setting qrCode state to:", totp.qr_code);
        setFlowState({
          kind: "enroll",
          enrollData: {
            factorId,
            qrCode: totp.qr_code,
            secret: totp.secret,
          },
        });
      } catch (e) {
        if (!cancelled) {
          setFlowState({
            kind: "error",
            message: e instanceof Error ? e.message : "An error occurred.",
          });
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleVerifyEnrollment() {
    if (flowState.kind !== "enroll" || !supabase || !code.trim()) return;

    setVerifyLoading(true);
    setFormError(null);

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: flowState.enrollData.factorId,
        });

      if (challengeError) {
        setFormError(
          challengeError.message ?? "Failed to create verification challenge."
        );
        setVerifyLoading(false);
        return;
      }

      const challengeId = challengeData?.id;
      if (!challengeId) {
        setFormError("Invalid challenge response. Please try again.");
        setVerifyLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: flowState.enrollData.factorId,
        challengeId,
        code: code.trim(),
      });

      if (verifyError) {
        setFormError(
          verifyError.message ??
            "Verification failed. Please check the code and try again."
        );
        setVerifyLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await logMfaEvent(user.id, "mfa_enrolled");
      }

      setFlowState({ kind: "success" });
      window.location.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "An error occurred.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleVerifyExisting() {
    if (flowState.kind !== "verify" || !supabase || !code.trim()) return;

    setVerifyLoading(true);
    setFormError(null);

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: flowState.factorId,
        });

      if (challengeError) {
        setFormError(
          challengeError.message ?? "Failed to create verification challenge."
        );
        setVerifyLoading(false);
        return;
      }

      const challengeId = challengeData?.id;
      if (!challengeId) {
        setFormError("Invalid challenge response. Please try again.");
        setVerifyLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: flowState.factorId,
        challengeId,
        code: code.trim(),
      });

      if (verifyError) {
        setFormError(
          verifyError.message ??
            "Verification failed. Please check the code and try again."
        );
        setVerifyLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        await logMfaEvent(user.id, "mfa_verified");
      }

      setFlowState({ kind: "success" });
      window.location.reload();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "An error occurred.");
    } finally {
      setVerifyLoading(false);
    }
  }

  if (flowState.kind === "success") {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="text-lg font-semibold">MFA Enabled</h2>
            </div>
            <p className="text-muted-foreground">
              Multi-factor authentication has been successfully enabled.
              Refreshing...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flowState.kind === "checking") {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Setting up MFA...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flowState.kind === "error") {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{flowState.message}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flowState.kind === "verify") {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Verify Multi-Factor Authentication</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app to complete
              sign-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="mfa-code">
                Enter the 6-digit code from your authenticator app
              </Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={verifyLoading}
                className="font-mono text-lg tracking-widest"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleVerifyExisting}
              disabled={verifyLoading || code.length !== 6}
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flowState.kind === "enroll") {
    const { enrollData } = flowState;
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Set Up Multi-Factor Authentication</CardTitle>
            <CardDescription>
              Scan the QR code with an authenticator app, or enter the secret
              manually. Then enter the 6-digit code to verify.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Scan this QR code with an authenticator app (Google Authenticator,
              Authy, Microsoft Authenticator, or similar).
            </p>

            {enrollData.qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img
                  src={enrollData.qrCode}
                  alt="MFA QR code"
                  className="w-48 h-48"
                />
              </div>
            )}

            {enrollData.secret && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Or enter this secret manually
                </Label>
                <p className="text-sm font-mono bg-muted px-3 py-2 rounded-md break-all">
                  {enrollData.secret}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="mfa-code">Verification code</Label>
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={verifyLoading}
                className="font-mono text-lg tracking-widest"
              />
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            <Button
              className="w-full"
              onClick={handleVerifyEnrollment}
              disabled={verifyLoading || code.length !== 6}
            >
              {verifyLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Enable MFA"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
