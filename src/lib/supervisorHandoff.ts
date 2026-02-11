/**
 * RN Block 3 — Phase-1 Step 2: Supervisor Handoff Object (Pending → Accepted)
 *
 * Durable supervisor handoff mechanism stored as governance audit events.
 * Initiation creates pending state; acceptance requires explicit accept by incoming supervisor.
 * Manager/Director can view/manage globally but cannot bypass acceptance.
 */

import { supabase } from "@/integrations/supabase/client";
import { recordGovernanceEvent } from "@/lib/governanceNotes";

// --- Types ---

export type SupervisorActorRole = "supervisor" | "manager" | "director";

export interface SupervisorHandoffState {
  case_id: string;
  status: "none" | "pending" | "accepted";
  from_supervisor_user_id?: string;
  to_supervisor_user_id?: string;
  initiated_at?: string;
  accepted_at?: string;
  initiated_audit_id?: string;
  accepted_audit_id?: string;
  reason_code?: string;
  reason_text?: string;
}

// --- Message constants for assertSupervisorAcceptanceGate ---

export const HANDOFF_GATE_MSG_INCOMING =
  "Supervisor handoff pending acceptance. Accept to assume supervisory governance.";
export const HANDOFF_GATE_MSG_OTHER =
  "Supervisor handoff pending acceptance by incoming supervisor.";

/**
 * Manager/Director can manage/view globally but do NOT bypass acceptance.
 * They are never treated as "accepted supervisor owner" for a handoff.
 */
export const canBypassAcceptance = false;

// --- Validation helpers (no external libs) ---

const VALID_ACTOR_ROLES: SupervisorActorRole[] = [
  "supervisor",
  "manager",
  "director",
];

function isIsoLike(s: string): boolean {
  if (!s || typeof s !== "string") return false;
  // Basic ISO 8601 pattern: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/.test(
    s
  );
}

function validateInitiateInput(input: unknown): asserts input is {
  case_id: string;
  actor_user_id: string;
  actor_role: SupervisorActorRole;
  from_supervisor_user_id: string;
  to_supervisor_user_id: string;
  reason_code?: string;
  reason_text?: string;
  occurred_at?: string;
} {
  if (!input || typeof input !== "object") {
    throw new Error("initiateSupervisorHandoff input must be a non-null object");
  }
  const i = input as Record<string, unknown>;
  if (!i.case_id || typeof i.case_id !== "string") {
    throw new Error("case_id is required and must be a string");
  }
  if (!i.actor_user_id || typeof i.actor_user_id !== "string") {
    throw new Error("actor_user_id is required and must be a string");
  }
  if (!i.actor_role || typeof i.actor_role !== "string") {
    throw new Error("actor_role is required and must be a string");
  }
  if (!VALID_ACTOR_ROLES.includes(i.actor_role as SupervisorActorRole)) {
    throw new Error(
      `actor_role must be one of: ${VALID_ACTOR_ROLES.join(", ")}`
    );
  }
  if (!i.from_supervisor_user_id || typeof i.from_supervisor_user_id !== "string") {
    throw new Error("from_supervisor_user_id is required and must be a string");
  }
  if (!i.to_supervisor_user_id || typeof i.to_supervisor_user_id !== "string") {
    throw new Error("to_supervisor_user_id is required and must be a string");
  }
  if (i.from_supervisor_user_id === i.to_supervisor_user_id) {
    throw new Error("from_supervisor_user_id must differ from to_supervisor_user_id");
  }
  if (i.occurred_at !== undefined && i.occurred_at !== null) {
    if (typeof i.occurred_at !== "string" || !isIsoLike(i.occurred_at)) {
      throw new Error("occurred_at must be an ISO-like date string when provided");
    }
  }
}

