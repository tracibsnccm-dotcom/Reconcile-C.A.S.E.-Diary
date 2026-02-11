/**
 * RN Work Queue Page – /rn/queue
 *
 * Dedicated RN work surface with:
 * - Awaiting Acknowledgement (assigned by supervisor; attorney_confirmed / intake_pending)
 * - Pending Work Queue (no initial care plan, 24h SLA with due/status/xh left)
 * - Active Work Queue (has initial care plan or case_status='active')
 * - RN name at top; case context safety (close panels on case switch is in CaseDetail).
 *
 * Data source: rc_cases.assigned_rn_id = current user id (profiles.id / auth user id).
 *
 * --- Phase 1 RN Finalize & Submit (release) entry points ---
 * Existing release UI: FinalizeCarePlanScreen (src/screens/rn/FinalizeCarePlanScreen.tsx),
 * rendered via CarePlanWorkflow with initialStep="finalize" (src/components/rn/CarePlanWorkflow.tsx).
 * Route to navigate for finalizing a specific case/care_plan: /rn/case/:caseId/finalize
 * (main.tsx: Route path="/rn/case/:caseId/finalize" -> CarePlanWorkflow initialStep="finalize").
 * RNPublishPanel (src/components/RNPublishPanel.tsx) uses navigate(`/rn/case/${id}/${segment}`).
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, parseISO, addHours } from "date-fns";
import { toast } from "sonner";
import { ExternalLink, Play, Square, CalendarCheck, FileText, Eye } from "lucide-react";
import { PENDING_QUEUE_ACTIONS, ACTIVE_QUEUE_ACTIONS } from "@/config/rnActions";
import { TodayDeadlinesPanel, RC_TODAY_ORIGIN } from "@/components/rn/TodayDeadlinesPanel";
import { getReminders, markReminderDone } from "@/lib/rnRemindersStore";
import { setLastActiveCase } from "@/lib/rnLastActiveCase";
import { LastActiveCaseBanner } from "@/components/rn/LastActiveCaseBanner";
import {
  getAcceptanceState,
  recordAcceptAssignment,
  recordDeclineAssignment,
  type AcceptanceState,
  type DeclineReasonCode,
} from "@/lib/rnAcknowledgment";
import { buildAcknowledgedAssignmentItems, type CaseForAck } from "@/lib/rnAssignmentPriority";
import { rnStatusLabel } from "@/lib/rnStatusLabels";
import { getClientDisplayName } from "@/lib/rnClientNameHelper";
import { useCarePlanReminders } from "@/hooks/useCarePlanReminders";
import { cn } from "@/lib/utils";

// --- RN Work Queue State Mapping ---
/**
 * QUEUE BUCKETS → CONDITIONS → TARGET ROUTES
 *
 * 1. Awaiting Acknowledgement
 *    - Condition: case_status IN ('attorney_confirmed', 'intake_pending', 'assigned_to_rn')
 *                 AND no released care plan
 *    - Target route: /rn/case/:caseId/ten-vs (opens 10Vs screen)
 *    - Primary CTA: "Acknowledge" (if not yet acknowledged) then "Open" (both go to ten-vs)
 *
 * 2. Pending Work Queue (Initial Care Plan Due < 24h)
 *    - Condition: attorney_attested && no care plan && no released care plan
 *    - Target route: /rn/case/:caseId/ten-vs (opens 10Vs screen)
 *    - Primary CTA: Row click or inline "Open case →" link
 *
 * 3. Active Cases
 *    - Condition: case_status='active' OR has any care plan
 *    - Target routes:
 *      - Draft care plan → /rn/case/:caseId/workflow (Continue Draft)
 *      - Released care plan → /rn/case/:caseId/finalize (View Released Plan)
 *      - No care plan → /rn/case/:caseId/workflow (Open Care Plan)
 *    - Primary CTA: Single button based on care plan status
 *    - Row click: Opens the same destination as primary CTA
 *
 * Navigation function: handleOpenCase (for Awaiting Ack + Pending) → /rn/case/:id/ten-vs
 *                      handleOpenCarePlan (for Active drafts) → /rn/case/:id/workflow
 *                      handleFinalizeSubmit (for Active released) → /rn/case/:id/finalize
 */

