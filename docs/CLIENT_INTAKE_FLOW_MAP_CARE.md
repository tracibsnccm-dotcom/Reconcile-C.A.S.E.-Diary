# Client Intake Flow Map — C.A.R.E.

Precise map of the C.A.R.E. (Reconcile C.A.R.E.™) client intake: entry routes, step structure, navigation, persistence, security posture, and submit behavior. All paths and names are from the codebase.

---

## 1) Intake entry route(s)

| URL path | Component | Where registered |
|---------|-----------|-------------------|
| `/demo` | `DemoRouteGuard` → `DemoHub` | `src/main.tsx`: pathname check inside `Root()`, not a `<Route>` |
| `/demo/*` | same | Same pathname check: `pathname === "/demo" \|\| pathname.startsWith("/demo/")` |
| Hash `#/demo` | same | `hash === "#/demo" \|\| hash.startsWith("#/demo/")` |

**Route / guard snippet** (`src/main.tsx`):

```tsx
// /demo routes go through guard (default: disabled)
const isDemoRoute = pathname === "/demo" || pathname.startsWith("/demo/") || hash === "#/demo" || ...;
if (isDemoRoute) return <DemoRouteGuard />;  // → DemoHub when VITE_ENABLE_DEMO === "true"
```

**How users reach intake**

- **CARE demo:** User must go to `/demo` (or `/demo/…`) with `VITE_ENABLE_DEMO === "true"`. `DemoRouteGuard` renders `DemoHub`. User enters access code `RCMS-CARE-2026` (DemoHub.tsx: `const ACCESS_CODE = "RCMS-CARE-2026"`), then clicks **“Open Client Experience”** or **“Client Experience (Demo)”** → `setView("client")` → `DemoHub` renders `<ClientIntakeScreen />`. No direct URL to the intake steps; everything is tab/view state inside DemoHub.
- **No dedicated intake path:** CARE intake is not mounted at `/client-intake` or any other path. `/client-intake` is the C.A.S.E. `IntakeWizard` (see `docs/CLIENT_INTAKE_FLOW_MAP.md`).

**Relevant files**

- `src/main.tsx` — `DemoRouteGuard`, `Root()` pathname/hash checks.
- `src/pages/DemoHub.tsx` — `ACCESS_CODE`, `STORAGE_KEY = "rcms_demo_unlocked_v1"`, `setView("client")`, `<ClientIntakeScreen />` (line 543).

---

## 2) Step structure

**Pre-wizard**

- None. CARE has no consent or identity page before the wizard. User lands on the first step of `ClientIntakeScreen` after choosing “Client Experience” in DemoHub.

**Wizard steps (single screen, single route)**

All steps live in one component: `src/screens/ClientIntakeScreen.tsx`. Step order is defined by the `STEPS` array.

| Step index | Step label (Stepper) | Content |
|------------|----------------------|---------|
| 0 | About You | Demographics: first/last name, DOB, gender identity, sex at birth, dependents, student status; overlay preview chips (e.g. 60+ Geriatric, Student Support, Gender-Affirming Care). |
| 1 | Injury Snapshot | Injury type (incl. Other), chronic condition, pain 1–10, missed work, primary concern. |
| 2 | Care Disruptions | SDOH-style: transportation, housing, food, childcare, income range. |
| 3 | Client Voice | Free text: what happened, hardest part, what you need most. |
| 4 | Preview | Review summary + checkbox “I confirm that the information I have provided is accurate…” (`demoAcknowledged`). |
| 5 | Complete | Thank-you screen: `ClientEndScreen` (no further form). |

**Snippet** (`src/screens/ClientIntakeScreen.tsx`, STEPS ~16–23, step/complete ~203–206):

```tsx
const STEPS: DemoStep[] = [
  "About You", "Injury Snapshot", "Care Disruptions", "Client Voice", "Preview", "Complete",
];
// ...
const step = STEPS[stepIndex];
const isPreview = step === "Preview";
const isComplete = step === "Complete";
```

**Stepper UI:** Pills for steps 0–4 are clickable; “Complete” is a disabled pill until user reaches it via Submit. No separate `Stepper.tsx`; inline pill buttons call `goTo(idx)`.

---

## 3) Navigation rules

**Back / Next** (`ClientIntakeScreen.tsx`, bottom navigation block ~933–972)

- **Back:** `goTo(stepIndex - 1)`. Button disabled when `stepIndex === 0`.
- **Next (Continue):** `goTo(stepIndex + 1)` for steps 0–3; no validation.
- **Preview → Submit:** On Preview (step 4), the primary button is “Submit Intake →”. It calls `goTo(5)` (Complete). **Gating:** button disabled unless `form.demoAcknowledged === true` (checkbox on Preview must be checked).

