/**
 * RN-side client name display helper
 * 
 * Provides a reliable client display name in RN views without schema changes.
 * Uses fallback order:
 * 1. rc_clients.first_name + last_name
 * 2. rc_cases.client_name (if exists)
 * 3. rc_client_intakes.intake_json.identity (first_name, last_name)
 * 4. "Unknown" (last resort)
 */

interface ClientNameSource {
  /** From rc_clients table */
  client_first_name?: string | null;
  client_last_name?: string | null;
  /** From rc_cases table (if exists) */
  client_name?: string | null;
  /** From rc_client_intakes.intake_json */
  intake_json?: {
    identity?: {
      first_name?: string | null;
      last_name?: string | null;
    } | null;
  } | null;
}

/**
 * Get client display name for RN-side components
 * @param caseRow - Case row that may have client fields or joined client data
 * @param intakeRow - Optional intake row with intake_json
 * @returns Client display name
 */
export function getClientDisplayName(
  caseRow: ClientNameSource | null | undefined,
  intakeRow?: { intake_json?: any } | null
): string {
  if (!caseRow) {
    // Try intake_json as fallback
    const intakeIdentity = intakeRow?.intake_json?.identity;
    if (intakeIdentity?.first_name || intakeIdentity?.last_name) {
      return `${intakeIdentity.first_name || ""} ${intakeIdentity.last_name || ""}`.trim() || "Unknown";
    }
    return "Unknown";
  }

  // Priority 1: rc_clients first_name + last_name
  if (caseRow.client_first_name || caseRow.client_last_name) {
    const name = `${caseRow.client_first_name || ""} ${caseRow.client_last_name || ""}`.trim();
    if (name) return name;
  }

  // Priority 2: rc_cases.client_name (if column exists)
  if (caseRow.client_name) {
    return caseRow.client_name;
  }

  // Priority 3: intake_json.identity
  const intakeIdentity = caseRow.intake_json?.identity || intakeRow?.intake_json?.identity;
  if (intakeIdentity?.first_name || intakeIdentity?.last_name) {
    const name = `${intakeIdentity.first_name || ""} ${intakeIdentity.last_name || ""}`.trim();
    if (name) return name;
  }

  // Last resort
  return "Unknown";
}
