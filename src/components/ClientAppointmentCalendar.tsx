import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  title: string;
  provider_name: string | null;
  appointment_date: string;
  appointment_time: string | null;
  location: string | null;
  notes: string | null;
  status: string;
}

interface ClientAppointmentCalendarProps {
  caseId: string;
}

export function ClientAppointmentCalendar({ caseId }: ClientAppointmentCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [caseId]);

  async function fetchAppointments() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("client_appointments")
        .select("*")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .gte("appointment_date", today)
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true })
        .limit(5);

      if (error) throw error;
      setAppointments(data || []);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card className="p-6 border-rcms-gold bg-white shadow-xl">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-rcms-teal" />
        Upcoming Appointments
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-muted rounded"></div>
          ))}
        </div>
      ) : appointments.length > 0 ? (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="p-4 border border-border rounded-lg bg-background hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{apt.title}</p>
                  {apt.provider_name && (
                    <p className="text-sm text-muted-foreground mt-1">with {apt.provider_name}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(apt.appointment_date)}
                      {apt.appointment_time && ` at ${formatTime(apt.appointment_time)}`}
                    </span>
                    {apt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {apt.location}
                      </span>
                    )}
                  </div>
                  {apt.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">{apt.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No appointment scheduled yet</p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            Your attorney&apos;s office will contact you if an appointment is needed. There is nothing you need to do right now.
          </p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            If an appointment is required, your attorney&apos;s office will reach out to you directly.
          </p>
        </div>
      )}
    </Card>
  );
}