```tsx
{isPreview ? (
  <button ... disabled={!form.demoAcknowledged} onClick={() => goTo(5)}>Submit Intake →</button>
) : (
  <button ... onClick={() => goTo(stepIndex + 1)}>Continue →</button>
)}
```

**Stepper (step pills):** `goTo(idx)` is called on click with no validation — user can jump to any previous or next step (steps 0–4). “Complete” is not clickable (disabled pill).

- **Back:** No validation; can always go back.
- **Next:** No per-step validation except Preview → Complete (acknowledgment required).
- **Jumping:** Allowed; no “only allow going back” or “must complete in order” enforcement.

---

## 4) Persistence model

**Where draft / state is stored**

| Store | Content | When used |
|-------|--------|-----------|
| **React state** | Full form in `ClientIntakeScreen`: `form` (`FormState`), `stepIndex`. | Live UI only; no automatic persist from this component. |
| **sessionStorage** | Not used by CARE intake. | — |
| **localStorage** | `rcms_demo_unlocked_v1` (DemoHub: unlock flag). `rcms_client_intake_demo` (optional: ClientEndScreen reads it to enrich demo case; **ClientIntakeScreen does not write to it**). `rcms_case_summary_attorney_demo` (ClientEndScreen writes built demo case for Attorney Console). | DemoHub: persist unlock. ClientEndScreen: read intake for `buildDemoCase001`; write attorney demo summary. |

**When data is written**

- **On unlock:** DemoHub sets `localStorage.setItem(STORAGE_KEY, "true")` (`DemoHub.tsx`).
- **On Complete (step 5):** `ClientEndScreen` renders; in a `useMemo` it writes `ATTORNEY_DEMO_STORAGE_KEY` with `JSON.stringify(built)`. It does **not** write `CLIENT_INTAKE_STORAGE_KEY`; that would need to be written by `ClientIntakeScreen` before navigating to Complete (currently not implemented, so `buildDemoCase001` gets `intake = null` from localStorage and uses fallbacks).

**No server persistence for CARE demo**

- No Supabase, no `rc_client_intake_sessions`, no `intake_drafts`, no RPC. CARE demo is client-only (DemoHub + ClientIntakeScreen + ClientEndScreen).

**IDs / tokens**

- No intake ID, session ID, or resume token. Demo is stateless except for React state and the localStorage keys above.

---

## 5) Security / HIPAA posture notes

**Explicit or implied**

- **Demo-only, no PHI in production:** CARE intake in this codebase is the **demo** flow behind `VITE_ENABLE_DEMO` and access code `RCMS-CARE-2026`. Marketing copy: “Read-only demo • No PHI” (App.tsx). No anon key or RPC used in the CARE demo path.
- **Unlock:** DemoHub stores unlock in `localStorage` (`rcms_demo_unlocked_v1`). No TTL; once unlocked, it stays until user clears storage or clicks “Lock”.
- **No token validation / TTL / purge:** No server-side session, so no token, TTL, or purge. No consent gates or attorney selection.
- **localStorage for demo data:** ClientEndScreen writes a **synthetic** case summary to `rcms_case_summary_attorney_demo` for the Attorney Console demo. If real PHI were ever used in CARE demo, that would be a HIPAA risk (localStorage is not recommended for PHI). Currently the flow is intended for demo data only.

**Not present**

- No anon key usage in CARE demo flow.
- No RLS, no consent flow, no attorney selection, no resume token, no rate limiting, no field-level masking.

---

## 6) Submit behavior

**What “submit” means in CARE**

- There is no server submit. “Submit Intake” in Preview sets `stepIndex` to 5, so the component re-renders and shows `ClientEndScreen` (Complete).

**Function called on “Submit”** (`ClientIntakeScreen.tsx`):

- No RPC. `onClick={() => goTo(5)}` only.

**Before “submit”**

- User must check the acknowledgment checkbox on Preview (`form.demoAcknowledged === true`). No other validation (e.g. required name fields) blocks advance.

**On Complete (step 5)**

- `ClientIntakeScreen` renders `<ClientEndScreen form={{ ...form }} />`. Note: `ClientEndScreen`’s declared props in the file are `injuryType` and `onRestart` (ClientEndScreen.tsx:56–59, 256); the caller passes `form`. So there is a props/type mismatch; the end screen may rely on reading from `localStorage` (CLIENT_INTAKE_STORAGE_KEY) for `buildDemoCase001`, and `injuryType`/`onRestart` would be undefined when called from ClientIntakeScreen (and “Restart demo” would fail unless handled).
- **ClientEndScreen** (`src/screens/ClientEndScreen.tsx`, `buildDemoCase001` ~108–254, component ~256–271):
  - Reads optional intake from `localStorage.getItem(CLIENT_INTAKE_STORAGE_KEY)` (ClientIntakeScreen does not write it).
  - Builds a demo case with `buildDemoCase001({ injuryType, intake })` (injuryType from props; intake from localStorage or null).
  - Writes once: `localStorage.setItem(ATTORNEY_DEMO_STORAGE_KEY, JSON.stringify(built))`.
