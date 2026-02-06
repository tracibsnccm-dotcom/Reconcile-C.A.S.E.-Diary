import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HelpCircle, Clock, ArrowLeft, Eye, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { AttorneyAttestationCard } from '@/components/AttorneyAttestationCard';
import { AttorneyRnAssignmentReadOnly } from '@/components/attorney/AttorneyRnAssignmentReadOnly';
import { ConsentDocumentViewer } from '@/components/ConsentDocumentViewer';
import { formatHMS, COMPLIANCE_COPY } from '@/constants/compliance';
import { getAttorneyCaseStageLabel, ATTORNEY_STAGE_LABELS } from '@/lib/attorneyCaseStageLabels';
import { useAuth } from '@/auth/supabaseAuth';
import { supabase } from '@/integrations/supabase/client';
import { supabaseGet } from '@/lib/supabaseRest';

interface IntakeRow {
  intake_id?: string;
  case_id: string;
  /** Original INT (e.g. INT-YYMMDD-##X) from rc_client_intake_sessions.intake_id; never replaced. */
  int_number: string | null;
  /** Assigned case number from rc_cases.case_number after confirmation; else awaiting assignment. */
  case_number?: string | null;
  client: string;
  client_name?: string;
  date_of_injury?: string | null;
  case_type?: string | null;
  stage: string;
  last_activity_iso: string;
  expires_iso: string;
  attorney_attested_at: string | null;
  attorney_confirm_deadline_at: string | null;
  assigned_rn_id?: string | null;
  nudges: number;
  my_client: boolean;
}

interface PendingIntake {
  id: string;
  case_id: string;
  intake_submitted_at: string;
  attorney_confirm_deadline_at: string;
  attorney_attested_at: string | null;
  intake_json: any;
  created_at: string;
  rc_cases?: {
    client_id?: string;
    attorney_id?: string;
    assigned_rn_id?: string | null;
    updated_at?: string | null;
  };
}

/**
 * Get client display name for attorney views with fallback order:
 * 1) case.client_first_name + case.client_last_name (or similar existing fields)
 * 2) case.client_name / case.client_full_name (if present)
 * 3) latest intake identity from intake_json (first_name/last_name/email if needed)
 * 4) fallback: "Client"
 */
function getClientDisplayName(input: any): string {
  // input may be a case row, or an object containing { case, intake }
  const c = input?.case ?? input ?? {};
  const first =
    c.client_first_name ??
    c.first_name ??
    c.clientFirstName ??
    c.client?.first_name ??
    c.client?.firstName;

  const last =
    c.client_last_name ??
    c.last_name ??
    c.clientLastName ??
    c.client?.last_name ??
    c.client?.lastName;

  const full =
    c.client_name ??
    c.client_full_name ??
    c.full_name ??
    c.client?.full_name ??
    c.client?.name;

  // Try intake_json identity if present on the loaded record
  const intakeJson = input?.intake_json ?? c.intake_json ?? input?.intake?.intake_json ?? input?.intake?.intakeJson;
  const intakeIdentity = intakeJson?.identity ?? intakeJson?.client_identity;
  const intakeFirst = intakeIdentity?.first_name ?? intakeIdentity?.firstName ?? intakeIdentity?.client_first_name ?? intakeIdentity?.clientFirstName;
  const intakeLast = intakeIdentity?.last_name ?? intakeIdentity?.lastName ?? intakeIdentity?.client_last_name ?? intakeIdentity?.clientLastName;

  const nameFromCaseParts = [first, last].filter(Boolean).join(" ").trim();
  if (nameFromCaseParts) return nameFromCaseParts;

  if (typeof full === "string" && full.trim()) return full.trim();

  const nameFromIntake = [intakeFirst, intakeLast].filter(Boolean).join(" ").trim();
  if (nameFromIntake) return nameFromIntake;

  return "Client";
}

