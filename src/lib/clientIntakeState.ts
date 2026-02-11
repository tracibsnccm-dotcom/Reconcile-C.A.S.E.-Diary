/**
 * Canonical client intake state resolver and message map.
 * Use across ResumeIntake, ClientPortal, and any intake-related banners
 * to ensure consistent plain-English messaging and exactly one state at a time.
 */

export type ClientIntakeState =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "SUBMITTED_PENDING_REVIEW"
  | "LOCKED_UNDER_REVIEW"
  | "EXPIRED_OR_INVALID";

export interface ResolveClientIntakeStateInput {
  hasStarted?: boolean;
  isSubmitted?: boolean;
  isLocked?: boolean;
  tokenInvalidOrExpired?: boolean;
}

/**
 * Maps "what we know" into a single canonical intake state.
 * Priority order: expired/invalid > locked > submitted > in_progress > not_started.
 */
export function resolveClientIntakeState(
  input: ResolveClientIntakeStateInput
): ClientIntakeState {
  const {
    hasStarted = false,
    isSubmitted = false,
    isLocked = false,
    tokenInvalidOrExpired = false,
  } = input;

  if (tokenInvalidOrExpired) return "EXPIRED_OR_INVALID";
  if (isLocked) return "LOCKED_UNDER_REVIEW";
  if (isSubmitted) return "SUBMITTED_PENDING_REVIEW";
  if (hasStarted) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export interface ClientIntakeStateMessage {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaAction?: () => void;
}

/** Canonical message map — use exactly; no scary language. */
export const CLIENT_INTAKE_STATE_MESSAGES: Record<
  ClientIntakeState,
  ClientIntakeStateMessage
> = {
  NOT_STARTED: {
    title: "Start your intake",
    body: "You'll answer a short series of questions so your attorney can review your case.",
    ctaLabel: "Start your intake",
  },
  IN_PROGRESS: {
    title: "Resume your intake",
    body: "You can continue where you left off. Your progress has been saved.",
    ctaLabel: "Resume your intake",
  },
  SUBMITTED_PENDING_REVIEW: {
    title: "Submitted — Pending attorney review",
    body: "Your intake has been submitted. Your attorney is reviewing your information.",
  },
  LOCKED_UNDER_REVIEW: {
    title: "Intake locked",
    body: "Your intake is locked while your attorney completes their review.",
  },
  EXPIRED_OR_INVALID: {
    title: "Intake session expired",
    body: "Your intake session has expired. Please contact your attorney's office for next steps.",
  },
};
