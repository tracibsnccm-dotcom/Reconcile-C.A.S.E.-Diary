/**
 * Emergency Alert System with HIPAA-Compliant Disclosure Controls
 * 
 * This module handles creating emergency/crisis alerts while respecting
 * client consent for attorney notification and maintaining audit trails.
 */

import { supabase } from "@/integrations/supabase/client";

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DisclosureScope = 'internal' | 'minimal' | 'full';

interface CreateEmergencyAlertParams {
  caseId: string;
  clientId: string;
  alertType: 'crisis' | 'wellness_check' | 'emergency_referral' | 'safety_concern';
  severity: AlertSeverity;
  internalMessage: string; // Full details for RN/care team
  minimalMessage?: string; // Attorney-safe minimal message
  metadata?: Record<string, any>;
}

interface AlertResult {
  success: boolean;
  alertId?: string;
  attorneyNotified: boolean;
  error?: string;
}

/**
 * Creates an emergency alert and notifies attorney if client has given consent
 * 
 * Workflow:
 * 1. Check client's attorney notification consent
 * 2. Create alert with appropriate disclosure scope
 * 3. If consent given, create minimal attorney notification
 * 4. Log disclosure event for audit trail
 */
export async function createEmergencyAlert(
  params: CreateEmergencyAlertParams
): Promise<AlertResult> {
  const {
    caseId,
    clientId,
    alertType,
    severity,
    internalMessage,
    minimalMessage,
    metadata = {},
  } = params;

  try {
    // Step 1: Check client's attorney notification consent
    const { data: preferences, error: prefError } = await supabase
      .from('client_preferences')
      .select('id, attorney_notify_consent, revoked, consent_signed_at')
      .eq('client_id', clientId)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      // PGRST116 = not found, which is OK (no consent given)
      console.error('Error checking consent:', prefError);
    }

    const hasConsent = preferences?.attorney_notify_consent && !preferences?.revoked;

    // Step 2: Determine disclosure scope
    // Critical alerts default to internal unless consent is given
    const disclosureScope: DisclosureScope = hasConsent ? 'minimal' : 'internal';

    // Step 3: Create the alert
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: alert, error: alertError } = await supabase
      .from('case_alerts')
      .insert({
        case_id: caseId,
        alert_type: alertType,
        severity,
        message: internalMessage,
        disclosure_scope: disclosureScope,
        created_by: user?.id,
        metadata: {
          ...metadata,
          consent_checked: true,
          consent_given: hasConsent,
        },
      })
      .select()
      .single();

    if (alertError) {
      return {
        success: false,
        attorneyNotified: false,
        error: alertError.message,
      };
    }

    let attorneyNotified = false;

    // Step 4: If consent given, notify attorney with MINIMAL disclosure
    if (hasConsent && alert) {
      // Get attorney assigned to this case
      const { data: assignments } = await supabase
        .from('case_assignments')
        .select('user_id')
        .eq('case_id', caseId)
        .eq('role', 'ATTORNEY');

      if (assignments && assignments.length > 0) {
        const attorneyId = assignments[0].user_id;

        // Create minimal message for attorney
        const attorneyMessage = minimalMessage || 
          `Client crisis reported; RN referral initiated. [Case Alert #${alert.id.slice(0, 8)}]`;

        // Create in-app message notification with minimal disclosure
        await supabase
          .from('messages')
          .insert({
            case_id: caseId,
            sender_id: user?.id || clientId,
            recipient_role: 'ATTORNEY',
            subject: '🚨 Client Emergency - Minimal Disclosure Notice',
            message_text: attorneyMessage,
            status: 'pending',
          });

        // Step 5: Log the disclosure for audit trail
        await supabase
          .from('disclosure_log')
          .insert({
            case_id: caseId,
            alert_id: alert.id,
            authorization_id: preferences?.id,
            disclosed_to_user_id: attorneyId,
            disclosed_to_role: 'ATTORNEY',
            disclosure_scope: 'minimal',
            disclosure_reason: `Client authorized emergency notification. Alert type: ${alertType}`,
            disclosed_by: user?.id,
            metadata: {
              alert_severity: severity,
              consent_signed_at: preferences?.consent_signed_at,
            },
          });

        attorneyNotified = true;
      }
    }

    return {
      success: true,
      alertId: alert.id,
      attorneyNotified,
    };

  } catch (error) {
    console.error('Error creating emergency alert:', error);
    return {
      success: false,
      attorneyNotified: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Allows client to revoke their emergency notification consent
 */
export async function revokeEmergencyConsent(clientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('client_preferences')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq('client_id', clientId);

    return !error;
  } catch (error) {
    console.error('Error revoking consent:', error);
    return false;
  }
}

/**
 * Allows client to restore their emergency notification consent
 */
export async function restoreEmergencyConsent(clientId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('client_preferences')
      .update({
        revoked: false,
        revoked_at: null,
        consent_signed_at: new Date().toISOString(), // Update timestamp
      })
      .eq('client_id', clientId);

    return !error;
  } catch (error) {
    console.error('Error restoring consent:', error);
    return false;
  }
}

/**
 * Get client's current emergency notification consent status
 */
export async function getEmergencyConsentStatus(clientId: string) {
  const { data, error } = await supabase
    .from('client_preferences')
    .select('attorney_notify_consent, revoked, consent_signed_at, consent_expires_at')
    .eq('client_id', clientId)
    .single();

  if (error) {
    return {
      hasConsent: false,
      isActive: false,
      signedAt: null,
      expiresAt: null,
    };
  }

  const isActive = data.attorney_notify_consent && 
                   !data.revoked && 
                   (!data.consent_expires_at || new Date(data.consent_expires_at) > new Date());

  return {
    hasConsent: data.attorney_notify_consent,
    isActive,
    signedAt: data.consent_signed_at,
    expiresAt: data.consent_expires_at,
  };
}
