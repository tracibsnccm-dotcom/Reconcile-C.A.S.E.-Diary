// src/lib/supabaseOperations.ts
// Direct Supabase operations - replaces Google Apps Script integration

import { supabase } from "@/integrations/supabase/client";
import { supabaseInsert } from "@/lib/supabaseRest";

export type Json = Record<string, any>;

/* ======================= Audit Logging ======================= */

export interface AuditEvent {
  ts?: string;
  actorRole: string;
  actorId: string;
  action:
    | "SIGN_IN"
    | "POLICY_ACK"
    | "INTAKE_SUBMIT"
    | "CHECKIN_SUBMIT"
    | "ACCESS_DENIED"
    | "VIEW_CASE"
    | "CONSENT_REVOKED"
    | "NUDGE_SENT"
    | "REMINDER_SCHEDULED"
    | "INVITE_CREATED"
    | "EXPORT_ATTEMPT"
    | "DOSSIER_MODAL_OPEN"
    | "DOSSIER_ACTION";
  caseId?: string;
  meta?: Json;
}

/**
 * Write a single audit log entry directly to Supabase
 */
export async function audit(ev: AuditEvent) {
  try {
    const entry = {
      created_at: ev.ts || new Date().toISOString(),
      user_id: ev.actorId,
      action: ev.action,
      case_id: ev.caseId || null,
      details: ev.meta ? JSON.stringify(ev.meta) : null,
    };
    const { error } = await supabaseInsert("rc_audit_logs", entry);
    if (error) {
      console.error("[audit] Failed to log audit event:", error);
    }
  } catch (error) {
    console.error("[audit] Exception logging audit event:", error);
  }
}

/* ======================= Intake Operations ======================= */

/**
 * Submit intake data directly to Supabase
 */
export async function postIntake(envelope: {
  caseId: string;
  userId?: string;
  incidentDate?: string;
  incidentType?: string;
  injuries?: string[];
  severitySelfScore?: number;
  initialTreatment?: string;
  narrative?: string;
  intakeData?: Json;
  completed?: boolean;
}) {
  const {
    caseId,
    userId,
    incidentDate,
    incidentType,
    injuries,
    severitySelfScore,
    initialTreatment,
    narrative,
    intakeData,
    completed = false,
  } = envelope;

  const { data, error } = await supabase
    .from("intakes")
    .insert({
      case_id: caseId,
      user_id: userId || null,
      incident_date: incidentDate || null,
      incident_type: incidentType || null,
      injuries: injuries || null,
      severity_self_score: severitySelfScore || null,
      initial_treatment: initialTreatment || null,
      narrative: narrative || null,
      intake_data: intakeData || {},
      completed,
    })
    .select()
    .single();

  if (error) {
    console.error("[postIntake] Failed:", error);
    throw new Error(`Intake submission failed: ${error.message}`);
  }

  return data;
}

/* ======================= Check-in Operations ======================= */

/**
 * Submit check-in data directly to Supabase
 */
export async function postCheckin(payload: {
  case_id: string;
  pain?: number;
  notes?: string;
  four_ps?: {
    physical?: number;
    psychological?: number;
    psychosocial?: number;
    professional?: number;
  };
  ts?: string;
}) {
  const { case_id, pain, notes, four_ps, ts } = payload;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const checkinPayload = {
    pain: pain || null,
    notes: notes || null,
    four_ps: four_ps || null,
    timestamp: ts || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("checkins")
    .insert({
      case_id,
      user_id: user.id,
      payload: checkinPayload,
    })
    .select()
    .single();

  if (error) {
    console.error("[postCheckin] Failed:", error);
    throw new Error(`Check-in submission failed: ${error.message}`);
  }

  return data;
}

/* ======================= Notification Operations ======================= */

/**
 * Send a nudge (reminder) email via edge function
 */
export async function sendNudge(payload: { caseId: string; email?: string }) {
  const { caseId, email } = payload;

  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: {
      type: "nudge",
      caseId,
      email,
    },
  });

  if (error) {
    console.error("[sendNudge] Failed:", error);
    throw new Error(`Failed to send nudge: ${error.message}`);
  }

  // Log audit event
  await audit({
    actorRole: "ATTORNEY",
    actorId: "self",
    action: "NUDGE_SENT",
    caseId,
  });

  return data;
}

/**
 * Schedule intake completion reminders via edge function
 */
export async function scheduleReminders(payload: {
  caseId: string;
  email?: string;
  phone?: string;
  days?: number[];
}) {
  const { caseId, email, phone, days = [1, 3, 5] } = payload;

  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: {
      type: "schedule-reminders",
      caseId,
      email,
      phone,
      days,
    },
  });

  if (error) {
    console.error("[scheduleReminders] Failed:", error);
    throw new Error(`Failed to schedule reminders: ${error.message}`);
  }

  // Log audit event
  await audit({
    actorRole: "SYSTEM",
    actorId: "system",
    action: "REMINDER_SCHEDULED",
    caseId,
  });

  return data;
}

/**
 * Notify system that an intake expired via edge function
 */
export async function notifyExpired(payload: { caseId: string; email?: string }) {
  const { caseId, email } = payload;

  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: {
      type: "intake-expired",
      caseId,
      email,
    },
  });

  if (error) {
    console.error("[notifyExpired] Failed:", error);
    throw new Error(`Failed to notify expired: ${error.message}`);
  }

  return data;
}

/**
 * Notify RN Supervisor that pre-settlement dossier was commissioned
 */
export async function notifyDossierCommissioned(payload: {
  caseId: string;
  attorneyId?: string;
  attorneyEmail?: string;
  clientLabel?: string;
}) {
  const { caseId, attorneyId, attorneyEmail, clientLabel } = payload;

  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: {
      type: "dossier-commissioned",
      caseId,
      attorneyId,
      attorneyEmail,
      clientLabel,
    },
  });

  if (error) {
    console.error("[notifyDossierCommissioned] Failed:", error);
    throw new Error(`Failed to notify dossier commissioned: ${error.message}`);
  }

  return data;
}

/* ======================= Helper: User-Friendly Error Handling ======================= */

/**
 * Wrap a promise to surface user-friendly errors
 */
export async function withUserNotice<T>(
  promise: Promise<T>,
  okMsg?: string,
  errorHandler?: (err: Error) => void
): Promise<T | null> {
  try {
    const out = await promise;
    return out;
  } catch (err: any) {
    console.error(err);
    if (errorHandler) {
      errorHandler(err);
    }
    return null;
  }
}
