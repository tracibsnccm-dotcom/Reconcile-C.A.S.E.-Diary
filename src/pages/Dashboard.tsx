import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/context/AppContext";
import { FileText, Users, Stethoscope, AlertCircle, TrendingUp, Clock, AlertTriangle, HeartPulse } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { SupportFooter } from "@/components/SupportFooter";
import { UpcomingDeadlinesWidget } from "@/components/UpcomingDeadlinesWidget";
import { LatestReportsPanel } from "@/components/LatestReportsPanel";
import { useState, useEffect } from "react";
import { fmtDate } from "@/lib/store";
import { PolicyModal } from "@/components/PolicyModal";
import { trialDaysRemaining, getTrialEndDate } from "@/utils/trial";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, UserCircle, Download } from "lucide-react";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { IntakeReminderDashboard } from "@/components/IntakeReminderDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { cases, currentTier, isTrialExpired, daysUntilInactive, trialStartDate, trialEndDate, policyAck, setPolicyAck, log, role } = useApp();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [attorneyCases, setAttorneyCases] = useState<any[]>([]);
  const [caseDetails, setCaseDetails] = useState<any>(null);
  const [rnCmInfo, setRnCmInfo] = useState<any>(null);
  const [lastCommunication, setLastCommunication] = useState<string | null>(null);

  const handlePolicyAgree = () => {
    setPolicyAck(true);
    log("ACK_MINIMUM_DATA_POLICY");
  };

  const handleLearnMore = () => {
    alert("We do not store full DOB, street address, or precise identifiers. Retrieve/manage those in the firm's system.");
  };

  const stats = [
    {
      name: "Total Cases",
      value: cases.length.toString(),
      change: "+12%",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: "Active Cases",
      value: cases.filter((c) => c.status === "IN_PROGRESS").length.toString(),
      change: "+8%",
      icon: TrendingUp,
      color: "text-status-active",
      bgColor: "bg-status-active/10",
    },
    {
      name: "Awaiting Consent",
      value: cases.filter((c) => c.status === "AWAITING_CONSENT").length.toString(),
      change: "-2%",
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      name: "Sensitive Cases",
      value: cases.filter((c) => c.status === "HOLD_SENSITIVE").length.toString(),
      change: "0%",
      icon: Clock,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      case: "CASE-2024-001",
      action: "Check-in completed",
      time: "2 hours ago",
      actor: "Maria Garcia (RN-CCM)",
    },
    {
      id: 2,
      case: "CASE-2024-003",
      action: "Flagged as sensitive",
      time: "5 hours ago",
      actor: "Lisa Chen (Attorney)",
    },
    {
      id: 3,
      case: "CASE-2024-002",
      action: "Created and awaiting consent",
      time: "1 day ago",
      actor: "Robert Johnson (Staff)",
    },
  ];

  // Use new trial helper for days remaining
  const daysRemaining = trialDaysRemaining({ trialStartDate, trialEndDate });
  const trialEnd = getTrialEndDate({ trialStartDate, trialEndDate });

  // Fetch attorney's cases for RN CM liaison tab
  // Use released-only attorney cases query (never drafts)
  useEffect(() => {
    if (!user?.id || role !== "ATTORNEY") return;

    const fetchCases = async () => {
      try {
        // Use getAttorneyCases() which enforces released-only access via attorney_accessible_cases() RPC
        const { getAttorneyCases } = await import("@/lib/attorneyCaseQueries");
        const attorneyCases = await getAttorneyCases();

        // Transform to match expected format
        const casesData = attorneyCases
          .map((c: any) => ({
            id: c.id,
            client_label: "Unknown", // AttorneyCase doesn't expose client_label for privacy
            status: c.case_status === "released" ? "RELEASED" : c.case_status === "closed" ? "CLOSED" : "NEW",
            created_at: c.created_at,
          }))
          .sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

        setAttorneyCases(casesData);
        if (casesData.length > 0) {
          setSelectedCaseId(casesData[0].id);
        }
      } catch (error: any) {
        console.error("Error fetching attorney cases:", error);
      }
    };

    fetchCases();
  }, [user?.id, role]);

  // Fetch case details and RN CM info when case is selected
  // For attorneys: use released-only case query
  useEffect(() => {
    if (!selectedCaseId) return;

    const fetchCaseDetails = async () => {
      try {
        let caseData: any;
        
        // For attorneys, use getAttorneyCaseById() which enforces released-only access
        if (role === "ATTORNEY") {
          const { getAttorneyCaseById } = await import("@/lib/attorneyCaseQueries");
          caseData = await getAttorneyCaseById(selectedCaseId);
          if (!caseData) {
            console.warn("Case not found or not accessible (may be draft)");
            setCaseDetails(null);
            return;
          }
        } else {
          // For non-attorneys, use standard query
          const { data, error: caseError } = await supabase
            .from("cases")
            .select("*")
            .eq("id", selectedCaseId)
            .single();
          if (caseError) throw caseError;
          caseData = data;
        }
        
        setCaseDetails(caseData);

        const { data: rnAssignment, error: rnError } = await supabase
          .from("case_assignments")
          .select("user_id")
          .eq("case_id", selectedCaseId)
          .in("role", ["RN_CM", "RCMS_CLINICAL_MGMT"])
          .maybeSingle();

        if (!rnError && rnAssignment) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("display_name, email, full_name")
            .eq("user_id", rnAssignment.user_id)
            .single();

          setRnCmInfo(profileData);
        } else {
          setRnCmInfo(null);
        }
      } catch (error: any) {
        console.error("Error fetching case details:", error);
      }
    };

    fetchCaseDetails();
  }, [selectedCaseId]);

  // Get last communication date
  useEffect(() => {
    if (!selectedCaseId) return;

    const fetchLastCommunication = async () => {
      const { data, error } = await supabase
        .from("attorney_rn_messages")
        .select("created_at")
        .eq("case_id", selectedCaseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLastCommunication(format(new Date(data.created_at), "MMM d, yyyy"));
      }
    };

    fetchLastCommunication();
  }, [selectedCaseId]);

  const handleExportLog = async () => {
    toast.info("Export functionality will be implemented with PDF generation");
  };

  return (
    <AppLayout>
      {!policyAck && (
        <PolicyModal
          open={!policyAck}
          onAgree={handlePolicyAgree}
          onLearnMore={handleLearnMore}
        />
      )}
      <div className="p-8">
        {/* Intake Reminder Dashboard */}
        <IntakeReminderDashboard />
        
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your overview.</p>
          </div>
          <NotificationBell />
        </div>

        {/* Trial Warning Banners */}
        {currentTier === "Inactive" && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Account Inactive</AlertTitle>
            <AlertDescription>
              Your trial expired over 30 days ago. Please upgrade to continue using RCMS C.A.R.E.
              <Button variant="outline" size="sm" className="ml-4">
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {currentTier === "Expired (Trial)" && daysUntilInactive !== null && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Trial Expired</AlertTitle>
            <AlertDescription>
              Your trial has ended. Account will become inactive in {daysUntilInactive} days.
              <Button variant="outline" size="sm" className="ml-4">
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {currentTier === "Trial" && daysRemaining <= 3 && daysRemaining > 0 && (
          <Alert className="mb-6 border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Trial Ending Soon</AlertTitle>
            <AlertDescription className="text-warning">
              Your trial ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} ({trialEnd && fmtDate(trialEnd)}). Upgrade to continue.
              <Button variant="outline" size="sm" className="ml-4">
                View Plans
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs for Attorney Role */}
        {role === "ATTORNEY" ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1 mb-6">
              <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={stat.name} className="p-6 border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                          <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                          <p className="text-xs text-muted-foreground mt-2">{stat.change} from last month</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                          <Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{activity.case}</p>
                          <p className="text-sm text-muted-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {activity.actor} • {activity.time}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <UpcomingDeadlinesWidget />
              </div>

              <div className="mt-6">
                <LatestReportsPanel />
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Non-Attorney View */
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.name} className="p-6 border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                        <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-2">{stat.change} from last month</p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{activity.case}</p>
                        <p className="text-sm text-muted-foreground">{activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.actor} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button className="w-full p-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Create New Case</span>
                  </button>
                  <button className="w-full p-4 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary-light transition-colors flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span className="font-medium">Add Client</span>
                  </button>
                  <button className="w-full p-4 bg-accent text-accent-foreground rounded-lg hover:bg-accent-light transition-colors flex items-center gap-3">
                    <Stethoscope className="w-5 h-5" />
                    <span className="font-medium">Find Providers</span>
                  </button>
                </div>
              </Card>
            </div>

            <div className="mt-8">
              <SupportFooter />
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
