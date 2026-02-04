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
