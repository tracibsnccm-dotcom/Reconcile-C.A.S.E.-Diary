# Client-Facing Messages Audit

Inventory of all client-facing banners, alerts, and messages for copy and tone normalization.  
**Scope:** Client-only UI. Excludes RN dashboards, attorney portal, intake scoring/branching, DB schema.

---

## a) Unable-to-reach

| File | Component | Exact user-facing text | Trigger | Category |
|------|-----------|------------------------|---------|----------|
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `You indicated we were unable to reach you recently: ${label}.` (label from UNABLE_TO_REACH_LABELS, e.g. "Wrong or changed phone number", "Missed calls / busy", "Prefer email contact", "Inconvenient timing", "Other", "Not applicable / Prefer not to say") | `overlay.unable_to_reach_reason` is set and not `__none__` on Review step | a) Unable-to-reach |
| `src/config/clientMessaging.ts` | (formatUnableToReachBanner) | `You indicated we were unable to reach you recently: ${label}.` | Used by IntakeWizard when client selected a reason in overlay question | a) Unable-to-reach |
| `src/config/overlayQuestions.ts` | (OVERLAY_QUESTIONS) | `If we were unable to reach you recently, what was the main reason?` | Label for overlay select on intake | a) Unable-to-reach |
| `src/pages/ClientPortalSimple.tsx` | ClientPortalSimple | `Action Needed: Review Your Care Plan` (AlertTitle) | Care Plan tab when `unableToReachCarePlan` (isUnableToReach or isParticipationUndetermined on 10-Vs draft) | a) Unable-to-reach |
| `src/pages/ClientPortalSimple.tsx` | ClientPortalSimple | `Your RN Care Manager needs to confirm your participation to proceed. Please send a message to continue.` | Same as above (PARTICIPATION_COPY.unable_to_determine.clientBanner) | a) Unable-to-reach |
| `src/pages/ClientPortalSimple.tsx` | ClientPortalSimple | `Message RN Care Manager` (button) | Same (PARTICIPATION_COPY.unable_to_determine.clientCtaLabel) | a) Unable-to-reach |
| `src/pages/ClientPortalSimple.tsx` | ClientPortalSimple | `Please message your RN Care Manager to review and update your plan.` | Care Plan tab when `unableToReachCarePlan` (card subtitle) | a) Unable-to-reach |

---

## b) Refusal / non-participation

*(None found in client-only intake/consent/resume/status/portal codepaths. Refusal/CPB copy lives in TenVsBuilder — RN; excluded per scope.)*

---

## c) Incomplete intake (pre-submit or pre-submit info)

| File | Component | Exact user-facing text | Trigger | Category |
|------|-----------|------------------------|---------|----------|
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Before you submit` (DialogTitle) | Dialog when Submit clicked and `buildIncompleteSections` returns ≥1 section | c) Incomplete intake |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Some sections are incomplete. You can submit now, or go back and add details.` | Same | c) Incomplete intake |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Go back to complete` (button) | Same | c) Incomplete intake |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Submit anyway` (button) | Same | c) Incomplete intake |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Incident type & date are required.` | Step 0 when `!requiredIncidentOk` | c) Incomplete intake |
| `src/pages/IntakeWizard.tsx` | IntakeWizard (WizardNav blockReason) | `Incident type and date are required.` | `blockReason` when step 0 and `!requiredIncidentOk` | c) Incomplete intake |
| `src/pages/IntakeWizard.tsx` | IntakeWizard (WizardNav blockReason) | `Please complete consent choices in the Sensitive Experiences section` | `blockReason` when step 2 and `sensitiveProgress?.blockNavigation` | c) Incomplete intake |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Please complete the 'Other' condition description before submitting. Go back to **Medical History** (Pre-injury or Post-injury) or **Behavioral Health** (Pre-accident or Post-accident) to describe your condition.` | Review step when "Other" selected for any diagnosis and description empty | c) Incomplete intake |

---

## d) Expired intake window

