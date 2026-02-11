import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import PerformanceDashboard from "@/components/attorney/PerformanceDashboard";
import DocumentHub from "@/components/attorney/DocumentHub";
import CalendarScheduling from "@/components/attorney/CalendarScheduling";
import AttorneyCaseNotes from "@/components/attorney/AttorneyCaseNotes";
import SettlementManagement from "@/components/attorney/SettlementManagement";
import CaseAnalyticsInsights from "@/components/attorney/CaseAnalyticsInsights";
import TaskDeadlineManager from "@/components/attorney/TaskDeadlineManager";
import ReferralNetworkManagement from "@/components/attorney/ReferralNetworkManagement";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KPI } from "@/components/KPI";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { RCMS_CONFIG } from "@/config/rcms";
import { Case, CaseStatus } from "@/config/rcms";
import { Users, Stethoscope, FileDown, AlertTriangle, Clock, BarChart3, Shield } from "lucide-react";
import { differenceInHours, differenceInDays } from "date-fns";
import { PendingIntakesWidget, sendImmediateNudge } from "@/modules/rcms-intake-extras";
import { ExportButton } from "@/components/AttorneyActions";
import { PreSettlementDossier, DossierReadiness } from "@/components/PreSettlementDossier";
import { useAuth } from "@/auth/supabaseAuth";
import { PolicyAcknowledgmentBanner } from "@/components/PolicyAcknowledgmentBanner";
import { EWalletSummary } from "@/components/EWalletSummary";
import { AttorneyQuickActions } from "@/components/AttorneyQuickActions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

// Cache attorney name to persist across remounts
let cachedAttorneyName: string | null = null;
import NotificationCenter from "@/components/attorney/NotificationCenter";
import BulkActionsBar from "@/components/attorney/BulkActionsBar";
import AdvancedFilters from "@/components/attorney/AdvancedFilters";
import ExportCenter from "@/components/attorney/ExportCenter";
import IntegrationSettings from "@/components/attorney/IntegrationSettings";
import AttorneyGlobalSearch from "@/components/attorney/AttorneyGlobalSearch";
import AttorneyQuickStatsWidget from "@/components/attorney/AttorneyQuickStatsWidget";
import PinnedCasesWidget from "@/components/attorney/PinnedCasesWidget";
import { TimeTrackingBilling } from "@/components/attorney/TimeTrackingBilling";
import { CaseNotesHub } from "@/components/attorney/CaseNotesHub";
import { ComplianceRiskManagement } from "@/components/attorney/ComplianceRiskManagement";
import { DiscoveryManagement } from "@/components/attorney/DiscoveryManagement";
import { FinancialDashboard } from "@/components/attorney/FinancialDashboard";
import { TeamCollaborationCenter } from "@/components/attorney/TeamCollaborationCenter";
import { CaseOutcomePredictions } from "@/components/attorney/CaseOutcomePredictions";
import { ConflictChecker } from "@/components/attorney/ConflictChecker";
import { LegalFormsLibrary } from "@/components/attorney/LegalFormsLibrary";
import { CourtFilingIntegration } from "@/components/attorney/CourtFilingIntegration";
import { RNValueMetrics } from "@/components/attorney/RNValueMetrics";
import { StatutesOfLimitationsTracker } from "@/components/attorney/StatutesOfLimitationsTracker";
import { MedicalLienManagement } from "@/components/attorney/MedicalLienManagement";
import { MedicalBillReview } from "@/components/attorney/MedicalBillReview";
import { SettlementCalculator } from "@/components/attorney/SettlementCalculator";
import { TrustAccounting } from "@/components/attorney/TrustAccounting";
import { FeatureLibrary } from "@/components/attorney/FeatureLibrary";
import { ExpertWitnessManagement } from "@/components/attorney/ExpertWitnessManagement";
import { EvidenceRepository } from "@/components/attorney/EvidenceRepository";
import { MedicalProviderNetwork } from "@/components/attorney/MedicalProviderNetwork";
import { ClientBillingInvoicing } from "@/components/attorney/ClientBillingInvoicing";
import { MarketingLeadManagement } from "@/components/attorney/MarketingLeadManagement";
import { AICasePrioritization } from "@/components/attorney/AICasePrioritization";
import { AISettlementPredictor } from "@/components/attorney/AISettlementPredictor";
import { AIDocumentAssembly } from "@/components/attorney/AIDocumentAssembly";