function validateAcceptInput(input: unknown): asserts input is {
  case_id: string;
  actor_user_id: string;
  actor_role: SupervisorActorRole;
  from_supervisor_user_id: string;
  to_supervisor_user_id: string;
  initiated_audit_id?: string;
  occurred_at?: string;
} {
  if (!input || typeof input !== "object") {
    throw new Error("acceptSupervisorHandoff input must be a non-null object");
  }
  const i = input as Record<string, unknown>;
  if (!i.case_id || typeof i.case_id !== "string") {
    throw new Error("case_id is required and must be a string");
  }
  if (!i.actor_user_id || typeof i.actor_user_id !== "string") {
    throw new Error("actor_user_id is required and must be a string");
  }
  if (!i.actor_role || typeof i.actor_role !== "string") {
    throw new Error("actor_role is required and must be a string");
  }
  if (!VALID_ACTOR_ROLES.includes(i.actor_role as SupervisorActorRole)) {
    throw new Error(
      `actor_role must be one of: ${VALID_ACTOR_ROLES.join(", ")}`
    );
  }
  if (!i.from_supervisor_user_id || typeof i.from_supervisor_user_id !== "string") {
    throw new Error("from_supervisor_user_id is required and must be a string");
  }
  if (!i.to_supervisor_user_id || typeof i.to_supervisor_user_id !== "string") {
    throw new Error("to_supervisor_user_id is required and must be a string");
  }
  if (i.actor_user_id !== i.to_supervisor_user_id) {
    throw new Error(
      "actor_user_id must equal to_supervisor_user_id (only incoming supervisor can accept)"
    );
  }
  if (i.occurred_at !== undefined && i.occurred_at !== null) {
    if (typeof i.occurred_at !== "string" || !isIsoLike(i.occurred_at)) {
      throw new Error("occurred_at must be an ISO-like date string when provided");
    }
  }
}

// --- Core functions ---

export interface InitiateSupervisorHandoffInput {
  case_id: string;
  actor_user_id: string;
  actor_role: SupervisorActorRole;
  from_supervisor_user_id: string;
  to_supervisor_user_id: string;
  reason_code?: string;
  reason_text?: string;
  occurred_at?: string;
}

export async function initiateSupervisorHandoff(
  input: InitiateSupervisorHandoffInput
): Promise<{ audit_id: string }> {
  validateInitiateInput(input);
  const occurred_at = input.occurred_at ?? new Date().toISOString();
  const { id } = await recordGovernanceEvent({
    event_type: "SUPERVISOR_HANDOFF_INITIATED",
    case_id: input.case_id,
    actor_user_id: input.actor_user_id,
    actor_role: input.actor_role,
    occurred_at,
    before: { supervisor_user_id: input.from_supervisor_user_id },
    after: { supervisor_user_id: input.to_supervisor_user_id },
    reason_code: input.reason_code,
    reason_text: input.reason_text,
  });
  return { audit_id: id };
}

export interface AcceptSupervisorHandoffInput {
  case_id: string;
  actor_user_id: string;
  actor_role: SupervisorActorRole;
  from_supervisor_user_id: string;
  to_supervisor_user_id: string;
  initiated_audit_id?: string;
  occurred_at?: string;
}

export async function acceptSupervisorHandoff(
  input: AcceptSupervisorHandoffInput
): Promise<{ audit_id: string }> {
  validateAcceptInput(input);
  const occurred_at = input.occurred_at ?? new Date().toISOString();
  const { id } = await recordGovernanceEvent({
    event_type: "SUPERVISOR_HANDOFF_ACCEPTED",
    case_id: input.case_id,
    actor_user_id: input.actor_user_id,
    actor_role: input.actor_role,
    occurred_at,
    before: {
      supervisor_user_id: input.from_supervisor_user_id,
      initiated_audit_id: input.initiated_audit_id ?? null,
    },
    after: {
      supervisor_user_id: input.to_supervisor_user_id,
      accepted: true,
    },
  });
  return { audit_id: id };
}

type AuditRow = {
  id: number;
  action: string | null;
  case_id: string | null;
  meta: Record<string, unknown> | null;
  ts: string | null;
};

