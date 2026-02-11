/**
 * Helpers for case declined/refused flag.
 * Priority: rc_cases.flags (JSON) > rn_status > status.
 * Used to block RN document uploads and gate UI when client has declined services.
 */

export type CaseRow = {
  flags?: unknown;
  rn_status?: string | null;
  status?: string | null;
  case_status?: string | null;
};

/** Returns true if case is declined per priority rule. */
export function isCaseDeclined(row: CaseRow | null | undefined): boolean {
  if (!row) return false;
  if (row.flags != null && typeof row.flags === 'object' && !Array.isArray(row.flags)) {
    const f = row.flags as Record<string, unknown>;
    return f.service_declined === true;
  }
  if (row.rn_status != null) return String(row.rn_status).toLowerCase() === 'declined';
  if (row.status != null) return String(row.status).toLowerCase() === 'declined';
  if (row.case_status != null) return String(row.case_status).toLowerCase() === 'declined';
  return false;
}