// --- Types ---

type PendingSlaStatus = "On Track" | "Due Soon" | "Urgent" | "Overdue";

interface AwaitingAckCase {
  id: string;
  case_number: string | null;
  client_name: string;
  case_status: string | null;
  created_at: string | null;
}

interface PendingCase {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
  /** When the 24h SLA started (attorney_attested_at or intake/case created_at) */
  assigned_at: string;
  /** assigned_at + 24h */
  due_at: Date;
}

interface ActiveCase {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
}

// --- Helpers ---

function getSlaStatus(dueAt: Date): { status: PendingSlaStatus; color: string } {
  const now = new Date();
  const hoursRem = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursRem < 0) return { status: "Overdue", color: "text-red-600 bg-red-50 border-red-200" };
  if (hoursRem < 4) return { status: "Urgent", color: "text-red-600 bg-red-50 border-red-200" };
  if (hoursRem < 12) return { status: "Due Soon", color: "text-amber-700 bg-amber-50 border-amber-200" };
  return { status: "On Track", color: "text-green-700 bg-green-50 border-green-200" };
}

function getHoursLeft(dueAt: Date): string {
  const now = new Date();
  const hours = (dueAt.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hours < 0) return "Overdue";
  const h = Math.floor(hours);
  if (h <= 0) return "<1h left";
  return `${h}h left`;
}

// --- Page ---

const RC_TODAY_SUPPRESS_PREFIX = "rc_today_suppress:";
const RC_RN_QUEUE_FOCUS = "rc_rn_queue_focus";

/** Soft focus highlight for section header (title + badge area). Orientation-only. */
const FOCUS_HEADER_CLASS = "rounded-md border border-slate-200 bg-slate-50 ring-1 ring-slate-200";

