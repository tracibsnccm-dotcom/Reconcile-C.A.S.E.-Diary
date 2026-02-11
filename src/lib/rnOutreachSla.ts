/**
 * RN Block 3 — Step 7: RN Outreach SLA Tracker (Supervisor visibility only)
 *
 * Tracks ATTEMPTED outreach only (not successful contact).
 * SLA: within 4 hours OR by end-of-day (EOD 17:00 America/Chicago).
 * Uses direct insert into audit_logs (recordGovernanceEvent restricts actor_role to supervisor/manager/director).
 * No schema changes.
 */

import { supabase } from "@/integrations/supabase/client";

export type OutreachChannel =
  | "phone"
  | "email"
  | "text"
  | "portal_message"
  | "other";

export type OutreachAttempt = {
  case_id: string;
  rn_user_id: string;
  channel: OutreachChannel;
  occurred_at: string;
  note?: string;
};

export type OutreachSlaStatus = {
  status: "met" | "due" | "breached" | "not_applicable";
  due_at?: string;
  breached_at?: string;
  last_attempt_at?: string;
};

const OUTREACH_ACTION = "RN_OUTREACH_ATTEMPT_RECORDED";

const ASSIGNMENT_ACTIONS = [
  "RN_ASSIGNED_TO_CASE",
  "RN_TEAM_CHANGED",
  "CASE_TEAM_CHANGED",
] as const;

function getTs(row: { ts?: string | null }): string | null {
  const v = row.ts;
  return typeof v === "string" && v ? v : null;
}

function getMeta(row: { meta?: unknown }): Record<string, unknown> | null {
  const m = row.meta;
  if (!m || typeof m !== "object" || Array.isArray(m)) return null;
  return m as Record<string, unknown>;
}

function metaIndicatesAssigned(
  meta: Record<string, unknown> | null,
  rn_user_id: string
): boolean {
  if (!meta) return false;
  const after = meta.after;
  if (!after || typeof after !== "object" || Array.isArray(after)) return false;
  const a = after as Record<string, unknown>;
  const assigned = a.assigned_rn_id ?? a.assigned_rn;
  return assigned === rn_user_id;
}

/**
 * Returns EOD 17:00 America/Chicago for the given date (from isoStr) as ISO string.
 * Uses heuristic: CST (-6) for Nov-Feb, CDT (-5) for Apr-Oct, Mar/Oct transition approximated.
 */
function getEOD17Chicago(isoStr: string): string {
  const d = new Date(isoStr);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value ?? "2025";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  const monthNum = parseInt(month, 10);
  const offsetHours =
    monthNum >= 4 && monthNum <= 10 ? 5 : 6;
  const utcHour = 17 + offsetHours;
  return `${year}-${month}-${day}T${String(utcHour).padStart(2, "0")}:00:00.000Z`;
}

/**
 * Records an RN outreach attempt. Uses direct insert (RN roles not permitted in recordGovernanceEvent).
 */
