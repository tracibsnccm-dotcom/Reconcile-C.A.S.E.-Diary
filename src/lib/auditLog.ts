import { AuditEntry, Role } from "@/config/rcms";
import { supabase } from "@/integrations/supabase/client";

export function createAuditEntry(
  action: string,
  caseId: string,
  actorRole: Role,
  actorId: string = "user-001"
): AuditEntry {
  return {
    ts: new Date().toISOString(),
    actorRole,
    actorId,
    action,
    caseId,
  };
}

export function logAudit(
  audit: AuditEntry[],
  action: string,
  caseId: string,
  actorRole: Role,
  actorId?: string
): AuditEntry[] {
  const entry = createAuditEntry(action, caseId, actorRole, actorId);
  return [...audit, entry];
}

/**
 * Enhanced audit logging to Supabase
 * Logs actions to the audit_logs table with metadata
 */
export async function logToDatabase(
  action: string,
  caseId?: string,
  actorRole?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        actor_id: user?.id,
        actor_role: actorRole,
        action,
        case_id: caseId,
        meta: metadata || {},
      });

    if (error) {
      console.error('Error logging to database:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception logging to database:', error);
    return { success: false, error: 'Failed to log audit entry' };
  }
}

/**
 * Log client-related actions with enhanced metadata
 */
export async function logClientAction(
  action: 'CREATED' | 'STATUS_CHANGED' | 'CONVERTED' | 'PURGED',
  caseId: string,
  oldValue?: string,
  newValue?: string,
  additionalMeta?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  return await logToDatabase(
    `client_${action.toLowerCase()}`,
    caseId,
    undefined,
    {
      old_value: oldValue,
      new_value: newValue,
      ...additionalMeta,
    }
  );
}
