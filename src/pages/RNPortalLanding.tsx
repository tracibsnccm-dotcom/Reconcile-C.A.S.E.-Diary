import { Link, useNavigate } from "react-router-dom";
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  HeartPulse,
  MessageSquare,
  Settings,
  Users,
  Activity,
  FolderKanban,
  Calendar,
  ClipboardCheck,
  AlertCircle,
  TrendingDown,
  StickyNote,
  BookOpen,
  Bell,
  UserCheck,
  Search,
  GitBranch,
  Mic,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { useAuth } from "@/auth/supabaseAuth";
import { useRNAssignments } from "@/hooks/useRNData";
import { format, parseISO } from "date-fns";
import { MetricNoteDialog } from "@/components/MetricNoteDialog";
import { useEffect, useState } from "react";
import { fetchRNMetrics, type RNMetricsData } from "@/lib/rnMetrics";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet } from "@/lib/supabaseRest";
import { DASHBOARD_ACTIONS } from "@/config/rnActions";
import { resolveCaseUuidFromRef } from "@/lib/rnCaseLinking";
import { setLastActiveCase } from "@/lib/rnLastActiveCase";
import { getAcceptanceState, type AcceptanceState } from "@/lib/rnAcknowledgment";
import {
  buildAcknowledgedAssignmentItems,
  type CaseForAck,
} from "@/lib/rnAssignmentPriority";
import { RNResourcesDialog } from "@/components/rn/RNResourcesDialog";
import { RNRecentActivityFeed } from "@/components/RNRecentActivityFeed";
import { RNUpcomingDeadlines } from "@/components/RNUpcomingDeadlines";
import { RNCaseHealthOverview } from "@/components/RNCaseHealthOverview";
import { RNTeamPerformance } from "@/components/RNTeamPerformance";
import { RNClientSatisfaction } from "@/components/RNClientSatisfaction";
import { RNCaseloadAtAGlance } from "@/components/RNCaseloadAtAGlance";
import { RNComplianceAlerts } from "@/components/RNComplianceAlerts";
import { RNTodaysPriorities } from "@/components/RNTodaysPriorities";
import { RNEngagementMetrics } from "@/components/RNEngagementMetrics";
import { LastActiveCaseBanner } from "@/components/rn/LastActiveCaseBanner";

interface CaseItem {
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
}

