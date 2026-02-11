/**
 * Client-side audit logger for attorney exports of released RN case snapshots.
 * 
 * This module provides utilities to log export events to the rc_export_audit table.
 * All logging is best-effort and will not break the export UX if it fails.
 */

import { supabase } from "@/integrations/supabase/client";

export type ExportAction = 'PRINT_PDF' | 'DOWNLOAD_TEXT';
export type ExportFormat = 'PDF' | 'TEXT';

export interface LogExportAuditParams {
  attorneyId?: string | null;
  clientId?: string | null;
  revisionChainRootCaseId: string;
  releasedCaseId: string;
  exportAction: ExportAction;
  exportFormat: ExportFormat;
  exportLabel?: string;
  fileName?: string;
  userAgent?: string;
  meta?: Record<string, any>;
}

/**
 * Small helper to validate that a string is a valid UUID format.
 * UUIDs follow the pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
function isUuid(v: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(v);
}

/**
 * Resolves a display identifier (e.g., "CASE-001") to the actual UUID from rc_cases.
 * If input is already a UUID, returns it as-is.
 * 
 * @param input - Either a UUID or a display identifier like "CASE-001"
 * @returns The UUID from rc_cases.id, or null if not found
 */
async function resolveReleasedCaseUuid(input: string): Promise<string | null> {
  // If input is already a UUID, return it
  if (isUuid(input)) {
    return input;
  }

  // Otherwise, treat input as a display identifier and look up the actual UUID
  try {
    const { data, error } = await supabase
      .schema('public')
      .from('rc_cases')
      .select('id, revision_of_case_id, created_at, case_status')
      .eq('case_number', input)
      .eq('is_superseded', false)
      .in('case_status', ['released', 'closed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[EXPORT AUDIT] Error resolving released case UUID:', error);
      return null;
    }

    if (data) {
      return data.id;
    }

    return null;
  } catch (error) {
    console.warn('[EXPORT AUDIT] Exception resolving released case UUID:', error);
    return null;
  }
}

/**
 * Logs an attorney export event to the audit trail.
 * 
 * This is a best-effort operation. Failures are caught and logged but will not
 * interrupt the export process.
 * 
 * Note: attorney_user_id is NOT included in the insert payload. The database
 * trigger will automatically set it to auth.uid().
 * 
 * @param params - Export audit parameters
 */
