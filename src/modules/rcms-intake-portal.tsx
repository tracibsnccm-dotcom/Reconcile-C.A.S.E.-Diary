// src/modules/rcms-intake-portal.tsx
// Reconcile C.A.R.E. — Intake/Portal module (single file)
// - UI: PendingIntakesWidget (Attorney), ClientIntakePanel, ClientPortalPanel
// - Hooks/Helpers: useIntakeProgress, autoPurgeIncomplete
// - Google Apps Script (GAS) hooks: scheduleClientReminders, sendImmediateNudge, notifyIntakeExpired
// This file is framework-agnostic for state: pass data via props & callbacks.
// Tailwind classes used for styling.

import * as React from "react";
import { FEATURE, type Role } from "@/lib/rcms-core";

// ---------- Config ----------
/** Days after which an incomplete intake is purged (system policy). */
export const DEFAULT_PURGE_AFTER_DAYS = 7;
/** Day offsets for automated client reminders (client only): Day 1, 3, 5 */
export const DEFAULT_REMINDER_DAYS = [1, 3, 5] as const;
/** Google Apps Script Web App endpoint (set as env var and pass into helpers). */
export type GasConfig = { webAppUrl?: string };

// ---------- Types (minimal, compatible with your app) ----------
export type IntakeRequired = {
  incident: boolean;
  injuries: boolean;
  consent: boolean;
};

export type IntakeOptional = {
  fourPs: boolean;
  sdoh: boolean;
};

export type IntakeMeta = {
  startedAt: string;
  completedAt?: string | null;
  required: IntakeRequired;
  optional: IntakeOptional;
};

export type ClientContact = {
  email?: string;
  phone?: string;
  fullName?: string; // leave undefined until allowed by consent
};

export type CaseStatus = "PENDING" | "READY" | "EXPIRED" | "ACTIVE";

export interface CaseRecord {
  id: string;
  token?: string; // secure client link
  createdAt: string;
  updatedAt: string;
  firmId: string;
  intake: IntakeMeta;
  consent: { signed: boolean; scope?: { shareWithAttorney?: boolean; shareWithProviders?: boolean } };
  clientContact: ClientContact;
  status: CaseStatus;
  checkins: Array<{ ts: string; pain: number; note: string; fourPs?: number }>;
}

// ---------- Utilities ----------
export function daysSince(iso: string | undefined) {
  if (!iso) return 0;
  const t = (Date.now() - new Date(iso).getTime()) / 86400000;
  return Math.floor(t);
}

export function maskName(full?: string) {
  if (!full) return "Client";
  const [f = "", l = ""] = full.split(" ");
  const mask = (s: string) => (s ? s[0] + "•".repeat(Math.max(0, s.length - 1)) : "");
  return `${mask(f)} ${mask(l)}`.trim();
}

/** Lightweight fetch wrapper; if GAS URL not provided, it no-ops. */
async function gasPost<T = unknown>(cfg: GasConfig | undefined, payload: unknown): Promise<{ ok: boolean; data?: T; skipped?: boolean }> {
  if (!cfg?.webAppUrl) return { ok: true, skipped: true };
  const res = await fetch(cfg.webAppUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, data: (await res.json().catch(() => undefined)) as T | undefined };
}

import { scheduleReminders, sendNudge, notifyExpired } from "../lib/supabaseOperations";
export async function scheduleClientReminders(cfg: GasConfig | undefined, c: CaseRecord, days: readonly number[] = DEFAULT_REMINDER_DAYS) {
  const { email, phone } = c.clientContact || {};
  if (!email && !phone) return { ok: true, skipped: true };
  return scheduleReminders({ caseId: c.id, email, phone, days: Array.from(days) });
}

export async function sendImmediateNudge(cfg: GasConfig | undefined, c: CaseRecord) {
  const { email, phone } = c.clientContact || {};
  if (!email && !phone) return { ok: true, skipped: true };
  return sendNudge({ caseId: c.id, email });
}

