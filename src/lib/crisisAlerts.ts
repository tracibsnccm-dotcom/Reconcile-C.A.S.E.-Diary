/**
 * Crisis Alert Management System
 * 
 * Handles creation of crisis alerts with HIPAA-compliant disclosure controls.
 * Implements the emergency notification workflow with consent-based attorney notifications.
 */

import { supabase } from "@/integrations/supabase/client";

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DisclosureScope = 'internal' | 'minimal' | 'full';

export interface CrisisAlertParams {
  caseId: string;
  alertType: string;
  severity: AlertSeverity;
  internalMessage: string; // Full details for RN/care team
  minimalMessage?: string; // Attorney-safe message (no PHI)
  metadata?: Record<string, any>;
}

/**
 * Creates a crisis alert and handles attorney notification based on client consent.
 * 
 * Workflow:
 * 1. Check client's attorney notification consent
 * 2. Create internal alert for RN/care team (full details)
 * 3. If consent granted, create minimal alert for attorney (no PHI)
 * 4. Log disclosure event for HIPAA audit trail
 */
export async function createCrisisAlert(params: CrisisAlertParams) {
  const { caseId, alertType, severity, internalMessage, minimalMessage, metadata } = params;

  try {
    // Get current user (should be RN_CCM)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get client ID from case assignments
    const { data: clientAssignment, error: assignmentError } = await supabase
      .from('case_assignments')
      .select('user_id')
      .eq('case_id', caseId)
      .eq('role', 'CLIENT')
      .single();

    if (assignmentError || !clientAssignment) {
      throw new Error("Could not find client for case");
    }

    const clientId = clientAssignment.user_id;

    // Check client's attorney notification consent
    const { data: preferences, error: prefError } = await supabase
      .from('client_preferences')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();

    if (prefError) {
      console.error("Error fetching client preferences:", prefError);
    }

    const hasConsent = preferences?.attorney_notify_consent === true && !preferences?.revoked;

    // Create internal alert (full details for care team)
    const { data: internalAlert, error: internalError } = await supabase
      .from('case_alerts')
      .insert({
        case_id: caseId,
        alert_type: alertType,
        severity,
        message: internalMessage,
        disclosure_scope: 'internal',
        created_by: user.id,
        metadata: {
          ...metadata,
          consent_checked: true,
          consent_granted: hasConsent,
        }
      })
      .select()
      .single();

    if (internalError) {
      throw new Error(`Failed to create internal alert: ${internalError.message}`);
    }

    // If client gave consent, create minimal attorney notification
    if (hasConsent) {
      // Get attorney user_id from case assignments
      const { data: attorneyAssignment } = await supabase
        .from('case_assignments')
        .select('user_id')
        .eq('case_id', caseId)
        .eq('role', 'ATTORNEY')
        .maybeSingle();

      if (attorneyAssignment) {
        const attorneyMessage = minimalMessage || 
          "Client crisis reported; RN referral initiated. No medical details disclosed per HIPAA minimum necessary standard.";

        // Create minimal disclosure alert for attorney
        const { data: attorneyAlert, error: attorneyError } = await supabase
          .from('case_alerts')
          .insert({
            case_id: caseId,
            alert_type: 'crisis_notification',
            severity: 'medium',
            message: attorneyMessage,
            disclosure_scope: 'minimal',
            created_by: user.id,
            metadata: {
              parent_alert_id: internalAlert.id,
              disclosure_authorized: true,
            }
          })
          .select()
          .single();

        if (attorneyError) {
          console.error("Failed to create attorney alert:", attorneyError);
        } else {
          // Log disclosure event for audit trail
          await supabase
            .from('disclosure_log')
            .insert({
              case_id: caseId,
              alert_id: attorneyAlert.id,
              authorization_id: preferences?.id,
              disclosed_to_user_id: attorneyAssignment.user_id,
              disclosed_to_role: 'ATTORNEY',
              disclosure_scope: 'minimal',
              disclosure_reason: 'Client emergency referral - consent on file',
              disclosed_by: user.id,
              metadata: {
                alert_type: alertType,
                severity,
                internal_alert_id: internalAlert.id,
              }
            });
        }
      }
    }

    return {
      success: true,
      alertId: internalAlert.id,
      consentGranted: hasConsent,
      message: hasConsent 
        ? "Alert created. Attorney has been notified per client consent."
        : "Alert created. Attorney notification withheld per client preference.",
    };

  } catch (error) {
    console.error("Error creating crisis alert:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Allows client to revoke attorney notification consent
 */
export async function revokeAttorneyNotificationConsent(clientId: string) {
  const { error } = await supabase
    .from('client_preferences')
    .update({
      revoked: true,
      revoked_at: new Date().toISOString(),
    })
    .eq('client_id', clientId);

  if (error) {
    throw new Error(`Failed to revoke consent: ${error.message}`);
  }

  return { success: true, message: "Attorney notification consent revoked successfully." };
}

/**
 * Re-enables attorney notification consent (if previously revoked)
 */
export async function reinstateAttorneyNotificationConsent(clientId: string) {
  const { error } = await supabase
    .from('client_preferences')
    .update({
      attorney_notify_consent: true,
      revoked: false,
      revoked_at: null,
      consent_signed_at: new Date().toISOString(),
    })
    .eq('client_id', clientId);

  if (error) {
    throw new Error(`Failed to reinstate consent: ${error.message}`);
  }

  return { success: true, message: "Attorney notification consent reinstated successfully." };
}