export default function RNWorkQueuePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [rnName, setRnName] = useState<string>("");
  const [awaitingAck, setAwaitingAck] = useState<AwaitingAckCase[]>([]);
  const [pending, setPending] = useState<PendingCase[]>([]);
  const [active, setActive] = useState<ActiveCase[]>([]);
  /** Ticks every 60s to refresh "xh left" (no seconds, calm updates) */
  const [tick, setTick] = useState(0);
  const [isTimerTracking, setIsTimerTracking] = useState(false);
  const [todayPanelOpen, setTodayPanelOpen] = useState(false);
  /** When set, show "Mark completed?" banner (returned from case opened via Today panel). */
  const [markCompleteBanner, setMarkCompleteBanner] = useState<{
    reminderId: string;
    reminderText: string;
  } | null>(null);
  /** Soft focus for Pending vs Active section when entering from dashboard buttons. */
  const [focus, setFocus] = useState<"pending" | "active" | null>(null);
  /** Latest rc_care_plans.status per case_id (for Active row visibility: draft vs released). */
  const [carePlanStatusByCase, setCarePlanStatusByCase] = useState<Record<string, string>>({});
  const [acceptanceStates, setAcceptanceStates] = useState<Map<string, AcceptanceState>>(new Map());
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineCaseId, setDeclineCaseId] = useState<string | null>(null);
  const [declineEpochId, setDeclineEpochId] = useState<string | null>(null);
  const [declineReasonCode, setDeclineReasonCode] = useState<DeclineReasonCode>("capacity_constraint");
  const [declineReasonText, setDeclineReasonText] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { hasActiveCarePlanReminders } = useCarePlanReminders();

  const focusClass = (section: "pending" | "active") =>
    focus === section ? FOCUS_HEADER_CLASS : "";

  const fetchQueue = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: rcUser, error: rcErr } = await supabase
        .from("rc_users")
        .select("id, full_name")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (rcErr) throw rcErr;
      setRnName(rcUser?.full_name || "RN");

      // rc_cases.assigned_rn_id has FK → profiles.id (auth_user_id)
      const { data: directCases, error: casesErr } = await supabase
        .from("rc_cases")
        .select("id, case_number, date_of_injury, case_type, client_id, case_status, created_at, assigned_rn_id")
        .eq("assigned_rn_id", user.id)
        .eq("is_superseded", false);

      if (casesErr) throw casesErr;
      const caseIds = directCases?.map((c) => c.id) || [];
      if (caseIds.length === 0) {
        setAwaitingAck([]);
        setPending([]);
        setActive([]);
        setCarePlanStatusByCase({});
        setLoading(false);
        return;
      }

      const { data: clients } = await supabase
        .from("rc_clients")
        .select("id, first_name, last_name")
        .in("id", directCases!.map((c) => c.client_id).filter(Boolean) as string[]);

      const { data: intakes } = await supabase
        .from("rc_client_intakes")
        .select("case_id, attorney_attested_at, created_at, intake_json")
        .in("case_id", caseIds);

      const { data: carePlans } = await supabase
        .from("rc_care_plans")
        .select("case_id, status, created_at")
        .in("case_id", caseIds)
        .order("created_at", { ascending: false });
      const withCarePlan = new Set(carePlans?.map((cp) => cp.case_id) || []);
      // Latest status per case for Active row "Finalize & Submit" vs "View Released Plan"
      const statusByCase: Record<string, string> = {};
      (carePlans || []).forEach((cp: { case_id: string; status?: string }) => {
        if (statusByCase[cp.case_id] == null) statusByCase[cp.case_id] = cp.status ?? "draft";
      });
      setCarePlanStatusByCase(statusByCase);

      const RELEASED_STATUSES = ["submitted", "approved"] as const;

      // Awaiting Acknowledgement: cases assigned to RN but not yet acknowledged
      // Include both pre-assignment statuses and post-assignment status
      // Exclude cases that already have a released/submitted/approved care plan (they belong in Active only)
      const AWAITING_ACK_STATUSES = ["attorney_confirmed", "intake_pending", "assigned_to_rn"] as const;

      const awaitingAckList: AwaitingAckCase[] = [];
      const pendingList: PendingCase[] = [];
      const activeList: ActiveCase[] = [];

      for (const c of directCases!) {
        const client = clients?.find((cl) => cl.id === c.client_id);
        const intake = intakes?.find((i) => i.case_id === c.id);
        const hasCarePlan = withCarePlan.has(c.id);
        const attested = !!intake?.attorney_attested_at;
        const latestPlanStatus = statusByCase[c.id];
        const isReleased = latestPlanStatus && RELEASED_STATUSES.includes(latestPlanStatus as (typeof RELEASED_STATUSES)[number]);
        
        // Use shared helper for client name with fallback to intake_json
        const clientName = getClientDisplayName(
          {
            client_first_name: client?.first_name || null,
            client_last_name: client?.last_name || null,
            intake_json: intake?.intake_json || null,
          },
          intake ? { intake_json: intake.intake_json } : undefined
        );

        // A) Awaiting Acknowledgement: assigned + case_status in ('attorney_confirmed','intake_pending','assigned_to_rn')
        //    Exclude if case already has released care plan (show in Active only)
        const status = (c.case_status || "").toLowerCase();
        if (AWAITING_ACK_STATUSES.includes(status as (typeof AWAITING_ACK_STATUSES)[number]) && !isReleased) {
          awaitingAckList.push({
            id: c.id,
            case_number: c.case_number,
            client_name: clientName,
            case_status: c.case_status,
            created_at: c.created_at ?? null,
          });
        }

        // B) Pending: keep existing rule (attested && !hasCarePlan, 24h SLA)
        //    Exclude cases with released care plan (they belong in Active only)
        const assignedAt =
          intake?.attorney_attested_at || (intake as { created_at?: string })?.created_at;
        const assignedAtDate = assignedAt ? new Date(assignedAt) : new Date();
        const dueAt = addHours(assignedAtDate, 24);

        if (attested && !hasCarePlan && !isReleased) {
          pendingList.push({
            id: c.id,
            case_number: c.case_number,
            client_name: clientName,
            date_of_injury: c.date_of_injury,
            case_type: c.case_type,
            assigned_at: assignedAt || assignedAtDate.toISOString(),
            due_at: dueAt,
          });
        }

        // C) Active: assigned + (case_status='active' OR hasCarePlan)
        if (status === "active" || hasCarePlan) {
          activeList.push({
            id: c.id,
            case_number: c.case_number,
            client_name: clientName,
            date_of_injury: c.date_of_injury,
            case_type: c.case_type,
          });
        }
      }

      setAwaitingAck(awaitingAckList);
      setPending(pendingList);
      setActive(activeList);

      // Load acceptance state for each assigned case
      const stateMap = new Map<string, AcceptanceState>();
      if (user?.id) {
        for (const c of directCases!) {
          if (c.assigned_rn_id === user.id) {
            try {
              const state = await getAcceptanceState(c.id, user.id);
              stateMap.set(c.id, state);
            } catch (err) {
              console.warn("[RN] Failed to load acceptance state for", c.id, err);
              stateMap.set(c.id, { status: "no_epoch" });
            }
          }
        }
      }
      setAcceptanceStates(stateMap);
    } catch (e) {
      console.error("RNWorkQueuePage: fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setLoading(false);
      return;
    }
    fetchQueue();
  }, [user?.id, authLoading, fetchQueue]);

  useEffect(() => {
    const id = setInterval(() => setTick((s) => s + 1), 60000);
    return () => clearInterval(id);
  }, []);

  /** Read focus from ?focus= or sessionStorage; normalize to pending|active|null; clear storage. */
  useEffect(() => {
    if (location.pathname !== "/rn/queue") return;
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get("focus");
    const fromStorage = sessionStorage.getItem(RC_RN_QUEUE_FOCUS);
    const raw = fromUrl || fromStorage;
    const next: "pending" | "active" | null =
      raw === "pending" || raw === "active" ? raw : null;
    setFocus(next);
    try {
      sessionStorage.removeItem(RC_RN_QUEUE_FOCUS);
    } catch {
      // ignore
    }
  }, [location.pathname, location.search]);

  /** Optional: remove highlight after ~8s. */
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => setFocus(null), 8000);
    return () => clearTimeout(t);
  }, [focus]);

  const rnUserId = user?.id ?? "unknown";

  const ackCasesForBuild: CaseForAck[] = awaitingAck.map((c) => ({
    id: c.id,
    created_at: c.created_at,
    case_status: c.case_status,
    case_number: c.case_number,
    client_name: c.client_name,
  }));
  const getAcceptanceAcknowledgedAt = (rnUserId: string, caseId: string): string | null => {
    const s = acceptanceStates.get(caseId);
    if (s?.status === "accepted") return s.accepted_at;
    if (s?.status === "ack_sent") return s.ack_sent_at;
    return null;
  };
  const acknowledgedAssignmentItems = buildAcknowledgedAssignmentItems({
    rnUserId: user?.id ?? "",
    cases: ackCasesForBuild,
    getAcknowledgedAt: getAcceptanceAcknowledgedAt,
    caseLabelResolver: (c) => `${c.case_number || c.id} — ${c.client_name || "Unknown"}`,
  });

  /** On /rn/queue: if we have rc_today_origin (returned from case via Today panel), show "Mark completed?" when reminder still open and not suppressed. */
  useEffect(() => {
    if (location.pathname !== "/rn/queue" || !user?.id) {
      setMarkCompleteBanner(null);
      return;
    }
    try {
      const raw = sessionStorage.getItem(RC_TODAY_ORIGIN);
      if (!raw) {
        setMarkCompleteBanner(null);
        return;
      }
      const o = JSON.parse(raw) as { reminderId?: string; reminderText?: string };
      const reminderId = o?.reminderId;
      const reminderText = o?.reminderText ?? "";
      if (!reminderId) {
        sessionStorage.removeItem(RC_TODAY_ORIGIN);
        setMarkCompleteBanner(null);
        return;
      }
      const today = new Date().toISOString().slice(0, 10);
      const suppressKey = RC_TODAY_SUPPRESS_PREFIX + reminderId;
      if (sessionStorage.getItem(suppressKey) === today) {
        sessionStorage.removeItem(RC_TODAY_ORIGIN);
        setMarkCompleteBanner(null);
        return;
      }
      const list = getReminders(rnUserId);
      const rem = list.find((x) => x.id === reminderId);
      if (!rem || rem.status !== "open") {
        sessionStorage.removeItem(RC_TODAY_ORIGIN);
        setMarkCompleteBanner(null);
        return;
      }
      setMarkCompleteBanner({ reminderId, reminderText });
    } catch {
      sessionStorage.removeItem(RC_TODAY_ORIGIN);
      setMarkCompleteBanner(null);
    }
  }, [location.pathname, user?.id, rnUserId]);

  const handleOpenCase = (caseId: string, caseLabel: string) => {
    const rnCaseRoute = `/rn/case/${caseId}/ten-vs`;
    if (user?.id) {
      setLastActiveCase(user.id, {
        case_id: caseId,
        case_label: caseLabel,
        last_route: rnCaseRoute,
      });
    }
    navigate(rnCaseRoute);
  };

  /** Navigate to care plan workflow (4Ps → SDOH → … → Finalize). Route: /rn/case/:caseId/workflow */
  const handleOpenCarePlan = (caseId: string, caseLabel: string) => {
    const route = `/rn/case/${caseId}/workflow`;
    if (user?.id) {
      setLastActiveCase(user.id, { case_id: caseId, case_label: caseLabel, last_route: route });
    }
    navigate(route);
  };

  /** Navigate to Finalize & Submit (release) screen. Route: /rn/case/:caseId/finalize */
  const handleFinalizeSubmit = (caseId: string, caseLabel: string) => {
    const route = `/rn/case/${caseId}/finalize`;
    if (user?.id) {
      setLastActiveCase(user.id, { case_id: caseId, case_label: caseLabel, last_route: route });
    }
    navigate(route);
  };

  const handleAccept = async (caseId: string) => {
    const state = acceptanceStates.get(caseId);
    if (!state || state.status !== "pending" || !user?.id) return;

    setActionLoading(caseId);
    try {
      await recordAcceptAssignment({
        case_id: caseId,
        rn_user_id: user.id,
        epoch_id: state.epoch.epoch_id,
      });
      toast.success("Assignment accepted.");
      const newState = await getAcceptanceState(caseId, user.id);
      setAcceptanceStates((prev) => new Map(prev).set(caseId, newState));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to accept assignment.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineOpen = (caseId: string) => {
    const state = acceptanceStates.get(caseId);
    if (!state || state.status !== "pending") return;
    setDeclineCaseId(caseId);
    setDeclineEpochId(state.epoch.epoch_id);
    setDeclineReasonCode("capacity_constraint");
    setDeclineReasonText("");
    setDeclineDialogOpen(true);
  };

  const handleDeclineConfirm = async () => {
    if (!declineCaseId || !declineEpochId || !user?.id) return;
    if (declineReasonCode === "other" && declineReasonText.trim().length < 10) {
      toast.error("Please provide at least 10 characters for your reason.");
      return;
    }

    setActionLoading(declineCaseId);
    try {
      await recordDeclineAssignment({
        case_id: declineCaseId,
        rn_user_id: user.id,
        epoch_id: declineEpochId,
        reason_code: declineReasonCode,
        reason_text: declineReasonCode === "other" ? declineReasonText.trim() : undefined,
      });
      toast.success("Assignment declined. Your supervisor will be notified.");
      const newState = await getAcceptanceState(declineCaseId, user.id);
      setAcceptanceStates((prev) => new Map(prev).set(declineCaseId, newState));
      setDeclineDialogOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to decline assignment.");
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading work queue…</p>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Please sign in to view your work queue.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Top: Page title + RN name + Today & Deadlines */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">RN Work Queue</h1>
            <p className="text-muted-foreground mt-1">{rnName}</p>
            {focus && (
              <p className="text-sm text-muted-foreground mt-1">
                Showing: {focus === "pending" ? "Pending" : "Active"} work
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setTodayPanelOpen(true)}
            className="gap-2 shrink-0"
          >
            <CalendarCheck className="h-4 w-4" />
            Today & Deadlines
          </Button>
        </header>

        <LastActiveCaseBanner rnUserId={user?.id} className="mb-4" variant="queue" />

        {/* Mark completed? banner — after return from case opened via Today panel */}
        {markCompleteBanner && (
          <div className="mb-4 p-3 rounded-lg border bg-muted/50 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-sm">Mark completed?</p>
              <p className="text-xs text-muted-foreground">
                You just worked on: {markCompleteBanner.reminderText}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  markReminderDone(rnUserId, markCompleteBanner.reminderId);
                  sessionStorage.removeItem(RC_TODAY_ORIGIN);
                  setMarkCompleteBanner(null);
                }}
              >
                Mark Completed
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  sessionStorage.setItem(
                    RC_TODAY_SUPPRESS_PREFIX + markCompleteBanner.reminderId,
                    today
                  );
                  sessionStorage.removeItem(RC_TODAY_ORIGIN);
                  setMarkCompleteBanner(null);
                }}
              >
                Not Now
              </Button>
            </div>
          </div>
        )}

        {/* Pending Queue Tools — execution tiles relocated from dashboard */}
        <section className="mb-4" aria-labelledby="pending-queue-tools-heading">
          <h2 id="pending-queue-tools-heading" className="text-sm font-semibold text-foreground mb-2">Pending Queue Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PENDING_QUEUE_ACTIONS.map((a) => {
              const Icon = a.icon;
              return (
                <Button
                  key={a.key}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-3"
                  onClick={() => a.to && navigate(a.to)}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      a.key === "care-plan-reminders" && (hasActiveCarePlanReminders ? "text-red-600" : "text-green-600")
                    )}
                  />
                  <span className="text-xs">{a.label}</span>
                </Button>
              );
            })}
          </div>
        </section>

        {/* Awaiting Acknowledgement (Assigned by Supervisor) — above Pending/Active */}
        <Card className="mb-6">
          <CardHeader className="bg-slate-50/50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="text-slate-900">Awaiting Acknowledgement (Assigned by Supervisor)</CardTitle>
              <Badge variant="secondary" className="bg-slate-200 text-slate-900">
                {awaitingAck.length}
              </Badge>
            </div>
            <CardDescription className="text-slate-700">
              These cases were assigned to you and are ready for RN intake and clinical work. Please acknowledge acceptance to begin.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {awaitingAck.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">No cases in this section.</p>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {awaitingAck.map((c) => {
                    const label = `${c.case_number || c.id} — ${c.client_name}`;
                    return (
                      <div
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenCase(c.id, label)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenCase(c.id, label); }}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-card hover:bg-muted/40 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{label}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {rnStatusLabel(c.case_status)}
                            </Badge>
                            {c.created_at && (
                              <span className="text-xs text-muted-foreground">
                                Created: {format(parseISO(c.created_at), "MMM d, yyyy")}
                              </span>
                            )}
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleOpenCase(c.id, label); }}
                            >
                              Open case →
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {(() => {
                            const state = acceptanceStates.get(c.id);
                            if (!state) return <span className="text-gray-400 text-sm">Loading...</span>;

                            if (state.status === "no_epoch") {
                              return (
                                <span className="text-xs text-red-600 font-medium">
                                  ⚠ No assignment event — contact supervisor
                                </span>
                              );
                            }

                            if (state.status === "pending") {
                              return (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleAccept(c.id); }}
                                    disabled={actionLoading === c.id}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {actionLoading === c.id ? "..." : "Accept"}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => { e.stopPropagation(); handleDeclineOpen(c.id); }}
                                    disabled={actionLoading === c.id}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    Decline
                                  </Button>
                                </div>
                              );
                            }

                            if (state.status === "accepted") {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                  ✓ Accepted
                                </span>
                              );
                            }

                            if (state.status === "declined") {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                  ✗ Declined
                                </span>
                              );
                            }

                            if (state.status === "ack_sent") {
                              return (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  ✓ Welcome note sent
                                </span>
                              );
                            }

                            return null;
                          })()}
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOpenCase(c.id, label); }}>
                            Open
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Section 1: Pending Work Queue (Initial Care Plan Due < 24h) */}
        <Card className="mb-6 border-l-4 border-l-amber-500">
          <CardHeader className="bg-amber-50/50 border-b">
            <div className={focusClass("pending")}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-amber-900">Pending Cases (Initial Care Plan Due &lt; 24h)</CardTitle>
                <Badge variant="secondary" className="bg-amber-200 text-amber-900">
                  {pending.length}
                </Badge>
              </div>
              <CardDescription className="text-amber-800">Cases without initial care plan; due within 24 hours</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">No cases in this section.</p>
            ) : (
              <ScrollArea className="h-[320px]">
                <div className="space-y-2">
                  {pending.map((p) => {
                    const { status, color } = getSlaStatus(p.due_at);
                    const hoursLeft = getHoursLeft(p.due_at);
                    const pendingLabel = `${p.case_number || p.id} — ${p.client_name}`;
                    return (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenCase(p.id, pendingLabel)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenCase(p.id, pendingLabel); }}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-card hover:bg-muted/40 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{p.case_number || p.id}</div>
                          <div className="text-xs text-muted-foreground">{p.client_name}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Due: {format(p.due_at, "MMM d, yyyy h:mm a")}
                            </span>
                            <Badge variant="outline" className={`text-xs ${color}`}>
                              {status}
                            </Badge>
                            <span className="text-xs font-medium">{hoursLeft}</span>
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleOpenCase(p.id, pendingLabel); }}
                            >
                              Open case →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Active Queue Tools — execution tiles relocated from dashboard */}
        <section className="mb-4" aria-labelledby="active-queue-tools-heading">
          <h2 id="active-queue-tools-heading" className="text-sm font-semibold text-foreground mb-2">Active Queue Tools</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {ACTIVE_QUEUE_ACTIONS.map((a) => {
              const Icon = a.action === "timer" ? (isTimerTracking ? Square : Play) : a.icon;
              const label = a.action === "timer" ? (isTimerTracking ? "Stop Timer" : "Start Timer") : a.label;
              const timerClass = isTimerTracking && a.action === "timer" ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" : "";
              return (
                <Button
                  key={a.key}
                  variant="outline"
                  className={`flex flex-col items-center gap-2 h-auto py-3 ${timerClass}`}
                  onClick={() => {
                    if (a.action === "timer") {
                      if (!isTimerTracking) setIsTimerTracking(true);
                      else navigate("/rn/time-tracking");
                    } else if (a.to) navigate(a.to);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{label}</span>
                </Button>
              );
            })}
          </div>
        </section>

        {/* Section 2: Active Work Queue */}
        <Card>
          <CardHeader className="bg-green-50/50 border-b">
            <div className={focusClass("active")}>
              <div className="flex justify-between items-center">
                <CardTitle className="text-green-900">Active Cases</CardTitle>
                <Badge variant="secondary" className="bg-green-200 text-green-900">
                  {active.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
              {active.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">No cases in this section.</p>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2">
                    {active.map((a) => {
                      const caseLabel = `${a.case_number || a.id} — ${a.client_name}`;
                      const status = carePlanStatusByCase[a.id];
                      const isReleased = status === "submitted" || status === "approved";
                      const hasDraft = status === "draft";
                      const hasNoPlan = status == null || status === "";
                      // Single primary action: draft -> Continue Draft (workflow); released -> View Released Plan (finalize); no plan -> Open Care Plan (workflow)
                      const primaryLabel = hasDraft ? "Continue Draft" : isReleased ? "View Released Plan" : "Open Care Plan";
                      const primaryOnClick = () => {
                        if (isReleased) handleFinalizeSubmit(a.id, caseLabel);
                        else handleOpenCarePlan(a.id, caseLabel);
                      };
                      const showNoDraftHelper = hasNoPlan && !isReleased;
                      return (
                        <div
                          key={a.id}
                          role="button"
                          tabIndex={0}
                          onClick={primaryOnClick}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') primaryOnClick(); }}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 bg-card hover:bg-muted/40 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm">{a.case_number || a.id}</div>
                            <div className="text-xs text-muted-foreground">{a.client_name}</div>
                            {a.date_of_injury && (
                              <div className="text-xs text-muted-foreground mt-1">
                                DOI: {format(parseISO(a.date_of_injury), "MMM d, yyyy")}
                              </div>
                            )}
                            {showNoDraftHelper && (
                              <p className="text-xs text-muted-foreground mt-1.5">
                                Create/save a draft care plan before finalizing.
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant={isReleased ? "secondary" : "default"}
                              onClick={(e) => { e.stopPropagation(); primaryOnClick(); }}
                              className="gap-1.5"
                            >
                              {isReleased ? <Eye className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                              {primaryLabel}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
        </Card>
      </div>

      <TodayDeadlinesPanel
        open={todayPanelOpen}
        onOpenChange={setTodayPanelOpen}
        rnUserId={rnUserId}
        caseOptions={[...awaitingAck, ...pending, ...active].map((c) => ({
          id: c.id,
          label: `${c.case_number || c.id} — ${c.client_name || "Unknown"}`,
        }))}
        acknowledgedAssignments={acknowledgedAssignmentItems}
      />

      {declineDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Decline Assignment</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for declining this assignment. Your supervisor will be notified.
            </p>

            <label className="block text-sm font-medium mb-1">Reason</label>
            <select
              value={declineReasonCode}
              onChange={(e) => setDeclineReasonCode(e.target.value as DeclineReasonCode)}
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3 text-sm"
            >
              <option value="capacity_constraint">At capacity / too many cases</option>
              <option value="over_limit_score">Over limit score</option>
              <option value="schedule_unavailable">Schedule unavailable</option>
              <option value="scope_mismatch">Scope mismatch</option>
              <option value="other">Other (please specify)</option>
            </select>

            {declineReasonCode === "other" && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Details (min 10 characters)</label>
                <textarea
                  value={declineReasonText}
                  onChange={(e) => setDeclineReasonText(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  placeholder="Please explain..."
                />
                <span className="text-xs text-gray-400">{declineReasonText.length}/300</span>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setDeclineDialogOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineConfirm}
                disabled={actionLoading !== null || (declineReasonCode === "other" && declineReasonText.trim().length < 10)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/**
 * RN QUEUE REGRESSION CHECKLIST
 * ─────────────────────────────
 * - [ ] Row click navigates correctly for each bucket:
 *       • Awaiting Acknowledgement → /rn/case/:id/ten-vs
 *       • Pending → /rn/case/:id/ten-vs
 *       • Active (draft) → /rn/case/:id/workflow
 *       • Active (released) → /rn/case/:id/finalize
 * - [ ] Inline "Open case →" link and primary CTA navigate to the same destination
 * - [ ] Acknowledge required bucket: primary action is "Acknowledge" then "Open"
 * - [ ] No dead links / no empty routes
 * - [ ] Status labels match real state (see rnStatusLabels.ts)
 * - [ ] Post-revision-submission: case appears in correct bucket with truthful status
 */