| File | Component | Exact user-facing text | Trigger | Category |
|------|-----------|------------------------|---------|----------|
| `src/config/clientMessaging.ts` | (INTAKE_WINDOW_EXPIRED) | `Your intake window has expired. Please contact your firm's administrator for continued access.` | 7-day intake window past; ACCESS_BLOCKED appended | d) Expired intake window |
| `src/config/clientMessaging.ts` | (INTAKE_LINK_EXPIRED) | `This intake link has expired. Please contact your firm's administrator for continued access.` | ResumeIntake: INT#+PIN lookup and created_at > 7 days | d) Expired intake window |
| `src/components/IntakeCountdownBanner.tsx` | IntakeCountdownBanner | `Your intake window has expired. Please contact your firm's administrator for continued access.` | `remaining <= 0` from rcms_intake_created_at + 7 days | d) Expired intake window |
| `src/components/IntakeCountdownBanner.tsx` | IntakeCountdownBanner | `Loading intake timer…` | No rcms_intake_id or rcms_intake_created_at in sessionStorage | d) Expired intake window |
| `src/components/IntakeCountdownBanner.tsx` | IntakeCountdownBanner | `You have ${daysPart}${timePart} remaining to complete intake (7-day window).` | Active countdown (e.g. `2d 05:23:41 remaining to complete intake (7-day window).`) | d) Expired intake window |
| `src/components/IntakeWelcome.tsx` | IntakeWelcome | `⚠️ Your intake window has expired. Please contact your firm's administrator for continued access.` | localStorage rcms_expiry_iso in past | d) Expired intake window |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `EXPIRED` (time remaining) | `clientMsRemaining <= 0` in header | d) Expired intake window |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Your intake window has expired. Please contact your firm's administrator for continued access.` | `clientWindowExpired` (7-day window past) in Alert | d) Expired intake window |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | Toast: `Intake Window Expired` / `Your 7-day intake window has expired. Please restart the intake process.` | Submit clicked when `clientWindowExpired` | d) Expired intake window |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Unable to submit yet.` + `Reason: client window expired` (submitError / submitErrorDetail) | Same as above (also in Alert on Review) | d) Expired intake window |
| `src/pages/IntakeWizard.tsx` | IntakeWizard (WizardNav blockReason) | `Your intake window has expired. Please contact your firm's administrator for continued access.` | `countdownExpired` from IntakeCountdownBanner | d) Expired intake window |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `This intake link has expired. Please contact your firm's administrator for continued access.` | INT#+PIN valid but `Date.now() - created > SEVEN_DAYS_MS`; view=expired | d) Expired intake window |
| `src/constants/compliance.ts` | (COMPLIANCE_COPY.attorneyExpired) | `INTAKE EXPIRED – DATA PERMANENTLY DELETED` (title) | ClientPortal: 48h attorney confirmation window passed | d) Expired intake window |
| `src/constants/compliance.ts` | (COMPLIANCE_COPY.attorneyExpired) | `The intake information associated with this individual has expired and has been permanently deleted in accordance with HIPAA data-minimization requirements.` `Deleted information cannot be retrieved. The client must complete the intake process again to proceed.` | Same | d) Expired intake window |
| `src/pages/ClientPortal.tsx` | ClientPortal | (COMPLIANCE_COPY.attorneyExpired.bodyLines as above) + `Restart Intake Process` (button) | `isExpired`: attorney_confirm_deadline_at passed, attorney not attested | d) Expired intake window |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Confirmation Window Expired` (CardTitle) | 48h attorney confirmation passed; status=expired | d) Expired intake window |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `The 48-hour confirmation window has expired. Your attorney did not confirm this intake within the required timeframe.` `<br /><br />` `Please contact your attorney or restart the intake process.` | Same | d) Expired intake window |
| `src/components/ClientPendingAttorneyConfirmation.tsx` | ClientPendingAttorneyConfirmation | `Intake Expired` (CardTitle) | 48h attorney deadline passed; `onExpired` | d) Expired intake window |
| `src/components/ClientPendingAttorneyConfirmation.tsx` | ClientPendingAttorneyConfirmation | `{COMPLIANCE_COPY.expiredCopy}` | Same. **Note:** `expiredCopy` is not defined in `compliance.ts`; would throw at runtime. | d) Expired intake window |
| `src/components/ClientPendingAttorneyConfirmation.tsx` | ClientPendingAttorneyConfirmation | `Restart Intake Process` (button) | Same | d) Expired intake window |

---

## e) Status: Submitted / Pending review

| File | Component | Exact user-facing text | Trigger | Category |
|------|-----------|------------------------|---------|----------|
| `src/config/clientMessaging.ts` | (RESUME_SUBMITTED_STATUS) | `Submitted — Pending attorney review` | ResumeIntake view=status (intake_status=submitted) | e) Status: Submitted / Pending review |
| `src/config/clientMessaging.ts` | (RESUME_SUBMITTED_HELP) | `Your intake has been submitted and is awaiting attorney review. If you need help, please contact your firm's administrator.` | Same | e) Status: Submitted / Pending review |
| `src/config/clientMessaging.ts` | (RESUME_SUBMITTED) | `Your intake has been submitted. You can check status here.` | (resume outcome; used in status view) | e) Status: Submitted / Pending review |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Once your attorney completes their review, you'll be able to sign in to the Client Portal.` | view=status | e) Status: Submitted / Pending review |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Intake Status` (h2) | view=status | e) Status: Submitted / Pending review |
| `src/constants/compliance.ts` | (COMPLIANCE_COPY.clientPendingAttorneyCopy) | `Your attorney has not yet completed their review of this case. While waiting for attorney review, your intake data is protected. However, if your attorney does not complete their review within 48 hours, all intake data will be permanently deleted and you will need to restart the intake process. RCMS is not responsible for delays caused by attorney non-response.` | ClientPortal/ClientPendingAttorneyConfirmation when pending 48h window | e) Status: Submitted / Pending review |
| `src/components/ClientPendingAttorneyConfirmation.tsx` | ClientPendingAttorneyConfirmation | `Pending Attorney Review` (CardTitle) | 48h window not yet passed | e) Status: Submitted / Pending review |
| `src/components/ClientPendingAttorneyConfirmation.tsx` | ClientPendingAttorneyConfirmation | `Time remaining for attorney review:` | Same; above countdown | e) Status: Submitted / Pending review |
| `src/components/ClientPendingAttorneyConfirmation.tsx` | ClientPendingAttorneyConfirmation | `What happens next:` / `Your attorney will be notified to review your intake` / `Once your attorney completes their review, you'll have full access to your client portal` / `If your attorney doesn't complete their review within 48 hours, your intake data will be permanently deleted and you'll need to restart` | Same | e) Status: Submitted / Pending review |
| `src/pages/ClientPortal.tsx` | ClientPortal | `Pending attorney review. If your attorney does not complete their review within 48 hours, intake will be deleted and must be restarted.` | `isPending` (deadline not passed, not attested) | e) Status: Submitted / Pending review |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Pending Attorney Review` (CardTitle) | status=pending | e) Status: Submitted / Pending review |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Your intake has been submitted and is awaiting attorney review.` | Same | e) Status: Submitted / Pending review |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Time remaining for attorney review:` | Same; countdown | e) Status: Submitted / Pending review |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Once your attorney completes their review, you will receive your case number and PIN.` | Same | e) Status: Submitted / Pending review |

