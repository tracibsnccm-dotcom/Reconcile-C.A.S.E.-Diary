import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, Bell } from "lucide-react";
import { format, formatDistanceToNow, isBefore, isToday } from "date-fns";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRemindersForUpcoming,
  markReminderDone,
  type RNReminder,
} from "@/lib/rnRemindersStore";
import { setLastActiveCase } from "@/lib/rnLastActiveCase";
import type { AssignedCasePriorityItem } from "@/lib/rnAssignmentPriority";

/** Shared/system deadline (read-only). */
interface Deadline {
  id: string;
  title: string;
  dueDate: Date;
  priority: "high" | "medium" | "low";
  clientName: string;
}

interface RNUpcomingDeadlinesProps {
  rnUserId?: string | null;
  /** Acknowledged assignments: show as HIGH when due <24h or overdue. */
  acknowledgedAssignments?: AssignedCasePriorityItem[];
}

export function RNUpcomingDeadlines({ rnUserId, acknowledgedAssignments = [] }: RNUpcomingDeadlinesProps) {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const today = new Date().toISOString().slice(0, 10);

  const ackDeadlines = useMemo(
    () => acknowledgedAssignments.filter((a) => a.is_due_within_24h || a.is_overdue),
    [acknowledgedAssignments]
  );

  // Mock shared deadlines – replace with real data when available
  const sharedDeadlines: Deadline[] = [
    { id: "1", title: "Care Plan Review", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 4), priority: "high", clientName: "John Smith" },
    { id: "2", title: "Follow-up Assessment", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), priority: "medium", clientName: "Jane Doe" },
    { id: "3", title: "Medication Review", dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48), priority: "medium", clientName: "Robert Johnson" },
  ];

  const personalDeadlines = useMemo(
    () => (rnUserId ? getRemindersForUpcoming(rnUserId, today) : []),
    [rnUserId, today, refresh]
  );

  const handleMarkDone = (id: string) => {
    if (!rnUserId) return;
    markReminderDone(rnUserId, id);
    setRefresh((r) => r + 1);
  };

  const getPriorityColor = (p: "high" | "medium" | "low") => {
    switch (p) { case "high": return "destructive"; case "medium": return "default"; default: return "secondary"; }
  };
  const isOverdue = (d: Date) => isBefore(d, new Date());
  const isDueToday = (d: Date) => isToday(d);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>Tasks and reviews requiring attention. Date-aware.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Acknowledged assignment deadlines (Initial Care Plan) – HIGH, at top */}
          {ackDeadlines.map((item) => {
            const dueDate = item.due_at ? new Date(item.due_at) : null;
            return (
              <div key={item.case_id} className="flex items-start justify-between gap-4 pb-3 border-b last:border-0">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Initial Care Plan — Assigned Case</p>
                  <p className="text-xs text-muted-foreground">{item.case_label}</p>
                  {dueDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(dueDate, "MMM d, h:mm a")}</span>
                      <span>{formatDistanceToNow(dueDate, { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="destructive">high</Badge>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                    onClick={() => {
                      if (rnUserId && rnUserId !== "unknown") {
                        setLastActiveCase(rnUserId, {
                          case_id: item.case_id,
                          case_label: item.case_label,
                          last_route: `/rn/case/${item.case_id}/ten-vs`,
                        });
                      }
                      navigate(`/rn/case/${item.case_id}/ten-vs`);
                    }}
                  >
                    Open case →
                  </button>
                </div>
              </div>
            );
          })}

          {/* Shared/system deadlines – read-only, date-aware */}
          {sharedDeadlines.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-4 pb-3 border-b last:border-0">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">{d.clientName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(d.dueDate, "MMM d, h:mm a")}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={getPriorityColor(d.priority)}>{d.priority}</Badge>
                {isOverdue(d.dueDate) && <Badge variant="destructive">Overdue</Badge>}
                {isDueToday(d.dueDate) && !isOverdue(d.dueDate) && <Badge variant="default">Today</Badge>}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(d.dueDate, { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}

          {/* Personal deadlines from store (target_date > today) */}
          {personalDeadlines.map((r) => (
            <PersonalDeadlineRow
              key={r.id}
              r={r}
              onToggle={() => handleMarkDone(r.id)}
              disabled={!rnUserId}
            />
          ))}
        </div>

        {ackDeadlines.length === 0 && sharedDeadlines.length === 0 && personalDeadlines.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No upcoming deadlines.</p>
        )}
      </CardContent>
    </Card>
  );
}

function PersonalDeadlineRow({
  r,
  onToggle,
  disabled,
}: { r: RNReminder; onToggle: () => void; disabled: boolean }) {
  const targetDate = new Date(r.target_date + "T12:00:00");
  return (
    <div className={`flex items-start gap-3 pb-3 border-b last:border-0 ${r.status === "done" ? "opacity-70" : ""}`}>
      <Checkbox
        checked={r.status === "done"}
        onCheckedChange={onToggle}
        disabled={disabled}
        className="mt-1"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Bell className="h-4 w-4 text-blue-600 shrink-0" />
          <span className={`text-sm font-medium ${r.status === "done" ? "line-through text-muted-foreground" : ""}`}>
            {r.text}
          </span>
          <Badge variant="secondary" className="text-[10px]">Personal reminder</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{format(targetDate, "MMM d, yyyy")}</span>
          <span>{formatDistanceToNow(targetDate, { addSuffix: true })}</span>
        </div>
        {r.status === "done" && r.completed_at && (
          <p className="text-xs text-muted-foreground">Completed {format(new Date(r.completed_at), "MMM d")}</p>
        )}
      </div>
    </div>
  );
}
