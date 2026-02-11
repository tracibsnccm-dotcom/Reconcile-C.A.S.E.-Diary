import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { AlertCircle, Plus, Bell } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { resolveCaseUuidFromRef, getCaseLabelFromRef } from "@/lib/rnCaseLinking";
import { setLastActiveCase } from "@/lib/rnLastActiveCase";
import {
  getRemindersForTodayView,
  markReminderDone,
  upsertReminder,
  isCarriedForward,
  type RNReminder,
} from "@/lib/rnRemindersStore";
import type { AssignedCasePriorityItem } from "@/lib/rnAssignmentPriority";
import { rnStatusLabel } from "@/lib/rnStatusLabels";

/** Follow-up items from metrics (e.g. overdue notes, missing follow-ups). Read-only. */
export interface FollowUpItem {
  type: string;
  case_id: string;
  priority: "high" | "medium" | "low";
  days_overdue: number;
}

interface RNTodaysPrioritiesProps {
  followUpItems?: FollowUpItem[];
  rnUserId?: string | null;
  /** For resolving case_id (UUID or RC-####) to UUID for View case navigation. */
  caseOptions?: Array<{ id: string; label: string }>;
  /** Acknowledged assignments to pin at top (Tier 1). */
  acknowledgedAssignments?: AssignedCasePriorityItem[];
}

