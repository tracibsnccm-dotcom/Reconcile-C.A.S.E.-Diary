// Frontend utility for sending emails via API route (when available)

interface SendIntakeResumeEmailParams {
  to: string;
  intNumber: string;
  resumeUrl: string;
  baseUrl?: string;
}

interface SendCaseCredentialsEmailParams {
  to: string;
  caseId: string;
  clientPin: string;
  clientLoginUrl: string;
  baseUrl?: string;
}

/**
 * Send intake resume email to client when they save and exit
 */
export async function sendIntakeResumeEmail(params: SendIntakeResumeEmailParams): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "intake-resume",
        to: params.to,
        intNumber: params.intNumber,
        resumeUrl: params.resumeUrl,
        baseUrl: params.baseUrl || (typeof window !== "undefined" ? window.location.origin : ""),
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    const result = await response.json();
    return { ok: result.ok || false };
  } catch (error: unknown) {
    console.error("[sendIntakeResumeEmail] Error:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to send email" };
  }
}

/**
 * Send case credentials email to client after attorney attestation
 */
export async function sendCaseCredentialsEmail(params: SendCaseCredentialsEmailParams): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "case-credentials",
        to: params.to,
        caseId: params.caseId,
        clientPin: params.clientPin,
        clientLoginUrl: params.clientLoginUrl,
        baseUrl: params.baseUrl || (typeof window !== "undefined" ? window.location.origin : ""),
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    const result = await response.json();
    return { ok: result.ok || false };
  } catch (error: unknown) {
    console.error("[sendCaseCredentialsEmail] Error:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to send email" };
  }
}