export async function logExportAudit(params: LogExportAuditParams): Promise<void> {
  // TEMP: Diagnostic logging at function entry
  console.info('[EXPORT AUDIT] called', {
    releasedCaseId: params.releasedCaseId,
    exportAction: params.exportAction,
    exportFormat: params.exportFormat,
  });

  try {
    // Resolve releasedCaseId to actual UUID (handles display IDs like "CASE-001")
    const releasedUuid = await resolveReleasedCaseUuid(params.releasedCaseId);
    
    if (!releasedUuid) {
      console.warn('[EXPORT AUDIT] could not resolve releasedCaseId to UUID', params.releasedCaseId);
      // Best-effort: do not throw, just return silently
      return;
    }

    // Get the case data to determine revision chain root
    // If we resolved a row from rc_cases, we can use its revision_of_case_id to find the root
    let revisionChainRootUuid: string = releasedUuid; // Default fallback

    try {
      const { data: caseData } = await supabase
        .schema('public')
        .from('rc_cases')
        .select('id, revision_of_case_id')
        .eq('id', releasedUuid)
        .maybeSingle();

      if (caseData && caseData.revision_of_case_id && isUuid(caseData.revision_of_case_id)) {
        // Walk up the chain to find the root
        let currentId: string | null = caseData.revision_of_case_id;
        const visited = new Set<string>([releasedUuid]);
        
        while (currentId && !visited.has(currentId)) {
          visited.add(currentId);
          const { data: parentData } = await supabase
            .schema('public')
            .from('rc_cases')
            .select('id, revision_of_case_id')
            .eq('id', currentId)
            .maybeSingle();
          
          if (!parentData || !parentData.revision_of_case_id) {
            // Found the root
            revisionChainRootUuid = currentId;
            break;
          }
          
          currentId = parentData.revision_of_case_id;
        }
      }
      // If no revision_of_case_id or it's not a UUID, use releasedUuid as chain root (safe fallback)
    } catch (error) {
      console.warn('[EXPORT AUDIT] Error getting case data for chain root:', error);
      // Continue with releasedUuid as fallback
    }

    // Handle revisionChainRootCaseId from params
    // If it's a UUID, use it; otherwise use the resolved chain root
    let finalRevisionChainRootCaseId: string;
    if (isUuid(params.revisionChainRootCaseId)) {
      finalRevisionChainRootCaseId = params.revisionChainRootCaseId;
    } else {
      // Use the resolved chain root from database query
      finalRevisionChainRootCaseId = revisionChainRootUuid;
    }

    const {
      attorneyId,
      clientId,
      exportAction,
      exportFormat,
      exportLabel = 'Export Released RN Case Snapshot',
      fileName,
      userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      meta = {},
    } = params;

    // Build the payload
    const payload = {
      // attorney_user_id is NOT included - database trigger handles this
      attorney_id: attorneyId || null,
      client_id: clientId || null,
      revision_chain_root_case_id: finalRevisionChainRootCaseId,
      released_case_id: releasedUuid,
      export_action: exportAction,
      export_format: exportFormat,
      export_label: exportLabel,
      file_name: fileName || null,
      user_agent: userAgent || null,
      meta: meta,
    };

    // TEMP: Diagnostic logging - Supabase URL and payload
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    console.info('[EXPORT AUDIT] supabase url', supabaseUrl);
    console.info('[EXPORT AUDIT] payload', payload);

    // Note: attorney_user_id is NOT included in the insert payload.
    // The database trigger will automatically set it to auth.uid().
    // Use explicit public schema to avoid schema cache issues.
    // Use array syntax for insert and select back the inserted row.
    const { data, error } = await supabase
      .schema('public')
      .from('rc_export_audit')
      .insert([payload])
      .select('id, created_at')
      .single();

    if (error) {
      // TEMP: Detailed diagnostic logging for insert failures
      console.warn('[EXPORT AUDIT] insert failed', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    } else {
      // TEMP: Diagnostic logging for successful insert
      console.info('[EXPORT AUDIT] insert ok', data);
    }
  } catch (error) {
    // TEMP: Diagnostic logging for unexpected errors
    console.warn('[EXPORT AUDIT] insert failed', error);
    // Best-effort: catch any unexpected errors and log minimally
    // Do NOT throw - this must not interrupt export behavior
  }
}

/**
 * Generates a conservative filename for exported case snapshots.
 * 
 * Uses a safe pattern that avoids PHI. Prefers using case_id if available,
 * otherwise falls back to a generic timestamp-based pattern.
 * 
 * @param caseMeta - Optional case metadata (client_last_name, case_id, released_at)
 * @param format - Export format ('PDF' or 'TEXT')
 * @returns Safe filename string (e.g., "RN_Snapshot_<caseId>.pdf" or "RN_Snapshot_<timestamp>.txt")
 */
export function getExportFileName(
  caseMeta: { client_last_name?: string; case_id?: string; released_at?: string },
  format: 'PDF' | 'TEXT'
): string {
  const extension = format === 'PDF' ? 'pdf' : 'txt';
  
  // Conservative approach: use case_id if available (treating it as releasedCaseId equivalent)
  // Extract last segment of UUID for brevity
  if (caseMeta.case_id) {
    const caseIdSegment = caseMeta.case_id.split('-').pop()?.substring(0, 8) || caseMeta.case_id.substring(0, 8);
    return `RN_Snapshot_${caseIdSegment}.${extension}`;
  }
  
  // Fallback: use timestamp from released_at or current date
  const timestamp = caseMeta.released_at 
    ? new Date(caseMeta.released_at).toISOString().split('T')[0].replace(/-/g, '')
    : new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  return `RN_Snapshot_${timestamp}.${extension}`;
}
