/**
 * Attorney Appointments — READ-ONLY view of client-reported appointments.
 * Same data as client dashboard Appointments tab: rc_appointments + rc_appointment_checkins.
 * Not editable by attorney. Includes "Reminders sent to client" when the system records them;
 * for rc_appointments no reminder log exists, so we show an empty-state.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { getAttorneyCasesForPrivateNotes } from "@/lib/attorneyCaseQueries";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CheckCircle, XCircle, AlertTriangle, Clock, Loader2, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface RcAppointment {
  id: string;
  title?: string | null;
  provider_name: string | null;
  appointment_type?: string | null;
  scheduled_at: string;
  location: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
}

interface CaseOption {
  id: string;
  case_number: string | null;
  client_name: string;
}

type ViewFilter = "upcoming" | "past" | "all";

// Same barrier mapping as ClientAppointments (for cancellation reason). Do not change client logic.
const BARRIER_TYPES = [
  { value: "childcare", label: "Childcare issue" },
  { value: "fear_anxiety", label: "Fear or anxiety about appointment" },
  { value: "feeling_unwell", label: "Not feeling well enough" },
  { value: "financial", label: "Financial concern" },
  { value: "forgot", label: "Forgot about it" },
  { value: "other", label: "Other reason" },
  { value: "transportation", label: "Transportation issue" },
  { value: "work_conflict", label: "Work conflict" },
];

function toLocalDateOnly(iso: string): string {
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso.slice(0, 10);
  }
}

function formatAppointmentDateTime(scheduledAt: string): string {
  try {
    const d = parseISO(scheduledAt);
    const dateStr = format(d, "MMM d, yyyy");
    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;
    const timeStr = `${displayHour}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    return `${dateStr} at ${timeStr}`;
  } catch {
    return scheduledAt;
  }
}

function getStatusBadge(status: string | null) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="w-3 h-3" />
          Attended
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="secondary" className="gap-1 bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="w-3 h-3" />
          Cancelled
        </Badge>
      );
    case "no_show":
      return (
        <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-800 hover:bg-orange-100">
          <AlertTriangle className="w-3 h-3" />
          No-show
        </Badge>
      );
    case "rescheduled":
      return (
        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
          <Clock className="w-3 h-3" />
          Rescheduled
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 hover:bg-blue-100">
          <Clock className="w-3 h-3" />
          Scheduled
        </Badge>
      );
  }
}

export default function AttorneyCalendar() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("upcoming");
  const [appointments, setAppointments] = useState<RcAppointment[]>([]);
  const [barrierReasons, setBarrierReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const caseId = selectedCaseId || null;

  // Load cases for selector (includes pending RN care plan: assigned_to_rn, etc.)
  useEffect(() => {
    if (!user?.id) {
      setCases([]);
      setCasesLoading(false);
      return;
    }
    setCasesLoading(true);
    getAttorneyCasesForPrivateNotes()
      .then((data) => setCases(data))
      .catch((err) => {
        console.error("Error fetching cases for appointments:", err);
        setCases([]);
      })
      .finally(() => setCasesLoading(false));
  }, [user?.id]);

  // Load appointments from same source as ClientAppointments: rc_appointments by case_id + rc_appointment_checkins for cancellation reasons
  useEffect(() => {
    if (!caseId) {
      setAppointments([]);
      setBarrierReasons({});
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("rc_appointments")
          .select("*")
          .eq("case_id", caseId)
          .order("scheduled_at", { ascending: true });

        if (cancelled) return;
        if (error) throw error;
        const list = (data || []) as RcAppointment[];
        setAppointments(list);

        const cancelledIds = list.filter((a) => a.status === "cancelled").map((a) => a.id);
        if (cancelledIds.length > 0) {
          const { data: checkins, error: checkinsErr } = await supabase
            .from("rc_appointment_checkins")
            .select("appointment_id, barrier_type, barrier_notes")
            .in("appointment_id", cancelledIds)
            .eq("can_attend", false);

          if (cancelled) return;
          if (!checkinsErr && checkins) {
            const reasons: Record<string, string> = {};
            checkins.forEach((c: { appointment_id: string; barrier_type?: string; barrier_notes?: string }) => {
              const barrier = BARRIER_TYPES.find((b) => b.value === c.barrier_type);
              reasons[c.appointment_id] = barrier?.label || c.barrier_notes || "No reason provided";
            });
            setBarrierReasons(reasons);
          }
        } else {
          setBarrierReasons({});
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error loading appointments:", err);
          toast.error("Failed to load appointments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [caseId]);

  const now = new Date();
  // In-memory filter: one query loads all; we filter by scheduled_at vs now.
  const filtered =
    viewFilter === "upcoming"
      ? appointments.filter((a) => new Date(a.scheduled_at) >= now)
      : viewFilter === "past"
        ? appointments.filter((a) => new Date(a.scheduled_at) < now)
        : appointments;
  // Upcoming: ascending (soonest first). Past / All: descending (newest first).
  const sorted =
    viewFilter === "upcoming"
      ? [...filtered].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
      : [...filtered].sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const byDate = new Map<string, RcAppointment[]>();
  for (const a of sorted) {
    const d = toLocalDateOnly(a.scheduled_at);
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(a);
  }
  // Upcoming: date groups soonest first. Past / All: date groups newest first.
  const dateKeys =
    viewFilter === "upcoming"
      ? Array.from(byDate.keys()).sort()
      : Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  // Reminders: rc_appointments has no reminder log. send-appointment-reminder uses client_appointments (different table).
  // Show empty-state per spec.
  const remindersRecorded: { timestamp: string; channel: string; status: string }[] = [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={selectedCaseId || "__none__"}
          onValueChange={(v) => setSelectedCaseId(v === "__none__" ? "" : v)}
          disabled={casesLoading}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={casesLoading ? "Loading…" : "Select a case"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select a case</SelectItem>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.case_number || c.id.slice(0, 8)} — {c.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {caseId && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewFilter("upcoming")}
              className={viewFilter === "upcoming" ? "border-primary" : ""}
            >
              Upcoming
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewFilter("past")}
              className={viewFilter === "past" ? "border-primary" : ""}
            >
              Past
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewFilter("all")}
              className={viewFilter === "all" ? "border-primary" : ""}
            >
              All
            </Button>
          </div>
        )}
      </div>

      {!casesLoading && cases.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No cases available yet. Cases will appear here after a client intake is confirmed.
        </p>
      )}

      {!caseId ? (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
          <p className="text-muted-foreground">Select a case to view client appointments.</p>
        </Card>
      ) : loading ? (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading appointments…</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Appointments list — same fields as client: date/time, title/type, status, cancellation reason */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">Appointments</h3>
            {sorted.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No appointments for this case.</p>
                <p className="text-xs mt-1">Appointments are added by the client in their portal.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dateKeys.map((d) => (
                  <div key={d}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {format(parseISO(d + "T12:00:00"), "EEEE, MMM d, yyyy")}
                    </h4>
                    <ul className="space-y-2">
                      {(byDate.get(d) || []).map((a) => {
                        const isCancelled = a.status === "cancelled";
                        return (
                        <li
                          key={a.id}
                          className="flex flex-wrap items-start justify-between gap-2 text-sm bg-muted/50 rounded-lg p-3 border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium ${isCancelled ? "line-through text-red-600" : "text-foreground"}`}>
                              {a.title || a.appointment_type || "Appointment"}
                            </div>
                            <div className={`text-xs mt-0.5 ${isCancelled ? "line-through text-red-500" : "text-muted-foreground"}`}>
                              {formatAppointmentDateTime(a.scheduled_at)}
                              {a.provider_name && ` · ${a.provider_name}`}
                            </div>
                            {a.location && (
                              <div className={`text-xs mt-1 ${isCancelled ? "line-through text-red-500" : "text-muted-foreground"}`}>{a.location}</div>
                            )}
                            {a.notes && (
                              <p className={`text-xs mt-1 line-clamp-2 ${isCancelled ? "line-through text-red-500" : "text-muted-foreground"}`}>{a.notes}</p>
                            )}
                            {isCancelled && barrierReasons[a.id] && (
                              <p className="text-red-600 text-xs mt-2 font-medium">
                                Reason: {barrierReasons[a.id]}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(a.status)}</div>
                        </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Reminders sent to client — empty state: rc_appointments has no reminder log */}
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Reminders sent to client
            </h3>
            {remindersRecorded.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {remindersRecorded.map((r, i) => (
                  <li key={i} className="flex justify-between text-muted-foreground">
                    <span>{r.timestamp}</span>
                    <span>{r.channel} · {r.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm py-4">Appointment reminders are not currently logged for attorney view.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
