/**
 * Client-facing banner and status copy — single source of truth.
 * Use these strings across ClientConsent, IntakeWizard, ResumeIntake, and
 * shared intake components. Do NOT invent new billing or policy copy beyond this.
 */

export const INTAKE_WINDOW_DAYS = 7;

/** Save & Exit / resume: "You can return anytime within 7 days using your INT# and temporary PIN." */
export const SAVE_AND_EXIT_RESUME =
  "You can return anytime within 7 days using your INT# and temporary PIN.";

/** Full Save & Exit toast (when a single string): "Saved. " + SAVE_AND_EXIT_RESUME */
export const SAVE_AND_EXIT_TOAST = `Saved. ${SAVE_AND_EXIT_RESUME}`;

/** Pause-and-resume guidance: "You can pause anytime and come back within 7 days to finish. Your progress saves automatically, and all information is kept private and secure." */
export const PAUSE_AND_RESUME_COPY =
  "You can pause anytime and come back within 7 days to finish. Your progress saves automatically, and all information is kept private and secure.";

/** Short 7-day reminder: "You can return within 7 days — progress saves automatically." */
export const RETURN_WITHIN_7_DAYS =
  "You can return within 7 days — progress saves automatically.";

/** Intake window expired — premium, legally neutral. Attorney-directed. */
export const INTAKE_WINDOW_EXPIRED =
  "Your intake window has expired. Please contact your attorney's office for assistance.";

/** Intake link expired (e.g. ResumeIntake). For your privacy, attorney-directed. */
export const INTAKE_LINK_EXPIRED =
  "For your privacy, intake links expire after a limited time. Please contact your attorney's office for a new link.";

/** Suffix for countdown active: " remaining to complete intake (7-day window)." */
export const COUNTDOWN_ACTIVE_SUFFIX =
  " remaining to complete intake (7-day window).";

// --- Resume outcomes ---

/** in_progress: "Continue your intake where you left off." */
export const RESUME_IN_PROGRESS = "Continue your intake where you left off.";

/** submitted (status-only): "Your intake has been submitted. You can check status here." */
export const RESUME_SUBMITTED =
  "Your intake has been submitted. You can check status here.";

/** submitted — status line: "Submitted — Pending attorney review" */
export const RESUME_SUBMITTED_STATUS = "Submitted — Pending attorney review";

/** submitted — help: intake status context; attorney-directed. */
export const RESUME_SUBMITTED_HELP =
  "Your intake has been submitted and is awaiting attorney review. If you need help, please contact your attorney's office for assistance.";

/** converted: "Your intake is complete. Please sign in to the Client Portal." */
export const RESUME_CONVERTED =
  "Your intake is complete. Please sign in to the Client Portal.";

// --- Help / support (premium, legally neutral; no "administrator" client-facing) ---

/** Sign-in gate title — calm, non-punitive. */
export const SIGN_IN_REQUIRED_TITLE = "Sign in to continue";

/** Sign-in gate body for Client Portal. */
export const SIGN_IN_REQUIRED_BODY = "Please sign in to access the Client Portal.";

/** Generic help/access (A): cannot access from this screen. Ambiguous -> attorney-directed. */
export const CANNOT_ACCESS_ACCOUNT =
  "We can't access your account from this screen. Please try again, or contact your attorney's office for assistance.";

/** Access blocked (B): account not available from this screen. Ambiguous -> attorney-directed. */
export const ACCESS_BLOCKED_FULL =
  "This account is not available from this screen. If you believe this is an error, please contact your attorney's office for assistance.";

/** Not authorized (C): can't complete request. Ambiguous -> attorney-directed. */
export const NOT_AUTHORIZED =
  "We can't complete that request. Please contact your attorney's office for assistance.";

/** Profile binding conflict — use for getRcClientsBindingUserMessage. Ambiguous -> attorney-directed. */
export const CLIENT_PROFILE_BINDING_HELP =
  "We couldn't link your profile to your case yet. Please contact your attorney's office for assistance.";

/** Profile/case linking failed with refresh option (ensureClientBinding, fetch failures). Ambiguous -> attorney-directed. */
export const CLIENT_PROFILE_BINDING_REFRESH =
  "We couldn't link your profile to your case yet. Please refresh or contact your attorney's office for assistance.";

/** Account locked (ClientLogin): suffix when locked_until is set. Ambiguous -> attorney-directed. */
export const ACCOUNT_LOCKED_SUFFIX =
  "If you believe this is an error, please contact your attorney's office for assistance.";

/** 48h confirmation expired (CheckIntakeStatus): next step. Attorney-directed. */
export const EXPIRED_CONFIRMATION_NEXT =
  "Please contact your attorney's office or restart the intake process.";

/** Intake required before portal (ClientPortal gate). Attorney-directed. */
export const INTAKE_REQUIRED_BODY =
  "Please complete Client Intake to access the Client Portal. If you need help, please contact your attorney's office for assistance.";

/** No active case (e.g. VoiceConcernsForm without caseId). Ambiguous -> attorney-directed. */
export const NO_ACTIVE_CASE =
  "No active case found. Please complete intake first. If you believe this is an error, please contact your attorney's office for assistance.";

/** Toast title when intake window expired on submit. */
export const INTAKE_WINDOW_EXPIRED_TOAST_TITLE = "Intake Window Expired";

/** Consent/access blocked banner title — softer than "Access Blocked". */
export const CONSENT_BLOCKED_TITLE = "Unable to continue";

// --- Unable to reach (overlay.unable_to_reach_reason) — display only; no new RN logic ---

/** Labels for overlay.unable_to_reach_reason. Keys must match overlayQuestions options. */
export const UNABLE_TO_REACH_LABELS: Record<string, string> = {
  __none__: "Not applicable / Prefer not to say",
  wrong_number: "Wrong or changed phone number",
  no_answer: "Missed calls / busy",
  email_better: "Prefer email contact",
  timing: "Inconvenient timing",
  other: "Other",
};

/** Banner when overlay.unable_to_reach_reason is set and not __none__. (label) => string */
export function formatUnableToReachBanner(label: string): string {
  return `You indicated we were unable to reach you recently: ${label}.`;
}
