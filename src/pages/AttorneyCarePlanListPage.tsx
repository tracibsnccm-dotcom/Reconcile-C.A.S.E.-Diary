// Attorney Care Plan List Page — /attorney/care-plans
// Lists released care plans (status=submitted) for attorney's cases.
// Links to AttorneyCarePlanView for view/export/print.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { getAttorneyCasesForPrivateNotes } from "@/lib/attorneyCaseQueries";
import { supabase } from "@/integrations/supabase/client";

type CarePlanRow = {
  id: string;
  case_id: string;
  plan_number: number;
  care_plan_type: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  case_number: string | null;
  client_name: string;
};

const CARE_PLAN_TYPE_LABELS: Record<string, string> = {
  initial: "Initial",
  routine_60_day: "60-Day Review",
  accelerated_30_day: "30-Day Accelerated",
  event_based: "Event-Based",
  attorney_request: "Attorney Request",
  discharge: "Discharge",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function AttorneyCarePlanListPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<CarePlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cases = await getAttorneyCasesForPrivateNotes();
        if (cancelled || !cases.length) {
          setPlans([]);
          return;
        }
        const caseIds = cases.map((c) => c.id);
        const { data: planRows, error } = await supabase
          .from("rc_care_plans")
          .select("id, case_id, plan_number, care_plan_type, status, created_at, submitted_at")
          .eq("status", "submitted")
          .in("case_id", caseIds)
          .order("submitted_at", { ascending: false });

        if (cancelled) return;
        if (error) {
          console.error("AttorneyCarePlanListPage: care plans fetch", error);
          setPlans([]);
          return;
        }

        const caseMap = new Map(cases.map((c) => [c.id, c]));
        const rows: CarePlanRow[] = (planRows || []).map((p: any) => {
          const c = caseMap.get(p.case_id);
          return {
            id: p.id,
            case_id: p.case_id,
            plan_number: p.plan_number,
            care_plan_type: p.care_plan_type || "initial",
            status: p.status,
            created_at: p.created_at,
            submitted_at: p.submitted_at,
            case_number: c?.case_number ?? null,
            client_name: c?.client_name ?? "Unknown",
          };
        });
        setPlans(rows);
      } catch (e) {
        if (!cancelled) {
          console.error("AttorneyCarePlanListPage:", e);
          setPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/attorney/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Care Plans
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          View and export released care plans. Only submitted plans are shown.
        </p>

        {loading ? (
          <p className="text-muted-foreground">Loading care plans…</p>
        ) : plans.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground mb-2">No Released Care Plans</h2>
            <p className="text-muted-foreground">
              Care plans will appear here once the RN completes and releases them.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">
                    {plan.case_number ?? plan.case_id.slice(0, 8)} — Care Plan #{plan.plan_number}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.client_name} • {CARE_PLAN_TYPE_LABELS[plan.care_plan_type] || plan.care_plan_type} • Released {fmtDate(plan.submitted_at)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/attorney/care-plans/${plan.id}`)}
                >
                  View / Export
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
