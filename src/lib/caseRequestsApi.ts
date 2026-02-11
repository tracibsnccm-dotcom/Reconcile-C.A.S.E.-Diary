/**
 * Case Requests API — Attorney ↔ RN case-linked requests and activity
 *
 * MANUAL TESTING CHECKLIST (see also docs/CASE_REQUESTS_TESTING.md):
 * 1. As attorney: create request on case -> see it in list -> thread shows initial body -> status open
 * 2. As RN: open same case -> see request -> reply -> status becomes responded (attorney sees it)
 * 3. As attorney: close request -> composer disables -> All Activity shows close event
 * 4. As attorney: reopen -> message -> All Activity updates
 * 5. Refresh browser on each step; everything persists.
 */

import { supabase } from "@/integrations/supabase/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CaseRequest {
  id: string;
  case_id: string;
  created_by_user_id: string;
  created_by_role: "attorney" | "rn";
  title: string;
  body: string;
  status: "open" | "responded" | "closed";
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface CaseRequestMessage {
  id: string;
  request_id: string;
  case_id: string;
  sender_user_id: string;
  sender_role: "attorney" | "rn";
  message: string;
  created_at: string;
}

export interface CaseActivity {
  id: string;
  case_id: string;
  actor_user_id: string | null;
  actor_role: "attorney" | "rn" | "system" | null;
  activity_type: string;
  ref_table: string | null;
  ref_id: string | null;
  summary: string;
  created_at: string;
  /** For client_communication: 'attorney_only' | 'attorney_rn'. NULL = visible to both. */
  visibility?: string | null;
  /** Full message/notes for client_communication. */
  details?: string | null;
}

export type ClientCommunicationType = "Phone" | "Email" | "In-Person" | "Written";

export interface RequestThread {
  request: CaseRequest;
  messages: CaseRequestMessage[];
}

export type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toError(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as Error).message);
  return String(err);
}

// ---------------------------------------------------------------------------
// listCaseRequests(caseId)
// ---------------------------------------------------------------------------

export async function listCaseRequests(caseId: string): Promise<ApiResult<CaseRequest[]>> {
  try {
    const { data, error } = await supabase
      .from("rc_case_requests")
      .select("*")
      .eq("case_id", caseId)
      .order("last_activity_at", { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: (data ?? []) as CaseRequest[], error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// createCaseRequest({ caseId, title, body, createdByUserId })
// ---------------------------------------------------------------------------

export async function createCaseRequest(params: {
  caseId: string;
  title: string;
  body: string;
  createdByUserId: string;
}): Promise<ApiResult<CaseRequest>> {
  const { caseId, title, body, createdByUserId } = params;
  if (!title?.trim()) return { data: null, error: "Title is required." };
  if (!body?.trim()) return { data: null, error: "Body is required." };
  if (!createdByUserId) return { data: null, error: "Created-by user is required." };
  try {
    const { data, error } = await supabase
      .from("rc_case_requests")
      .insert({
        case_id: caseId,
        created_by_user_id: createdByUserId,
        created_by_role: "attorney",
        title: title.trim(),
        body: body.trim(),
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as CaseRequest, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// getRequestThread(requestId) -> { request, messages }
// ---------------------------------------------------------------------------

export async function getRequestThread(requestId: string): Promise<ApiResult<RequestThread>> {
  try {
    const { data: req, error: reqErr } = await supabase
      .from("rc_case_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (reqErr) return { data: null, error: reqErr.message };
    if (!req) return { data: null, error: "Request not found." };

    const { data: msgs, error: msgErr } = await supabase
      .from("rc_case_request_messages")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });
    if (msgErr) return { data: null, error: msgErr.message };

    return {
      data: {
        request: req as CaseRequest,
        messages: (msgs ?? []) as CaseRequestMessage[],
      },
      error: null,
    };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// postRequestMessage({ requestId, caseId, message, senderUserId, senderRole })
// ---------------------------------------------------------------------------

export async function postRequestMessage(params: {
  requestId: string;
  caseId: string;
  message: string;
  senderUserId: string;
  senderRole: "attorney" | "rn";
}): Promise<ApiResult<CaseRequestMessage>> {
  const { requestId, caseId, message, senderUserId, senderRole } = params;
  if (!message?.trim()) return { data: null, error: "Message is required." };
  if (!senderUserId) return { data: null, error: "Sender user is required." };
  if (!["attorney", "rn"].includes(senderRole)) return { data: null, error: "Sender role must be attorney or rn." };
  try {
    const { data, error } = await supabase
      .from("rc_case_request_messages")
      .insert({
        request_id: requestId,
        case_id: caseId,
        sender_user_id: senderUserId,
        sender_role: senderRole,
        message: message.trim(),
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as CaseRequestMessage, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// closeRequest(requestId) — attorney only
// ---------------------------------------------------------------------------

export async function closeRequest(requestId: string): Promise<ApiResult<CaseRequest>> {
  try {
    const { data, error } = await supabase
      .from("rc_case_requests")
      .update({ status: "closed" })
      .eq("id", requestId)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as CaseRequest, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// reopenRequest(requestId) — attorney only
// ---------------------------------------------------------------------------

export async function reopenRequest(requestId: string): Promise<ApiResult<CaseRequest>> {
  try {
    const { data, error } = await supabase
      .from("rc_case_requests")
      .update({ status: "open" })
      .eq("id", requestId)
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as CaseRequest, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// listCaseActivity(caseId) -> rc_case_activity ordered desc
// ---------------------------------------------------------------------------

export async function listCaseActivity(caseId: string): Promise<ApiResult<CaseActivity[]>> {
  try {
    const { data, error } = await supabase
      .from("rc_case_activity")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: (data ?? []) as CaseActivity[], error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// insertClientCommunication — attorney documents client contact (rc_case_activity)
// visibility: 'attorney_only' (default) or 'attorney_rn' when ccRn is true
// ---------------------------------------------------------------------------

export async function insertClientCommunication(params: {
  caseId: string;
  actorUserId: string;
  communicationType: ClientCommunicationType;
  message: string;
  ccRn: boolean;
}): Promise<ApiResult<CaseActivity>> {
  const { caseId, actorUserId, communicationType, message, ccRn } = params;
  const trimmed = (message || "").trim();
  if (!trimmed) return { data: null, error: "Message / Notes is required." };
  if (!actorUserId) return { data: null, error: "Actor user is required." };
  const visibility = ccRn ? "attorney_rn" : "attorney_only";
  const summary =
    "Client communication (" +
    communicationType +
    "): " +
    (trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed);
  try {
    const { data, error } = await supabase
      .from("rc_case_activity")
      .insert({
        case_id: caseId,
        actor_user_id: actorUserId,
        actor_role: "attorney",
        activity_type: "client_communication",
        ref_table: null,
        ref_id: null,
        summary,
        details: trimmed,
        visibility,
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data: data as CaseActivity, error: null };
  } catch (e) {
    return { data: null, error: toError(e) };
  }
}
