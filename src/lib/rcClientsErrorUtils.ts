/**
 * Helpers for rc_clients auth_user_id binding conflict errors.
 * When rc_clients.auth_user_id unique constraint is violated (admin-only binding),
 * we show a user-friendly message and non-PHI diagnostic detail.
 * User-facing copy: CLIENT_PROFILE_BINDING_HELP from clientMessaging (premium, legally neutral).
 */

import { CLIENT_PROFILE_BINDING_HELP } from "@/config/clientMessaging";

export function isRcClientsAuthBindingError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("rc_clients_auth_user_id_key") ||
    msg.includes("duplicate key value violates unique constraint")
  );
}

export function getRcClientsBindingUserMessage(): string {
  return CLIENT_PROFILE_BINDING_HELP;
}

/** Non-PHI diagnostic for diagnostics panel / logging. */
export function getRcClientsBindingDiagnosticDetail(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  return [code, msg].filter(Boolean).join(" — ");
}