export const AttorneyIntakeTracker = ({ showHeader = true }: { showHeader?: boolean } = {}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<IntakeRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [filter, setFilter] = useState<'all' | 'lt72' | 'lt24'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [autoNudge, setAutoNudge] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<PendingIntake | null>(null);
  const [loadingIntake, setLoadingIntake] = useState(false);
  const [resolution, setResolution] = useState<null | "CONFIRMED" | "DECLINED">(null);
  const [attestationKey, setAttestationKey] = useState(0);

  const calculateTTL = (expiresIso: string) => {
    const ms = Math.max(0, new Date(expiresIso).getTime() - Date.now());
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const label = `${d}d ${h}h`;
    
    let className = 'text-green-600';
    if (ms <= 24 * 3600000) className = 'text-destructive font-bold';
    else if (ms <= 72 * 3600000) className = 'text-yellow-600 font-semibold';
    
    return { ms, label, className };
  };

  const getRiskLevel = (expiresIso: string) => {
    const { ms } = calculateTTL(expiresIso);
    if (ms <= 24 * 3600000) return { level: 'High', variant: 'destructive' as const };
    if (ms <= 72 * 3600000) return { level: 'Medium', variant: 'default' as const };
    return { level: 'Low', variant: 'secondary' as const };
  };

  const loadData = async () => {
    console.log('loadData: START');
    try {
      // Get current user's auth ID and look up their rc_user ID
      let attorneyRcUserId: string | null = null;
      
      // User is already available from useAuth hook - use it directly
      const authUserId = user?.id;
      console.log('loadData: Using user from useAuth', { authUserId });
      
      if (scope === 'mine' && user && authUserId) {
        try {
          // Verify user is an attorney, then use auth_user_id directly since cases store auth_user_id as attorney_id
          const rcUsersQuery = `auth_user_id=eq.${authUserId}&role=eq.attorney&select=id`;
          const { data: rcUsers, error: rcUsersError } = await supabaseGet('rc_users', rcUsersQuery);
          if (rcUsersError) throw rcUsersError;
          const isAttorney = Array.isArray(rcUsers) ? rcUsers.length > 0 : !!rcUsers;
          attorneyRcUserId = isAttorney ? authUserId : null;
        } catch (err) {
          console.error('Failed to get attorney rc_user ID:', err);
        }
      }
      
      // Build query string for Supabase REST API - JOIN with rc_cases and rc_clients
      let queryString = 'select=*,rc_cases(id,attorney_id,case_type,case_number,case_status,date_of_injury,assigned_rn_id,rc_clients(first_name,last_name))&intake_status=in.(submitted_pending_attorney,attorney_confirmed,attorney_declined_not_client)&rc_cases.is_superseded=eq.false';
      
      if (scope === 'mine' && attorneyRcUserId) {
        queryString += `&rc_cases.attorney_id=eq.${attorneyRcUserId}`;
      }
      
      // Use REST helper for RLS-protected queries
      console.log('loadData: About to query intakes with', queryString);
      const { data: intakes, error: intakesError } = await supabaseGet('rc_client_intakes', queryString);
      console.log('loadData: intakes result', { count: intakes?.length, error: intakesError });
      console.log('loadData: Raw intakes from API:', intakes);
      
      if (intakesError) {
        throw intakesError;
      }

      if (!Array.isArray(intakes)) {
        throw new Error('Expected array from Supabase query');
      }

        // Filter out intakes where rc_cases doesn't match the attorney
      // Also fetch client data for cases that don't have it in the nested join
      const filteredIntakes = scope === 'mine' && attorneyRcUserId
        ? intakes.filter((intake: any) => {
            const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
            return caseData && caseData.attorney_id === attorneyRcUserId;
          })
        : intakes;
      
      // For cases missing client data, fetch it separately
      const casesNeedingClientData = filteredIntakes.filter((intake: any) => {
        const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
        return caseData && caseData.client_id && !caseData.rc_clients;
      });
      
      if (casesNeedingClientData.length > 0) {
        const caseIds = casesNeedingClientData.map((intake: any) => {
          const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
          return caseData?.client_id;
        }).filter(Boolean);
        
        if (caseIds.length > 0) {
          try {
            const { data: clientsData } = await supabaseGet(
              'rc_clients',
              `id=in.(${caseIds.join(',')})&select=id,first_name,last_name`
            );
            
            if (clientsData) {
              const clientsMap = new Map(
                (Array.isArray(clientsData) ? clientsData : [clientsData]).map((c: any) => [
                  c.id,
                  { first_name: c.first_name, last_name: c.last_name }
                ])
              );
              
              // Attach client data to cases
              filteredIntakes.forEach((intake: any) => {
                const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
                if (caseData && caseData.client_id && !caseData.rc_clients) {
                  const clientInfo = clientsMap.get(caseData.client_id);
                  if (clientInfo) {
                    caseData.rc_clients = clientInfo;
                  }
                }
              });
            }
          } catch (err) {
            console.error('Failed to fetch client data:', err);
          }
        }
      }

      // Fetch original INT numbers from rc_client_intake_sessions (intake_id = INT-YYMMDD-##X)
      const allCaseIds = (filteredIntakes || []).map((i: any) => i.case_id).filter(Boolean);
      const sessionMap = new Map<string, string>();
      if (allCaseIds.length > 0) {
        try {
          const { data: sessions } = await supabaseGet(
            'rc_client_intake_sessions',
            `case_id=in.(${allCaseIds.join(',')})&select=case_id,intake_id`
          );
          (Array.isArray(sessions) ? sessions : []).forEach((s: any) => {
            if (s?.case_id && s?.intake_id) sessionMap.set(s.case_id, s.intake_id);
          });
        } catch (_) {}
      }

      // ATTORNEY-5: Exclude cases that have a submitted care plan (RN released) — they belong in Active Cases
      const caseIdsWithSubmittedPlan = new Set<string>();
      if (allCaseIds.length > 0) {
        try {
          const { data: submittedPlans } = await supabaseGet<{ case_id: string; id: string; submitted_at?: string }[]>(
            'rc_care_plans',
            `case_id=in.(${allCaseIds.join(',')})&status=eq.submitted&select=case_id,id,submitted_at&order=submitted_at.desc`
          );
          const plans = Array.isArray(submittedPlans) ? submittedPlans : [];
          // Pick most recent submitted plan per case (already ordered by submitted_at desc)
          plans.forEach((p: { case_id: string; id: string }) => {
            if (p?.case_id) caseIdsWithSubmittedPlan.add(p.case_id);
          });
        } catch (_) {}
      }

      // Transform to IntakeRow format for display (exclude cases with submitted care plan — ATTORNEY-5)
      const transformedRows: IntakeRow[] = (filteredIntakes || [])
        .filter((intake: any) => !caseIdsWithSubmittedPlan.has(intake.case_id))
        .map((intake: any) => {
        const caseData = Array.isArray(intake.rc_cases) ? intake.rc_cases[0] : intake.rc_cases;
        const clientData = caseData?.rc_clients;
        
        // Use helper function to get client name with fallbacks including intake_json
        const clientName = getClientDisplayName({
          case: {
            client_first_name: clientData?.first_name,
            client_last_name: clientData?.last_name,
            client_name: caseData?.client_name,
            client_full_name: caseData?.client_full_name,
            intake_json: intake.intake_json,
          },
          intake_json: intake.intake_json,
        });
        
        // Confirmed condition: case_status === 'attorney_confirmed' (rc_cases) or attorney_attested_at (rc_client_intakes) as proxy.
        const isConfirmed = !!intake.attorney_attested_at || caseData?.case_status === 'attorney_confirmed';
        const isDeclined = intake.intake_status === 'attorney_declined_not_client';
        const isExpired = !isConfirmed && !isDeclined &&
          intake.attorney_confirm_deadline_at &&
          new Date(intake.attorney_confirm_deadline_at).getTime() < Date.now();
        
        const stage = getAttorneyCaseStageLabel({
          attorney_attested_at: intake.attorney_attested_at,
          assigned_rn_id: caseData?.assigned_rn_id ?? null,
          intake_status: intake.intake_status,
          attorney_confirm_deadline_at: intake.attorney_confirm_deadline_at,
        });
        
        const cn = caseData?.case_number ?? null;
        const rcmsId = intake.intake_json?.rcmsId ?? null;
        const origInt = rcmsId ?? sessionMap.get(intake.case_id) ?? (cn && String(cn).startsWith('INT-') ? cn : null) ?? null;
        return {
          intake_id: intake.id,
          case_id: intake.case_id,
          int_number: origInt,
          case_number: cn,
          client: clientName,
          client_name: clientName,
          date_of_injury: caseData?.date_of_injury || null,
          case_type: caseData?.case_type || null,
          stage,
          last_activity_iso: intake.intake_submitted_at || new Date().toISOString(),
          expires_iso: intake.attorney_confirm_deadline_at || '',
          attorney_attested_at: intake.attorney_attested_at,
          attorney_confirm_deadline_at: intake.attorney_confirm_deadline_at,
          assigned_rn_id: caseData?.assigned_rn_id ?? null,
          nudges: 0,
          my_client: true,
        };
      });

      console.log('loadData: Transformed rows:', transformedRows);

      setRows(transformedRows);

      // If viewing a specific case, reload its intake data
      // Reset resolution when reloading data
      if (selectedCaseId) {
        setResolution(null);
        loadIntakeForCase(selectedCaseId);
      }
    } catch (error) {
      console.error('Failed to load intakes:', error);
      toast.error('Failed to load intake data');
    }
  };

  const loadIntakeForCase = async (caseId: string, intakeId?: string) => {
    setLoadingIntake(true);
    try {
      // Load intake with case data and client data for the attestation modal
      // If intakeId is provided, load by id; otherwise load by case_id
      const queryFilter = intakeId 
        ? `id=eq.${intakeId}` 
        : `case_id=eq.${caseId}&order=created_at.desc&limit=1`;
      const queryString = `select=*,rc_cases(id,attorney_id,case_type,client_id,case_number,case_status,date_of_injury,assigned_rn_id,updated_at,rc_clients(first_name,last_name))&${queryFilter}&rc_cases.is_superseded=eq.false`;
      const { data: intakeData, error: intakeError } = await supabaseGet('rc_client_intakes', queryString);
      
      if (intakeError) {
        throw intakeError;
      }
      
      const updatedIntake = (Array.isArray(intakeData) ? intakeData[0] : intakeData) as PendingIntake | null;
      setSelectedIntake(updatedIntake);
      
      if (updatedIntake?.attorney_attested_at) {
        setResolution("CONFIRMED");
      }
    } catch (error) {
      console.error('Failed to load intake:', error);
      toast.error('Failed to load intake details');
      setSelectedIntake(null);
    } finally {
      setLoadingIntake(false);
    }
  };

  const handleViewIntake = (caseId: string, intakeId?: string) => {
    setSelectedCaseId(caseId);
    setResolution(null); // Reset resolution when viewing a new intake
    loadIntakeForCase(caseId, intakeId);
  };

  const handleNudge = async (caseId: string) => {
    try {
      const { error } = await supabase.functions.invoke('attorney-intake-tracker', {
        body: { action: 'nudge', case_id: caseId }
      });
      if (error) throw error;
      toast.success('Nudge sent successfully');
      loadData();
    } catch (error) {
      console.error('Nudge error:', error);
      toast.error('Failed to send nudge');
    }
  };

  const handleEscalate = async (caseId: string) => {
    if (!confirm('Escalate this intake to RN CM now?')) return;

    try {
      const { error } = await supabase.functions.invoke('attorney-intake-tracker', {
        body: { action: 'escalate', case_id: caseId }
      });
      if (error) throw error;
      toast.success('Escalated to RN CM');
      loadData();
    } catch (error) {
      console.error('Escalate error:', error);
      toast.error('Failed to escalate');
    }
  };

  const handleBulkNudge = async () => {
    if (selectedIds.size === 0) {
      toast.error('Select at least one client');
      return;
    }

    try {
      await Promise.all(Array.from(selectedIds).map(id => handleNudge(id)));
      setSelectedIds(new Set());
      toast.success(`Sent ${selectedIds.size} nudges`);
    } catch (error) {
      toast.error('Some nudges failed');
    }
  };

  const handleAutoNudgeToggle = (checked: boolean) => {
    setAutoNudge(checked);
    if (checked) {
      localStorage.setItem('rcms_atty_auto_nudge', '1');
    } else {
      localStorage.removeItem('rcms_atty_auto_nudge');
    }
  };

  // Count intakes awaiting attorney review for banner
  const pendingCount = rows.filter(row => row.stage === 'Intake Submitted — Awaiting Attorney Review').length;

  const filteredRows = rows.filter(row => {
    // Search filter
    const q = searchQuery.toLowerCase().trim();
    if (q && !(row.client.toLowerCase().includes(q) || row.case_id.toLowerCase().includes(q))) {
      return false;
    }

    // Time filter
    const { ms } = calculateTTL(row.expires_iso);
    if (filter === 'lt72' && ms > 72 * 3600000) return false;
    if (filter === 'lt24' && ms > 24 * 3600000) return false;

    return true;
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 60000); // Refresh every minute

    // Check auto-nudge setting
    if (localStorage.getItem('rcms_atty_auto_nudge') === '1') {
      setAutoNudge(true);
    }

    return () => clearInterval(interval);
  }, [scope]);

  // If viewing a specific intake, show attestation card
  if (selectedCaseId && selectedIntake) {
    const caseData = Array.isArray(selectedIntake.rc_cases) 
      ? selectedIntake.rc_cases[0] 
      : selectedIntake.rc_cases;

    // Check if confirmed
    const isConfirmed = !!selectedIntake.attorney_attested_at;

    // Check if expired (deadline exists and has passed, but not confirmed)
    const isExpired = !isConfirmed &&
      !!selectedIntake.attorney_confirm_deadline_at &&
      new Date(selectedIntake.attorney_confirm_deadline_at).getTime() < Date.now();

    // Check if attestation is needed (not confirmed and not expired)
    const needsAttestation = !isConfirmed && !isExpired && !!selectedIntake.attorney_confirm_deadline_at;

    // Get client name for display using helper function
    const clientName = getClientDisplayName({
      case: {
        client_first_name: caseData?.rc_clients?.first_name,
        client_last_name: caseData?.rc_clients?.last_name,
        client_name: caseData?.client_name,
        client_full_name: caseData?.client_full_name,
        intake_json: selectedIntake.intake_json,
      },
      intake_json: selectedIntake.intake_json,
    });

    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => {
            setSelectedCaseId(null);
            setSelectedIntake(null);
            setResolution(null); // Reset resolution when leaving
          }}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Intake List
        </Button>

        {/* Client Name Header */}
        <Card>
          <CardHeader>
            <CardTitle>Client: {clientName}</CardTitle>
          </CardHeader>
        </Card>

        {/* What this means — attorney-only explanatory copy */}
        {needsAttestation && (
          <Card className="border-l-4 border-primary">
            <CardHeader>
              <CardTitle className="text-base">What this means</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>The client has completed their intake. Please review the information and confirm whether the case should proceed. Once reviewed, the case can be assigned to an RN for initial care planning.</p>
              <p className="text-xs italic text-muted-foreground/90">
                Client view: While under review, the client sees their intake as submitted and awaiting attorney review.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Show attestation card if needed, or receipt if already confirmed */}
        {(needsAttestation || isConfirmed) && (
          <AttorneyAttestationCard
            key={`attestation-${attestationKey}`}
            intakeId={selectedIntake.id}
            caseId={selectedCaseId}
            intakeSubmittedAt={selectedIntake.intake_submitted_at}
            attorneyConfirmDeadlineAt={selectedIntake.attorney_confirm_deadline_at}
            attorneyAttestedAt={selectedIntake.attorney_attested_at}
            intakeJson={selectedIntake.intake_json}
            resolved={resolution || (isConfirmed ? "CONFIRMED" : null)}
            onResolved={async (res, timestamp, updatedJson) => {
              setResolution(res);
              setAttestationKey(prev => prev + 1);
              if (res === "CONFIRMED") {
                setSelectedIntake(prev => prev ? {
                  ...prev,
                  attorney_attested_at: timestamp,
                  intake_json: updatedJson
                } : null);
                await loadData();
              } else if (res === "DECLINED") {
                setSelectedIntake(prev => prev ? {
                  ...prev,
                  intake_json: updatedJson
                } : null);
                await loadData();
              }
            }}
            onAttested={(attestedAt, updatedJson) => {
              // Keep this for backward compatibility, but resolution state is primary
              setSelectedIntake(prev => prev ? {
                ...prev,
                attorney_attested_at: attestedAt,
                intake_json: updatedJson
              } : null);
            }}
            onAttestationComplete={() => {
              // Don't show toast here - the AttorneyAttestationCard already shows one
              // Don't reload - let user see and copy the case number and PIN
              // User can click "Back to Intake List" when ready
            }}
          />
        )}


        {/* Show declined state when resolved as declined */}
        {resolution === "DECLINED" && (
          <Card className="border-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                Declined
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-900">
                  {selectedIntake.intake_json?.compliance?.attorney_confirmation_receipt?.confirmed_at
                    ? `Marked as not my client on ${new Date(selectedIntake.intake_json.compliance.attorney_confirmation_receipt.confirmed_at).toLocaleString()}. Intake access is disabled.`
                    : 'Marked as not my client. Intake access is disabled.'}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {isExpired && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                {COMPLIANCE_COPY.attorneyExpired.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription className="space-y-2">
                  {COMPLIANCE_COPY.attorneyExpired.bodyLines.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {isConfirmed && !isExpired && (
          <>
            {/* RN Assignment — read-only (attorneys do not assign; RN Supervisor does) */}
            <AttorneyRnAssignmentReadOnly
              assignedRnId={caseData?.assigned_rn_id ?? null}
              updatedAt={caseData?.updated_at ?? undefined}
            />
            {/* Consent Documents */}
            <ConsentDocumentViewer caseId={selectedCaseId!} showPrintButton={true} />
            
            <Card>
              <CardContent className="p-6">
                <Button
                  onClick={() => {
                    const id = selectedIntake?.id;
                    if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id).trim())) {
                      toast.error('Unable to open intake: missing intake id.');
                      return;
                    }
                    navigate(`/attorney/intakes/${id}`);
                  }}
                  className="mt-4"
                >
                  View Case Details
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border-l-4 border-accent rounded-lg">
          <Clock className="w-5 h-5 text-primary" />
          <strong className="text-foreground">Intakes Submitted — Awaiting Attorney Review:</strong>
          <span className="font-bold text-primary">{pendingCount}</span>
          <span className="text-sm text-muted-foreground">
            Client intakes ready for your review.
          </span>
          <button
            className="ml-auto w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold hover:bg-primary/80"
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            onFocus={() => setShowHelp(true)}
            onBlur={() => setShowHelp(false)}
          >
            <HelpCircle className="w-3 h-3" />
          </button>
          {showHelp && (
            <div className="absolute right-0 top-full mt-2 bg-popover border rounded-lg shadow-lg p-3 max-w-sm z-10">
              <p className="text-sm mb-2">
                <strong>Confidentiality Notice:</strong>
                <br />
                All communications, case notes, and uploaded files within Reconcile C.A.R.E. are
                encrypted and stored under HIPAA and attorney–client privilege standards.
              </p>
              <Link
                to="/compliance-and-privacy"
                className="text-xs text-primary hover:underline font-bold"
              >
                View full Compliance Policy
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Panel */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-3 p-4 border-b bg-muted/30">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search by client/case…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48"
            />
            <Select value={scope} onValueChange={(v: any) => setScope(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mine">My clients</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="lt72">Under 72h</SelectItem>
                <SelectItem value="lt24">Under 24h</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleBulkNudge} size="sm">
              Nudge Selected
            </Button>
            <div className="flex items-center gap-2">
              <Checkbox
                id="auto-nudge"
                checked={autoNudge}
                onCheckedChange={handleAutoNudgeToggle}
              />
              <Label htmlFor="auto-nudge" className="text-sm font-bold cursor-pointer">
                Auto-nudge (every 48h)
              </Label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto max-w-full min-w-0">
          <table className="w-full max-w-full table-fixed min-w-0">
            <thead className="bg-muted/50 text-xs sm:text-sm">
              <tr className="border-b">
                <th className="p-1.5 w-10 min-w-[2.5rem] text-left">
                  <Checkbox
                    checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds(new Set(filteredRows.map(r => r.case_id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                </th>
                <th className="p-1.5 w-24 max-w-[100px] text-left font-semibold">INT Number</th>
                <th className="p-1.5 w-28 max-w-[120px] text-left font-semibold">Case Number</th>
                <th className="p-1.5 min-w-0 text-left font-semibold">Client Name</th>
                <th className="p-1.5 w-24 max-w-[100px] text-left font-semibold">Date of Injury</th>
                <th className="p-1.5 w-20 max-w-[80px] text-left font-semibold">Case Type</th>
                <th className="p-1.5 w-24 max-w-[100px] text-left font-semibold">Status</th>
                <th className="p-1.5 w-32 max-w-[128px] text-left font-semibold">Stage</th>
                <th className="p-1.5 w-28 max-w-[120px] text-left font-semibold hidden md:table-cell">Last Activity</th>
                <th className="p-1.5 w-24 max-w-[100px] text-left font-semibold hidden md:table-cell">Time Remaining</th>
                <th className="p-1.5 w-16 max-w-[64px] text-left font-semibold">Risk</th>
                <th className="p-1.5 w-32 max-w-[128px] text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm">
              {filteredRows.map((row) => {
                const ttl = calculateTTL(row.expires_iso);
                const risk = getRiskLevel(row.expires_iso);
                const isSelected = selectedIds.has(row.case_id);
                
                // Determine status - hide countdown if deadline is null or attested_at exists
                const hasDeadline = !!row.attorney_confirm_deadline_at;
                const isConfirmed = !!row.attorney_attested_at;
                const isDeclined = row.stage === ATTORNEY_STAGE_LABELS.DECLINED || !hasDeadline && !isConfirmed;
                const isExpired = !isConfirmed && !isDeclined &&
                  hasDeadline &&
                  new Date(row.attorney_confirm_deadline_at!).getTime() < Date.now();
                
                // Status badge
                let statusLabel = 'Awaiting Review';
                let statusVariant: 'default' | 'destructive' | 'secondary' | 'outline' = 'secondary';
                if (isConfirmed) {
                  statusLabel = 'Confirmed';
                  statusVariant = 'default';
                } else if (isDeclined) {
                  statusLabel = 'Declined';
                  statusVariant = 'outline';
                } else if (isExpired) {
                  statusLabel = 'Expired';
                  statusVariant = 'destructive';
                }
                
                // Show countdown only if deadline exists, not confirmed, and not declined
                const shouldShowCountdown = hasDeadline && !isConfirmed && !isDeclined;

                return (
                  <tr key={row.case_id} className="border-b hover:bg-muted/30">
                    <td className="p-1.5 w-10 min-w-[2.5rem]">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          const newSet = new Set(selectedIds);
                          if (checked) {
                            newSet.add(row.case_id);
                          } else {
                            newSet.delete(row.case_id);
                          }
                          setSelectedIds(newSet);
                        }}
                      />
                    </td>
                    <td className="p-1.5 w-24 max-w-[100px] overflow-hidden">
                      <div className="font-mono font-bold text-primary truncate max-w-[100px]" title={row.int_number || undefined}>
                        {row.int_number || '—'}
                      </div>
                      <Button
                        variant="link"
                        onClick={() => handleViewIntake(row.case_id, row.intake_id)}
                        className="p-0 h-auto text-primary hover:underline text-xs mt-0.5"
                      >
                        {row.case_id.slice(0, 8)}...
                      </Button>
                    </td>
                    <td className="p-1.5 w-28 max-w-[120px] overflow-hidden">
                      {!!row.attorney_attested_at ? (
                        <span className="font-mono truncate max-w-[100px] block" title={row.case_number || undefined}>{row.case_number || '—'}</span>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Awaiting</Badge>
                      )}
                    </td>
                    <td className="p-1.5 min-w-0 overflow-hidden">
                      <div className="font-medium truncate max-w-[120px] sm:max-w-[180px]" title={row.client_name || row.client}>{row.client_name || row.client}</div>
                    </td>
                    <td className="p-1.5 w-24 max-w-[100px] text-muted-foreground overflow-hidden">
                      <span className="truncate max-w-[100px] block">{row.date_of_injury 
                        ? new Date(row.date_of_injury).toLocaleDateString()
                        : 'N/A'}</span>
                    </td>
                    <td className="p-1.5 w-20 max-w-[80px] text-muted-foreground overflow-hidden">
                      <span className="truncate max-w-[80px] block">{row.case_type || 'N/A'}</span>
                    </td>
                    <td className="p-1.5 w-24 max-w-[100px]">
                      <Badge variant={statusVariant} className="text-xs whitespace-nowrap">{statusLabel}</Badge>
                    </td>
                    <td className="p-1.5 w-32 max-w-[128px] overflow-hidden">
                      <Badge variant="outline" className="text-xs truncate max-w-[100px] inline-block" title={row.stage}>{row.stage}</Badge>
                    </td>
                    <td className={`p-1.5 w-28 max-w-[120px] text-muted-foreground hidden md:table-cell overflow-hidden`}>
                      <span className="truncate max-w-[100px] block">{new Date(row.last_activity_iso).toLocaleString()}</span>
                    </td>
                    <td className={`p-1.5 w-24 max-w-[100px] font-bold hidden md:table-cell ${ttl.className}`}>
                      {shouldShowCountdown ? (
                        ttl.label
                      ) : (
                        <Badge variant={statusVariant} className="text-xs">{statusLabel}</Badge>
                      )}
                    </td>
                    <td className="p-1.5 w-16 max-w-[64px]">
                      {shouldShowCountdown && <Badge variant={risk.variant} className="text-xs">{risk.level}</Badge>}
                    </td>
                    <td className="p-1.5 w-32 max-w-[128px] overflow-hidden">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-1.5"
                          onClick={() =>
                            isConfirmed && row.intake_id
                              ? navigate(`/attorney/intakes/${row.intake_id}`)
                              : handleViewIntake(row.case_id, row.intake_id)
                          }
                        >
                          <Eye className="w-3 h-3 mr-0.5 shrink-0" />
                          <span className="truncate">{isConfirmed ? 'View' : 'Review'}</span>
                        </Button>
                        {!isConfirmed && (
                          <>
                            <Button size="sm" className="text-xs h-7 px-1.5" onClick={() => handleNudge(row.case_id)}>
                              Nudge
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-1.5"
                              onClick={() => handleEscalate(row.case_id)}
                            >
                              Escalate
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-8">
                    <div className="space-y-4 text-center">
                      <p className="text-muted-foreground">No intakes found</p>
                      <Card className="max-w-xl mx-auto border-l-4 border-primary text-left">
                        <CardHeader>
                          <CardTitle className="text-base">What this means</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                          <p>The client has completed their intake. Please review the information and confirm whether the case should proceed. Once reviewed, the case can be assigned to an RN for initial care planning.</p>
                          <p className="text-xs italic text-muted-foreground/90">
                            Client view: While under review, the client sees their intake as submitted and awaiting attorney review.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Intakes auto-delete after 7 days. "Auto-nudge" sends a reminder every 48h until
            finished or time expires; prompt escalation to RN CM after two nudges or{' '}
            <strong>&lt;24h</strong> remaining.
          </p>
        </div>
      </Card>
    </div>
  );
};