---

## f) Help / contact administrator

| File | Component | Exact user-facing text | Trigger | Category |
|------|-----------|------------------------|---------|----------|
| `src/config/clientMessaging.ts` | (ACCESS_BLOCKED) | `Please contact your firm's administrator for continued access.` | Used in INTAKE_WINDOW_EXPIRED, INTAKE_LINK_EXPIRED | f) Help / contact administrator |
| `src/config/clientMessaging.ts` | (RESUME_SUBMITTED_HELP) | `Your intake has been submitted and is awaiting attorney review. If you need help, please contact your firm's administrator.` | ResumeIntake status view | f) Help / contact administrator |
| `src/lib/rcClientsErrorUtils.ts` | (getRcClientsBindingUserMessage) | `Client profile binding conflict detected. Please contact support.` | IntakeWizard submit: rc_clients auth_user_id binding conflict | f) Help / contact administrator |
| `src/pages/ClientConsent.tsx` | ClientConsent | `We're sorry, without agreeing to the Service Agreement, we cannot provide care management services. You remain a client of your attorney, but we cannot assist with your case. Please contact your attorney if you have questions.` | User declined Service Agreement; showDeclineMessage | f) Help / contact administrator |
| `src/pages/ClientLogin.tsx` | ClientLogin | `Account locked until {time}. Please contact your attorney if you need immediate access.` | client-sign-in returns locked_until | f) Help / contact administrator |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Please contact your attorney or restart the intake process.` | status=expired | f) Help / contact administrator |
| `src/pages/ClientPortal.tsx` | ClientPortal | `Please sign in to access the Client Portal.` | No user and no sessionStorage client_case_id | f) Help / contact administrator |
| `src/pages/ClientPortal.tsx` | ClientPortal | `Authentication Required` (h2) | Same | f) Help / contact administrator |
| `src/components/ClientProfile.tsx` | ClientProfile | `We couldn't link your profile to your case yet. Please refresh or contact support.` | ensureClientBindingForCase / rc_clients binding failures | f) Help / contact administrator |
| `src/components/ClientProfile.tsx` | ClientProfile | `Client profile binding conflict detected. Please contact support.` | getRcClientsBindingUserMessage in toast/error | f) Help / contact administrator |

