import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface WorkQueueCase {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
  fourp_scores: {
    physical?: number;
    psychological?: number;
    psychosocial?: number;
    professional?: number;
  } | null;
  viability_index: number | null;
  active_flags_count: number;
  last_checkin_date: string | null;
  care_plan_status: string | null;
  is_pending: boolean;
}

export function WorkQueue() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingCases, setPendingCases] = useState<WorkQueueCase[]>([]);
  const [activeCases, setActiveCases] = useState<WorkQueueCase[]>([]);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth to finish loading before attempting to fetch data
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchWorkQueue();
  }, [user?.id, authLoading]);

  async function fetchWorkQueue() {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('WorkQueue: Fetching for auth user ID:', user.id);
      
      // First, get the rc_users.id from auth_user_id
      // rn_cm_id in rc_cases stores rc_users.id, not auth_user_id
      const { data: rcUserData, error: rcUserError } = await supabase
        .from('rc_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      console.log('WorkQueue: rc_users lookup result:', rcUserData, rcUserError);
      
      if (rcUserError) {
        console.error('WorkQueue: rc_users lookup error:', rcUserError);
        throw rcUserError;
      }

      if (!rcUserData?.id) {
        console.log('WorkQueue: No rc_users record found for this auth user');
        setPendingCases([]);
        setActiveCases([]);
        setLoading(false);
        return;
      }

      const rcUserId = rcUserData.id;
      console.log('WorkQueue: Found rc_users.id:', rcUserId);
      
      // Query rc_cases using rn_cm_id (which stores rc_users.id)
      const { data: directCases, error: directCasesError } = await supabase
        .from('rc_cases')
        .select('id')
        .eq('rn_cm_id', rcUserId)
        .eq('is_superseded', false);
      
      console.log('WorkQueue: Direct cases query (rn_cm_id):', directCases, directCasesError);
      
      if (directCasesError) {
        console.error('WorkQueue: Cases query error:', directCasesError);
        throw directCasesError;
      }

      const caseIds = directCases?.map(c => c.id) || [];
      console.log('WorkQueue: Found case IDs via rn_cm_id:', caseIds);

      if (caseIds.length === 0) {
        console.log('WorkQueue: No cases found for this RN');
        setPendingCases([]);
        setActiveCases([]);
        setLoading(false);
        return;
      }

      // Fetch cases with case_type
      const { data: casesData, error: casesError } = await supabase
        .from('rc_cases')
        .select('id, case_number, date_of_injury, case_type, client_id')
        .in('id', caseIds)
        .eq('is_superseded', false);

      console.log('WorkQueue: Cases data:', casesData, casesError);

      if (casesError) {
        console.error('WorkQueue: Cases error:', casesError);
        throw casesError;
      }

      // Fetch client names
      const { data: clientsData } = await supabase
        .from('rc_clients')
        .select('id, first_name, last_name')
        .in('id', casesData?.map(c => c.client_id).filter(Boolean) || []);

      // Fetch intakes to check attorney attestation
      const { data: intakesData } = await supabase
        .from('rc_client_intakes')
        .select('case_id, attorney_attested_at, intake_status')
        .in('case_id', caseIds);

      // Fetch latest check-ins for 4P scores
      const { data: checkinsData } = await supabase
        .from('rc_client_checkins')
        .select('case_id, fourp_physical, fourp_psychological, fourp_psychosocial, fourp_professional, created_at')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false });

      // Fetch care plans - check which cases have care plans
      const { data: carePlansData } = await supabase
        .from('rc_care_plans')
        .select('case_id, plan_type, updated_at')
        .in('case_id', caseIds)
        .order('updated_at', { ascending: false });

      const casesWithCarePlans = new Set(carePlansData?.map(cp => cp.case_id) || []);

      // Fetch active flags count (if clinical flags table exists)
      // TODO: Replace with actual clinical flags table query when available
      const activeFlagsCount = 0; // Placeholder - fetch from clinical flags table

      // Build cases array with all data
      const casesWithData: WorkQueueCase[] = (casesData || []).map(c => {
        const client = clientsData?.find(cl => cl.id === c.client_id);
        const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'Unknown Client';
        
        // Check if attorney attested
        const intake = intakesData?.find(i => i.case_id === c.id);
        const attorneyAttested = !!intake?.attorney_attested_at;
        
        // Check if has care plan
        const hasCarePlan = casesWithCarePlans.has(c.id);
        
        // Pending = attorney attested but no care plan
        const isPending = attorneyAttested && !hasCarePlan;
        
        const latestCheckin = checkinsData?.find(ch => ch.case_id === c.id);
        const fourpScores = latestCheckin ? {
          physical: latestCheckin.fourp_physical,
          psychological: latestCheckin.fourp_psychological,
          psychosocial: latestCheckin.fourp_psychosocial,
          professional: latestCheckin.fourp_professional,
        } : null;

        const viabilityIndex = fourpScores 
          ? ((fourpScores.physical || 0) + (fourpScores.psychological || 0) + 
             (fourpScores.psychosocial || 0) + (fourpScores.professional || 0)) / 4
          : null;

        const carePlan = carePlansData?.find(cp => cp.case_id === c.id);
        const carePlanStatus = carePlan 
          ? (carePlan.plan_type === 'final' ? 'Complete' : 
             carePlan.plan_type === 'updated' ? 'In Progress' : 'Draft')
          : null;

        return {
          id: c.id,
          case_number: c.case_number,
          client_name: clientName,
          date_of_injury: c.date_of_injury,
          case_type: c.case_type,
          fourp_scores: fourpScores,
          viability_index: viabilityIndex,
          active_flags_count: activeFlagsCount,
          last_checkin_date: latestCheckin?.created_at || null,
          care_plan_status: carePlanStatus,
          is_pending: isPending,
        };
      });

      // Split into pending and active
      const pending = casesWithData.filter(c => c.is_pending);
      const active = casesWithData.filter(c => !c.is_pending && casesWithCarePlans.has(c.id));

      console.log('WorkQueue: Final results - Pending:', pending.length, 'Active:', active.length);
      console.log('WorkQueue: Pending cases:', pending);
      console.log('WorkQueue: Active cases:', active);

      setPendingCases(pending);
      setActiveCases(active);

    } catch (error) {
      console.error('Error fetching work queue:', error);
    } finally {
      setLoading(false);
    }
  }

  // Case Card Component
  function CaseCard({ 
    caseItem, 
    isExpanded, 
    onToggleExpand, 
    isPending,
  }: { 
    caseItem: WorkQueueCase; 
    isExpanded: boolean; 
    onToggleExpand: () => void;
    isPending: boolean;
  }) {
    return (
      <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
        <Card className="border-l-4" style={{ borderLeftColor: isPending ? '#f59e0b' : '#10b981' }}>
          <CollapsibleTrigger className="w-full">
            <CardContent className="p-3 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{caseItem.case_number || 'No case number'}</p>
                      {caseItem.active_flags_count > 0 && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{caseItem.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-amber-500' : 'bg-green-500'}`} />
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>
            </CardContent>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-3">
              <div className="space-y-3 border-t pt-3 mt-3">
                {/* Read-only summary information */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium">Date of Injury:</span>
                    <p className="mt-0.5">
                      {caseItem.date_of_injury 
                        ? format(parseISO(caseItem.date_of_injury), 'MMM d, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Case Type:</span>
                    <p className="mt-0.5">{caseItem.case_type || 'N/A'}</p>
                  </div>
                </div>

                {caseItem.fourp_scores && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">4P Scores:</p>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">P1: </span>
                        <span className="font-semibold">{caseItem.fourp_scores.physical || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P2: </span>
                        <span className="font-semibold">{caseItem.fourp_scores.psychological || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P3: </span>
                        <span className="font-semibold">{caseItem.fourp_scores.psychosocial || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">P4: </span>
                        <span className="font-semibold">{caseItem.fourp_scores.professional || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground font-medium">Active Flags:</span>
                    <p className="mt-0.5">{caseItem.active_flags_count}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-medium">Last Check-in:</span>
                    <p className="mt-0.5">
                      {caseItem.last_checkin_date
                        ? format(parseISO(caseItem.last_checkin_date), 'MMM d, yyyy')
                        : 'Never'}
                    </p>
                  </div>
                </div>

                {!isPending && caseItem.viability_index !== null && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Viability Index: </span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {caseItem.viability_index.toFixed(1)}
                    </Badge>
                  </div>
                )}

                {!isPending && caseItem.care_plan_status && (
                  <div>
                    <span className="text-xs text-muted-foreground font-medium">Care Plan Status: </span>
                    {caseItem.care_plan_status === 'Complete' ? (
                      <Badge className="bg-green-500 text-xs ml-2">{caseItem.care_plan_status}</Badge>
                    ) : caseItem.care_plan_status === 'In Progress' ? (
                      <Badge className="bg-blue-500 text-xs ml-2">{caseItem.care_plan_status}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs ml-2">{caseItem.care_plan_status}</Badge>
                    )}
                  </div>
                )}

                {/* Action Buttons — All RN routes for consistency */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Primary action: Pending → ten-vs for initial assessment; Active → workflow for care plan
                      const route = isPending
                        ? `/rn/case/${caseItem.id}/ten-vs`
                        : `/rn/case/${caseItem.id}/workflow`;
                      navigate(route);
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {isPending ? 'Open Case' : 'Open Care Plan'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/rn/case/${caseItem.id}/requests`);
                    }}
                  >
                    Requests
                  </Button>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Show loading state while auth is loading or data is fetching
  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <div className="text-center text-muted-foreground py-8">Loading work queue...</div>
      </div>
    );
  }

  // If no user after auth has loaded, show empty state
  if (!user) {
    return (
      <div className="space-y-4">
        <div className="text-center text-muted-foreground py-8">Please sign in to view your work queue.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Cases Section */}
      <Card>
        <CardHeader className="bg-amber-50 border-b border-amber-200" style={{ backgroundColor: '#fef3c7' }}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-amber-900">Pending Cases</CardTitle>
            <Badge className="bg-amber-500" style={{ backgroundColor: '#f59e0b' }}>
              {pendingCases.length} Pending
            </Badge>
          </div>
          <CardDescription className="text-amber-700">
            Newly attested cases awaiting initial care plan
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {pendingCases.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No pending cases
                </div>
              ) : (
                pendingCases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseItem={caseItem}
                    isExpanded={expandedCaseId === caseItem.id}
                    onToggleExpand={() => setExpandedCaseId(
                      expandedCaseId === caseItem.id ? null : caseItem.id
                    )}
                    isPending={true}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Active Cases Section */}
      <Card>
        <CardHeader className="bg-green-50 border-b border-green-200" style={{ backgroundColor: '#d1fae5' }}>
          <div className="flex justify-between items-center">
            <CardTitle className="text-green-900">Active Cases</CardTitle>
            <Badge className="bg-green-500" style={{ backgroundColor: '#10b981' }}>
              {activeCases.length} Active
            </Badge>
          </div>
          <CardDescription className="text-green-700">
            Cases with existing care plans
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {activeCases.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No active cases
                </div>
              ) : (
                activeCases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.id}
                    caseItem={caseItem}
                    isExpanded={expandedCaseId === caseItem.id}
                    onToggleExpand={() => setExpandedCaseId(
                      expandedCaseId === caseItem.id ? null : caseItem.id
                    )}
                    isPending={false}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