export default function RNPortalLanding() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { role } = useApp();
  const isSupervisor = role === ROLES.SUPER_USER || role === ROLES.SUPER_ADMIN || role === ROLES.RN_CM_SUPERVISOR || role === ROLES.RN_CM_MANAGER;
  const { assignments } = useRNAssignments();
  const [metricsData, setMetricsData] = useState<RNMetricsData | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [metricNotes, setMetricNotes] = useState<Set<string>>(new Set());
  const [selectedMetric, setSelectedMetric] = useState<{
    name: string;
    label: string;
    value: number;
    target: number;
  } | null>(null);
  const [activeCases, setActiveCases] = useState<CaseItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [rnName, setRnName] = useState<string>("");
  const [rnUserId, setRnUserId] = useState<string | null>(null);
  /** id+label for View case resolution (same source as queue: rc_cases for rn_cm_id). */
  const [caseOptions, setCaseOptions] = useState<Array<{ id: string; label: string }>>([]);
  /** Cases for acknowledged-assignments (assigned_rn_id = auth id, matches queue). */
  const [casesForAck, setCasesForAck] = useState<CaseForAck[]>([]);
  /** Acceptance state per case for acknowledged-assignments. */
  const [acceptanceStates, setAcceptanceStates] = useState<Map<string, AcceptanceState>>(new Map());
  const displayName = rnName || authUser?.user_metadata?.full_name || "RN";

  const newAssignments = assignments.filter((a) => {
    const assignedDate = new Date(a.assigned_at);
    const daysSinceAssigned = Math.floor((Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceAssigned <= 3;
  });

  const hasEmergencies = metricsData && metricsData.metrics.alerts.length > 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load metrics
        const data = await fetchRNMetrics();
        setMetricsData(data);
        
        // Load RN name and ID using user from useAuth hook
        if (authUser) {
          // Get RN user record from rc_users
          const { data: rnUserData, error: rnUserError } = await supabaseGet(
            'rc_users',
            `auth_user_id=eq.${authUser.id}&select=id,full_name&limit=1`
          );

          if (!rnUserError && rnUserData) {
            const rnUser = Array.isArray(rnUserData) ? rnUserData[0] : rnUserData;
            if (rnUser) {
              const rcUserId = (rnUser as { id: string }).id;
              setRnUserId(rcUserId);
              const fullName = (rnUser as { full_name?: string }).full_name || "RN";
              setRnName(fullName);
              // caseOptions for View case UUID resolution (same as queue: rc_cases for rn_cm_id)
              const { data: directCases, error: casesErr } = await supabase
                .from("rc_cases")
                .select("id, case_number, client_id")
                .eq("rn_cm_id", rcUserId)
                .eq("is_superseded", false);
              if (!casesErr && directCases?.length) {
                const clientIds = directCases.map((c) => c.client_id).filter(Boolean) as string[];
                const { data: clients } = await supabase
                  .from("rc_clients")
                  .select("id, first_name, last_name")
                  .in("id", clientIds);
                const opts = directCases.map((c) => {
                  const cl = clients?.find((x) => x.id === c.client_id);
                  const name = cl
                    ? `${(cl as { first_name?: string }).first_name || ""} ${(cl as { last_name?: string }).last_name || ""}`.trim()
                    : "Unknown Client";
                  return { id: c.id, label: `${c.case_number || c.id} — ${name || "Unknown"}` };
                });
                setCaseOptions(opts);
              } else {
                setCaseOptions([]);
              }
            }
          }

          // Cases for acknowledged-assignments: assigned_rn_id = auth id (matches /rn/queue)
          try {
            const { data: ackCases, error: ackErr } = await supabase
              .from("rc_cases")
              .select("id, created_at, case_status, case_number, client_id")
              .eq("assigned_rn_id", authUser.id)
              .eq("is_superseded", false);
            if (!ackErr && ackCases?.length) {
              const ackClientIds = ackCases.map((c) => c.client_id).filter(Boolean) as string[];
              const { data: ackClients } = await supabase
                .from("rc_clients")
                .select("id, first_name, last_name")
                .in("id", ackClientIds);
              const mapped: CaseForAck[] = ackCases.map((c) => {
                const cl = ackClients?.find((x) => x.id === c.client_id);
                const client_name = cl
                  ? `${(cl as { first_name?: string }).first_name || ""} ${(cl as { last_name?: string }).last_name || ""}`.trim()
                  : "Unknown Client";
                return {
                  id: c.id,
                  created_at: c.created_at ?? null,
                  case_status: c.case_status ?? null,
                  case_number: c.case_number ?? null,
                  client_name,
                };
              });
              setCasesForAck(mapped);

              // Load acceptance state for each assigned case
              const stateMap = new Map<string, AcceptanceState>();
              for (const c of mapped) {
                try {
                  const state = await getAcceptanceState(c.id, authUser.id);
                  stateMap.set(c.id, state);
                } catch (err) {
                  console.warn("[RN] Failed to load acceptance state for", c.id, err);
                  stateMap.set(c.id, { status: "no_epoch" });
                }
              }
              setAcceptanceStates(stateMap);
            } else {
              setCasesForAck([]);
              setAcceptanceStates(new Map());
            }
          } catch {
            setCasesForAck([]);
            setAcceptanceStates(new Map());
          }

          // Load notes for current user
          const { data: notes } = await supabase
            .from('rn_metric_notes')
            .select('metric_name')
            .eq('rn_user_id', authUser.id);
          
          if (notes) {
            const uniqueMetrics = new Set(notes.map(n => n.metric_name));
            setMetricNotes(uniqueMetrics);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setMetricsLoading(false);
      }
    };
    
    if (authUser) {
      loadData();
    } else {
      setMetricsLoading(false);
    }
  }, [authUser]);


  const handleMetricClick = (name: string, label: string, value: number, target: number) => {
    setSelectedMetric({ name, label, value, target });
    setNoteDialogOpen(true);
  };

  const handleNoteDialogClose = async (open: boolean) => {
    setNoteDialogOpen(open);
    
    // Refresh notes when dialog closes
    if (!open && authUser) {
      const { data: notes } = await supabase
        .from('rn_metric_notes')
        .select('metric_name')
        .eq('rn_user_id', authUser.id);
      
      if (notes) {
        const uniqueMetrics = new Set(notes.map(n => n.metric_name));
        setMetricNotes(uniqueMetrics);
      }
    }
  };

  const hasNote = (metricName: string) => {
    return metricNotes.has(metricName);
  };

  const getColorClass = (value: number, target: number) => {
    if (value >= target) return "bg-green-500";
    if (value >= target - 5) return "bg-yellow-400";
    return "bg-red-500";
  };

  const getTrendIcon = (change: string) => {
    if (change.startsWith("+")) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change.startsWith("-")) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return null;
  };

  const getAcceptanceAcknowledgedAt = (rnUserId: string, caseId: string): string | null => {
    const s = acceptanceStates.get(caseId);
    if (s?.status === "accepted") return s.accepted_at;
    if (s?.status === "ack_sent") return s.ack_sent_at;
    return null;
  };
  const acknowledgedAssignmentItems = buildAcknowledgedAssignmentItems({
    rnUserId: authUser?.id ?? "",
    cases: casesForAck,
    getAcknowledgedAt: getAcceptanceAcknowledgedAt,
    caseLabelResolver: (c) => `${c.case_number || c.id} — ${c.client_name || "Unknown"}`,
  });

  return (
    <AppLayout>
      <div className="py-6 px-6 bg-gradient-to-b from-[#0f2a6a]/5 via-[#128f8b]/5 to-[#0f2a6a]/5 min-h-screen">
        <div className="max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-3">
              <span>RN Case Management</span>
              <span className="opacity-75">Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f2a6a]">
              Welcome, {displayName}, RN, CCM
            </h1>
            <p className="text-[#0f2a6a]/80 mt-2 max-w-2xl">
              This dashboard provides situational awareness and serves as your command center for daily priorities, clinical oversight, and performance. Case work is completed in your work queues.
            </p>
            <LastActiveCaseBanner rnUserId={authUser?.id} className="mt-3" variant="dashboard" />
          </div>
          {/* Top actions: ONLY Contact Sup/Mgr + Pending Queue + Active Queue. Execution tiles moved to /rn/queue. */}
          <div className="flex flex-wrap gap-3 shrink-0">
            {DASHBOARD_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <Button
                  key={a.key}
                  variant={a.key === "pending" ? "default" : "outline"}
                  onClick={() => navigate(a.to)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {a.label}
                </Button>
              );
            })}
          </div>
        </header>

          <RNResourcesDialog />

          {/* Emergency Alert — always visible under tabs; empty state when none */}
          <section className="mb-4" aria-labelledby="emergency-alert-heading">
            <h2 id="emergency-alert-heading" className="sr-only">Emergency Alert</h2>
            {hasEmergencies ? (
              <Alert variant="destructive" className="border-l-4 animate-pulse">
                <AlertCircle className="h-4 w-4 animate-pulse" />
                <AlertDescription className="flex items-center justify-between">
                  <span className="font-semibold">
                    {metricsData!.metrics.alerts.length} EMERGENCY Alert{metricsData!.metrics.alerts.length !== 1 ? "s" : ""} - SUICIDAL IDEATION
                  </span>
                  <Badge variant="destructive" className="animate-pulse">IMMEDIATE ACTION REQUIRED</Badge>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-l-4 border-l-muted bg-muted/30">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <AlertDescription>No emergency alerts at this time.</AlertDescription>
              </Alert>
            )}
          </section>

          {/* Metric Note Dialog */}
          {selectedMetric && (
            <MetricNoteDialog
              open={noteDialogOpen}
              onOpenChange={handleNoteDialogClose}
              metricName={selectedMetric.name}
              metricLabel={selectedMetric.label}
              currentValue={selectedMetric.value}
              targetValue={selectedMetric.target}
            />
          )}

          {/* At a Glance — caseload counts only; Caseload Health moved to Quality & Performance */}
          <section className="mb-8" aria-labelledby="at-a-glance-heading">
            <h2 id="at-a-glance-heading" className="text-xl font-bold text-[#0f2a6a] mb-4">At a glance</h2>
            <RNCaseloadAtAGlance />
          </section>

          {/* Command center: 3-column — Today's Priorities | Upcoming Deadlines | Recent Activity */}
          <section className="mb-8" aria-labelledby="today-heading">
            <h2 id="today-heading" className="text-xl font-bold text-[#0f2a6a] mb-4">Today&apos;s workflow</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <RNTodaysPriorities followUpItems={metricsData?.metrics?.alerts ?? []} rnUserId={authUser?.id ?? null} caseOptions={caseOptions} acknowledgedAssignments={acknowledgedAssignmentItems} />
              <RNUpcomingDeadlines rnUserId={authUser?.id ?? null} acknowledgedAssignments={acknowledgedAssignmentItems} />
              <RNRecentActivityFeed rnUserId={authUser?.id ?? null} caseOptions={caseOptions} />
            </div>
          </section>

          {/* 72-hour supervisor visibility: system subsequent care plan items only; neutral; no appointments/calls */}
          {isSupervisor && metricsData && (() => {
            const alerts = metricsData.metrics.alerts || [];
            const over72h = alerts.filter((a: { type?: string; days_overdue?: number }) => {
              if ((a.days_overdue ?? 0) < 3) return false;
              const t = (a.type || "").toLowerCase();
              if (/appointment|call/.test(t)) return false;
              return true;
            });
            if (over72h.length === 0) return null;
            return (
              <section className="mb-8" aria-labelledby="over72h-heading">
                <h2 id="over72h-heading" className="text-xl font-bold text-[#0f2a6a] mb-4">Items Pending &gt; 72 Hours (Review for capacity/support)</h2>
                <Card>
                  <CardContent className="pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">RN</th>
                            <th className="text-left py-2 font-medium">Item</th>
                            <th className="text-left py-2 font-medium">Age</th>
                            <th className="text-left py-2 font-medium">Case</th>
                          </tr>
                        </thead>
                        <tbody>
                          {over72h.map((a: { type?: string; case_id?: string; days_overdue?: number }, i: number) => (
                            <tr key={i} className="border-b last:border-0">
                              <td className="py-2 text-muted-foreground">{rnName || "—"}</td>
                              <td className="py-2">{a.type} – {a.case_id || "—"}</td>
                              <td className="py-2">{a.days_overdue ?? 0} days</td>
                              <td className="py-2">
                                {a.case_id ? (() => {
                                  const resolved = resolveCaseUuidFromRef(a.case_id, caseOptions);
                                  return resolved ? (
                                    <Link
                                      to={`/rn/case/${resolved}/ten-vs`}
                                      className="text-primary hover:underline"
                                      onClick={() => {
                                        if (authUser?.id) {
                                          const caseLabel = caseOptions.find((o) => o.id === resolved)?.label ?? a.case_id;
                                          setLastActiveCase(authUser.id, {
                                            case_id: resolved,
                                            case_label: caseLabel,
                                            last_route: `/rn/case/${resolved}/ten-vs`,
                                          });
                                        }
                                      }}
                                    >
                                      View case
                                    </Link>
                                  ) : (
                                    <span className="text-muted-foreground text-xs">Case link unavailable</span>
                                  );
                                })() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </section>
            );
          })()}

          {/* Quality & Performance — includes Caseload Health integrated here */}
          <section className="mb-8" aria-labelledby="quality-perf-heading">
            <h2 id="quality-perf-heading" className="text-xl font-bold text-[#0f2a6a] mb-4">Quality & Performance</h2>
            <div className="mb-4">
              <RNCaseHealthOverview />
            </div>
            {metricsData && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-[#0f2a6a]">My Quality & Performance Metrics</CardTitle>
                  <CardDescription>
                    Your weekly and monthly performance vs. RCMS targets, plus compliance tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { label: "Notes ≤ 24h", value: metricsData.metrics.my_performance.notes_24h, target: metricsData.metrics.targets.notes_24h, weekChange: metricsData.metrics.trend.week_change.notes_24h, monthChange: metricsData.metrics.trend.month_change.notes_24h, type: "performance" },
                      { label: "Subsequent Care Plan Calls", value: metricsData.metrics.my_performance.followup_calls, target: metricsData.metrics.targets.followup_calls, weekChange: metricsData.metrics.trend.week_change.followup_calls, monthChange: metricsData.metrics.trend.month_change.followup_calls, type: "performance" },
                      { label: "Med Reconciliation", value: metricsData.metrics.my_performance.med_reconciliation, target: metricsData.metrics.targets.med_reconciliation, weekChange: metricsData.metrics.trend.week_change.med_reconciliation, monthChange: metricsData.metrics.trend.month_change.med_reconciliation, type: "performance" },
                      { label: "Care Plans Current", value: metricsData.metrics.my_performance.care_plans_current, target: metricsData.metrics.targets.care_plans_current, weekChange: metricsData.metrics.trend.week_change.care_plans_current, monthChange: metricsData.metrics.trend.month_change.care_plans_current, type: "performance" },
                      { label: "Required Fields", value: 94, target: 100, weekChange: "+2%", monthChange: "+5%", type: "compliance" },
                      { label: "Care Plan Timeliness", value: 88, target: 95, weekChange: "-1%", monthChange: "+3%", type: "compliance" },
                      { label: "Documentation Standards", value: 96, target: 98, weekChange: "+1%", monthChange: "+2%", type: "compliance" },
                      { label: "Compliance Rate", value: 92, target: 95, weekChange: "0%", monthChange: "+4%", type: "compliance" },
                    ].map((m, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border bg-card p-3 hover:shadow-md transition-all cursor-pointer relative group"
                        onClick={() => handleMetricClick(`${m.type}_${m.label.toLowerCase().replace(/\s+/g, '_')}`, m.label, m.value, m.target)}
                      >
                        {hasNote(`${m.type}_${m.label.toLowerCase().replace(/\s+/g, '_')}`) && (
                          <div className="absolute top-2 right-2"><StickyNote className="h-3 w-3 text-blue-600" /></div>
                        )}
                        <div className="text-xs font-medium text-muted-foreground mb-1">{m.label}</div>
                        <div className="text-xl font-bold text-foreground mb-2">{m.value}%</div>
                        <div className="h-1.5 rounded bg-muted mb-2">
                          <div className={`h-1.5 rounded transition-all ${getColorClass(m.value, m.target)}`} style={{ width: `${m.value}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="text-muted-foreground">Target: {m.target}%</div>
                          <div className="flex items-center gap-1">{getTrendIcon(m.weekChange)}<span>{m.weekChange}</span></div>
                        </div>
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity pointer-events-none" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <RNTeamPerformance />
              <RNClientSatisfaction />
            </div>
            {isSupervisor && (
              <div className="grid grid-cols-1 gap-4">
                <RNEngagementMetrics />
              </div>
            )}
          </section>

          {/* Compliance Center — renamed from Compliance Alerts; lower third */}
          <section className="mb-8" aria-labelledby="compliance-center-heading">
            <h2 id="compliance-center-heading" className="text-xl font-bold text-[#0f2a6a] mb-4">Compliance Center</h2>
            <RNComplianceAlerts />
          </section>

        {/* Tools & Resources */}
        <section className="mb-8" aria-labelledby="tools-resources-heading">
          <h2 id="tools-resources-heading" className="text-xl font-bold text-[#0f2a6a] mb-4">Tools & Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Education Materials */}
          <Link
            to="/rn/education-library"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full min-h-[180px]"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">Education Materials</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Access client education resources, videos, and interactive materials.
                </p>
                <Badge className="mt-3" variant="secondary">Resource Library</Badge>
              </div>
            </div>
          </Link>

          {/* Voice Documentation */}
          <Link
            to="/rn/voice-documentation"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full min-h-[180px]"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-lg bg-pink-100 text-pink-700 group-hover:bg-pink-600 group-hover:text-white transition shrink-0">
                <Mic className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">Voice Documentation</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Dictate notes with voice-to-text and AI-powered documentation assistance.
                </p>
                <Badge className="mt-3" variant="secondary">AI-Enhanced</Badge>
              </div>
            </div>
          </Link>

          {/* Resources */}
          <div
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group cursor-pointer flex flex-col h-full min-h-[180px]"
            onClick={() => {
              if ((window as any).openRNResourcesDialog) {
                (window as any).openRNResourcesDialog();
              }
            }}
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">Resources</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Quick access to guides, training materials, and best practices.
                </p>
                <Badge className="mt-3" variant="secondary">Resource Library</Badge>
              </div>
            </div>
          </div>

          {/* Log Activity */}
          <Link
            to="/rn-clinical-liaison"
            className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full min-h-[180px]"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="p-3 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-600 group-hover:text-white transition shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-lg">Log Activity</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Record clinical activities, notes, and case updates.
                </p>
                <Badge className="mt-3" variant="secondary">Activity Tracking</Badge>
              </div>
            </div>
          </Link>

          {isSupervisor && (
            <Link
              to="/rn-supervisor"
              className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-lg transition-all group flex flex-col h-full min-h-[180px]"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="p-3 rounded-lg bg-[#0f2a6a]/10 text-[#0f2a6a] group-hover:bg-[#0f2a6a] group-hover:text-white transition shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-lg">Team Dashboard</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Monitor team performance, manage assignments, and review quality metrics.
                  </p>
                  <Badge className="mt-3" variant="secondary">Supervisor View</Badge>
                </div>
              </div>
            </Link>
          )}
        </div>
        </section>

        {/* Settings & Profile */}
        <div>
          <h2 className="text-xl font-bold text-[#0f2a6a] mb-4">Settings & Profile</h2>
          <Link
            to="/rn/settings"
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition group inline-flex items-start gap-3 w-full md:w-auto"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-600 group-hover:text-white transition">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">RN Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Update profile, availability, communication preferences, and security settings.
              </p>
            </div>
          </Link>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}
