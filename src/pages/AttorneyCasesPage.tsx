import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { fmtDate } from "@/lib/store";
import { getAttorneyCaseStageLabel } from "@/lib/attorneyCaseStageLabels";
import { FolderOpen, FileText, ArrowLeft, Pin } from "lucide-react";
import { differenceInHours, differenceInDays, isToday } from "date-fns";
import { usePinnedCases } from "@/hooks/usePinnedCases";

export default function AttorneyCasesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter") || "";
  const pinnedParam = searchParams.get("pinned") === "1";
  const pinnedFilter = filter === "pinned";
  const pinned = pinnedParam || pinnedFilter;
  const { cases, attorneyRoleNotConfigured, rolesLoadError, rolesLoadErrorCode, rolesLoadDiagnostics } = useApp();
  const { pinnedCaseIds } = usePinnedCases();

  const now = new Date();
  let filtered = cases || [];
  let filterLabel = "View Cases";
  if (pinned) {
    filtered = (cases || []).filter((c) => pinnedCaseIds.includes(c.id));
    filterLabel = "Pinned Cases";
  } else if (filter === "stale30" || filter === "needs_attention_30") {
    filtered = (cases || []).filter((c) => {
      const lastActivity = (c as any).checkins?.length
        ? (c as any).checkins[(c as any).checkins.length - 1]?.ts
        : (c.updatedAt || c.createdAt);
      if (!lastActivity) return false;
      return differenceInDays(now, new Date(lastActivity)) >= 30;
    });
    filterLabel = "Cases Needing Attention (30+ days)";
  } else if (filter === "assigned_today") {
    filtered = (cases || []).filter((c) => isToday(new Date(c.createdAt)));
    filterLabel = "Assigned Today";
  } else if (filter === "urgent") {
    // Attorney-6: Only intake-phase cases (care plan not released) are at SLA risk
    filtered = (cases || []).filter((c) => {
      const h = differenceInHours(now, new Date(c.createdAt));
      const isIntakePhase = !c.carePlanReleased;
      return h >= 72 && c.status === "NEW" && isIntakePhase;
    });
    filterLabel = "Urgent Tasks";
  } else if (filter === "active") {
    filtered = (cases || []).filter((c) => c.status !== "CLOSED");
    filterLabel = "Active Cases";
  } else if (filter === "completed_today") {
    filtered = (cases || []).filter((c) => c.status === "CLOSED" && c.updatedAt && isToday(new Date(c.updatedAt)));
    filterLabel = "Completed Today";
  }

  return (
    <AppLayout>
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/attorney/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-2">{filterLabel}</h1>
        <p className="text-muted-foreground mb-6">
          {filter ? `Filter: ${filterLabel}.` : "Browse and manage your cases."}
        </p>

        {rolesLoadError ? (
          <Card className="p-8 border-border text-center space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Unable to load user roles</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Unable to load user roles. Please refresh. If this persists, contact admin.
            </p>
            <p className="text-sm text-muted-foreground">Reason: {rolesLoadError}</p>
            <p className="text-sm text-muted-foreground">Code: {rolesLoadErrorCode ?? "—"}</p>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            {(import.meta.env.DEV || (typeof window !== "undefined" && (window as { __RCMS_DEBUG_ROLES?: boolean }).__RCMS_DEBUG_ROLES)) && rolesLoadDiagnostics && (
              <div className="rounded-md border border-border bg-muted/50 p-4 text-xs font-mono text-muted-foreground text-left mt-4">
                <div className="font-semibold text-foreground mb-2">Role load diagnostics</div>
                <div>hasSession: {String(rolesLoadDiagnostics.hasSession)}</div>
                <div>auth_user_id: {import.meta.env.DEV ? (rolesLoadDiagnostics.auth_user_id ?? "null") : (rolesLoadDiagnostics.auth_user_id ? `${String(rolesLoadDiagnostics.auth_user_id).slice(0, 8)}…` : "null")}</div>
                <div>roleQueryTable: {rolesLoadDiagnostics.roleQueryTable}</div>
                <div>roleQueryResultCount: {rolesLoadDiagnostics.roleQueryResultCount ?? "—"}</div>
                <div>role: {rolesLoadDiagnostics.role ?? "—"}</div>
                <div>error: {rolesLoadDiagnostics.error ?? "—"}</div>
              </div>
            )}
          </Card>
        ) : attorneyRoleNotConfigured ? (
          <Card className="p-8 border-border text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Role not configured</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your account role is not configured. Contact admin.
            </p>
          </Card>
        ) : !cases || cases.length === 0 ? (
          <Card className="p-8 border-border text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No cases yet</h2>
            <p className="text-muted-foreground mb-4 max-w-md mx-auto">
              You don’t have any released cases. New cases will appear here after intake and release.
            </p>
            <Button asChild variant="default">
              <Link to="/attorney/pending-intakes">
                <FileText className="w-4 h-4 mr-2" />
                Go to Intakes Awaiting Review
              </Link>
            </Button>
          </Card>
        ) : filtered.length === 0 && pinned ? (
          <Card className="p-8 border-border text-center">
            <Pin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No pinned cases yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-4">
              Pinned cases are cases you’ve marked for quick access. Pin cases from a case’s detail page to see them here. This list updates as you pin and unpin.
            </p>
            <Button variant="outline" onClick={() => navigate("/attorney/dashboard")}>
              Back to Dashboard
            </Button>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-8 border-border text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {(filter === "needs_attention_30" || filter === "stale30") ? "No cases currently meet the 30+ day attention threshold." : "No items match this filter yet."}
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              {(filter === "needs_attention_30" || filter === "stale30")
                ? "What happens next: Cases will appear here when they have no activity for 30+ days."
                : "Try another filter or go back to the dashboard."}
            </p>
            <Button variant="outline" onClick={() => navigate("/attorney/dashboard")} className="mt-4">
              Back to Dashboard
            </Button>
          </Card>
        ) : (
          <Card className="border-border">
            <div className="divide-y divide-border">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/attorney/cases/${c.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/attorney/cases/${c.id}`);
                    }
                  }}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {c.client?.rcmsId || c.id}
                        {c.client?.fullName || c.client?.displayNameMasked ? ` — ${c.client.fullName || c.client.displayNameMasked}` : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border bg-muted text-muted-foreground">
                        {c.carePlanReleased
                          ? getAttorneyCaseStageLabel({ care_plan_released: true })
                          : (c.status?.replace(/_/g, " ") || "—")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {c.intake?.incidentType || "N/A"}
                      {c.intake?.injuries?.length ? ` • ${(c.intake.injuries ?? []).slice(0, 2).join(", ")}` : ""}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground ml-4 shrink-0">
                    {fmtDate(c.updatedAt || c.createdAt || "")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
