/**
 * RN-only: Maps internal case_status values to RN-friendly labels for pills/badges.
 * Do NOT change stored values or enums. Used only for RN-facing display.
 *
 * Note: "Pending" in RN Work Queue (e.g. "Pending Cases") is a queue bucket name
 * (no initial care plan, 24h SLA), not a case_status. These labels map case_status only.
 */

const RN_STATUS_LABELS: Record<string, string> = {
  attorney_confirmed: "Ready for RN intake",
  intake_pending: "Awaiting RN intake",
  assigned_to_rn: "Assigned to RN",
  active: "Active care",
  released: "Released to attorney",
  closed: "Case closed",
};

export function rnStatusLabel(status: string | null | undefined): string {
  if (status == null || status === "") return "";
  const s = String(status).toLowerCase();
  return RN_STATUS_LABELS[s] ?? status;
}
