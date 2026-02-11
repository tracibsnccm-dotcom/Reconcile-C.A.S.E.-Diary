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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

type MfaFactor = { id: string; status?: string };

/**
 * Logs MFA events to rc_security_audit.
 */
async function logMfaEvent(
  userId: string,
  eventType: "mfa_verified"
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
      console.error("[MFAChallenge] Failed to log audit:", error);
    }
  } catch (e) {
    console.error("[MFAChallenge] Audit log exception:", e);
  }
}

type FlowState =
  | { kind: "loading" }
  | { kind: "ready"; factorId: string }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * MFA verification challenge for users who have enrolled MFA but have not
 * completed the MFA step in this session (session is AAL1, needs AAL2).
 */
export function MFAChallenge() {
  const [flowState, setFlowState] = useState<FlowState>({ kind: "loading" });
  const [code, setCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured()) {
      setFlowState({
        kind: "error",
        message: "Authentication is not configured.",
      });
      return;
    }

    let cancelled = false;

    async function init() {
      setFlowState({ kind: "loading" });
      setCode("");

      try {
        const { data, error: listError } = await supabase!.auth.mfa.listFactors();

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

        if (verifiedFactor) {
          setFlowState({ kind: "ready", factorId: verifiedFactor.id });
        } else {
          setFlowState({
            kind: "error",
            message: "No verified MFA factor found. Please contact support.",
          });
        }
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

  async function handleVerify() {
    if (flowState.kind !== "ready" || !supabase || !code.trim()) return;

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
            <p className="text-muted-foreground">
              MFA verified successfully. Refreshing...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (flowState.kind === "loading") {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading...</p>
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
              <AlertDescription>{flowState.message}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            onClick={handleVerify}
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
