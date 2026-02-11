# Client Intake Flow Map — C.A.S.E.

Precise map of client intake: entry routes, step structure, navigation, persistence, security signals, and submit behavior. All paths and names are from the codebase.

---

## 1) Intake entry route(s)

| URL path | Component | File that registers route |
|----------|-----------|----------------------------|
| `/client-consent` | `ClientConsent` | `src/main.tsx` (inside `<Routes>`, no AuthProvider) |
| `/intake-identity` | `IntakeIdentity` | `src/main.tsx` |
| `/client-intake` | `IntakeWizard` | `src/main.tsx` |
| `/resume-intake` | `ResumeIntake` | `src/main.tsx` |
| `/check-status` | `CheckIntakeStatus` | `src/main.tsx` |

**Route registration snippet** (`src/main.tsx`):

```tsx
<Route path="/client-consent" element={<ClientConsent />} />
<Route path="/intake-identity" element={<IntakeIdentity />} />
<Route path="/client-intake" element={<IntakeWizard />} />
<Route path="/resume-intake" element={<ResumeIntake />} />
<Route path="/check-status" element={<CheckIntakeStatus />} />
```

**How users reach intake**

- **Start new intake:** Index links to `/client-consent` (“Start Intake”). `src/pages/Index.tsx`: `<a href="/client-consent" className="rcms-btn cta-intake">Start Intake</a>`.
- **Resume / check status:** Index and ClientConsent link to `/resume-intake` (“Resume / Check Status”).
- **Email resume link:** `src/lib/intakeEmailService.ts` builds `resumeUrl = ${baseUrl}/resume-intake?token=${params.resumeToken}` (resume token = session `resume_token`).

---

## 2) Intake step structure

**Pre-wizard (separate pages)**

| Order | Route / location | File | Component / screen |
|-------|-------------------|------|---------------------|
| 0 | `/client-consent` | `src/pages/ClientConsent.tsx` | Attorney selection (step 0) then consent steps 1–5 |
| 1 | `/intake-identity` | `src/pages/IntakeIdentity.tsx` | Minimum identity (attorney, first name, last name, PIN); creates INT session |
| 2 | `/client-consent` (after identity) | `src/pages/ClientConsent.tsx` | Consent steps 1–5 (Service Agreement → HIPAA) |
| 3 | `/client-intake` | `src/pages/IntakeWizard.tsx` | `IntakeWizard` (5 steps) |

**IntakeWizard steps (single route `/client-intake`)**

Steps are 0‑indexed; `step` state and `Stepper` labels are defined in `IntakeWizard.tsx`.

| Step index | Stepper label | Section / content | Main UI in file |
|------------|----------------|-------------------|------------------|
| 0 | Incident | Incident Details (type, date, treatment, injuries, narrative, contact email) | `step === 0` block, ~2064–2190 |
| 1 | Medical | Medications & treatments (pre/post injury, allergies, conditions) | `step === 1` block, ~2201–2270 |
| 2 | Mental Health | Mental health & well‑being, sensitive experiences | `step === 2` block, ~2283–2442 |
| 3 | 4Ps + SDOH | Assessment snapshot (4Ps sliders, SDOH), overlay questions | `step === 3` block, ~2455–2690 |
| 4 | Review | Review & Submit (e‑sign, submit button, post‑submit success UI) | `step === 4` block, ~2698–3107 |

**Stepper component:** `src/components/Stepper.tsx` — `labels={["Incident", "Medical", "Mental Health", "4Ps + SDOH", "Review"]}`. Clicks set `step` directly (no validation when clicking a prior step).

---

## 3) Navigation rules

**WizardNav** (`src/components/WizardNav.tsx`)

- **Back:** `setStep(Math.max(0, step - 1))`. Disabled when `step === 0`.
- **Next:** `setStep(Math.min(last, step + 1))`. Disabled when `step === last` (4) or when `!canAdvance`.

**canAdvance / blockReason** (passed from `IntakeWizard` to `WizardNav`):