// Consent + CSV helpers (keep PHI out)
function consentAllowsAttorney(caseObj: Case) {
  const signed = !!caseObj?.consent?.signed;
  const share = caseObj?.consent?.scope?.shareWithAttorney !== false;
  const difficultShare = (caseObj as any)?.difficult_block?.share_with_attorney !== false;
  return signed && share && difficultShare;
}

function buildCsvRowsFromCase(caseObj: Case) {
  if (!caseObj) return [];
  return [{
    case_id: caseObj.id || (caseObj as any).case_id || "",
    status: caseObj.status || "",
    onset_date: caseObj.intake?.incidentDate || "",
    incident_type: caseObj.intake?.incidentType || "",
    initial_treatment: caseObj.intake?.initialTreatment || "",
    flags: (caseObj.flags || []).join("|"),
    provider_id: caseObj.assignedProviderId || "",
    p_physical: (caseObj as any).fourPs?.physical ?? "",
    p_psychological: (caseObj as any).fourPs?.psychological ?? "",
    p_psychosocial: (caseObj as any).fourPs?.psychosocial ?? "",
    p_professional: (caseObj as any).fourPs?.professional ?? "",
    consent_signed: caseObj.consent?.signed ? "yes" : "no",
    restricted: caseObj.consent?.restrictedAccess ? "yes" : "no",
  }];
}

// Status color coding helper
function getStatusColor(status: CaseStatus): {
  bg: string;
  text: string;
  border: string;
  icon?: React.ReactNode;
} {
  switch (status) {
    case "HOLD_SENSITIVE":
      return {
        bg: "bg-destructive/10",
        text: "text-destructive",
        border: "border-destructive/50",
        icon: <Shield className="w-3 h-3" />,
      };
    case "AWAITING_CONSENT":
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-500",
        border: "border-orange-500/50",
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    case "IN_PROGRESS":
      return {
        bg: "bg-green-500/10",
        text: "text-green-500",
        border: "border-green-500/50",
      };
    case "ROUTED":
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-500",
        border: "border-blue-500/50",
      };
    case "NEW":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-500",
        border: "border-yellow-500/50",
      };
    case "CLOSED":
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
      };
    default:
      return {
        bg: "bg-muted",
        text: "text-muted-foreground",
        border: "border-border",
      };
  }
}

