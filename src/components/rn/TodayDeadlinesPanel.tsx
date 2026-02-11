/**
 * TodayDeadlinesPanel – RN planning layer side panel (Today & Deadlines).
 * Editable personal reminders only. No DB. Reuses rnRemindersStore.
 * Deep links to cases when linked_case_id exists; sets rc_today_origin for
 * "Mark completed?" prompt on return to /rn/queue.
 */

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, subDays } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Bell, Pin } from "lucide-react";
import {
  getRemindersForTodayView,
  getRemindersForUpcoming,
  getRemindersCompletedInRange,
  getReminders,
  markReminderDone,
  upsertReminder,
  isCarriedForward,
  type RNReminder,
} from "@/lib/rnRemindersStore";
import { resolveCaseUuidFromRef, getCaseLabelFromRef, type CaseOption } from "@/lib/rnCaseLinking";
import { setLastActiveCase } from "@/lib/rnLastActiveCase";
import type { AssignedCasePriorityItem } from "@/lib/rnAssignmentPriority";

export const RC_TODAY_ORIGIN = "rc_today_origin";

export type { CaseOption };

export interface TodayDeadlinesPanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Auth user id or rc user id; fallback "unknown" if missing. */
  rnUserId: string;
  /** Optional. When provided, Add form can link a reminder to a case. */
  caseOptions?: CaseOption[];
  /** Optional. Acknowledged assignments to show pinned at top. */
  acknowledgedAssignments?: AssignedCasePriorityItem[];
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Set sessionStorage when navigating to case from a Today/Deadline item (for "Mark completed?" on return). */
function setTodayOrigin(reminder: RNReminder): void {
  try {
    sessionStorage.setItem(
      RC_TODAY_ORIGIN,
      JSON.stringify({
        reminderId: reminder.id,
        reminderText: reminder.text,
        date: reminder.target_date,
        source: "today_panel",
      })
    );
  } catch {
    // ignore
  }
}

