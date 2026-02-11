import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Case, CaseStatus } from "@/config/rcms";
import { fmtDate } from "@/lib/store";
import { differenceInDays, differenceInHours } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  AlertTriangle,
  Clock,
  Download,
  Calendar,
  TrendingUp,
  Shield,
} from "lucide-react";

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

export default function Reports() {
  const navigate = useNavigate();
  const { cases } = useApp();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // New clients in past 30 days
  const newClients = cases.filter((c) => {
    const createdDate = new Date(c.createdAt);
    return createdDate >= thirtyDaysAgo;
  });

  // Unprocessed cases (6+ days old, still NEW status)
  // Attorney-6: Only intake-phase cases (care plan not released) are at SLA risk
  const unprocessedCases = cases.filter((c) => {
    const daysOld = differenceInDays(now, new Date(c.createdAt));
    const isIntakePhase = !c.carePlanReleased;
    return daysOld >= 6 && c.status === "NEW" && isIntakePhase;
  });

  // At-risk cases with time-based warnings
  // 144 hours (6 days) = deletion time
  // Attorney-6: Only intake-phase cases; suppress when care_plan_released === true
  const atRiskCases = cases
    .filter((c) => c.status === "NEW" && !c.carePlanReleased)
    .map((c) => {
      const hoursOld = differenceInHours(now, new Date(c.createdAt));
      const hoursRemaining = 144 - hoursOld; // 144 hours = 6 days
      return { ...c, hoursOld, hoursRemaining };
    })
    .filter((c) => c.hoursRemaining <= 48 && c.hoursRemaining > 0)
    .sort((a, b) => a.hoursRemaining - b.hoursRemaining);

  function getWarningLevel(hoursRemaining: number) {
    if (hoursRemaining <= 8) return "critical";
    if (hoursRemaining <= 24) return "urgent";
    if (hoursRemaining <= 48) return "warning";
    return "normal";
  }

  function getWarningColor(level: string) {
    switch (level) {
      case "critical":
        return "bg-destructive/20 border-destructive text-destructive";
      case "urgent":
        return "bg-orange-500/20 border-orange-500 text-orange-500";
      case "warning":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-500";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 relative">
              <h1 className="text-3xl font-bold text-foreground">Attorney Reports</h1>
              <span 
                className="inline-flex justify-center items-center w-[18px] h-[18px] rounded-full bg-[hsl(var(--primary))] text-primary-foreground font-extrabold text-[0.75rem] cursor-help relative group"
                tabIndex={0}
                aria-label="Confidentiality Notice"
              >
                ?
                <div 
                  className="absolute left-0 top-[140%] bg-card border border-[hsl(var(--accent))] rounded-lg shadow-lg p-3 max-w-[300px] z-20 hidden group-hover:block group-focus:block"
                  role="tooltip"
                >
                  <p className="text-sm text-foreground mb-2 leading-snug">
                    <strong>Confidentiality Notice:</strong><br />
                    All communications, case notes, and uploaded files within Reconcile C.A.R.E. are encrypted and stored under HIPAA and attorney–client privilege standards. Information shared here is accessible only to authorized case team members.
                  </p>
                  <a 
                    href="/compliance-and-privacy" 
                    target="_blank" 
                    rel="noopener"
                    className="text-[hsl(var(--primary))] font-bold text-sm underline hover:opacity-80"
                  >
                    View full Compliance Policy
                  </a>
                </div>
              </span>
            </div>
            <p className="text-muted-foreground mt-1">
              Case activity and deletion warnings
            </p>
          </div>
          <Button variant="outline" onClick={() => alert("Export functionality (mock)")}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Clients</p>
                <p className="text-2xl font-bold text-foreground">{newClients.length}</p>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Clock className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unprocessed</p>
                <p className="text-2xl font-bold text-foreground">{unprocessedCases.length}</p>
                <p className="text-xs text-muted-foreground">6+ days old</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">At Risk</p>
                <p className="text-2xl font-bold text-foreground">{atRiskCases.length}</p>
                <p className="text-xs text-muted-foreground">≤48h remaining</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-accent/10">
                <FileText className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold text-foreground">{cases.length}</p>
                <p className="text-xs text-muted-foreground">All statuses</p>
              </div>
            </div>
          </Card>
        </div>

        {/* At-Risk Cases (Critical Section) */}
        {atRiskCases.length > 0 && (
          <Card className="p-6 border-destructive bg-destructive/5 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive mt-1" />
              <div>
                <h2 className="text-xl font-semibold text-destructive mb-1">
                  Cases Approaching Deletion
                </h2>
                <p className="text-sm text-muted-foreground">
                  {atRiskCases.length} case{atRiskCases.length !== 1 ? "s" : ""} will be
                  deleted/tagged as attorney refusal without action
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-semibold text-sm text-foreground">Case ID</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Incident</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Created</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Time Remaining</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Warning Level</th>
                    <th className="pb-3 font-semibold text-sm text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskCases.map((c) => {
                    const level = getWarningLevel(c.hoursRemaining);
                    const statusColors = getStatusColor(c.status);
                    return (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-3 font-medium text-foreground">{c.client.rcmsId}</td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {c.intake.incidentType}
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {fmtDate(c.createdAt)}
                        </td>
                        <td className="py-3">
                          <span className="font-semibold text-destructive">
                            {c.hoursRemaining}h
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getWarningColor(
                              level
                            )}`}
                          >
                            {level === "critical" && "🔴"}
                            {level === "urgent" && "🟠"}
                            {level === "warning" && "🟡"}
                            {level.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/cases/${c.id}`)}
                          >
                            Review Case
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* New Clients (Last 30 Days) */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                New Clients (Last 30 Days)
              </h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {newClients.length} total
              </span>
            </div>

            {newClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No new clients in the last 30 days</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {newClients.map((c) => {
                  const statusColors = getStatusColor(c.status);
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${statusColors.border} ${statusColors.bg} hover:opacity-80 cursor-pointer transition-colors`}
                      onClick={() => navigate(`/cases/${c.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{c.client.rcmsId}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                          >
                            {statusColors.icon}
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {c.intake.incidentType} • {c.intake.injuries.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {fmtDate(c.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Unprocessed Cases (6+ Days) */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">
                Unprocessed Cases (6+ Days)
              </h2>
              <span className="ml-auto text-sm text-muted-foreground">
                {unprocessedCases.length} total
              </span>
            </div>

            {unprocessedCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unprocessed cases</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unprocessedCases.map((c) => {
                  const daysOld = differenceInDays(now, new Date(c.createdAt));
                  const statusColors = getStatusColor(c.status);
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${statusColors.border} ${statusColors.bg} hover:opacity-80 cursor-pointer transition-colors`}
                      onClick={() => navigate(`/cases/${c.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{c.client.rcmsId}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${statusColors.bg} ${statusColors.text} ${statusColors.border}`}
                          >
                            {statusColors.icon}
                            {c.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {c.intake.incidentType} • {c.intake.injuries.slice(0, 2).join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-orange-500">{daysOld} days old</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(c.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="p-4 bg-muted border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Deletion Policy
            </h3>
            <p className="text-sm text-muted-foreground">
              Cases without attorney intervention are automatically deleted after{" "}
              <b className="text-foreground">144 hours (6 days)</b> and tagged as "attorney
              refusal/denial". Automated warnings are sent at{" "}
              <b className="text-foreground">48h, 24h, and 8h</b> remaining.
            </p>
          </Card>

          <Card className="p-4 bg-muted border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Status Color Guide
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/50">
                  <Shield className="w-3 h-3" />
                  HOLD SENSITIVE
                </span>
                <span className="text-muted-foreground">— Highest priority</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/50">
                  <AlertTriangle className="w-3 h-3" />
                  AWAITING CONSENT
                </span>
                <span className="text-muted-foreground">— Needs action</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/50">
                  IN PROGRESS
                </span>
                <span className="text-muted-foreground">— Active & compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/50">
                  ROUTED
                </span>
                <span className="text-muted-foreground">— Routed to provider</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
