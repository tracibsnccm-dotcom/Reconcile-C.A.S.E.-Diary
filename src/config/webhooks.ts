// Webhook Configuration for Provider Confirmations
// External webhook integration for RCMS Journal tracking

export const WEBHOOK_CONFIG = {
  // External webhook URL (if needed for provider confirmations)
  PROVIDER_CONFIRMATION_URL: import.meta.env.VITE_PROVIDER_CONFIRMATION_URL || "",
  
  // Security token for webhook authentication
  SECURITY_TOKEN: import.meta.env.VITE_WEBHOOK_SECURITY_TOKEN || "",
} as const;
