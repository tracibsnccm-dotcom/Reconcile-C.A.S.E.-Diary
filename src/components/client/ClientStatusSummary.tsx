/**
 * ClientStatusSummary — Read-only status banner for Client Portal (CLIENT-3.1).
 * Displays ONE calm status message derived from intake/case state.
 * No CTAs, no deadlines, no urgency language.
 */

import { Info } from "lucide-react";

export type ClientStatusMessage =
  | "INTAKE_IN_PROGRESS"
  | "SUBMITTED_PENDING_REVIEW"
  | "UNDER_REVIEW"
  | "RELEASED"
  | "CLOSED"
  | "NO_ACTION_REQUIRED";

/** Canonical status messages — calm, explanatory, single line. */
const STATUS_MESSAGES: Record<ClientStatusMessage, string> = {
  INTAKE_IN_PROGRESS:
    "Your intake is in progress. You may continue where you left off.",
  SUBMITTED_PENDING_REVIEW:
    "Your intake has been submitted and is awaiting attorney review.",
  UNDER_REVIEW:
    "Your case is currently under review. No action is required from you.",
  RELEASED:
    "Your care plan has been released. If you have questions, contact your care manager.",
  CLOSED:
    "This case is closed. If you need assistance, contact your attorney's office.",
  NO_ACTION_REQUIRED:
    "There is nothing you need to do right now.",
};

/**
 * Derives a single status from rc_cases.case_status (canonical mapping).
 * Use existing case_status values; do not invent new logic.
 */
export function deriveStatusFromCaseStatus(
  caseStatus: string | null | undefined
): ClientStatusMessage {
  const s = (caseStatus ?? "").toLowerCase();
  if (s === "intake_pending") return "SUBMITTED_PENDING_REVIEW";
  if (
    ["attorney_confirmed", "assigned_to_rn", "active"].includes(s)
  )
    return "UNDER_REVIEW";
  if (s === "released") return "RELEASED";
  if (s === "closed") return "CLOSED";
  if (["draft", "working", "revised", "ready"].includes(s))
    return "NO_ACTION_REQUIRED";
  return "NO_ACTION_REQUIRED";
}

interface ClientStatusSummaryProps {
  /** rc_cases.case_status — used to derive the displayed message */
  caseStatus?: string | null;
  /** Optional: override with explicit status (e.g. from intake when available) */
  statusOverride?: ClientStatusMessage | null;
}

export function ClientStatusSummary({
  caseStatus,
  statusOverride,
}: ClientStatusSummaryProps) {
  const status: ClientStatusMessage =
    statusOverride ?? deriveStatusFromCaseStatus(caseStatus);
  const message = STATUS_MESSAGES[status];

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200 text-slate-700"
      role="status"
      aria-live="polite"
    >
      <Info className="w-4 h-4 flex-shrink-0 text-slate-500" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
