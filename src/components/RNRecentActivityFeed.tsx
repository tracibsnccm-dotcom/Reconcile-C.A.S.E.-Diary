import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, MessageSquare, Calendar, CheckCircle, AlertTriangle, Bell } from "lucide-react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRemindersCompletedInRange } from "@/lib/rnRemindersStore";
import { resolveCaseUuidFromRef, getCaseLabelFromRef } from "@/lib/rnCaseLinking";
import { setLastActiveCase } from "@/lib/rnLastActiveCase";

type FilterRange = "yesterday_today" | "last7";

interface SystemActivity {
  id: string;
  type: "note" | "message" | "appointment" | "completed" | "alert";
  description: string;
  timestamp: Date;
  clientName?: string;
}

interface RNRecentActivityFeedProps {
  rnUserId?: string | null;
  /** Optional. For "Open case" when a completed reminder has linked_case_id. */
  caseOptions?: Array<{ id: string; label: string }>;
}

export function RNRecentActivityFeed({ rnUserId, caseOptions = [] }: RNRecentActivityFeedProps) {
  const navigate = useNavigate();
  const [range, setRange] = useState<FilterRange>("yesterday_today");

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = subDays(new Date(), 1).toISOString().slice(0, 10);
  const from7 = subDays(new Date(), 7).toISOString().slice(0, 10);

  const from = range === "yesterday_today" ? yesterday : from7;
  const to = today;

  // Personal activity: completed personal reminders (today + yesterday only, from rnRemindersStore)
  const completedPersonal = useMemo(
    () => (rnUserId ? getRemindersCompletedInRange(rnUserId, yesterday, today) : []),
    [rnUserId, yesterday, today]
  );
  const personalSorted = useMemo(
    () => [...completedPersonal].sort((a, b) => (new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())),
    [completedPersonal]
  );

  // Mock system activity – replace with real feed when available. Filter by range.
  const systemActivities: SystemActivity[] = [
    { id: "1", type: "note", description: "Added clinical note for follow-up", timestamp: new Date(Date.now() - 1000 * 60 * 30), clientName: "John Smith" },
    { id: "2", type: "message", description: "Sent message regarding medication", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), clientName: "Jane Doe" },
    { id: "3", type: "completed", description: "Completed care plan review", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), clientName: "Robert Johnson" },
    { id: "4", type: "alert", description: "Responded to clinical alert", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), clientName: "Mary Williams" },
  ];
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");
  const filteredSystem = systemActivities.filter((a) => {
    const t = a.timestamp.getTime();
    return t >= fromDate.getTime() && t <= toDate.getTime();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle>Recent Activity</CardTitle>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setRange("yesterday_today")}
              className={`px-2 py-1 rounded text-xs ${range === "yesterday_today" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Yesterday + Today
            </button>
            <button
              type="button"
              onClick={() => setRange("last7")}
              className={`px-2 py-1 rounded text-xs ${range === "last7" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Last 7 days
            </button>
          </div>
        </div>
        <CardDescription>Your latest actions and updates. Date-aware.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-0">
            {/* Personal activity block (today + yesterday, from rnRemindersStore) */}
            <div className="pb-3 mb-3 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Personal activity</p>
              {!rnUserId ? (
                <p className="text-sm text-muted-foreground py-2">Loading reminders…</p>
              ) : personalSorted.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No completed personal reminders for yesterday or today.</p>
              ) : (
                personalSorted.map((r) => {
                  const isDeadline = (r.target_date || "") > (r.completed_at?.slice(0, 10) || "");
                  const resolvedUuid = r.linked_case_id ? resolveCaseUuidFromRef(r.linked_case_id, caseOptions) : null;
                  return (
                    <div key={`pr-${r.id}`} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="rounded-full bg-blue-100 p-2"><Bell className="h-4 w-4 text-blue-600" /></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">
                          {isDeadline ? "Personal deadline completed: " : "Personal reminder completed: "}{r.text}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.completed_at ? format(new Date(r.completed_at), "MMM d, h:mm a") : ""}
                          {r.completed_at && ` (${formatDistanceToNow(new Date(r.completed_at), { addSuffix: true })})`}
                        </p>
                        {resolvedUuid && (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                            onClick={() => {
                              if (rnUserId && rnUserId !== "unknown") {
                                const caseLabel =
                                  caseOptions.find((o) => o.id === resolvedUuid)?.label ??
                                  getCaseLabelFromRef(r.linked_case_id, caseOptions) ??
                                  `Case ${resolvedUuid}`;
                                setLastActiveCase(rnUserId, {
                                  case_id: resolvedUuid,
                                  case_label: caseLabel,
                                  last_route: `/rn/case/${resolvedUuid}/ten-vs`,
                                });
                              }
                              navigate(`/rn/case/${resolvedUuid}/ten-vs`);
                            }}
                          >
                            Open case →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* System activity (filtered by range) */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">System activity</p>
              {filteredSystem.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No system activity in this range.</p>
              ) : (
                filteredSystem.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className="rounded-full bg-primary/10 p-2">{getIcon(a.type)}</div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{a.description}</p>
                      {a.clientName && <p className="text-xs text-muted-foreground">{a.clientName}</p>}
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(a.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function getIcon(type: SystemActivity["type"]) {
  switch (type) {
    case "note": return <FileText className="h-4 w-4" />;
    case "message": return <MessageSquare className="h-4 w-4" />;
    case "appointment": return <Calendar className="h-4 w-4" />;
    case "completed": return <CheckCircle className="h-4 w-4" />;
    case "alert": return <AlertTriangle className="h-4 w-4" />;
  }
}
