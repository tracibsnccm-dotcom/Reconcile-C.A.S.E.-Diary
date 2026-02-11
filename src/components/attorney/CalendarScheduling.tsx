import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useAuth } from "@/auth/supabaseAuth";

interface Appointment {
  id: string;
  case_id: string;
  appointment_type: string | null;
  provider_name: string | null;
  scheduled_at: string;
  location: string | null;
  status: string;
  client_name?: string;
  case_number?: string;
  barrier_reason?: string;
}

export default function CalendarScheduling() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [barrierReasons, setBarrierReasons] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    }
  }, [user?.id]);

  async function fetchAppointments() {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // First, get case IDs assigned to this attorney
      const assignmentsUrl = `${supabaseUrl}/rest/v1/rc_case_assignments?user_id=eq.${user.id}&status=eq.active&select=case_id`;
      const assignmentsResponse = await fetch(assignmentsUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (!assignmentsResponse.ok) {
        console.error("Failed to fetch case assignments");
        return;
      }

      const assignmentsData = await assignmentsResponse.json();
      const caseIds = assignmentsData.map((a: any) => a.case_id);

      console.log("=== FETCHING APPOINTMENTS ===");
      console.log("Case IDs:", caseIds);

      if (caseIds.length === 0) {
        console.log("No case IDs found");
        setAppointments([]);
        return;
      }

      // Fetch appointments for those cases
      const appointmentsUrl = `${supabaseUrl}/rest/v1/rc_appointments?case_id=in.(${caseIds.join(',')})&order=scheduled_at.desc`;
      const appointmentsResponse = await fetch(appointmentsUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      if (!appointmentsResponse.ok) {
        console.error("Failed to fetch appointments, status:", appointmentsResponse.status);
        return;
      }

      const appointmentsData = await appointmentsResponse.json();
      console.log("Appointments fetched:", appointmentsData);

      // Fetch case info to get client names
      const casesUrl = `${supabaseUrl}/rest/v1/rc_cases?id=in.(${caseIds.join(',')})&is_superseded=eq.false&select=id,case_number,rc_clients(first_name,last_name)`;
      const casesResponse = await fetch(casesUrl, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });

      let caseMap = new Map();
      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        casesData.forEach((c: any) => {
          caseMap.set(c.id, {
            case_number: c.case_number,
            client_name: c.rc_clients
              ? `${c.rc_clients.first_name || ''} ${c.rc_clients.last_name || ''}`.trim()
              : 'Client',
          });
        });
      }

      // Transform appointments
      const transformedAppointments: Appointment[] = appointmentsData.map((apt: any) => {
        const caseInfo = caseMap.get(apt.case_id);
        return {
          id: apt.id,
          case_id: apt.case_id,
          appointment_type: apt.appointment_type || 'Appointment',
          provider_name: apt.provider_name,
          scheduled_at: apt.scheduled_at,
          location: apt.location,
          status: apt.status || 'scheduled',
          client_name: caseInfo?.client_name || 'Client',
          case_number: caseInfo?.case_number || apt.case_id.slice(0, 8),
        };
      });

      console.log("Transformed appointments:", transformedAppointments);
      setAppointments(transformedAppointments);

      // Fetch barrier reasons for cancelled/missed appointments
      const cancelledIds = transformedAppointments
        .filter((a: Appointment) => a.status === 'cancelled' || a.status === 'missed')
        .map((a: Appointment) => a.id);
      
      if (cancelledIds.length > 0) {
        const checkinsResponse = await fetch(
          `${supabaseUrl}/rest/v1/rc_appointment_checkins?appointment_id=in.(${cancelledIds.join(',')})&can_attend=eq.false`,
          {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
            }
          }
        );
        if (checkinsResponse.ok) {
          const checkinsData = await checkinsResponse.json();
          const reasons: Record<string, string> = {};
          checkinsData.forEach((checkin: any) => {
            if (checkin.barrier_type) {
              const barrierLabels: Record<string, string> = {
                'transportation': 'Transportation issue',
                'financial': 'Financial barrier',
                'childcare': 'Childcare issue',
                'work': 'Work conflict',
                'health': 'Health issue',
                'other': checkin.barrier_notes || 'Other barrier'
              };
              reasons[checkin.appointment_id] = barrierLabels[checkin.barrier_type] || checkin.barrier_type;
            }
          });
          setBarrierReasons(reasons);
        }
      }
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'h:mm a');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'MMM d, yyyy');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-600 text-white">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-600 text-white">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'missed':
        return <Badge className="bg-orange-500 text-white">Missed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const generateActivityMessage = (apt: Appointment) => {
    const dateTime = `${formatDate(apt.scheduled_at)} at ${formatTime(apt.scheduled_at)}`;
    const providerText = apt.provider_name ? ` with ${apt.provider_name}` : '';
    
    switch (apt.status) {
      case 'scheduled':
        return `${apt.client_name} scheduled ${apt.appointment_type}${providerText} for ${dateTime}`;
      case 'completed':
        return `${apt.client_name} completed ${apt.appointment_type}${providerText} on ${formatDate(apt.scheduled_at)}`;
      case 'cancelled':
        const reason = barrierReasons[apt.id] ? ` - Reason: ${barrierReasons[apt.id]}` : '';
        return `${apt.client_name} cancelled ${apt.appointment_type}${providerText}${reason}`;
      case 'missed':
        const missedReason = barrierReasons[apt.id] ? ` - Reason: ${barrierReasons[apt.id]}` : '';
        return `${apt.client_name} missed ${apt.appointment_type}${providerText}${missedReason}`;
      default:
        return `${apt.client_name} - ${apt.appointment_type}${providerText} on ${dateTime}`;
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    switch (activeFilter) {
      case 'upcoming':
        return apt.status === 'scheduled' && new Date(apt.scheduled_at) >= new Date();
      case 'completed':
        return apt.status === 'completed';
      case 'cancelled':
        return apt.status === 'cancelled' || apt.status === 'missed';
      default:
        return true;
    }
  });

  // Group by date
  const groupedByDate = filteredAppointments.reduce((acc, apt) => {
    const dateKey = formatDate(apt.scheduled_at);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Appointment Activity</h2>
        <p className="text-sm text-gray-600">Track client appointment updates across your cases</p>
      </div>

      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled/Missed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="mt-6">
          <Card className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse h-20 bg-muted rounded"></div>
                ))}
              </div>
            ) : sortedDates.length > 0 ? (
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-6">
                  {sortedDates.map(date => (
                    <div key={date}>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 sticky top-0 bg-white py-2">
                        {date}
                      </h3>
                      <div className="space-y-3 ml-4">
                        {groupedByDate[date].map(apt => {
                          const isCancelled = apt.status === 'cancelled';
                          const isMissed = apt.status === 'missed';
                          const hasStrikethrough = isCancelled || isMissed;
                          const barrierReason = barrierReasons[apt.id];
                          
                          return (
                            <div
                              key={apt.id}
                              className={`p-4 border rounded-lg shadow-sm transition-colors ${
                                isCancelled ? 'bg-red-50' : isMissed ? 'bg-orange-50' : 'bg-white hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    {getStatusBadge(apt.status)}
                                    {barrierReason && (
                                      <span className={`text-xs font-medium ${isCancelled ? 'text-red-600' : 'text-orange-600'}`}>
                                        {barrierReason}
                                      </span>
                                    )}
                                  </div>
                                  <p className={`font-medium mb-1 ${hasStrikethrough ? 'line-through text-gray-600' : 'text-gray-900'}`}>
                                    {apt.client_name} - {apt.case_number}
                                  </p>
                                  <p className={`text-sm mb-1 ${hasStrikethrough ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                    {apt.appointment_type}
                                    {apt.provider_name && ` with ${apt.provider_name}`}
                                  </p>
                                  <p className={`text-sm mb-1 ${hasStrikethrough ? 'line-through text-gray-500' : 'text-gray-600'}`}>
                                    {formatDate(apt.scheduled_at)} at {formatTime(apt.scheduled_at)}
                                  </p>
                                  {apt.location && (
                                    <p className={`text-sm ${hasStrikethrough ? 'line-through text-gray-400' : 'text-gray-500'}`}>
                                      <MapPin className="h-3 w-3 inline mr-1" />
                                      {apt.location}
                                    </p>
                                  )}
                                  {barrierReason && (
                                    <p className={`text-sm mt-2 font-medium ${isCancelled ? 'text-red-600' : 'text-orange-600'}`}>
                                      Reason: {barrierReason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <CalendarIcon className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm text-gray-600">No appointment activity for your cases</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