export async function recordRnOutreachAttempt(args: {
  case_id: string;
  rn_user_id: string;
  channel: OutreachChannel;
  note?: string;
  occurred_at?: string;
}): Promise<{ id: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("recordRnOutreachAttempt requires an authenticated session");
  }

  const occurredAt = args.occurred_at ?? new Date().toISOString();
  const meta: Record<string, unknown> = {
    governance: true,
    outreach: true,
    event_type: OUTREACH_ACTION,
    channel: args.channel,
    occurred_at: occurredAt,
  };
  if (args.note) meta.note = args.note;

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      action: OUTREACH_ACTION,
      actor_id: args.rn_user_id,
      actor_role: "rn",
      case_id: args.case_id,
      meta,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to record outreach attempt: ${error.message}`);
  }

  return { id: String(data.id) };
}

/**
 * Lists outreach attempts for a case, optionally filtered by RN.
 */
export async function listRnOutreachAttempts(
  case_id: string,
  rn_user_id?: string
): Promise<OutreachAttempt[]> {
  const { data: rows, error } = await supabase
    .from("audit_logs")
    .select("action, actor_id, ts, meta")
    .eq("case_id", case_id)
    .eq("action", OUTREACH_ACTION)
    .order("ts", { ascending: true });

  if (error) {
    throw new Error(`Failed to list outreach attempts: ${error.message}`);
  }

  const attempts: OutreachAttempt[] = [];
  for (const row of rows ?? []) {
    const meta = getMeta(row);
    if (!meta?.governance && !meta?.outreach) continue;
    const actorId = row.actor_id;
    if (rn_user_id && actorId !== rn_user_id) continue;
    const channel = (meta.channel ?? "other") as OutreachChannel;
    const occurredAt =
      (meta.occurred_at as string) ?? getTs(row) ?? new Date().toISOString();
    attempts.push({
      case_id,
      rn_user_id: String(actorId ?? ""),
      channel,
      occurred_at: occurredAt,
      note: meta.note as string | undefined,
    });
  }
  return attempts.sort(
    (a, b) =>
      new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
  );
}

/**
 * Returns outreach SLA status for a case/RN pair.
 * - not_applicable: RN not assigned to case (rc_cases.assigned_rn_id).
 * - met: first outreach attempt exists after SLA start.
 * - due: no attempt yet, now < due_at.
 * - breached: no attempt yet, now >= due_at.
 */
export async function getOutreachSlaStatus(
  case_id: string,
  rn_user_id: string
): Promise<OutreachSlaStatus> {
  const { data: caseRow, error: caseError } = await supabase
    .from("rc_cases")
    .select("id, assigned_rn_id, created_at")
    .eq("id", case_id)
    .eq("is_superseded", false)
    .maybeSingle();

  if (caseError || !caseRow) {
    return { status: "not_applicable" };
  }

  const assignedRnId = caseRow.assigned_rn_id;
  if (!assignedRnId || assignedRnId !== rn_user_id) {
    return { status: "not_applicable" };
  }

  const { data: auditRows, error: auditError } = await supabase
    .from("audit_logs")
    .select("action, ts, meta")
    .eq("case_id", case_id)
    .order("ts", { ascending: false })
    .limit(200);

  if (auditError) {
    return { status: "not_applicable" };
  }

  let slaStart: string | null = null;
  for (const row of auditRows ?? []) {
    const action = row.action;
    if (!action || typeof action !== "string") continue;
    if (!ASSIGNMENT_ACTIONS.includes(action as (typeof ASSIGNMENT_ACTIONS)[number]))
      continue;
    const meta = getMeta(row);
    if (!metaIndicatesAssigned(meta, rn_user_id)) continue;
    const ts = getTs(row);
    if (ts) {
      slaStart = ts;
      break;
    }
  }

  if (!slaStart) {
    slaStart = caseRow.created_at ?? new Date().toISOString();
  }

  const attempts = await listRnOutreachAttempts(case_id, rn_user_id);
  const firstAttemptAfterStart = attempts.find(
    (a) => new Date(a.occurred_at) >= new Date(slaStart!)
  );

  if (firstAttemptAfterStart) {
    const lastAttempt = attempts
      .filter((a) => new Date(a.occurred_at) >= new Date(slaStart!))
      .pop();
    return {
      status: "met",
      last_attempt_at: lastAttempt?.occurred_at ?? firstAttemptAfterStart.occurred_at,
    };
  }

  const slaStartDate = new Date(slaStart);
  const fourHoursLater = new Date(slaStartDate.getTime() + 4 * 60 * 60 * 1000);
  const eod17 = getEOD17Chicago(slaStart);
  const eod17Date = new Date(eod17);
  const dueAt =
    slaStartDate.getTime() >= eod17Date.getTime()
      ? fourHoursLater.toISOString()
      : fourHoursLater.getTime() < eod17Date.getTime()
        ? fourHoursLater.toISOString()
        : eod17;

  const now = new Date();
  if (now < new Date(dueAt)) {
    return { status: "due", due_at: dueAt };
  }
  return { status: "breached", breached_at: dueAt };
}