- **RPC/table writes:** None. No Supabase, no `rc_client_intakes`, no `rc_cases`.

**After “submit”**

- User remains on the same “page” (view) and sees ClientEndScreen content: “Thank you — your demo intake is complete”, what happens next, and a synthetic case summary (Case ID DEMO-001, client name, jurisdiction). Buttons: “Done” (scroll to top), “Restart demo” (onRestart — not passed from ClientIntakeScreen, so may be no-op or throw).
- **Redirect:** No route change. User can switch back to hub or Attorney Console via DemoHub UI (no programmatic redirect).

---

## Differences vs C.A.S.E.

| Aspect | C.A.S.E. | C.A.R.E. (this flow) |
|--------|----------|------------------------|
| **Entry** | Dedicated routes: `/client-consent`, `/intake-identity`, `/client-intake`, `/resume-intake`, `/check-status` (main.tsx). | Single entry: `/demo` (pathname guard) → DemoHub → “Client Experience” → ClientIntakeScreen. No URL per step. |
| **Pre-wizard** | ClientConsent (attorney + consent), IntakeIdentity (identity + session creation). | None. |
| **Wizard steps** | 5 steps: Incident, Medical, Mental Health, 4Ps+SDOH, Review (IntakeWizard). | 6 “steps”: About You, Injury Snapshot, Care Disruptions, Client Voice, Preview, Complete (ClientIntakeScreen). |
| **Persistence** | sessionStorage + `rc_client_intake_sessions` (Supabase), optional `intake_drafts`; debounced update; Save & Exit. | React state only during flow; localStorage for demo unlock and attorney demo summary. No server. |
| **Submit** | RPC `submit_intake_create_case`; writes `rc_client_intakes`, updates session, links consent; then success UI and optional “Go to Client Portal” / “Return to Home”. | No RPC. `goTo(5)` → ClientEndScreen; writes only `rcms_case_summary_attorney_demo` to localStorage. |
| **Security** | Anon key for session CRUD; TTL (7 days); purge edge function; consent gates; resume token + PIN; rate limit on resume. | Demo-only; access code; no anon key, no TTL, no purge, no consent. |
| **Stepper** | Stepper allows jumping to any step (no validation on click). | Same: pills allow jump; only Preview→Complete gated by acknowledgment. |

---

## Likely improvements to port into C.A.R.E.

1. **Write intake to localStorage before Complete**  
   ClientEndScreen expects optional data at `CLIENT_INTAKE_STORAGE_KEY` to enrich the attorney demo case. ClientIntakeScreen does not write the form there. Before `goTo(5)`, persist the current `form` (e.g. `localStorage.setItem(CLIENT_INTAKE_STORAGE_KEY, JSON.stringify(form))`) so `buildDemoCase001` can use real answers and “Restart demo” can be implemented by clearing and resetting from that key if desired.

2. **Align ClientEndScreen props with caller**  
   ClientIntakeScreen passes `form`; ClientEndScreen declares `injuryType` and `onRestart`. Define a `form`-based prop type (or extend the existing one) and pass `onRestart={() => { setStepIndex(0); setForm(DEFAULT_FORM); }}` so “Restart demo” works and TypeScript matches usage.

3. **Optional dedicated route for CARE intake**  
   If CARE should be shareable or bookmarkable, add e.g. `<Route path="/care/intake" element={...} />` that renders DemoHub in “client” view or a minimal wrapper around ClientIntakeScreen, instead of relying only on `/demo` + manual “Open Client Experience”.

4. **Per-step validation and gating**  
   CASE gates step 0 (incident type/date), step 2 (sensitive experiences), and countdown. CARE has no required-field or step validation except the Preview checkbox. Consider at least requiring name (and optionally injury type) before allowing advance or submit, and optionally “only allow going back” or “complete in order” to mirror stricter flows.

5. **No localStorage for PHI (if CARE ever holds real data)**  
   CASE avoids localStorage for PHI; draft is sessionStorage + server. CARE currently uses localStorage only for demo unlock and synthetic case. If CARE is ever used with real client data, remove or isolate any PHI from localStorage and consider sessionStorage + server draft pattern.

6. **Post-“submit” redirect option**  
   CASE keeps user on Review with success and manual “Go to Client Portal”. CARE keeps user on Complete with “Done” / “Restart demo”. If desired, add an optional “Return to hub” or “Open Attorney Console” that programmatically sets DemoHub view (e.g. `setView("hub")` or `setView("attorney")`) so the flow feels closed without relying on user clicking the tab.

---

*All citations are to the current codebase; line numbers are approximate and may shift. Snippets are kept to ≤15 lines.*
