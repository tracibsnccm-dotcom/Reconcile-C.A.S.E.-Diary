/**
 * RN Dashboard – landing: metrics (counts only), upcoming (informational),
 * alerts notice, workflow tip, and navigation to Pending / Active Work Queues.
 * No case lists. Route: /rn/dashboard (post RN login).
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Calendar, AlertCircle, ChevronRight, Inbox, CheckCircle, Info, Lightbulb, Activity } from "lucide-react";
import { fetchRNMetrics } from "@/lib/rnMetrics";
import { useRNDiary } from "@/hooks/useRNData";

export default function RNDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { entries: diaryEntries } = useRNDiary();

  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [alertsCount, setAlertsCount] = useState<number | null>(null);
  const [checkinsToday, setCheckinsToday] = useState<number | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Lightweight pending/active counts + check-ins today (same logic as RNWorkQueuePage; no new schema)
  const fetchCounts = useCallback(async () => {
    if (!user?.id) return;
    setCountsLoading(true);
    try {
      const { data: rcUser, error: rcErr } = await supabase
        .from("rc_users")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (rcErr) throw rcErr;
      if (!rcUser?.id) {
        setPendingCount(0);
        setActiveCount(0);
        setCheckinsToday(0);
        setCountsLoading(false);
        return;
      }

      const { data: directCases, error: casesErr } = await supabase
        .from("rc_cases")
        .select("id")
        .eq("rn_cm_id", rcUser.id)
        .eq("is_superseded", false);
      if (casesErr) throw casesErr;
      const caseIds = directCases?.map((c) => c.id) || [];
      if (caseIds.length === 0) {
        setPendingCount(0);
        setActiveCount(0);
        setCheckinsToday(0);
        setCountsLoading(false);
        return;
      }

      const { data: intakes } = await supabase
        .from("rc_client_intakes")
        .select("case_id, attorney_attested_at, created_at")
        .in("case_id", caseIds);

      const { data: carePlans } = await supabase
        .from("rc_care_plans")
        .select("case_id")
        .in("case_id", caseIds);
      const withCarePlan = new Set(carePlans?.map((cp) => cp.case_id) || []);

      let p = 0;
      let a = 0;
      for (const c of directCases) {
        const intake = intakes?.find((i) => i.case_id === c.id);
        const hasCarePlan = withCarePlan.has(c.id);
        const attested = !!intake?.attorney_attested_at;
        if (attested && !hasCarePlan) p += 1;
        else if (hasCarePlan) a += 1;
      }
      setPendingCount(p);
      setActiveCount(a);

      // Check-ins today (existing rc_client_checkins; no schema change)
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      const { count, error: chErr } = await supabase
        .from("rc_client_checkins")
        .select("id", { count: "exact", head: true })
        .in("case_id", caseIds)
        .gte("created_at", today + "T00:00:00")
        .lt("created_at", tomorrow + "T00:00:00");
      setCheckinsToday(chErr ? null : count ?? 0);
    } catch (e) {
      console.error("RNDashboard: counts fetch error", e);
      setPendingCount(null);
      setActiveCount(null);
      setCheckinsToday(null);
    } finally {
      setCountsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (authLoading || !user?.id) {
      if (!user?.id) setCountsLoading(false);
      return;
    }
    fetchCounts();
  }, [user?.id, authLoading, fetchCounts]);

  // Alerts from existing fetchRNMetrics
  useEffect(() => {
    if (authLoading || !user?.id) return;
    setMetricsLoading(true);
    fetchRNMetrics()
      .then((d) => {
        setAlertsCount(d?.metrics?.alerts?.length ?? 0);
      })
      .catch(() => setAlertsCount(null))
      .finally(() => setMetricsLoading(false));
  }, [user?.id, authLoading]);

  // Upcoming: diary entries (read-only) or placeholders
  const upcomingRows = diaryEntries.slice(0, 5).map((e) => ({
    id: e.id,
    label: e.title || e.entry_type?.replace(/_/g, " ") || "Appointment",
    when: e.scheduled_date && e.scheduled_time
      ? `${e.scheduled_date} ${(e.scheduled_time as string).slice(0, 5)}`
      : e.scheduled_date || "—",
  }));

  const hasUpcoming = upcomingRows.length > 0;

  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="py-6 px-6 max-w-5xl mx-auto">
        {/* A) Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">RN Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview &amp; upcoming</p>
        </header>

        {/* SECTION 1: Overview Metrics (counts only) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Pending Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {countsLoading ? "—" : pendingCount ?? "—"}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Awaiting initial care plan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Active Cases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {countsLoading ? "—" : activeCount ?? "—"}
              </span>
              <p className="text-xs text-muted-foreground mt-1">With care plan</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {metricsLoading ? "—" : alertsCount ?? "—"}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Check-ins Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">
                {countsLoading ? "—" : checkinsToday ?? "—"}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Client wellness</p>
            </CardContent>
          </Card>
        </section>

        {/* SECTION 2: Upcoming (informational) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming
            </CardTitle>
            <CardDescription>Deadlines and reminders</CardDescription>
          </CardHeader>
          <CardContent>
            {hasUpcoming ? (
              <ul className="space-y-3">
                {upcomingRows.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm font-medium">{r.label}</span>
                    <span className="text-sm text-muted-foreground">{r.when}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground py-4">
                <p>No upcoming items.</p>
                <p>Check the Pending Work Queue for new assignments, or add entries in RN Diary.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SECTION 3: Alerts / Notices (informational only) */}
        {typeof alertsCount === "number" && alertsCount > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50/50">
            <CardContent className="py-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">You have {alertsCount} alert{alertsCount !== 1 ? "s" : ""} requiring attention.</p>
                <p className="text-sm text-amber-800 mt-1">Review them in the Work Queue or from individual case views.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Workflow reminder (dashboard-appropriate filler) */}
        <Card className="mb-6 border-muted">
          <CardContent className="py-4 flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Workflow reminder</p>
              <p className="text-sm text-muted-foreground mt-1">
                Complete initial care plans within 24 hours of attorney attestation. Document all client interactions in the case record.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: Quick Actions (navigation only) */}
        <section className="flex flex-col sm:flex-row gap-4">
          <Button
            size="lg"
            className="flex-1 justify-between"
            onClick={() => navigate("/rn/queue?focus=pending")}
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Go to Pending Work Queue
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="flex-1 justify-between"
            onClick={() => navigate("/rn/queue?focus=active")}
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Go to Active Work Queue
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </section>
      </div>
    </AppLayout>
  );
}
