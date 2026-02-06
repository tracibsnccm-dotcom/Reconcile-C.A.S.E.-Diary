import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  title?: string | null;
  appointment_type?: string | null;
  provider_name: string | null;
  scheduled_at: string;
  location: string | null;
  notes: string | null;
  status: string | null;
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_appointments?case_id=eq.${caseId}&scheduled_at=gte.${today}&order=scheduled_at.asc&limit=10`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          }
        }
      );
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      setAppointments(data || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'h:mm a');
  };

  const titleFor = (apt: Appointment) =>
    apt.title || apt.appointment_type || apt.provider_name || 'Appointment';

  return (
    <Card className="bg-white shadow-lg border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
        <Calendar className="w-6 h-6 text-orange-500" />
        Upcoming Appointments
      </h2>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-slate-100 rounded" />
          ))}
        </div>
      ) : appointments.length > 0 ? (
        <div className="space-y-3">
          {appointments.filter(a => a.status === 'scheduled' || !a.status).map((apt) => (
            <div key={apt.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
              <p className="font-semibold text-gray-900">{titleFor(apt)}</p>
              {apt.provider_name && <p className="text-sm text-gray-600 mt-1">with {apt.provider_name}</p>}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(apt.scheduled_at)} at {formatTime(apt.scheduled_at)}
                </span>
                {apt.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {apt.location}
                  </span>
                )}
              </div>
              {apt.notes && <p className="text-xs text-gray-500 mt-2 italic">{apt.notes}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No upcoming appointments</p>
          <p className="text-sm mt-2 max-w-md mx-auto">
            Your attorney&apos;s office will contact you if an appointment is needed.
          </p>
        </div>
      )}
    </Card>
  );
}