export function TodayDeadlinesPanel({
  open,
  onOpenChange,
  rnUserId,
  caseOptions = [],
  acknowledgedAssignments = [],
}: TodayDeadlinesPanelProps) {
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [addingToday, setAddingToday] = useState(false);
  const [addingUpcoming, setAddingUpcoming] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editDate, setEditDate] = useState("");

  const today = todayStr();
  const yesterday = subDays(new Date(), 1).toISOString().slice(0, 10);

  const todayList = useMemo(
    () => (rnUserId ? getRemindersForTodayView(rnUserId, today) : []),
    [rnUserId, today, refresh]
  );
  const upcomingList = useMemo(
    () => (rnUserId ? getRemindersForUpcoming(rnUserId, today) : []),
    [rnUserId, today, refresh]
  );
  const recentList = useMemo(
    () =>
      rnUserId
        ? getRemindersCompletedInRange(rnUserId, yesterday, today)
        : [],
    [rnUserId, yesterday, today, refresh]
  );

  const handleOpenCase = useCallback(
    (r: RNReminder) => {
      const resolvedId = resolveCaseUuidFromRef(r.linked_case_id, caseOptions);
      if (!resolvedId) return;
      setTodayOrigin(r);
      const caseLabel =
        caseOptions.find((o) => o.id === resolvedId)?.label ??
        getCaseLabelFromRef(r.linked_case_id, caseOptions) ??
        `Linked: ${r.linked_case_id || "case"}`;
      if (rnUserId && rnUserId !== "unknown") {
        setLastActiveCase(rnUserId, {
          case_id: resolvedId,
          case_label: caseLabel,
          last_route: `/rn/case/${resolvedId}/ten-vs`,
        });
      }
      navigate(`/rn/case/${resolvedId}/ten-vs`);
      onOpenChange(false);
    },
    [navigate, onOpenChange, caseOptions, rnUserId]
  );

  const handleMarkDone = useCallback(
    (id: string) => {
      if (!rnUserId) return;
      markReminderDone(rnUserId, id);
      setRefresh((r) => r + 1);
    },
    [rnUserId]
  );

  const handleAddToday = useCallback(
    (text: string, targetDate: string, linkedCaseId?: string | null) => {
      if (!text.trim() || !rnUserId) return;
      upsertReminder(rnUserId, {
        text: text.trim(),
        target_date: targetDate,
        linked_case_id: linkedCaseId || null,
      });
      setRefresh((r) => r + 1);
      setAddingToday(false);
    },
    [rnUserId]
  );

  const handleAddUpcoming = useCallback(
    (text: string, targetDate: string, linkedCaseId?: string | null) => {
      if (!text.trim() || !rnUserId) return;
      upsertReminder(rnUserId, {
        text: text.trim(),
        target_date: targetDate,
        linked_case_id: linkedCaseId || null,
      });
      setRefresh((r) => r + 1);
      setAddingUpcoming(false);
    },
    [rnUserId]
  );

  const handleSaveEdit = useCallback(
    (id: string) => {
      if (!rnUserId || !editText.trim()) return;
      upsertReminder(rnUserId, {
        id,
        text: editText.trim(),
        target_date: editDate,
      });
      setRefresh((r) => r + 1);
      setEditingId(null);
    },
    [rnUserId, editText, editDate]
  );

  const startEdit = useCallback((r: RNReminder) => {
    setEditingId(r.id);
    setEditText(r.text);
    setEditDate(r.target_date);
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-2 border-b shrink-0">
          <SheetTitle>Today & Deadlines</SheetTitle>
          <SheetDescription>
            Personal reminders and deadlines. Planning only.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4 space-y-6">
            {/* Acknowledged Assignments (Pinned) — compact, open case only */}
            {acknowledgedAssignments.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1 flex items-center gap-1.5">
                  <Pin className="h-3.5 w-3.5" />
                  Acknowledged Assignments (Pinned)
                </h3>
                <div className="space-y-2">
                  {acknowledgedAssignments.map((item) => (
                    <div
                      key={item.case_id}
                      className="rounded-lg border border-l-4 border-l-emerald-600 bg-emerald-50/30 p-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{item.case_label}</span>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors shrink-0"
                          onClick={() => {
                            if (rnUserId && rnUserId !== "unknown") {
                              setLastActiveCase(rnUserId, {
                                case_id: item.case_id,
                                case_label: item.case_label,
                                last_route: `/rn/case/${item.case_id}/ten-vs`,
                              });
                            }
                            navigate(`/rn/case/${item.case_id}/ten-vs`);
                            onOpenChange(false);
                          }}
                        >
                          Open case →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* A) Today's Priorities */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1">
                Today&apos;s Priorities
              </h3>
              <div className="space-y-2">
                {todayList.map((r) =>
                  editingId === r.id ? (
                    <EditRow
                      key={r.id}
                      text={editText}
                      date={editDate}
                      onTextChange={setEditText}
                      onDateChange={setEditDate}
                      onSave={() => handleSaveEdit(r.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <ReminderRow
                      key={r.id}
                      r={r}
                      today={today}
                      section="today"
                      caseOptions={caseOptions}
                      onToggle={() => handleMarkDone(r.id)}
                      onEdit={() => startEdit(r)}
                      onOpenCase={() => handleOpenCase(r)}
                      disabled={!rnUserId}
                    />
                  )
                )}
                {addingToday && rnUserId && (
                  <AddRow
                    defaultDate={today}
                    caseOptions={caseOptions}
                    onAdd={handleAddToday}
                    onCancel={() => setAddingToday(false)}
                  />
                )}
                {rnUserId && !addingToday && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1"
                    onClick={() => setAddingToday(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                )}
              </div>
              {todayList.length === 0 && !addingToday && (
                <p className="text-xs text-muted-foreground py-2">
                  No priorities for today.
                </p>
              )}
            </section>

            {/* B) Upcoming Deadlines */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1">
                Upcoming Deadlines
              </h3>
              <div className="space-y-2">
                {upcomingList.map((r) =>
                  editingId === r.id ? (
                    <EditRow
                      key={r.id}
                      text={editText}
                      date={editDate}
                      onTextChange={setEditText}
                      onDateChange={setEditDate}
                      onSave={() => handleSaveEdit(r.id)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <ReminderRow
                      key={r.id}
                      r={r}
                      today={today}
                      section="upcoming"
                      caseOptions={caseOptions}
                      onToggle={() => handleMarkDone(r.id)}
                      onEdit={() => startEdit(r)}
                      onOpenCase={() => handleOpenCase(r)}
                      disabled={!rnUserId}
                    />
                  )
                )}
                {addingUpcoming && rnUserId && (
                  <AddRow
                    defaultDate={(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      return d.toISOString().slice(0, 10);
                    })()}
                    caseOptions={caseOptions}
                    onAdd={handleAddUpcoming}
                    onCancel={() => setAddingUpcoming(false)}
                  />
                )}
                {rnUserId && !addingUpcoming && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1"
                    onClick={() => setAddingUpcoming(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                )}
              </div>
              {upcomingList.length === 0 && !addingUpcoming && (
                <p className="text-xs text-muted-foreground py-2">
                  No upcoming deadlines.
                </p>
              )}
            </section>

            {/* C) Recent Activity */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-2 sticky top-0 bg-background py-1">
                Recent Activity
              </h3>
              <div className="space-y-2">
                {recentList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No completed items for yesterday or today.
                  </p>
                ) : (
                  recentList.map((r) => {
                    const recentResolvedId = resolveCaseUuidFromRef(r.linked_case_id, caseOptions);
                    return (
                      <div
                        key={r.id}
                        className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0"
                      >
                        <Bell className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <span className="text-sm line-through text-muted-foreground">
                            {r.text}
                          </span>
                          {r.completed_at && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(
                                parseISO(r.completed_at),
                                "MMM d, h:mm a"
                              )}
                            </p>
                          )}
                          {recentResolvedId && (
                            <div className="mt-1.5">
                              <button
                                type="button"
                                className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                                onClick={() => handleOpenCase(r)}
                              >
                                Open case →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// --- Row components ---

function ReminderRow({
  r,
  today,
  section,
  caseOptions,
  onToggle,
  onEdit,
  onOpenCase,
  disabled,
}: {
  r: RNReminder;
  today: string;
  section: "today" | "upcoming";
  caseOptions: CaseOption[];
  onToggle: () => void;
  onEdit: () => void;
  onOpenCase: () => void;
  disabled: boolean;
}) {
  const carried = isCarriedForward(r, today);
  const dateLabel =
    r.target_date === today
      ? "Today"
      : carried
        ? `Carried forward (${format(parseISO(r.target_date), "MMM d")})`
        : format(parseISO(r.target_date), "MMM d, yyyy");

  const resolvedId = resolveCaseUuidFromRef(r.linked_case_id, caseOptions);
  const linkedLabel = r.linked_case_id
    ? (getCaseLabelFromRef(r.linked_case_id, caseOptions) ?? r.linked_case_id)
    : null;

  return (
    <div
      className={`rounded-lg border p-2.5 transition-all ${
        r.status === "done"
          ? "opacity-70 bg-muted/50"
          : "border-l-4 border-l-blue-500 bg-blue-50/30"
      }`}
    >
      <div className="flex items-start gap-2">
        <Checkbox
          checked={r.status === "done"}
          onCheckedChange={onToggle}
          disabled={disabled}
          className="mt-1 shrink-0"
        />
        <div
          className={`min-w-0 flex-1 ${resolvedId ? "cursor-pointer" : ""}`}
          onClick={resolvedId ? onOpenCase : undefined}
          onKeyDown={
            resolvedId ? (e) => e.key === "Enter" && onOpenCase() : undefined
          }
          role={resolvedId ? "button" : undefined}
          tabIndex={resolvedId ? 0 : undefined}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span
              className={`text-sm font-medium ${
                r.status === "done"
                  ? "line-through text-muted-foreground"
                  : ""
              }`}
            >
              {r.text}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              Personal reminder
            </Badge>
            {linkedLabel && (
              <span className="text-[10px] text-muted-foreground">
                Linked: {linkedLabel}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {dateLabel}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-xs"
              onClick={onEdit}
              disabled={disabled}
            >
              <Pencil className="h-3 w-3 mr-1" />
              Edit
            </Button>
            {r.linked_case_id &&
              (resolvedId ? (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline focus:outline-none focus:underline transition-colors"
                  onClick={onOpenCase}
                >
                  Open case →
                </button>
              ) : (
                <span className="text-[10px] text-muted-foreground py-1.5">
                  Case link unavailable
                </span>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditRow({
  text,
  date,
  onTextChange,
  onDateChange,
  onSave,
  onCancel,
}: {
  text: string;
  date: string;
  onTextChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-lg border border-dashed p-2.5 space-y-2 bg-muted/20">
      <Input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Reminder text"
        className="h-9"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="h-9 rounded-md border px-2 text-sm w-full"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={!text.trim()}>
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function AddRow({
  defaultDate,
  caseOptions = [],
  onAdd,
  onCancel,
}: {
  defaultDate: string;
  caseOptions?: { id: string; label: string }[];
  onAdd: (text: string, date: string, linkedCaseId?: string | null) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [linkedCaseId, setLinkedCaseId] = useState<string>("");
  return (
    <div className="rounded-lg border border-dashed p-2.5 space-y-2 bg-muted/20">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Reminder text"
        className="h-9"
        onKeyDown={(e) => e.key === "Enter" && onAdd(text, date, linkedCaseId || undefined)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="h-9 rounded-md border px-2 text-sm w-full"
      />
      {caseOptions.length > 0 && (
        <select
          value={linkedCaseId}
          onChange={(e) => setLinkedCaseId(e.target.value)}
          className="h-9 rounded-md border px-2 text-sm w-full bg-background"
        >
          <option value="">Link to case (optional)</option>
          {caseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onAdd(text, date, linkedCaseId || undefined)}
          disabled={!text.trim()}
        >
          Add
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
