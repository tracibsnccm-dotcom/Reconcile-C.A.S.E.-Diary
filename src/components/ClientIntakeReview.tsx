import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Calendar, MapPin, Stethoscope, Activity, Info, Shield, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export function ClientIntakeReview({ caseId }: { caseId: string }) {
  const { user } = useAuth();
  const [caseData, setCaseData] = useState<any>(null);
  const [intakeData, setIntakeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntakeData();
  }, [caseId, user?.id]);

  async function loadIntakeData() {
    if (!caseId || !user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Fetch case data
      const { data: caseDataResult, error: caseError } = await supabase
        .from("rc_cases")
        .select("*")
        .eq("id", caseId)
        .eq("is_superseded", false)
        .maybeSingle();

      if (caseError && caseError.code !== 'PGRST116') {
        console.error("Error loading case data:", caseError);
        setError("Failed to load case information");
        return;
      }

      // Fetch intake data to get receipt
      const { data: intakeResult, error: intakeError } = await supabase
        .from("rc_client_intakes")
        .select("id, intake_json, attorney_attested_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (intakeError && intakeError.code !== 'PGRST116') {
        console.error("Error loading intake data:", intakeError);
      }

      if (caseDataResult) {
        setCaseData(caseDataResult);
      } else {
        setError("No case data found");
      }

      if (intakeResult) {
        setIntakeData(intakeResult);
      }
    } catch (err: any) {
      console.error("Error loading intake data:", err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
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
            onClick={loadIntakeData}
            className="ml-4"
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!caseData) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No intake information available yet. Please complete your intake form or contact your RN Case Manager if you believe this is an error.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          This is your submitted intake information. If you need to update anything, please contact your RN Case Manager.
        </AlertDescription>
      </Alert>

      {/* Case Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-rcms-teal" />
          Case Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Case ID</p>
            <p className="font-medium">{caseData.client_label || `RC-${caseData.id.slice(-8)}`}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge>{caseData.status}</Badge>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Date Created</p>
            <p className="font-medium">
              {format(new Date(caseData.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Attorney Code</p>
            <p className="font-medium">{caseData.attorney_code || 'Not Assigned'}</p>
          </div>
        </div>
      </Card>

      {/* Incident Information */}
      {caseData.incident_type && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-rcms-teal" />
            Incident Details
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Type of Incident</p>
              <p className="font-medium">{caseData.incident_type}</p>
            </div>
            
            {caseData.incident_date && (
              <div>
                <p className="text-sm text-muted-foreground">Incident Date</p>
                <p className="font-medium">
                  {format(new Date(caseData.incident_date), 'MMM dd, yyyy')}
                </p>
              </div>
            )}
            
            {caseData.incident_location && (
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="font-medium">{caseData.incident_location}</p>
                </div>
              </div>
            )}
            
            {caseData.incident_description && (
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">{caseData.incident_description}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Initial Health Information */}
      {(caseData.initial_pain_level || caseData.initial_injuries) && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <Stethoscope className="w-5 h-5 text-rcms-teal" />
            Initial Health Information
          </h3>
          
          <div className="space-y-3">
            {caseData.initial_pain_level && (
              <div>
                <p className="text-sm text-muted-foreground">Initial Pain Level</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-lg">{caseData.initial_pain_level}/10</p>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-rcms-teal h-2 rounded-full transition-all"
                      style={{ width: `${(caseData.initial_pain_level / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {caseData.initial_injuries && (
              <div>
                <p className="text-sm text-muted-foreground">Reported Injuries</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(typeof caseData.initial_injuries === 'string' 
                    ? caseData.initial_injuries.split(',') 
                    : caseData.initial_injuries
                  ).map((injury: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {injury.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Baseline Metrics */}
      {(caseData.baseline_physical || caseData.baseline_psychological) && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-rcms-teal" />
            Baseline 4 P's Assessment
          </h3>
          
          <div className="space-y-4">
            {caseData.baseline_physical && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Physical</span>
                  <span className="text-sm text-muted-foreground">{caseData.baseline_physical}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${caseData.baseline_physical}%` }}
                  />
                </div>
              </div>
            )}
            
            {caseData.baseline_psychological && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Psychological</span>
                  <span className="text-sm text-muted-foreground">{caseData.baseline_psychological}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${caseData.baseline_psychological}%` }}
                  />
                </div>
              </div>
            )}
            
            {caseData.baseline_psychosocial && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Psychosocial</span>
                  <span className="text-sm text-muted-foreground">{caseData.baseline_psychosocial}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `${caseData.baseline_psychosocial}%` }}
                  />
                </div>
              </div>
            )}
            
            {caseData.baseline_purpose && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Purpose</span>
                  <span className="text-sm text-muted-foreground">{caseData.baseline_purpose}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${caseData.baseline_purpose}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Attorney Confirmation Receipt */}
      {intakeData?.intake_json?.compliance?.attorney_confirmation_receipt && (
        <Card className="p-6 border-green-500">
          <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            Attorney Confirmation Receipt
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Confirmed at</p>
              <p className="font-medium">
                {new Date(intakeData.intake_json.compliance.attorney_confirmation_receipt.confirmed_at).toLocaleString()}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Confirmed by</p>
              <p className="font-medium">
                {intakeData.intake_json.compliance.attorney_confirmation_receipt.confirmed_by?.includes('@')
                  ? intakeData.intake_json.compliance.attorney_confirmation_receipt.confirmed_by.split('@')[0] + '@***'
                  : intakeData.intake_json.compliance.attorney_confirmation_receipt.confirmed_by}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Action</p>
              <Badge variant={intakeData.intake_json.compliance.attorney_confirmation_receipt.action === 'CONFIRMED_CLIENT_RELATIONSHIP' ? 'default' : 'outline'}>
                {intakeData.intake_json.compliance.attorney_confirmation_receipt.action}
              </Badge>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