```tsx
canAdvance={
  (step === 0 ? requiredIncidentOk :
   step === 1 ? true :
   step === 2 ? (sensitiveProgress ? !sensitiveProgress.blockNavigation : true) :
   true) && !countdownExpired
}
blockReason={
  countdownExpired ? INTAKE_WINDOW_EXPIRED
  : step === 0 && !requiredIncidentOk ? "Incident type and date are required."
  : step === 2 && sensitiveProgress?.blockNavigation ? "Please complete consent choices in the Sensitive Experiences section"
  : undefined
}
```

- **Step 0:** Cannot advance without incident type and incident date (`requiredIncidentOk`).
- **Step 1:** No gating.
- **Step 2:** Advance blocked if `sensitiveProgress.blockNavigation` (sensitive experiences consent choices incomplete).
- **Steps 3–4:** No step‑level block; countdown expiry blocks all advance.

**Stepper:** Clicking a step sets `setStep(idx)` with no validation — user can jump to any step (including back).

**Pre‑submit (Review step):** Submitting runs `buildIncompleteSections()`; if incomplete sections exist, an “incomplete sections” dialog can send user to the first incomplete step or allow “Submit anyway”.

---

## 4) Persistence model

**Where draft intake is stored**

| Store | Content | When used |
|-------|--------|-----------|
| **React state** | Full wizard state (`intake`, `client`, `fourPs`, `sdoh`, consent, meds, step, etc.) | Live UI; built into `formData` for persistence. |
| **sessionStorage** | `rcms_intake_id`, `rcms_intake_session_id`, `rcms_intake_created_at`, `rcms_intake_step`, `rcms_intake_form_data`, `rcms_consents_completed`, `rcms_client_*`, `rcms_attorney_*`, `rcms_resume_token`, etc. | Hydration on load, guards, submit (case_number from `rcms_intake_id`). |
| **Supabase table `rc_client_intake_sessions`** | Session row: `id`, `intake_id` (INT#), `resume_token`, `attorney_id`, `attorney_code`, `first_name`, `last_name`, `email`, `current_step`, `form_data` (JSON), `expires_at`, `intake_status`, `case_id` (after submit). | Created at identity; updated for draft and on submit. |
| **Supabase table `intake_drafts`** (optional) | `draft_json: { formData, step }`, `owner_user_id`. | Only when user is **authenticated**; `useAutosave` writes here (see below). |

**When data is written**

- **On change (debounced):**  
  - `updateIntakeSession(sessionId, { currentStep: step, formData: { ...formData, step } })` in `IntakeWizard` — debounced **3 s** after `formData` or `step` change (`useEffect` with 3s timer).  
  - `useAutosave` (when enabled and user is logged in): debounce **3 s**, writes to `intake_drafts` only; does **not** run for anonymous client intake (no user).
- **On step advance:** Same debounced `updateIntakeSession`; step is part of `formData`/`currentStep`.
- **On “Save & Exit”:** Immediate `updateIntakeSession(sessionId, { formData, currentStep })`, then `sessionStorage.setItem("rcms_intake_form_data", ...)` and `sessionStorage.setItem("rcms_intake_step", ...)`, then `navigate("/")`.
- **On submit:** See section 6 (RPC + `rc_client_intakes` insert + `updateIntakeSession(..., intakeStatus: 'submitted', caseId)`).

**Draft token / intake id concepts**

- **`rcms_intake_session_id`:** UUID of the row in `rc_client_intake_sessions` (session id). Used as `p_resume_token` for the submit RPC and for all `updateIntakeSession` calls.
- **`rcms_intake_id`:** Human‑readable INT# (e.g. `INT-260115-02V`). Displayed to client; used as `case_number` on submit; required for resume (INT# + PIN).
- **`resume_token`:** Stored in DB in `rc_client_intake_sessions.resume_token`; used in email link as `?token=`. Lookup via `getIntakeSessionByToken(token)` in `ResumeIntake`. Also stored in sessionStorage as `rcms_resume_token` after identity creation to allow bypass of consent check in wizard.
- **PIN:** 6‑digit temp PIN; hashed with `hashTempPin(pin, intakeId)` and stored in `form_data.tempPinHash`. Resume by INT# + PIN uses `getIntakeSessionByIntakeId` then compares hash.

---

## 5) Security / HIPAA posture signals

**Explicit or implied measures**

- **TTL / purge:**  
  - `rc_client_intake_sessions` has `expires_at` (7 days in `intakeSessionService`).  
  - Edge function `supabase/functions/purge-expired-intakes/index.ts`: purges `rc_client_intakes` with `intake_status = 'submitted_pending_attorney'` and `created_at` older than 7 days; deletes related `rc_client_intake_sessions` and marks case expired. Documented for daily cron.
- **Compliance constants:** `src/constants/compliance.ts` — `CLIENT_INTAKE_WINDOW_HOURS = 168` (7 days), attorney confirm window 48 hours, reminder thresholds, and HIPAA/attestation copy.
- **Client intake window:** Countdown and `clientWindowExpired` in `IntakeWizard` block submit when window expired; messaging from `INTAKE_WINDOW_EXPIRED` / config.
- **Identity and submit:** Canonical client identity for `rc_client_intakes.intake_json.client` is built from intake session / sessionStorage (first/last name, email, phone) — “Identity step” is separate (IntakeIdentity) and single source of truth; comments in code say “Do NOT rely on SDOH” for identity.
- **Display masking:** `maskName(client.fullName)` used for display in payload; `displayNameMasked` set on case client.
- **RPC for case creation:** Case creation goes through `submit_intake_create_case(p_resume_token)` RPC, not direct client inserts into `rc_cases` (reduces arbitrary client writes).
- **RLS:** Other parts of the app (attorney, RN) use “RLS” and “RLS policies” (e.g. `attorneyCaseQueries.ts`, `supabaseRest.ts`, `FourPsScreen.tsx`, `SDOHScreen.tsx`). Client intake routes are **public** (no `RequireAuth`); access to wizard is gated by session/consent/attorney checks in the app, not by RLS on the intake session table (anon key used for create/update/read of `rc_client_intake_sessions` in intake flow).
- **No localStorage for PHI:** Draft persistence for unauthenticated flow is sessionStorage + `rc_client_intake_sessions`. `IntakeSaveBar` has commented‑out code that would use `localStorage` and an edge function for draft; that path is disabled (“Draft initialization skipped - edge function disabled for MVP”).

**Guards preventing access without proper session**

- **IntakeWizard:**  
  - Consent gate: if `rcms_consents_completed` (and consent session id) not set and no `rcms_resume_token`, redirect to `/client-consent`.  
  - Attorney gate: requires `attorney_id` or `attorney_code` in URL or session; validated via `get_attorney_directory` RPC; otherwise redirect to `/client-consent?attorney_required=1`.  
  - No Supabase auth required for the page (public route).
- **ClientConsent:** If on a consent step and no `rcms_intake_id` (and no session), redirect to `/intake-identity` with attorney params so identity (and session) is created first.
- **ResumeIntake:** INT# + PIN verifies via `getIntakeSessionByIntakeId` and `hashTempPin`; `?token=` verifies via `getIntakeSessionByToken`. 7‑day window from `session.createdAt` enforced; expired or invalid token shows EXPIRED_OR_INVALID / LOCKED_UNDER_REVIEW / SUBMITTED_PENDING_REVIEW and does not enter wizard.
- **Rate limit:** ResumeIntake limits PIN attempts to 5 per page load (`RATE_LIMIT_ATTEMPTS`).

**Not present (from this codebase)**

- No in‑app field‑level redaction or encryption of fields before send (payload is JSON to Supabase).
- No explicit “no localStorage for PHI” policy string; only the fact that the active client flow uses sessionStorage + DB.

---

## 6) Submit behavior

**Function called on submit**

- **RPC:** `supabase.rpc('submit_intake_create_case', { p_resume_token: intakeSessionId })`  
  - `intakeSessionId` = `sessionStorage.getItem("rcms_intake_session_id")`.  
  - File: `src/pages/IntakeWizard.tsx` (submit function).

**Before RPC**

- Validation: incident date, “Other” diagnosis descriptions, client first/last name, presence of `intakeSessionId`; duplicate submit check (session already `submitted` with `case_id`).
- `case_number` taken from `rcms_intake_id` (or from `rc_client_intake_sessions.intake_id` if sessionStorage missing).
- Full payload built (`newCase`, `intakeJson` with identity from `buildIntakeIdentity(...)`).
- `updateIntakeSession(intakeSessionId, { formData: { ...formData, fourPs, sdoh, intake, client } })` so RPC has latest form data.

**RPC and subsequent writes**

1. **RPC `submit_intake_create_case`**  
   - Input: `p_resume_token` (session id).  
   - Returns: `case_id`, `client_id` (from RPC response; used for follow‑up inserts where applicable).

2. **updateIntakeSession(intakeSessionId, { intakeStatus: 'submitted', caseId: newCase.id })**  
   - Marks session submitted and links to case.

3. **supabaseInsert('rc_client_intakes', { case_id, intake_json, intake_status: 'submitted_pending_attorney', intake_submitted_at, attorney_confirm_deadline_at })**  
   - Creates intake row; `intake_json` holds full payload (client identity, intake, fourPs, sdoh, consent, compliance, medications, overlay_answers, etc.).

4. **Consent linking:** If `rcms_consent_session_id` exists, `rc_client_consents` row is updated with `case_id` and `client_intake_id` (intake row id).

5. **Optional (authenticated user only):** Insert into `rc_client_checkins` (baseline), `rc_client_medications`, `client_treatments`, `client_allergies` (and related), and mental health screening / sensitive disclosures where implemented.

**Records and linkage**

- **rc_cases:** Created inside RPC `submit_intake_create_case` (not visible in app code); case id returned as `case_id`.
- **rc_client_intakes:** One row per submit; `case_id` = RPC `case_id`; `intake_json` = full intake payload; `intake_status = 'submitted_pending_attorney'`; `attorney_confirm_deadline_at` = now + 48 hours.
- **rc_client_intake_sessions:** Updated with `intake_status: 'submitted'`, `case_id: newCase.id`.
- **rc_client_consents:** Updated by `session_id` to set `case_id` and `client_intake_id` (intake row id).

**After submit**

- `setSubmitSuccess(true)` — user stays on step 4 (Review) and sees success message, INT#, and “What happens next”.
- SessionStorage: `rcms_consents_completed` removed; `rcms_intake_submitted`, `rcms_intake_status`, `rcms_intake_submitted_at` set; `rcms_intake_form_data` removed.
- **Redirect:** No automatic redirect. User can click:
  - **“Go to Client Portal”** → `navigate("/client-portal")`
  - **“Return to Home”** (from another button on the page) → `navigate("/")`
- **Save & Exit** (before submit): `navigate("/")` after saving.

---

## Potential improvements vs CARE (if CARE differs)

- **Explicit “no localStorage for PHI”:** Document or enforce that PHI is not stored in localStorage (CASE already uses sessionStorage + DB for draft; IntakeSaveBar’s localStorage/edge draft is disabled).
- **RLS on intake session table:** If CARE restricts `rc_client_intake_sessions` by RLS (e.g. service role or verified session), CASE currently uses anon key for create/read/update in the client flow; consider aligning with CARE’s policy model.
- **Resume token in URL:** Email link uses `?token=<resume_token>`. If CARE uses one-time or short‑lived tokens, CASE’s resume_token is long‑lived until session expires (7 days); consider TTL or one-time use if CARE does.
- **Post-submit redirect:** CASE keeps user on Review with success message and manual “Go to Client Portal” / “Return to Home”; if CARE auto-redirects (e.g. to portal or thank-you page), consider adding an optional auto-redirect after N seconds.
- **Step validation on Stepper click:** Stepper allows jumping to any step without validation; CARE might enforce “only allow going back” or validate before allowing jump to a future step.
- **Draft for anonymous users:** CASE persists anonymous draft only in sessionStorage and `rc_client_intake_sessions`; `useAutosave` (intake_drafts) runs only when user is logged in. If CARE has a different anonymous draft strategy (e.g. server-only draft by session id), that could be compared.