export async function notifyIntakeExpired(cfg: GasConfig | undefined, c: CaseRecord) {
  const { email, phone } = c.clientContact || {};
  if (!email && !phone) return { ok: true, skipped: true };
  return notifyExpired({ caseId: c.id, email });
}

// ---------- Hook: Intake Progress ----------
export function useIntakeProgress(intake?: IntakeMeta) {
  const totalSteps = 5; // required(3) + optional(2)
  const completed =
    (intake?.required?.incident ? 1 : 0) +
    (intake?.required?.injuries ? 1 : 0) +
    (intake?.required?.consent ? 1 : 0) +
    (intake?.optional?.fourPs ? 1 : 0) +
    (intake?.optional?.sdoh ? 1 : 0);
  const percent = Math.round((completed / totalSteps) * 100);
  return { completedSteps: completed, totalSteps, percent };
}

// ---------- Helper: Auto-purge incomplete intakes ----------
/**
 * Purges incomplete intakes older than N days. Returns a new list + list of purged ids.
 * You decide how to persist the new list in your AppContext/Store.
 */
export async function autoPurgeIncomplete(
  cfg: GasConfig | undefined,
  cases: CaseRecord[],
  purgeAfterDays = DEFAULT_PURGE_AFTER_DAYS
) {
  const keep: CaseRecord[] = [];
  const purged: CaseRecord[] = [];
  for (const c of cases) {
    const incomplete = !c.intake?.completedAt;
    const age = daysSince(c.intake?.startedAt || c.createdAt);
    if (incomplete && age >= purgeAfterDays) {
      purged.push(c);
      await notifyIntakeExpired(cfg, c).catch(() => void 0);
    } else {
      keep.push(c);
    }
  }
  return { keep, purged };
}

