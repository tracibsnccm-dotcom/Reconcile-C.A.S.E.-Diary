import {
  recordGovernanceEvent,
  type GovernanceEventPayload,
} from "@/lib/governanceNotes";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enhanced audit logging service for client lifecycle events
 */
export class ClientAuditService {
  /**
   * Log client creation event
   */
  static async logClientCreated(
    caseId: string,
    clientNumber: string,
    clientType: string,
    userId?: string
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        action: 'CLIENT_CREATED',
        case_id: caseId,
        actor_id: userId || null,
        actor_role: 'STAFF',
        meta: {
          client_number: clientNumber,
          client_type: clientType,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging client creation:', error);
    }
  }

  /**
   * Log status change event
   */
  static async logStatusChange(
    caseId: string,
    oldStatus: string,
    newStatus: string,
    userId?: string
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        action: 'STATUS_CHANGED',
        case_id: caseId,
        actor_id: userId || null,
        actor_role: 'STAFF',
        meta: {
          old_status: oldStatus,
          new_status: newStatus,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging status change:', error);
    }
  }

  /**
   * Log client conversion event
   */
  static async logClientConverted(
    originalCaseId: string,
    newClientId: string,
    attorneyCode: string,
    userId?: string
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        action: 'CLIENT_CONVERTED',
        case_id: originalCaseId,
        actor_id: userId || null,
        actor_role: 'STAFF',
        meta: {
          new_client_id: newClientId,
          attorney_code: attorneyCode,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging client conversion:', error);
    }
  }

  /**
   * Log purged intake event
   */
  static async logIntakePurged(
    caseId: string,
    clientNumber: string,
    reason: string = 'Abandoned for 7+ days'
  ): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        action: 'INTAKE_PURGED',
        case_id: caseId,
        actor_role: 'SYSTEM',
        meta: {
          client_number: clientNumber,
          reason,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error logging intake purge:', error);
    }
  }

  /**
   * Record an immutable governance event (RN team changes, handoffs, etc.).
   * Delegates to recordGovernanceEvent; uses audit_logs table.
   */
  static async logGovernanceEvent(
    payload: GovernanceEventPayload
  ): Promise<{ id: string } | null> {
    try {
      return await recordGovernanceEvent(payload);
    } catch (error) {
      console.error("Error recording governance event:", error);
      return null;
    }
  }

  /**
   * Get audit trail for a specific case
   */
  static async getCaseAuditTrail(caseId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('case_id', caseId)
        .order('ts', { ascending: false });

      if (error) {
        console.error('Error fetching audit trail:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Exception fetching audit trail:', error);
      return [];
    }
  }
}