export default function AttorneyLanding() {
  console.log("AttorneyLanding: Component rendering, about to set up useEffect");
  console.log('=== AttorneyLanding: Component function called ===');
  const navigate = useNavigate();
  const { user, roles } = useAuth();
  const {
    currentTier,
    tierCaps,
    providers,
    providerSlots,
    nextReset,
    swapsCap,
    swapsUsed,
    routerEnabled,
    exportAllowed,
    cases,
    log,
    attorneyRoleNotConfigured,
    rolesLoadError,
    rolesLoadErrorCode,
    rolesLoadDiagnostics,
  } = useApp();

  console.log('=== AttorneyLanding: Cases data from useApp ===');
  console.log('AttorneyLanding: User ID:', user?.id);
  console.log('AttorneyLanding: Number of cases:', cases?.length || 0);
  console.log('AttorneyLanding: Cases data:', cases);
  if (cases && cases.length > 0) {
    console.log('AttorneyLanding: Case IDs:', cases.map(c => c.id));
    console.log('AttorneyLanding: Case statuses:', cases.map(c => ({ id: c.id, status: c.status })));
  }

  const [tierData, setTierData] = useState<any>(null);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [attorneyName, setAttorneyName] = useState<string>("");

  // Define loadAttorneyName with useCallback to avoid stale closures
  const loadAttorneyName = useCallback(async () => {
    console.log("loadAttorneyName: Starting...");
    if (!user?.id) {
      console.log("loadAttorneyName: No user ID available, user:", user);
      return;
    }

    try {
      console.log("loadAttorneyName: Fetching attorney name for user:", user.id);
      
      // Get rc_users record for this attorney - wrapped in try-catch
      let rcUser: any = null;
      let rcUserError: any = null;
      try {
        const result = await supabase
          .from("rc_users")
          .select("full_name")
          .eq("auth_user_id", user.id)
          .maybeSingle();
        
        rcUser = result.data;
        rcUserError = result.error;
        console.log("loadAttorneyName: Query completed", { rcUser, rcUserError });
      } catch (queryError) {
        console.error("loadAttorneyName: Query threw exception:", queryError);
        rcUserError = queryError;
      }

      if (rcUserError) {
        console.error("loadAttorneyName: rc_users error:", rcUserError);
        throw rcUserError;
      }
      
      if (rcUser?.full_name) {
        console.log("Setting attorney name:", rcUser.full_name);
        setAttorneyName(rcUser.full_name);
      } else {
        console.log("loadAttorneyName: No full_name in rc_users, trying profiles fallback");
        // Fallback to profiles table if rc_users doesn't have it
        let profile: any = null;
        let profileError: any = null;
        try {
          const result = await supabase
            .from("profiles")
            .select("display_name, full_name")
            .eq("user_id", user.id)
            .maybeSingle();
          
          profile = result.data;
          profileError = result.error;
          console.log("loadAttorneyName: profiles query completed", { profile, profileError });
        } catch (queryError) {
          console.error("loadAttorneyName: Profiles query threw exception:", queryError);
          profileError = queryError;
        }

        if (!profileError && profile) {
          const name = profile.full_name || profile.display_name || "";
          console.log("Setting attorney name (from profiles):", name);
          setAttorneyName(name);
        } else {
          console.log("loadAttorneyName: No name found in profiles either");
        }
      }
    } catch (error) {
      console.error("Error loading attorney name:", error);
    }
  }, [user]);

  async function loadTierData() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attorney_metadata")
        .select("tier")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setTierData(data);
    } catch (error) {
      console.error("Error loading tier data:", error);
    }
  }

  // Call loadAttorneyName when user becomes available - check sessionStorage first
  useEffect(() => {
    // Check sessionStorage first (set during login)
    const storedName = sessionStorage.getItem('attorneyName');
    if (storedName) {
      console.log("AttorneyLanding: Using attorney name from sessionStorage:", storedName);
      setAttorneyName(storedName);
      // Also cache it for module-level cache
      cachedAttorneyName = storedName;
      return;
    }

    // Fallback: fetch from database if not in sessionStorage
    if (!user?.id) {
      console.log("AttorneyLanding: useEffect triggered, but no user available");
      return;
    }

    let isMounted = true;
    
    const fetchName = async () => {
      try {
        console.log("fetchName: Fetching attorney name for user:", user.id);
        
        // Get rc_users record for this attorney - wrapped in try-catch
        let rcUser: any = null;
        let rcUserError: any = null;
        try {
          const result = await supabase
            .from("rc_users")
            .select("full_name")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          
          rcUser = result.data;
          rcUserError = result.error;
          console.log("fetchName: Query completed", { rcUser, rcUserError });
        } catch (queryError) {
          console.error("fetchName: Query threw exception:", queryError);
          rcUserError = queryError;
        }

        if (!isMounted) {
          console.log("fetchName: Component unmounted, skipping state update");
          return;
        }

        if (rcUserError) {
          console.error("fetchName: rc_users error:", rcUserError);
          throw rcUserError;
        }
        
        if (rcUser?.full_name) {
          const name = rcUser.full_name;
          console.log("Setting attorney name:", name);
          // Store in sessionStorage and cache
          sessionStorage.setItem('attorneyName', name);
          cachedAttorneyName = name;
          if (isMounted) {
            setAttorneyName(name);
          }
        } else {
          console.log("fetchName: No full_name in rc_users, trying profiles fallback");
          // Fallback to profiles table if rc_users doesn't have it
          let profile: any = null;
          let profileError: any = null;
          try {
            const result = await supabase
              .from("profiles")
              .select("display_name, full_name")
              .eq("user_id", user.id)
              .maybeSingle();
            
            profile = result.data;
            profileError = result.error;
            console.log("fetchName: profiles query completed", { profile, profileError });
          } catch (queryError) {
            console.error("fetchName: Profiles query threw exception:", queryError);
            profileError = queryError;
          }

          if (!isMounted) {
            console.log("fetchName: Component unmounted after profiles query, skipping state update");
            return;
          }

          if (!profileError && profile) {
            const name = profile.full_name || profile.display_name || "";
            console.log("Setting attorney name (from profiles):", name);
            // Store in sessionStorage and cache
            if (name) {
              sessionStorage.setItem('attorneyName', name);
              cachedAttorneyName = name;
            }
            if (isMounted) {
              setAttorneyName(name);
            }
          } else {
            console.log("fetchName: No name found in profiles either");
          }
        }
      } catch (error) {
        console.error("Error loading attorney name:", error);
      }
    };

    console.log("AttorneyLanding: useEffect triggered, user available:", user.id);
    loadTierData();
    fetchName();
    
    return () => {
      isMounted = false;
      console.log("AttorneyLanding: useEffect cleanup - isMounted set to false");
    };
  }, [user]);

  useEffect(() => {
    console.log("AttorneyLanding: attorneyName state changed to:", attorneyName);
  }, [attorneyName]);

  const usedProviders = providers.filter((p) => p.active).length;
  const providerRemain = Math.max(0, providerSlots - usedProviders);

  // Filter cases for different tracking needs
  const now = new Date();
  
  // Critical: Intake-phase cases without attorney intervention in 72+ hours
  // Attorney-6: Suppress intake SLA banner when care_plan_released === true (active case)
  const criticalCases = cases.filter((c) => {
    const hoursOld = differenceInHours(now, new Date(c.createdAt));
    const isIntakePhase = !(c as { carePlanReleased?: boolean }).carePlanReleased;
    return hoursOld >= 72 && c.status === "NEW" && isIntakePhase;
  });

  // Cases needing attention (30+ days since last checkin)
  const needsAttentionCases = cases.filter((c) => {
    if (!c.checkins || c.checkins.length === 0) {
      const daysOld = differenceInDays(now, new Date(c.createdAt));
      return daysOld >= 30;
    }
    const lastCheckin = c.checkins[c.checkins.length - 1];
    const daysSinceCheckin = differenceInDays(now, new Date(lastCheckin.ts));
    return daysSinceCheckin >= 30;
  });


  if (rolesLoadError) {
    return (
      <AppLayout>
        <div className="p-8 space-y-4">
          <p className="text-muted-foreground">
            Unable to load user roles. Please refresh. If this persists, contact admin.
          </p>
          <p className="text-sm text-muted-foreground">Reason: {rolesLoadError}</p>
          <p className="text-sm text-muted-foreground">Code: {rolesLoadErrorCode ?? "—"}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          {(import.meta.env.DEV || (typeof window !== "undefined" && (window as { __RCMS_DEBUG_ROLES?: boolean }).__RCMS_DEBUG_ROLES)) && rolesLoadDiagnostics && (
            <div className="rounded-md border border-border bg-muted/50 p-4 text-xs font-mono text-muted-foreground">
              <div className="font-semibold text-foreground mb-2">Role load diagnostics</div>
              <div>hasSession: {String(rolesLoadDiagnostics.hasSession)}</div>
              <div>auth_user_id: {import.meta.env.DEV ? (rolesLoadDiagnostics.auth_user_id ?? "null") : (rolesLoadDiagnostics.auth_user_id ? `${String(rolesLoadDiagnostics.auth_user_id).slice(0, 8)}…` : "null")}</div>
              <div>roleQueryTable: {rolesLoadDiagnostics.roleQueryTable}</div>
              <div>roleQueryResultCount: {rolesLoadDiagnostics.roleQueryResultCount ?? "—"}</div>
              <div>role: {rolesLoadDiagnostics.role ?? "—"}</div>
              <div>error: {rolesLoadDiagnostics.error ?? "—"}</div>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PolicyAcknowledgmentBanner />
      {attorneyRoleNotConfigured && (
        <div className="mx-8 mt-4 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10">
          <p className="text-sm font-medium text-foreground">Your account role is not configured. Contact admin.</p>
        </div>
      )}
      <div className="p-8 pb-24 lg:pb-8">
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Attorney Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {attorneyName && attorneyName.trim() ? `Welcome, ${attorneyName}` : 'Manage your practice and client cases'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <AttorneyGlobalSearch />
            <ExportCenter />
            <NotificationCenter />
          </div>
        </div>

        {/* Quick Stats Widget */}
        <div className="mb-6">
          <AttorneyQuickStatsWidget />
        </div>

        {/* Top Row: Tier + eWallet */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 border-border lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary cursor-help">
                      Tier: {tierData?.tier || currentTier}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage plan and pricing in Billing</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
            </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <KPI
              label="Attorney Seats"
              value={`${tierCaps.seats.attorneys}`}
              note="Configured in tier"
            />
            <KPI
              label="Staff Seats"
              value={`${tierCaps.seats.staff}`}
              note="Configured in tier"
            />
            <KPI
              label="Provider Slots"
              value={`${usedProviders}/${providerSlots}`}
              note={`${providerRemain} remaining`}
            />
          </div>
        </Card>

          <EWalletSummary />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Team Seats</p>
                <p className="text-2xl font-bold text-foreground">
                  {tierCaps.seats.attorneys + tierCaps.seats.staff + tierCaps.seats.rnCcm}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-lg bg-accent/10">
                <Stethoscope className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Providers</p>
                <p className="text-2xl font-bold text-foreground">{usedProviders}</p>
              </div>
            </div>
          </Card>

        </div>

        {/* Quick Actions Dashboard */}
        <div className="space-y-6 mb-6">
          <AttorneyQuickActions />
        </div>

        {/* Overview Content - Case Tracking (Tab ribbon removed) */}
        <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <AdvancedFilters 
                onApplyFilters={(filters) => console.log("Filters applied:", filters)} 
                filterType="cases"
              />
            </div>
            {/* CRITICAL: 72-hour cases */}
            {criticalCases.length > 0 && (
              <Card className="p-4 border-destructive bg-destructive/5">
                <div className="flex items-start gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-destructive mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-destructive mb-1">
                      Critical: Attorney Action Required
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {criticalCases.length} case{criticalCases.length !== 1 ? "s" : ""} pending 72+ hours. 
                      Will be deleted/tagged as attorney refusal in 72 more hours.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {criticalCases.map((c) => (
                    <CaseListItem key={c.id} case={c} navigate={navigate} urgent />
                  ))}
                </div>
              </Card>
            )}

            {/* Cases Needing Attention */}
            <Card
              className="p-4 border-border cursor-pointer hover:bg-muted/30 transition-colors"
              role="button"
              tabIndex={0}
              onClick={() => navigate("/attorney/cases?filter=stale30")}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate("/attorney/cases?filter=stale30"); } }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-warning" />
                <h3 className="text-lg font-semibold text-foreground">
                  Cases Needing Attention (30+ days)
                </h3>
                <span className="ml-auto text-sm text-muted-foreground">
                  {needsAttentionCases.length} case{needsAttentionCases.length !== 1 ? "s" : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); navigate("/attorney/cases?filter=stale30"); }}
                >
                  View
                </Button>
              </div>
              {needsAttentionCases.length === 0 ? (
                <p className="text-sm text-muted-foreground">All cases have recent check-ins</p>
              ) : (
                <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                  {needsAttentionCases.slice(0, 5).map((c) => (
                    <CaseListItem key={c.id} case={c} navigate={navigate} showLastCheckin />
                  ))}
                  {needsAttentionCases.length > 5 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/attorney/cases?filter=stale30")}
                      className="w-full mt-2"
                    >
                      View all {needsAttentionCases.length} cases
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {/* Pinned Cases */}
            <div>
              <PinnedCasesWidget />
            </div>
        </div>

        {/* Bulk Actions Bar - shown when items are selected */}
        <BulkActionsBar 
          selectedCount={selectedCases.length}
          onClearSelection={() => setSelectedCases([])}
          itemType="cases"
        />

      </div>
    </AppLayout>
  );
}

// Helper component for case list items
function CaseListItem({
  case: c,
  navigate,
  urgent = false,
  showLastCheckin = false,
}: {
  case: Case;
  navigate: (path: string) => void;
  urgent?: boolean;
  showLastCheckin?: boolean;
}) {
  const hoursOld = differenceInHours(new Date(), new Date(c.createdAt));
  const lastCheckin = c.checkins?.[c.checkins.length - 1];
  const daysSinceCheckin = lastCheckin
    ? differenceInDays(new Date(), new Date(lastCheckin.ts))
    : differenceInDays(new Date(), new Date(c.createdAt));

  const statusColors = getStatusColor(c.status);

  const { user, roles } = useAuth();
  const rows = buildCsvRowsFromCase(c);
  const okByConsent = consentAllowsAttorney(c);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        urgent
          ? "border-destructive/50 bg-destructive/10"
          : `${statusColors.border} ${statusColors.bg}`
      }`}
    >
      <div className="flex-1 cursor-pointer" onClick={() => navigate(`/attorney/cases/${c.id}`)}>
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {c.client.rcmsId}
            {c.client?.fullName || c.client?.displayNameMasked ? ` — ${c.client.fullName || c.client.displayNameMasked}` : ""}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
          >
            {statusColors.icon}
            {c.status.replace(/_/g, " ")}
          </span>
          <DossierReadiness caseObj={c} />
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {c.intake?.incidentType || "N/A"} • {c.intake?.injuries && Array.isArray(c.intake.injuries) ? c.intake.injuries.slice(0, 2).join(", ") : "No injuries listed"}
          {c.intake?.injuries && c.intake.injuries.length > 2 && "..."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          {urgent && (
            <p className="text-sm font-semibold text-destructive">
              {Math.floor(hoursOld)}h old
            </p>
          )}
          {showLastCheckin && (
            <p className="text-sm text-muted-foreground">
              {daysSinceCheckin} days ago
            </p>
          )}
          {!urgent && !showLastCheckin && (
            <p className="text-sm text-muted-foreground">
              {fmtDate(c.createdAt)}
            </p>
          )}
        </div>
        <ExportButton
          role={roles[0] || "ATTORNEY"}
          caseId={c?.id || (c as any)?.case_id}
          consentAllows={okByConsent}
          rows={rows}
          filename={`rcms_case_${c?.id || (c as any)?.case_id}.csv`}
          userId={user?.id || ""}
          caseData={c}
        />
        <PreSettlementDossier caseObj={c} />
      </div>
    </div>
  );
}
