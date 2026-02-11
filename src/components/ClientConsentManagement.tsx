import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Shield, FileText, CheckCircle, XCircle, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { format } from "date-fns";
import { toast } from "sonner";

export function ClientConsentManagement({ caseId }: { caseId: string }) {
  const { user } = useAuth();
  const [consentData, setConsentData] = useState<any>(null);
  const [sensitiveDisclosures, setSensitiveDisclosures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConsentData();
    loadSensitiveDisclosures();
  }, [caseId, user?.id]);

  async function loadConsentData() {
    if (!caseId) {
      setLoading(false);
      return;
    }
    
    setError(null);
    try {
      // Query consent directly by case_id
      const { data: consentRecords, error: fetchError } = await supabase
        .from("rc_client_consents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error loading consent data:", fetchError);
        setError("Failed to load consent information");
        return;
      }

      if (consentRecords) {
        // Transform consent data to match expected format
        const hasServiceAgreement = !!consentRecords.service_agreement_signed_at && !consentRecords.service_agreement_declined;
        const hasLegalDisclosure = !!consentRecords.legal_disclosure_signed_at;
        const hasObtainRecords = !!consentRecords.obtain_records_signed_at;
        const hasHealthcareCoord = !!consentRecords.healthcare_coord_signed_at;
        const hasHipaa = !!consentRecords.hipaa_acknowledged_at;
        
        // All consents are signed if all required ones are present
        const allSigned = hasServiceAgreement && hasLegalDisclosure && hasObtainRecords && hasHealthcareCoord && hasHipaa;
        
        // Get the earliest signature date
        const signatureDates = [
          consentRecords.service_agreement_signed_at,
          consentRecords.legal_disclosure_signed_at,
          consentRecords.obtain_records_signed_at,
          consentRecords.healthcare_coord_signed_at,
          consentRecords.hipaa_acknowledged_at,
        ].filter(Boolean).sort();
        
        setConsentData({
          consent_signed: allSigned,
          consent_signed_at: signatureDates[0] || null,
          consent_attorney: hasLegalDisclosure ? 'authorized' : 'not_authorized',
          consent_providers: hasHealthcareCoord ? 'authorized' : 'not_authorized',
          consent_details: consentRecords, // Store full consent details
        });
      } else {
        // No consent records found for this case
        console.warn('No consent records found for case:', caseId);
        setConsentData({
          consent_signed: false,
          consent_signed_at: null,
          consent_attorney: 'not_authorized',
          consent_providers: 'not_authorized',
        });
      }
    } catch (err: any) {
      console.error("Error loading consent data:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function loadSensitiveDisclosures() {
    if (!caseId || !user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("client_sensitive_disclosures")
        .select("*")
        .eq("case_id", caseId)
        .eq("selected", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setSensitiveDisclosures(data);
      }
    } catch (err) {
      console.error("Error loading sensitive disclosures:", err);
    }
  }

  async function updateSensitiveConsent(consentType: 'attorney' | 'provider', value: 'share' | 'no_share') {
    if (!caseId || !user?.id) return;
    
    try {
      const field = consentType === 'attorney' ? 'consent_attorney' : 'consent_provider';
      
      const { error } = await supabase
        .from("client_sensitive_disclosures")
        .update({ 
          [field]: value,
          consent_ts: new Date().toISOString()
        })
        .eq("case_id", caseId)
        .eq("selected", true);

      if (error) throw error;
      
      toast.success(`Consent ${value === 'share' ? 'granted' : 'revoked'} for ${consentType}`);
      loadSensitiveDisclosures();
    } catch (err: any) {
      console.error("Error updating consent:", err);
      toast.error("Failed to update consent");
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              loadConsentData();
              loadSensitiveDisclosures();
            }}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!consentData && !caseId) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No case found. Please complete your intake or contact your RN Case Manager.
        </AlertDescription>
      </Alert>
    );
  }

  const hasDisclosures = sensitiveDisclosures.length > 0;
  const currentAttorneyConsent = sensitiveDisclosures[0]?.consent_attorney || 'unset';
  const currentProviderConsent = sensitiveDisclosures[0]?.consent_provider || 'unset';

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Your Privacy Rights:</strong> You control who can access your sensitive information. 
          You can update your consent choices at any time.
        </AlertDescription>
      </Alert>

      {/* General Consent Status */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-rcms-teal" />
          General Case Consent
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Case Management Consent</p>
              <p className="text-sm text-muted-foreground">Authorization for care coordination</p>
            </div>
            {consentData?.consent_signed ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Signed
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Not Signed
              </Badge>
            )}
          </div>
          
          {consentData?.consent_signed_at && (
            <p className="text-xs text-muted-foreground">
              Signed on {format(new Date(consentData.consent_signed_at), 'MMM dd, yyyy h:mm a')}
            </p>
          )}
        </div>
      </Card>

      <Separator />

      {/* Sensitive Information Consent */}
      {hasDisclosures ? (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-rcms-teal" />
            Sensitive Information Sharing
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            You have {sensitiveDisclosures.length} sensitive item{sensitiveDisclosures.length !== 1 ? 's' : ''} on record. 
            Choose who can access this information:
          </p>

          <div className="space-y-6">
            {/* Attorney Consent */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">Share with Attorney</p>
                  <p className="text-sm text-muted-foreground">
                    Allow your attorney to view sensitive information for case strategy
                  </p>
                </div>
                <Badge 
                  variant={currentAttorneyConsent === 'share' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {currentAttorneyConsent === 'share' ? 'Granted' : 
                   currentAttorneyConsent === 'no_share' ? 'Denied' : 'Not Set'}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={currentAttorneyConsent === 'share' ? 'default' : 'outline'}
                  onClick={() => updateSensitiveConsent('attorney', 'share')}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Allow Access
                </Button>
                <Button
                  size="sm"
                  variant={currentAttorneyConsent === 'no_share' ? 'destructive' : 'outline'}
                  onClick={() => updateSensitiveConsent('attorney', 'no_share')}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny Access
                </Button>
              </div>
            </div>

            {/* Provider Consent */}
            <div className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">Share with Healthcare Providers</p>
                  <p className="text-sm text-muted-foreground">
                    Allow providers to view sensitive information for better care coordination
                  </p>
                </div>
                <Badge 
                  variant={currentProviderConsent === 'share' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {currentProviderConsent === 'share' ? 'Granted' : 
                   currentProviderConsent === 'no_share' ? 'Denied' : 'Not Set'}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={currentProviderConsent === 'share' ? 'default' : 'outline'}
                  onClick={() => updateSensitiveConsent('provider', 'share')}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Allow Access
                </Button>
                <Button
                  size="sm"
                  variant={currentProviderConsent === 'no_share' ? 'destructive' : 'outline'}
                  onClick={() => updateSensitiveConsent('provider', 'no_share')}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny Access
                </Button>
              </div>
            </div>
          </div>

          {sensitiveDisclosures[0]?.consent_ts && (
            <p className="text-xs text-muted-foreground mt-4">
              Last updated: {format(new Date(sensitiveDisclosures[0].consent_ts), 'MMM dd, yyyy h:mm a')}
            </p>
          )}
        </Card>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You haven't disclosed any sensitive information. If you need to share sensitive details about your health or situation, 
            please contact your RN Case Manager or use the Sensitive Experiences section during intake.
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-900">
          <strong>Important:</strong> Your RN Case Manager always has access to sensitive information 
          to ensure your safety and proper care coordination, regardless of these settings.
        </AlertDescription>
      </Alert>
    </div>
  );
}