export async function getPendingSupervisorHandoff(
  case_id: string
): Promise<SupervisorHandoffState> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, case_id, meta, ts")
    .eq("case_id", case_id)
    .in("action", ["SUPERVISOR_HANDOFF_INITIATED", "SUPERVISOR_HANDOFF_ACCEPTED"])
    .order("ts", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch handoff state: ${error.message}`);
  }

  const rows = (data ?? []) as AuditRow[];
  const governanceRows = rows.filter(
    (r) => r.meta && typeof r.meta === "object" && (r.meta as Record<string, unknown>).governance === true
  );

  if (governanceRows.length === 0) {
    return { case_id, status: "none" };
  }

  const initiated = governanceRows.find(
    (r) => r.action === "SUPERVISOR_HANDOFF_INITIATED"
  );
  if (!initiated) {
    return { case_id, status: "none" };
  }

  const meta = initiated.meta as Record<string, unknown>;
  const before = meta?.before as Record<string, unknown> | undefined;
  const after = meta?.after as Record<string, unknown> | undefined;
  const fromId = before?.supervisor_user_id as string | undefined;
  const toId = after?.supervisor_user_id as string | undefined;
  const occurredAt = (meta?.occurred_at as string) ?? initiated.ts ?? undefined;

  const initiatedTs = initiated.ts ?? "";
  const accepted = governanceRows.find((r) => {
    if (r.action !== "SUPERVISOR_HANDOFF_ACCEPTED") return false;
    const m = r.meta as Record<string, unknown>;
    const after = m?.after as Record<string, unknown> | undefined;
    if (after?.supervisor_user_id !== toId) return false;
    const before = m?.before as Record<string, unknown> | undefined;
    const linkedId = before?.initiated_audit_id;
    if (linkedId != null && String(linkedId) === String(initiated.id)) return true;
    const rTs = r.ts ?? "";
    return rTs >= initiatedTs;
  });

  if (accepted) {
    const accMeta = accepted.meta as Record<string, unknown>;
    const accOccurred = (accMeta?.occurred_at as string) ?? accepted.ts ?? undefined;
    return {
      case_id,
      status: "accepted",
      from_supervisor_user_id: fromId,
      to_supervisor_user_id: toId,
      initiated_at: occurredAt,
      accepted_at: accOccurred,
      initiated_audit_id: String(initiated.id),
      accepted_audit_id: String(accepted.id),
      reason_code: meta?.reason_code as string | undefined,
      reason_text: meta?.reason_text as string | undefined,
    };
  }

  return {
    case_id,
    status: "pending",
    from_supervisor_user_id: fromId,
    to_supervisor_user_id: toId,
    initiated_at: occurredAt,
    initiated_audit_id: String(initiated.id),
    reason_code: meta?.reason_code as string | undefined,
    reason_text: meta?.reason_text as string | undefined,
  };
}

export async function listPendingSupervisorHandoffsForSupervisor(
  supervisor_user_id: string
): Promise<SupervisorHandoffState[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, case_id, meta, ts")
    .eq("action", "SUPERVISOR_HANDOFF_INITIATED")
    .order("ts", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch handoff initiations: ${error.message}`);
  }

  const rows = (data ?? []) as AuditRow[];
  const candidates = rows.filter((r) => {
    if (!r.meta || typeof r.meta !== "object") return false;
    const m = r.meta as Record<string, unknown>;
    if (m.governance !== true) return false;
    const after = m.after as Record<string, unknown> | undefined;
    return after?.supervisor_user_id === supervisor_user_id;
  });

  const result: SupervisorHandoffState[] = [];
  const seenCases = new Set<string>();

  for (const row of candidates) {
    const caseId = row.case_id ?? "";
    if (!caseId || seenCases.has(caseId)) continue;
    seenCases.add(caseId);

    const state = await getPendingSupervisorHandoff(caseId);
    if (state.status === "pending") {
      result.push(state);
    }
  }

  return result;
}

export interface AssertSupervisorAcceptanceGateParams {
  case_id: string;
  user_id: string;
  role: SupervisorActorRole | string;
}

export function assertSupervisorAcceptanceGate(
  params: AssertSupervisorAcceptanceGateParams
): Promise<void> {
  return (async () => {
    const { case_id, user_id, role } = params;
    const r = String(role).toLowerCase();
    if (r !== "supervisor" && r !== "manager" && r !== "director") {
      return;
    }
    const state = await getPendingSupervisorHandoff(case_id);
    if (state.status !== "pending") {
      return;
    }
    if (r === "manager" || r === "director") {
      return;
    }
    if (state.to_supervisor_user_id === user_id) {
      throw new Error(HANDOFF_GATE_MSG_INCOMING);
    }
    throw new Error(HANDOFF_GATE_MSG_OTHER);
  })();
}