export function RNTodaysPriorities({ followUpItems = [], rnUserId, caseOptions = [], acknowledgedAssignments = [] }: RNTodaysPrioritiesProps) {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTargetDate, setNewTargetDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const today = new Date().toISOString().slice(0, 10);
  const todayReminders = useMemo(
    () => (rnUserId ? getRemindersForTodayView(rnUserId, today) : []),
    [rnUserId, today, refresh]
  );

  const handleAdd = () => {
    const t = newText.trim();
    if (!t || !rnUserId) return;
    upsertReminder(rnUserId, { text: t, target_date: newTargetDate });
    setNewText("");
    setNewTargetDate(new Date().toISOString().slice(0, 10));
    setAdding(false);
    setRefresh((r) => r + 1);
  };

  const handleMarkDone = (id: string) => {
    if (!rnUserId) return;
    markReminderDone(rnUserId, id);
    setRefresh((r) => r + 1);
  };

  const activeFollowUps = followUpItems.length;
  const personalCount = todayReminders.filter((r) => r.status === "open").length;
  const personalDone = todayReminders.filter((r) => r.status === "done").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#0f2a6a]">Today&apos;s Priorities</CardTitle>
          <div className="flex gap-2">
            {activeFollowUps > 0 && (
              <Badge variant="secondary">Follow-ups: {activeFollowUps}</Badge>
            )}
            {rnUserId && (
              <Badge variant="outline">
                {personalDone}/{todayReminders.length} personal done
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* 1) Acknowledged Assignments — pinned to top (Tier 1) */}
          {acknowledgedAssignments.length > 0 && (
            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-semibold text-[#0f2a6a]">Acknowledged Assignments</h3>
              <p className="text-xs text-muted-foreground">Assigned by supervisor. Start work in the case.</p>
              {acknowledgedAssignments.map((item) => (
                <div
                  key={item.case_id}
                  className="p-3 rounded-lg border-l-4 border-l-emerald-600 bg-emerald-50/50"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{item.case_label}</span>
                        <Badge variant="outline" className="text-[10px]">{rnStatusLabel(item.case_status)}</Badge>
                        {item.is_overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                        {item.is_due_within_24h && !item.is_overdue && <Badge variant="secondary" className="text-[10px]">Due &lt; 24h</Badge>}
                      </div>
                      {item.acknowledged_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Acknowledged {format(parseISO(item.acknowledged_at), "MMM d, h:mm a")}
                        </p>
                      )}
                      <div className="mt-2">
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
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2) System follow-ups: read-only, no checkbox */}
          {followUpItems.map((a, i) => {
            const resolvedUuid = resolveCaseUuidFromRef(a.case_id, caseOptions);
            return (
              <div
                key={`followup-${i}-${a.case_id}`}
                className="p-3 rounded-lg border-l-4 border-l-amber-500 bg-amber-50/50"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-5" aria-hidden />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="font-semibold text-sm">{a.type} – {a.case_id}</span>
                      <Badge variant="outline" className="text-[10px]">Follow-up</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ages: {a.days_overdue} day{a.days_overdue !== 1 ? "s" : ""} overdue
                    </p>
                    <div className="mt-2 space-y-1">
                      {resolvedUuid ? (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                          onClick={() => {
                            if (rnUserId && rnUserId !== "unknown") {
                              const caseLabel =
                                caseOptions.find((o) => o.id === resolvedUuid)?.label ??
                                getCaseLabelFromRef(a.case_id, caseOptions) ??
                                a.case_id;
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
                      ) : (
                        <p className="text-xs text-muted-foreground">Case link unavailable</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Personal reminders from store (same rnRemindersStore as /rn/queue) */}
          {todayReminders.map((r) => (
            <PersonalReminderRow
              key={r.id}
              r={r}
              today={today}
              caseOptions={caseOptions}
              onToggle={() => handleMarkDone(r.id)}
              onOpenCase={(uuid) => {
                if (!uuid) return;
                if (rnUserId && rnUserId !== "unknown") {
                  const caseLabel =
                    caseOptions.find((o) => o.id === uuid)?.label ?? `Case ${uuid}`;
                  setLastActiveCase(rnUserId, {
                    case_id: uuid,
                    case_label: caseLabel,
                    last_route: `/rn/case/${uuid}/ten-vs`,
                  });
                }
                navigate(`/rn/case/${uuid}/ten-vs`);
              }}
              disabled={!rnUserId}
            />
          ))}

          {/* Inline add */}
          {adding && rnUserId && (
            <div className="p-3 rounded-lg border border-dashed bg-muted/30 space-y-2">
              <Input
                placeholder="Reminder text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                className="h-9"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="h-9 rounded-md border px-2 text-sm"
                />
                <Button size="sm" onClick={handleAdd} disabled={!newText.trim()}>
                  Add
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAdding(false); setNewText(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Add button for personal reminders */}
        {rnUserId && !adding && (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Add personal reminder
            </Button>
          </div>
        )}

        {acknowledgedAssignments.length === 0 && followUpItems.length === 0 && todayReminders.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No priorities for today. {rnUserId && "Add a personal reminder above."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PersonalReminderRow({
  r,
  today,
  caseOptions = [],
  onToggle,
  onOpenCase,
  disabled,
}: {
  r: RNReminder;
  today: string;
  caseOptions?: Array<{ id: string; label: string }>;
  onToggle: () => void;
  onOpenCase?: (uuid: string) => void;
  disabled: boolean;
}) {
  const carried = isCarriedForward(r, today);
  const resolvedUuid = resolveCaseUuidFromRef(r.linked_case_id, caseOptions);
  const linkedLabel = r.linked_case_id ? (getCaseLabelFromRef(r.linked_case_id, caseOptions) ?? r.linked_case_id) : null;
  return (
    <div
      className={`p-3 rounded-lg border-l-4 transition-all ${
        r.status === "done" ? "opacity-70 bg-muted/50" : "border-l-blue-500 bg-blue-50/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={r.status === "done"}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="mt-1"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Bell className="h-4 w-4 text-blue-600 shrink-0" />
            <span
              className={`font-medium text-sm ${r.status === "done" ? "line-through text-muted-foreground" : ""}`}
            >
              {r.text}
            </span>
            <Badge variant="secondary" className="text-[10px]">Personal reminder</Badge>
            {carried && (
              <Badge variant="outline" className="text-[10px]">Carried forward ({format(parseISO(r.target_date), "MMM d")})</Badge>
            )}
            {linkedLabel && (
              <span className="text-[10px] text-muted-foreground">Linked: {linkedLabel}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
            {r.status === "done" && r.completed_at && (
              <span>Completed {format(parseISO(r.completed_at), "MMM d, h:mm a")}</span>
            )}
          </div>
          {resolvedUuid && onOpenCase && (
            <div className="mt-1.5">
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                onClick={() => onOpenCase(resolvedUuid)}
              >
                Open case →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