// ---------- UI: Attorney Dashboard - Pending Intakes ----------
export function PendingIntakesWidget(props: {
  currentFirmId: string;
  cases: CaseRecord[];
  onNudge: (c: CaseRecord) => Promise<void> | void;
}) {
  const { currentFirmId, cases, onNudge } = props;
  const pending = React.useMemo(
    () =>
      cases
        .filter((c) => c.firmId === currentFirmId && !c.intake?.completedAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [cases, currentFirmId]
  );

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium mb-2">Intakes in Progress</h3>
      <p className="text-sm text-muted-foreground mb-3">
        Clients invited but not finished. Names remain masked until consent is signed.
      </p>
      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Case</th>
              <th className="text-left p-2">Client</th>
              <th className="text-left p-2">Days Since Start</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-muted-foreground">
                  No pending intakes.
                </td>
              </tr>
            )}
            {pending.map((c) => {
              const name = c.consent?.signed ? c.clientContact?.fullName || "Client" : maskName(c.clientContact?.fullName);
              const age = daysSince(c.intake?.startedAt || c.createdAt);
              const atRisk = age >= 5;
              return (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.id}</td>
                  <td className="p-2">{name}</td>
                  <td className="p-2">{age} days</td>
                  <td className="p-2">
                    <span
                      className={`text-xs rounded px-2 py-1 ${
                        atRisk ? "bg-destructive/10 text-destructive" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {atRisk ? "At Risk" : "In Progress"}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      className="rounded bg-primary px-3 py-1.5 text-primary-foreground text-sm hover:bg-primary/90"
                      onClick={() => onNudge(c)}
                      title="Send a friendly reminder to complete intake"
                    >
                      Nudge
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- UI: Client Intake Panel ----------
export function ClientIntakePanel(props: {
  caseRecord: CaseRecord;
  onPatchIntake: (patch: Partial<IntakeMeta>) => void;
  onPatchContact: (patch: Partial<ClientContact>) => void;
  onCompleteIntake: () => void; // called when all required are complete
  onScheduleReminders?: (c: CaseRecord) => void; // optional
  orientationVideo?: React.ReactNode; // custom embed if desired
}) {
  const { caseRecord: c, onPatchIntake, onPatchContact, onCompleteIntake, onScheduleReminders, orientationVideo } = props;
  const { completedSteps, totalSteps, percent } = useIntakeProgress(c.intake);

  // call onScheduleReminders once when intake starts (has startedAt)
  React.useEffect(() => {
    if (onScheduleReminders && c.intake?.startedAt) onScheduleReminders(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function markRequired<K extends keyof IntakeRequired>(key: K, val: boolean) {
    const req = { ...(c.intake?.required || { incident: false, injuries: false, consent: false }), [key]: val };
    onPatchIntake({ required: req });
  }

  function markOptional<K extends keyof IntakeOptional>(key: K, val: boolean) {
    const opt = { ...(c.intake?.optional || { fourPs: false, sdoh: false }), [key]: val };
    onPatchIntake({ optional: opt });
  }

  function tryComplete() {
    const r = c.intake.required;
    if (r.incident && r.injuries && r.consent) {
      onPatchIntake({ completedAt: new Date().toISOString() });
      onCompleteIntake();
    } else {
      alert("Please complete all required sections before continuing.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 bg-muted">
        <p className="text-sm font-medium mb-2">🎥 What to expect</p>
        {orientationVideo ?? (
          <div className="aspect-video w-full bg-muted-foreground/10 grid place-items-center text-muted-foreground text-sm">
            Intake Orientation Video Placeholder
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          We'll ask about your incident, injuries, and consent. You can stop and return later using your secure link.
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-lg border p-3">
        <label className="text-sm font-medium">Progress</label>
        <div className="mt-2 h-2 w-full bg-secondary rounded">
          <div className="h-2 bg-primary rounded" style={{ width: `${percent}%` }} />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {completedSteps} of {totalSteps} steps complete
        </div>
      </div>

      {/* Required: Incident */}
      <Section isDone={c.intake.required.incident} title="Incident Details (required)">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            placeholder="Incident type (e.g., MVA, WorkComp)"
            onBlur={(e) => markRequired("incident", !!e.target.value)}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            placeholder="Incident date (YYYY-MM-DD)"
            onBlur={(e) => markRequired("incident", !!e.target.value)}
          />
        </div>
      </Section>

      {/* Required: Injuries */}
      <Section isDone={c.intake.required.injuries} title="Injuries & Initial Treatment (required)">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            placeholder="Injuries (free text)"
            onBlur={(e) => markRequired("injuries", !!e.target.value)}
          />
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            placeholder="Initial treatment (ED/PCP/Chiro/None)"
            onBlur={(e) => markRequired("injuries", !!e.target.value)}
          />
        </div>
      </Section>

      {/* Required: Consent */}
      <Section isDone={c.intake.required.consent} title="Consent (required)">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <input
              id={`consent_${c.id}`}
              type="checkbox"
              onChange={(e) => {
                const signed = e.target.checked;
                markRequired("consent", signed);
              }}
            />
            <label htmlFor={`consent_${c.id}`}>
              I consent to share my information with my attorney and providers as described.
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm"
              placeholder="Your email (for secure link)"
              onBlur={(e) => props.onPatchContact({ email: e.target.value })}
            />
            <input
              className="rounded border border-input bg-background px-3 py-2 text-sm"
              placeholder="Your phone (for SMS reminders)"
              onBlur={(e) => props.onPatchContact({ phone: e.target.value })}
            />
          </div>
        </div>
      </Section>

      {/* Optional: 4Ps & SDOH */}
      <Section
        isDone={c.intake.optional.fourPs && c.intake.optional.sdoh}
        title="Optional 4Ps & SDOH (complete within 24–72 hours)"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            placeholder="4Ps quick score (0–100)"
            onBlur={(e) => markOptional("fourPs", !!e.target.value)}
          />
          <select
            className="rounded border border-input bg-background px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => markOptional("sdoh", !!e.target.value)}
          >
            <option value="" disabled>
              SDOH: any needs?
            </option>
            <option>Housing</option>
            <option>Food</option>
            <option>Transport</option>
            <option>Insurance Gap</option>
          </select>
        </div>
      </Section>

      {/* Finish */}
      <div className="flex justify-end gap-2">
        <button
          className="rounded bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
          onClick={tryComplete}
        >
          Finish Intake & Go to Portal
        </button>
      </div>
    </div>
  );
}

// ---------- UI: Client Portal Panel ----------
export function ClientPortalPanel(props: {
  caseRecord?: CaseRecord; // undefined means ask for token outside, or show minimal UI
  portalVideo?: React.ReactNode;
  onSubmitCheckin: (checkin: { pain: number; fourPs?: number; note: string }) => void;
  canUseFeatures?: (role: Role) => boolean; // optional, if you want to gate per role
}) {
  const { caseRecord: c, portalVideo, onSubmitCheckin } = props;

  if (!c) {
    return (
      <div className="rounded-lg border p-4 bg-yellow-50 border-yellow-300">
        <p className="text-sm">
          Please open your secure Client Portal link from your email or text message to continue.
        </p>
      </div>
    );
  }

  const intakeDone = !!c.intake?.completedAt;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 bg-muted">
        <p className="text-sm font-medium mb-2">🎥 How to use your Client Portal</p>
        {portalVideo ?? (
          <div className="aspect-video w-full bg-muted-foreground/10 grid place-items-center text-muted-foreground text-sm">
            Portal Explainer Video Placeholder
          </div>
        )}
        <ul className="mt-2 text-xs text-muted-foreground list-disc ml-5">
          <li>Submit your check-ins regularly (pain scale + notes).</li>
          <li>Update your 4Ps when requested by your care team.</li>
          <li>Your information is private and shared only with your team.</li>
        </ul>
      </div>

      {!intakeDone && (
        <div className="rounded-lg border p-4 bg-destructive/10 border-destructive/30 text-destructive">
          Your intake isn't complete yet. Please finish your intake to access the portal features.
        </div>
      )}

      {intakeDone && (
        <>
          {/* Check-in */}
          <div className="rounded-lg border p-3">
            <label className="text-sm font-medium">Submit Check-In</label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input id="pain" className="rounded border border-input bg-background px-3 py-2 text-sm" placeholder="Pain (0–10)" />
              <input id="fourps" className="rounded border border-input bg-background px-3 py-2 text-sm" placeholder="4Ps quick score (0–100)" />
            </div>
            <textarea
              id="note"
              className="mt-2 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              rows={3}
              placeholder="Notes (e.g., changes since last visit)"
            />
            <div className="mt-2 flex justify-end">
              <button
                className="rounded bg-primary px-3 py-2 text-primary-foreground text-sm hover:bg-primary/90"
                onClick={() => {
                  const pain = parseInt((document.getElementById("pain") as HTMLInputElement)?.value || "0", 10);
                  const fp = parseInt((document.getElementById("fourps") as HTMLInputElement)?.value || "0", 10);
                  const note = (document.getElementById("note") as HTMLTextAreaElement)?.value || "";
                  onSubmitCheckin({ pain, fourPs: fp, note });
                }}
              >
                Submit Check-In
              </button>
            </div>
          </div>

          {/* History */}
          <div className="rounded-lg border p-3">
            <label className="text-sm font-medium">Recent Check-Ins</label>
            {c.checkins.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">No check-ins yet.</p>
            ) : (
              <ul className="mt-2 space-y-2 text-sm">
                {c.checkins
                  .slice()
                  .reverse()
                  .map((ch, i) => (
                    <li key={i} className="border rounded p-2">
                      <div className="text-xs text-muted-foreground">{new Date(ch.ts).toLocaleString()}</div>
                      <div>
                        Pain: {ch.pain}/10 • 4Ps: {ch.fourPs ?? "—"}
                      </div>
                      <div className="text-foreground">{ch.note}</div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Small internal component ----------
function Section(props: { isDone: boolean; title: string; children: React.ReactNode }) {
  const { isDone, title, children } = props;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{title}</label>
        <span
          className={`text-[11px] rounded px-2 py-0.5 ${
            isDone ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
          }`}
        >
          {isDone ? "Done" : "Pending"}
        </span>
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
