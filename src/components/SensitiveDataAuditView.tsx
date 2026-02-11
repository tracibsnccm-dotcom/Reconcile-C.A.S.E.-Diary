import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, Clock, User, FileText, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SensitiveDataAuditViewProps {
  caseId: string;
}

interface AuditEntry {
  id: string;
  item_code: string;
  category: string;
  selected: boolean;
  risk_level: string | null;
  consent_attorney: string;
  consent_provider: string;
  consent_ts: string | null;
  audit_event: string;
  audit_note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  creator_name?: string;
}

export function SensitiveDataAuditView({ caseId }: SensitiveDataAuditViewProps) {
  const [auditData, setAuditData] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAuditData() {
      setIsLoading(true);
      try {
        // Fetch all disclosure records (including deselected) for audit trail
        const { data: disclosures, error } = await supabase
          .from('client_sensitive_disclosures')
          .select('*')
          .eq('case_id', caseId)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        // Fetch creator names
        if (disclosures) {
          const uniqueCreators = [...new Set(disclosures.map(d => d.created_by).filter(Boolean))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', uniqueCreators);

          const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

          const enrichedData = disclosures.map(d => ({
            ...d,
            creator_name: d.created_by ? profileMap.get(d.created_by) || 'Unknown' : 'System'
          }));

          setAuditData(enrichedData);
        }
      } catch (error) {
        console.error('Error loading audit data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAuditData();
  }, [caseId]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading audit data...</div>
      </Card>
    );
  }

  if (auditData.length === 0) {
    return (
      <Card className="p-6">
        <Alert>
          <AlertDescription>
            No sensitive disclosures have been recorded for this case yet.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // Group by category
  const selectedItems = auditData.filter(d => d.selected);
  const consentStatus = selectedItems[0];

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Sensitive Information Audit Trail</h3>
        <Badge variant="outline" className="ml-auto">
          {selectedItems.length} Active Disclosure{selectedItems.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Consent Status Summary */}
      {consentStatus && (
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <h4 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Current Consent Status
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Attorney Sharing:</span>{' '}
              <Badge variant={consentStatus.consent_attorney === 'share' ? 'default' : 'secondary'}>
                {consentStatus.consent_attorney === 'share' ? '✓ Granted' : 
                 consentStatus.consent_attorney === 'no_share' ? '✗ Denied' : '⚠ Not Set'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Provider Sharing:</span>{' '}
              <Badge variant={consentStatus.consent_provider === 'share' ? 'default' : 'secondary'}>
                {consentStatus.consent_provider === 'share' ? '✓ Granted' : 
                 consentStatus.consent_provider === 'no_share' ? '✗ Denied' : '⚠ Not Set'}
              </Badge>
            </div>
          </div>
          {consentStatus.consent_ts && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Clock className="h-3 w-3" />
              Consent updated: {format(new Date(consentStatus.consent_ts), 'MMM dd, yyyy h:mm a')}
            </div>
          )}
        </div>
      )}

      <Separator />

      {/* Active Disclosures */}
      <div className="space-y-4">
        <h4 className="font-medium">Active Disclosures</h4>
        {selectedItems.map((item) => (
          <div key={item.id} className="p-4 border rounded-lg space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium">{item.item_code.replace(/_/g, ' ')}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  Category: {item.category.replace(/_/g, ' ')}
                </div>
              </div>
              {item.risk_level && (
                <Badge 
                  variant={
                    item.risk_level === 'RED' ? 'destructive' : 
                    item.risk_level === 'ORANGE' ? 'default' : 'secondary'
                  }
                >
                  {item.risk_level} Risk
                </Badge>
              )}
            </div>
            
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <User className="h-3 w-3" />
                Reported by: {item.creator_name}
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                Added: {format(new Date(item.created_at), 'MMM dd, yyyy h:mm a')}
              </div>
              {item.updated_at !== item.created_at && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Last updated: {format(new Date(item.updated_at), 'MMM dd, yyyy h:mm a')}
                </div>
              )}
            </div>

            {item.audit_note && (
              <div className="text-xs bg-muted/50 p-2 rounded mt-2">
                <span className="font-medium">Note:</span> {item.audit_note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Deselected Items (History) */}
      {auditData.filter(d => !d.selected).length > 0 && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Previously Disclosed (History)</h4>
            <div className="space-y-2 opacity-60">
              {auditData.filter(d => !d.selected).map((item) => (
                <div key={item.id} className="p-3 border border-dashed rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span>{item.item_code.replace(/_/g, ' ')}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.audit_event}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.updated_at), 'MMM dd, yyyy h:mm a')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Warning for RN CM */}
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-900">
          <strong>RN CM Access Only:</strong> This audit view is restricted to clinical staff. 
          Information is shared with attorneys and providers only with explicit client consent.
        </AlertDescription>
      </Alert>
    </Card>
  );
}
