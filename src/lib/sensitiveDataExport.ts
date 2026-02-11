import { supabase } from "@/integrations/supabase/client";

/**
 * Filter sensitive disclosures based on disclosure scope and viewer role
 * 
 * Disclosure scopes:
 * - 'internal': Only RN CM, Staff, Compliance can see
 * - 'minimal': Internal + Attorney (limited details)
 * - 'full': All authorized parties can see full details
 */
export async function filterSensitiveDataForExport(
  caseId: string,
  viewerRole: string
): Promise<{
  alerts: any[];
  disclosures: any[];
  canViewSensitive: boolean;
}> {
  const internalRoles = ['RN_CCM', 'STAFF', 'SUPER_USER', 'SUPER_ADMIN', 'COMPLIANCE'];
  const canViewInternal = internalRoles.includes(viewerRole);
  const isAttorney = viewerRole === 'ATTORNEY';

  // Fetch case alerts with disclosure scope
  const { data: allAlerts } = await supabase
    .from('case_alerts')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false });

  // Filter alerts based on disclosure scope
  let filteredAlerts = allAlerts || [];
  
  if (!canViewInternal) {
    // Attorneys can only see 'minimal' and 'full' scope alerts
    filteredAlerts = filteredAlerts.filter(alert => 
      alert.disclosure_scope === 'minimal' || alert.disclosure_scope === 'full'
    );
  }

  // Fetch sensitive disclosures
  const { data: allDisclosures } = await supabase
    .from('client_sensitive_disclosures')
    .select('*')
    .eq('case_id', caseId)
    .eq('selected', true);

  let filteredDisclosures = allDisclosures || [];

  // Filter disclosures based on consent
  if (isAttorney) {
    // Attorneys only see items where consent_attorney = 'share'
    filteredDisclosures = filteredDisclosures.filter(d => 
      d.consent_attorney === 'share'
    );
  }

  // For minimal disclosure to attorney, redact free_text
  if (isAttorney) {
    filteredDisclosures = filteredDisclosures.map(d => ({
      ...d,
      free_text: d.consent_attorney === 'share' ? d.free_text : '[Redacted - No consent]'
    }));
  }

  return {
    alerts: filteredAlerts,
    disclosures: filteredDisclosures,
    canViewSensitive: canViewInternal || isAttorney
  };
}

/**
 * Get sanitized sensitive data summary for PDF export
 */
export async function getSensitiveDataSummaryForPDF(
  caseId: string,
  viewerRole: string
): Promise<string> {
  const { alerts, disclosures, canViewSensitive } = await filterSensitiveDataForExport(
    caseId,
    viewerRole
  );

  if (!canViewSensitive) {
    return 'Sensitive information is not available in this export due to access restrictions.';
  }

  let summary = '';

  // Add critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  if (criticalAlerts.length > 0) {
    summary += `\n⚠️ CRITICAL SAFETY ALERTS (${criticalAlerts.length}):\n`;
    criticalAlerts.forEach(alert => {
      summary += `- ${alert.message} (${new Date(alert.created_at).toLocaleDateString()})\n`;
    });
  }

  // Add high-priority alerts
  const highAlerts = alerts.filter(a => a.severity === 'high');
  if (highAlerts.length > 0) {
    summary += `\n⚠️ HIGH PRIORITY ALERTS (${highAlerts.length}):\n`;
    highAlerts.forEach(alert => {
      summary += `- ${alert.message} (${new Date(alert.created_at).toLocaleDateString()})\n`;
    });
  }

  // Add disclosure summary
  if (disclosures.length > 0) {
    summary += `\n🔒 SENSITIVE DISCLOSURES (${disclosures.length} items):\n`;
    
    const categories = {
      substance_use: 'Substance Use/Dependency',
      safety_trauma: 'Safety & Trauma History',
      stressors: 'Current Stressors/Barriers'
    };

    Object.entries(categories).forEach(([key, label]) => {
      const items = disclosures.filter(d => d.category === key);
      if (items.length > 0) {
        summary += `\n${label}: ${items.length} item(s) disclosed\n`;
        
        // Only show details for internal roles
        if (viewerRole !== 'ATTORNEY') {
          items.forEach(item => {
            summary += `  - ${item.item_code.replace(/_/g, ' ')} (Risk: ${item.risk_level || 'N/A'})\n`;
            if (item.free_text) {
              summary += `    Note: ${item.free_text}\n`;
            }
          });
        }
      }
    });

    // Add consent status
    if (disclosures[0]) {
      summary += `\nConsent Status:\n`;
      summary += `- Attorney: ${disclosures[0].consent_attorney === 'share' ? 'Granted' : 'Not Granted'}\n`;
      summary += `- Providers: ${disclosures[0].consent_provider === 'share' ? 'Granted' : 'Not Granted'}\n`;
    }
  }

  return summary || 'No sensitive disclosures or alerts on file.';
}
