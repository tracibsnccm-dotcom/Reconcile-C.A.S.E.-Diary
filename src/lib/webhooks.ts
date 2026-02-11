import { WEBHOOK_CONFIG } from "@/config/webhooks";
import { Case, Provider } from "@/config/rcms";

export interface ProviderConfirmationPayload {
  caseId: string;
  providerId: string;
  providerName: string;
  specialty: string;
  clientInitials?: string;
  attorneyRef?: string;
  timestamp: string;
  confirmationType: "appointment_confirmed" | "appointment_scheduled" | "appointment_completed";
}

/**
 * Send provider confirmation to external webhook
 * @param payload - Confirmation data to send
 * @returns Promise that resolves when webhook call completes
 */
export async function sendProviderConfirmation(
  payload: ProviderConfirmationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(WEBHOOK_CONFIG.PROVIDER_CONFIRMATION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RCMS-Token": WEBHOOK_CONFIG.SECURITY_TOKEN,
      },
      body: JSON.stringify({
        ...payload,
        source: "RCMS_CARE",
        version: "1.0",
      }),
    });

    // External webhooks may return redirects, so we check for success differently
    if (response.ok || response.redirected) {
      return { success: true };
    }

    return {
      success: false,
      error: `Webhook returned status ${response.status}`,
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper to create confirmation payload from case and provider data
 */
export function createConfirmationPayload(
  caseData: Case,
  provider: Provider,
  confirmationType: ProviderConfirmationPayload["confirmationType"] = "appointment_confirmed"
): ProviderConfirmationPayload {
  return {
    caseId: caseData.id,
    providerId: provider.id,
    providerName: provider.name,
    specialty: provider.specialty,
    clientInitials: caseData.client.displayNameMasked,
    attorneyRef: caseData.client.attyRef,
    timestamp: new Date().toISOString(),
    confirmationType,
  };
}
