// src/modules/rcms-intake-extras.tsx
// Reconcile C.A.R.E. — Add-ons (ONE FILE)
// Features provided (drop-in):
// 1) <PendingIntakesWidget/> for AttorneyLanding (masked names until consent, with “Nudge” button)
// 2) autoPurgeIncomplete() to remove incomplete intakes after N days (default 7)
// 3) Google Apps Script hooks: scheduleClientReminders(), sendImmediateNudge(), notifyIntakeExpired()
// 4) <IntakeProgressBar/> to show % complete on IntakeWizard (keep your stepper)
// ----------------------------------------------------------------------------------
// INTEGRATION (3 quick steps; no visual redesign):
// A) AttorneyLanding.tsx
//    import { PendingIntakesWidget, sendImmediateNudge } from "@/modules/rcms-intake-extras";
//    <PendingIntakesWidget
//       currentFirmId={currentFirmId}
//       cases={caseListFromContext}
//       onNudge={(c)=> sendImmediateNudge({ webAppUrl: import.meta.env.VITE_GAS_URL }, c)}
//    />
//
// B) AppContext (on boot/init where you load cases):
//    import { autoPurgeIncomplete } from "@/modules/rcms-intake-extras";
//    const { keep, purged } = await autoPurgeIncomplete({ webAppUrl: import.meta.env.VITE_GAS_URL }, allCases);
//    if (purged.length) setCases(keep);
//
// C) IntakeWizard.tsx (top of form, under your stepper header):
//    import { IntakeProgressBar, useIntakePercent, scheduleClientReminders } from "@/modules/rcms-intake-extras";
//    const percent = useIntakePercent(intakeMeta);
//    <IntakeProgressBar percent={percent} />
//    // When intake first starts (has startedAt) or on first step submit:
//    scheduleClientReminders({ webAppUrl: import.meta.env.VITE_GAS_URL }, caseRecord);
//
// ENV: add VITE_GAS_URL to Lovable env if you want emails/SMS via Apps Script. Otherwise these calls no-op.

// -------------------------------- Types (align with your app) --------------------------------
import * as React from "react";
import { scheduleReminders, sendNudge, notifyExpired } from "../lib/supabaseOperations";

export type IntakeRequired = { incident: boolean; injuries: boolean; consent: boolean; };
export type IntakeOptional = { fourPs: boolean; sdoh: boolean; };
export type IntakeMeta = {
  startedAt: string;
  completedAt?: string | null;
  required: IntakeRequired;
  optional: IntakeOptional;
};

export type Consent = { signed: boolean; scope?: { shareWithAttorney?: boolean; shareWithProviders?: boolean } };
export type ClientContact = { email?: string; phone?: string; fullName?: string; };
export type Checkin = { ts: string; pain: number; note: string; fourPs?: number };
export type CaseStatus = "PENDING" | "READY" | "EXPIRED" | "ACTIVE";

export interface CaseRecord {
  id: string;
  token?: string;
  createdAt: string;
  updatedAt: string;
  firmId: string;
  intake: IntakeMeta;
  consent: Consent;
  clientContact: ClientContact;
  status: CaseStatus;
  checkins: Checkin[];
}

// -------------------------------- Config --------------------------------
export const DEFAULT_PURGE_AFTER_DAYS = 7;
export const DEFAULT_REMINDER_DAYS = [1, 3, 5] as const;

export type GasConfig = { webAppUrl?: string };

// -------------------------------- Utilities --------------------------------
export function daysSince(iso?: string) {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export function maskName(full?: string) {
  if (!full) return "Client";
  const [f = "", l = ""] = (full || "").split(" ");
  const m = (s: string) => (s ? s[0] + "•".repeat(Math.max(0, s.length - 1)) : "");
  return `${m(f)} ${m(l)}`.trim();
}

// -------------------------------- Notification Functions (Supabase) --------------------------------
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

// -------------------------------- Auto-purge helper --------------------------------
/** Remove incomplete intakes older than N days; returns { keep, purged } */
export async function autoPurgeIncomplete(cfg: GasConfig | undefined, cases: CaseRecord[], purgeAfterDays = DEFAULT_PURGE_AFTER_DAYS) {
  const keep: CaseRecord[] = [];
  const purged: CaseRecord[] = [];
  for (const c of cases) {
    const incomplete = !c.intake?.completedAt;
    const age = daysSince(c.intake?.startedAt || c.createdAt);
    if (incomplete && age >= purgeAfterDays) {
      purged.push(c);
      try { await notifyIntakeExpired(cfg, c); } catch {}
    } else {
      keep.push(c);
    }
  }
  return { keep, purged };
}

// -------------------------------- Intake progress --------------------------------
/** compute % complete: 3 required + 2 optional */
export function useIntakePercent(intake?: IntakeMeta) {
  const totalSteps = 5;
  const completed =
    (intake?.required?.incident ? 1 : 0) +
    (intake?.required?.injuries ? 1 : 0) +
    (intake?.required?.consent ? 1 : 0) +
    (intake?.optional?.fourPs ? 1 : 0) +
    (intake?.optional?.sdoh ? 1 : 0);
  return Math.round((completed / totalSteps) * 100);
}

export function IntakeProgressBar({ percent }: { percent: number }) {
  return (
    <div className="rounded-lg border p-3">
      <label className="text-sm font-medium">Progress</label>
      <div className="mt-2 h-2 w-full bg-gray-200 rounded">
        <div className="h-2 bg-blue-600 rounded" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
      </div>
      <div className="mt-1 text-xs text-gray-600">{percent}% complete</div>
    </div>
  );
}

// -------------------------------- Attorney widget: Pending Intakes --------------------------------
export function PendingIntakesWidget(props: {
  currentFirmId: string;
  cases: CaseRecord[];
  onNudge: (c: CaseRecord) => Promise<void> | void;
}) {
  const { currentFirmId, cases, onNudge } = props;
  const pending = React.useMemo(
    () =>
      (cases || [])
        .filter((c) => c.firmId === currentFirmId && !c.intake?.completedAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [cases, currentFirmId]
  );

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-medium mb-2">Intakes in Progress</h3>
      <p className="text-sm text-gray-600 mb-3">Clients invited but not finished. Names remain masked until consent is signed.</p>
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
                <td colSpan={5} className="p-3 text-center text-gray-500">No pending intakes.</td>
              </tr>
            )}
            {pending.map((c) => {
              const name = c.consent?.signed ? (c.clientContact?.fullName || "Client") : maskName(c.clientContact?.fullName);
              const age = daysSince(c.intake?.startedAt || c.createdAt);
              const atRisk = age >= 5;
              return (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.id}</td>
                  <td className="p-2">{name}</td>
                  <td className="p-2">{age} days</td>
                  <td className="p-2">
                    <span className={`text-xs rounded px-2 py-1 ${atRisk ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-800"}`}>
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
