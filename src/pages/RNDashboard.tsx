import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  HeartPulse,
  MessageSquare,
  TrendingUp,
  Users
} from "lucide-react";
import { format, isToday, parseISO } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { WorkQueue } from "@/components/rn/WorkQueue";

interface Case {
  id: string;
  case_number: string | null;
  client_name: string;
  date_of_injury: string | null;
  case_type: string | null;
  fourp_scores: {
    physical?: number;
    psychological?: number;
    psychosocial?: number;
    professional?: number;
  } | null;
  viability_index: number | null;
  active_flags_count: number;
  last_checkin_date: string | null;
  care_plan_status: string | null;
  has_care_plan: boolean;
  is_pending: boolean;
}

interface ClinicalFlag {
  id: string;
  case_id: string;
  client_name: string;
  flag_type: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
  created_at: string;
}

interface ActivityItem {
  id: string;
  type: 'note' | 'checkin' | 'message';
  case_id: string;
  case_number: string | null;
  client_name: string;
  content: string;
  created_at: string;
}

export default function RNDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [pendingCases, setPendingCases] = useState<Case[]>([]);
  const [activeCases, setActiveCases] = useState<Case[]>([]);
  const [flags, setFlags] = useState<ClinicalFlag[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    activeCases: 0,
    pendingReviews: 0,
    activeFlags: 0,
    checkinsToday: 0,
  });

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboardData();
  }, [user?.id]);

  async function fetchDashboardData() {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Fetch case assignments for this RN
      const { data: assignments, error: assignmentsError } = await supabase
        .from('rc_case_assignments')
        .select('case_id')
        .eq('user_id', user.id)
        .in('role', ['RN_CCM', 'RN_CM', 'RCMS_CLINICAL_MGMT']);

      if (assignmentsError) throw assignmentsError;

      const caseIds = assignments?.map(a => a.case_id) || [];

      if (caseIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch cases with case_type
      const { data: casesData, error: casesError } = await supabase
        .from('rc_cases')
        .select('id, case_number, date_of_injury, case_type, client_id')
        .in('id', caseIds)
        .eq('is_superseded', false);

      if (casesError) throw casesError;

      // Fetch client names
      const { data: clientsData } = await supabase
        .from('rc_clients')
        .select('id, first_name, last_name')
        .in('id', casesData?.map(c => c.client_id).filter(Boolean) || []);

      // Fetch intakes to check attorney attestation
      const { data: intakesData } = await supabase
        .from('rc_client_intakes')
        .select('case_id, attorney_attested_at, intake_status')
        .in('case_id', caseIds);

      // Fetch latest check-ins for 4P scores
      const { data: checkinsData } = await supabase
        .from('rc_client_checkins')
        .select('case_id, fourp_physical, fourp_psychological, fourp_psychosocial, fourp_professional, created_at')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false });

      // Fetch care plans - check which cases have care plans
      const { data: carePlansData } = await supabase
        .from('care_plans')
        .select('case_id, plan_type, updated_at')
        .in('case_id', caseIds)
        .order('updated_at', { ascending: false });

      const casesWithCarePlans = new Set(carePlansData?.map(cp => cp.case_id) || []);

      // Build cases array with all data
      const casesWithData: Case[] = (casesData || []).map(c => {
        const client = clientsData?.find(cl => cl.id === c.client_id);
        const clientName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'Unknown Client';
        
        // Check if attorney attested
        const intake = intakesData?.find(i => i.case_id === c.id);
        const attorneyAttested = !!intake?.attorney_attested_at;
        
        // Check if has care plan
        const hasCarePlan = casesWithCarePlans.has(c.id);
        
        // Pending = attorney attested but no care plan
        const isPending = attorneyAttested && !hasCarePlan;
        
        const latestCheckin = checkinsData?.find(ch => ch.case_id === c.id);
        const fourpScores = latestCheckin ? {
          physical: latestCheckin.fourp_physical,
          psychological: latestCheckin.fourp_psychological,
          psychosocial: latestCheckin.fourp_psychosocial,
          professional: latestCheckin.fourp_professional,
        } : null;

        const viabilityIndex = fourpScores 
          ? ((fourpScores.physical || 0) + (fourpScores.psychological || 0) + 
             (fourpScores.psychosocial || 0) + (fourpScores.professional || 0)) / 4
          : null;

        const carePlan = carePlansData?.find(cp => cp.case_id === c.id);
        const carePlanStatus = carePlan 
          ? (carePlan.plan_type === 'final' ? 'Complete' : 
             carePlan.plan_type === 'updated' ? 'In Progress' : 'Draft')
          : null;

        return {
          id: c.id,
          case_number: c.case_number,
          client_name: clientName,
          date_of_injury: c.date_of_injury,
          case_type: c.case_type,
          fourp_scores: fourpScores,
          viability_index: viabilityIndex,
          active_flags_count: 0, // TODO: Fetch from clinical flags table
          last_checkin_date: latestCheckin?.created_at || null,
          care_plan_status: carePlanStatus,
          has_care_plan: hasCarePlan,
          is_pending: isPending,
        };
      });

      // Split into pending and active
      const pending = casesWithData.filter(c => c.is_pending);
      const active = casesWithData.filter(c => c.has_care_plan);

      setCases(casesWithData);
      setPendingCases(pending);
      setActiveCases(active);

      // Calculate stats
      const activeCasesCount = active.length;
      const pendingReviewsCount = pending.length;
      const activeFlags = 0; // TODO: Fetch from clinical flags table
      const today = new Date().toISOString().split('T')[0];
      const checkinsToday = checkinsData?.filter(ch => 
        ch.created_at?.startsWith(today)
      ).length || 0;

      setStats({
        activeCases: activeCasesCount,
        pendingReviews: pendingReviewsCount,
        activeFlags,
        checkinsToday,
      });

      // Fetch recent activity (auto-notes, check-ins, messages)
      await fetchRecentActivity(caseIds, casesWithData);

      // TODO: Fetch clinical flags
      // await fetchClinicalFlags(caseIds);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecentActivity(caseIds: string[], casesList: Case[]) {
    try {
      // Fetch auto-notes
      const { data: notesData } = await supabase
        .from('rc_case_notes')
        .select('id, case_id, content, created_at, title')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch check-ins
      const { data: checkinsData } = await supabase
        .from('rc_client_checkins')
        .select('id, case_id, created_at')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('rc_messages')
        .select('id, case_id, message_text, created_at')
        .in('case_id', caseIds)
        .order('created_at', { ascending: false })
        .limit(10);

      // Combine and format activities
      const activitiesList: ActivityItem[] = [];

      // Add notes
      if (notesData) {
        for (const note of notesData) {
          const caseData = casesList.find(c => c.id === note.case_id);
          activitiesList.push({
            id: note.id,
            type: 'note',
            case_id: note.case_id,
            case_number: caseData?.case_number || null,
            client_name: caseData?.client_name || 'Unknown',
            content: note.title || note.content?.substring(0, 100) || 'Note',
            created_at: note.created_at,
          });
        }
      }

      // Add check-ins
      if (checkinsData) {
        for (const checkin of checkinsData) {
          const caseData = casesList.find(c => c.id === checkin.case_id);
          activitiesList.push({
            id: checkin.id,
            type: 'checkin',
            case_id: checkin.case_id,
            case_number: caseData?.case_number || null,
            client_name: caseData?.client_name || 'Unknown',
            content: 'Client completed wellness check-in',
            created_at: checkin.created_at,
          });
        }
      }

      // Add messages
      if (messagesData) {
        for (const message of messagesData) {
          const caseData = casesList.find(c => c.id === message.case_id);
          activitiesList.push({
            id: message.id,
            type: 'message',
            case_id: message.case_id,
            case_number: caseData?.case_number || null,
            client_name: caseData?.client_name || 'Unknown',
            content: message.message_text?.substring(0, 100) || 'Message',
            created_at: message.created_at,
          });
        }
      }

      // Sort by date and limit
      activitiesList.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(activitiesList.slice(0, 20));
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'moderate': return 'bg-orange-500';
      case 'low': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status || status === 'Draft') {
      return <Badge variant="outline">Draft</Badge>;
    }
    if (status === 'In Progress') {
      return <Badge className="bg-blue-500">In Progress</Badge>;
    }
    if (status === 'Complete') {
      return <Badge className="bg-green-500">Complete</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };


  if (loading) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center text-muted-foreground">Loading dashboard...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">RN Care Manager Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Reconcile C.A.R.E.™ - Clinical Assessment & Recovery Engagement
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => document.getElementById('my-work-queue')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Cases</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeCases + stats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view work queue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Flags</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeFlags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-ins Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checkinsToday}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Work Queue Section */}
          <div id="my-work-queue" className="lg:col-span-2">
            <WorkQueue />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Active Flags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Active Flags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {flags.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      No active flags
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {flags.map((flag) => (
                        <div
                          key={flag.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/rn/case/${flag.case_id}/ten-vs`)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="font-medium text-sm">{flag.client_name}</span>
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(flag.severity)}`} />
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{flag.flag_type}</p>
                          <p className="text-xs">{flag.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(flag.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  {activities.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      No recent activity
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/rn/case/${activity.case_id}/ten-vs`)}
                        >
                          <div className="flex items-start gap-2 mb-1">
                            {activity.type === 'note' && <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />}
                            {activity.type === 'checkin' && <CheckCircle2 className="h-3 w-3 mt-0.5 text-muted-foreground" />}
                            {activity.type === 'message' && <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />}
                            <div className="flex-1">
                              <p className="text-xs font-medium">{activity.client_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.case_number || 'No case number'}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs mt-1">{activity.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(activity.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