---

## g) Other client alert/error

| File | Component | Exact user-facing text | Trigger | Category |
|------|-----------|------------------------|---------|----------|
| `src/components/ErrorBoundary.tsx` | ErrorBoundary | `Something went wrong` | Any caught render error in app | g) Other client alert/error |
| `src/components/ErrorBoundary.tsx` | ErrorBoundary | `Check console for details.` | Same | g) Other client alert/error |
| `src/components/ErrorBoundary.tsx` | ErrorBoundary | `Error: {error.name}: {error.message}` or `Error: Unknown error` | Same | g) Other client alert/error |
| `src/components/ErrorBoundary.tsx` | ErrorBoundary | `Reload Page` (button) | Same | g) Other client alert/error |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Please enter your Intake ID (INT#).` | INT# empty on submit | g) Other client alert/error |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Please enter your temporary PIN.` | PIN empty on submit | g) Other client alert/error |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Too many attempts. Please refresh the page and try again.` | >5 attempts in one page load | g) Other client alert/error |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `We couldn't find that Intake ID (INT#). Please check and try again.` | getIntakeSessionByIntakeId returns null | g) Other client alert/error |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Incorrect PIN. Please try again.` | TEMP PIN hash mismatch or missing | g) Other client alert/error |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Something went wrong. Please try again.` | catch in handleSubmit | g) Other client alert/error |
| `src/pages/ResumeIntake.tsx` | ResumeIntake | `Your intake is complete. Please sign in to the Client Portal.` (RESUME_CONVERTED) | view=attorney when intake_status=converted | g) Other client alert/error |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `Continue your intake where you left off.` (RESUME_IN_PROGRESS) | `resume=true` and !clientWindowExpired | g) Other client alert/error |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | Toast: `Intake Window Expired` / `Your 7-day intake window has expired. Please restart the intake process.` | clientWindowExpired on submit | g) Other client alert/error |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | Toast: `Validation` / `Incident date is required.` | Missing incident date on submit | g) Other client alert/error |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | Various `setSubmitError`/toast: `Unable to submit yet.` (Reason: missing incident date, failed to generate case_number, intake already submitted, etc.), `Please describe the 'Other'...`, `We couldn't confirm your name details...`, `We couldn't confirm your email...`, `Submission failed. Please try again.`, `Intake submission blocked: missing client identity payload...` | Various submit validation/API failures | g) Other client alert/error |
| `src/pages/IntakeWizard.tsx` | IntakeWizard | `In Case of Emergency:` `If you are experiencing a medical or mental health crisis, please call 911 or the National Suicide Prevention Lifeline at 988 immediately. Do not wait for your RN Care Manager to contact you.` | Always on Review step (Crisis Resources Banner) | g) Other client alert/error |
| `src/pages/ClientConsent.tsx` | ClientConsent | `Failed to save. Please try again.` (from setError) | saveConsentStep or save progress fails | g) Other client alert/error |
| `src/pages/ClientConsent.tsx` | ClientConsent | `Continue your intake where you left off.` (RESUME_IN_PROGRESS) | `resume=true` on Consents | g) Other client alert/error |
| `src/pages/ClientConsent.tsx` | ClientConsent | `Redirecting to home page...` | After decline (showDeclineMessage) | g) Other client alert/error |
| `src/pages/ClientLogin.tsx` | ClientLogin | `Please enter both case number and PIN` | Empty case or PIN on submit | g) Other client alert/error |
| `src/pages/ClientLogin.tsx` | ClientLogin | `Account locked until {time}` | locked_until from client-sign-in | g) Other client alert/error |
| `src/pages/ClientLogin.tsx` | ClientLogin | `Invalid PIN. {n} attempts remaining.` | client-sign-in: attempts_remaining | g) Other client alert/error |
| `src/pages/ClientLogin.tsx` | ClientLogin | `result.error` or `Login failed` | client-sign-in !ok | g) Other client alert/error |
| `src/pages/ClientLogin.tsx` | ClientLogin | `An error occurred during login. Please try again.` | catch in handleSubmit | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Please enter your first name.` | firstName empty on Continue | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Please enter your last name.` | lastName empty | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Please enter a valid email address.` | email empty or no @ | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Create a 6-digit temporary PIN (numbers only).` | tempPin invalid | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `PIN and confirmation do not match.` | tempPin !== tempPinConfirm | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Attorney selection is required. Please go back and select an attorney.` | !attorneyId && !attorneyCode | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Failed to save your information. Please try again.` | createIntakeSession throws | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Before you continue: We need basic contact information so we can save your intake. If you leave before completing this step, your information will not be saved.` | Shown before session created | g) Other client alert/error |
| `src/pages/IntakeIdentity.tsx` | IntakeIdentity | `Your intake has been saved!` | After createIntakeSession success | g) Other client alert/error |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Please enter your Intake ID` | intakeId empty on Check | g) Other client alert/error |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `No intake found with ID: **{intakeId}** Please check your Intake ID and try again.` | No matching rc_client_intakes | g) Other client alert/error |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Your intake has been confirmed by your attorney. You can now access your case portal using the credentials below.` | status=confirmed | g) Other client alert/error |
| `src/pages/CheckIntakeStatus.tsx` | CheckIntakeStatus | `Failed to check intake status` | supabaseGet error or throw | g) Other client alert/error |
| `src/pages/ClientPortal.tsx` | ClientPortal | `Loading...` | checkingAuth or checkingIntake | g) Other client alert/error |
| `src/pages/ClientPortal.tsx` | ClientPortal | `Please complete Client Intake to access the Client Portal.` | intakeCompleted=false | g) Other client alert/error |
| `src/pages/ClientPortal.tsx` | ClientPortal | `Redirecting automatically in a few seconds...` | Same | g) Other client alert/error |
| `src/pages/ClientPortal.tsx` | ClientPortal | `Attorney Confirmation Completed` / `Your attorney confirmed your intake on {date}.` / `You may now proceed.` | isConfirmed | g) Other client alert/error |
| `src/pages/ClientPortal.tsx` | ClientPortal | `No active case found. Please complete intake first.` | VoiceConcernsForm opened with !caseId | g) Other client alert/error |
| `src/pages/ClientPortalSimple.tsx` | ClientPortalSimple | `Loading your portal...` | loading | g) Other client alert/error |
| `src/pages/ClientPortalSimple.tsx` | ClientPortalSimple | `{error}` (e.g. `Case not found`, `Failed to load case information`) | loadCaseData throws | g) Other client alert/error |
| `src/config/clientMessaging.ts` | (SAVE_AND_EXIT_TOAST) | `Saved. You can return anytime within 7 days using your INT# and temporary PIN.` | Save & Exit on intake | g) Other client alert/error |
| `src/config/clientMessaging.ts` | (PAUSE_AND_RESUME_COPY) | `You can pause anytime and come back within 7 days to finish. Your progress saves automatically, and all information is kept private and secure.` | IntakeWelcome | g) Other client alert/error |
| `src/config/clientMessaging.ts` | (RETURN_WITHIN_7_DAYS) | `You can return within 7 days — progress saves automatically.` | IntakeWelcome countdown when no saved expiry | g) Other client alert/error |
| `src/components/IntakeWelcome.tsx` | IntakeWelcome | `Could not reach CARA at this time. Please try again.` | CARA explain API failure | g) Other client alert/error |

---

## Config / constants (referenced by components)

- `src/config/clientMessaging.ts`: INTAKE_WINDOW_DAYS, SAVE_AND_EXIT_RESUME, SAVE_AND_EXIT_TOAST, PAUSE_AND_RESUME_COPY, RETURN_WITHIN_7_DAYS, ACCESS_BLOCKED, INTAKE_WINDOW_EXPIRED, INTAKE_LINK_EXPIRED, COUNTDOWN_ACTIVE_SUFFIX, RESUME_IN_PROGRESS, RESUME_SUBMITTED, RESUME_SUBMITTED_STATUS, RESUME_SUBMITTED_HELP, RESUME_CONVERTED, UNABLE_TO_REACH_LABELS, formatUnableToReachBanner.
- `src/constants/compliance.ts`: COMPLIANCE_COPY.attorneyExpired, clientPendingAttorneyCopy; formatHMS. (`expiredCopy` referenced by ClientPendingAttorneyConfirmation is **not** defined.)
- `src/constants/participationMessaging.ts`: PARTICIPATION_COPY.unable_to_determine (clientBanner, clientCtaLabel).

---

*Inventory complete. No behavior or copy changed. For normalization, prefer `clientMessaging.ts` and `compliance.ts` as single sources of truth where applicable.*
