import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  action: string;
  actorRole: string;
  actorId: string;
  caseId?: string;
  meta?: Record<string, any>;
}

export async function audit(entry: AuditEntry): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("rc_audit_log").insert({
      action: entry.action,
      actor_role: entry.actorRole,
      actor_id: entry.actorId,
      case_id: entry.caseId || null,
      meta: entry.meta || {},
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[Audit] Failed:", e);
  }
}

export async function sendNudge(payload: { caseId: string; email?: string }) {
  const { caseId, email } = payload;
  if (!supabase) return;
  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: { type: "nudge", caseId, email },
  });
  if (error) throw new Error(`Failed to send nudge: ${error.message}`);
  return data;
}

export async function scheduleReminders(payload: {
  caseId: string;
  email?: string;
  phone?: string;
  days?: number[];
}) {
  const { caseId, email, phone, days = [1, 3, 5] } = payload;
  if (!supabase) return;
  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: { type: "schedule-reminders", caseId, email, phone, days },
  });
  if (error) throw new Error(`Failed to schedule reminders: ${error.message}`);
  return data;
}

export async function notifyExpired(payload: { caseId: string; email?: string }) {
  const { caseId, email } = payload;
  if (!supabase) return;
  const { data, error } = await supabase.functions.invoke("send-notification", {
    body: { type: "intake-expired", caseId, email },
  });
  if (error) throw new Error(`Failed to notify expired: ${error.message}`);
  return data;
}
