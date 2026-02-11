import ClientCheckins from "./ClientCheckins";
import { CarePlansViewer } from "@/components/CarePlansViewer";
import { ClientCarePlanPrintButton } from "@/components/ClientCarePlanPrintButton";
import { ClientMessaging } from "@/components/ClientMessaging";
import { ReportConcernDialog } from "@/components/ReportConcernDialog";
import { FileComplaintForm } from "@/components/FileComplaintForm";
import { VoiceConcernsForm } from "@/components/VoiceConcernsForm";
import { WellnessSnapshot } from "@/components/WellnessSnapshot";
import { BaselineProgressComparison } from "@/components/BaselineProgressComparison";
import { HealthSummaryChips } from "@/components/HealthSummaryChips";
import { AssessmentSnapshotExplainer } from "@/components/AssessmentSnapshotExplainer";
import { ClientGoalTracker } from "@/components/ClientGoalTracker";
import { ClientMedicationTracker } from "@/components/ClientMedicationTracker";
import { ClientTreatmentTracker } from "@/components/ClientTreatmentTracker";
import { ClientAllergyTracker } from "@/components/ClientAllergyTracker";
import { ClientActionItems } from "@/components/ClientActionItems";
import { CareTeamContactBar } from "@/components/CareTeamContactBar";
import { CrisisResourcesBanner } from "@/components/CrisisResourcesBanner";
import { ClientAppointmentCalendar } from "@/components/ClientAppointmentCalendar";
import { ClientQuickMessage } from "@/components/ClientQuickMessage";
import { ProgressHighlights } from "@/components/ProgressHighlights";
import { ClientDocuments } from "@/components/ClientDocuments";
import { CaseTimeline } from "@/components/CaseTimeline";
import { ResourceLibrary } from "@/components/ResourceLibrary";
import { ClientJournal } from "@/components/ClientJournal";
import { MotivationWidget } from "@/components/MotivationWidget";
import { SupportFooter } from "@/components/SupportFooter";
import { ClientProfileSettings } from "@/components/ClientProfileSettings";
import { ClientIntakeReview } from "@/components/ClientIntakeReview";
import { ClientConsentManagement } from "@/components/ClientConsentManagement";
import { ConsentDocumentViewer } from "@/components/ConsentDocumentViewer";
import { NotificationBell } from "@/components/NotificationBell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/auth/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Megaphone, MessageSquare, AlertTriangle, ClipboardCheck, FileText, Clock, BookOpen, Stethoscope, Briefcase, Users, BookText, UserRound, Activity, Settings, LogOut, Shield, Building2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useCases } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet } from '@/lib/supabaseRest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClientPendingAttorneyConfirmation } from "@/components/ClientPendingAttorneyConfirmation";
import { RoleGuard } from "@/components/RoleGuard";
import { SIGN_IN_REQUIRED_TITLE, SIGN_IN_REQUIRED_BODY, INTAKE_REQUIRED_BODY, NO_ACTIVE_CASE } from "@/config/clientMessaging";
import { resolveClientIntakeState, CLIENT_INTAKE_STATE_MESSAGES } from "@/lib/clientIntakeState";

export default function ClientPortal() {
  const { cases: userCases, loading: casesLoading } = useCases();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  
  // Check for client login via sessionStorage (case number + PIN login)
  const sessionCaseId = typeof window !== 'undefined' ? sessionStorage.getItem('client_case_id') : null;
  
  const caseId = selectedCaseId || sessionCaseId || (userCases?.[0]?.id as string | undefined);
  const [concernDialogOpen, setConcernDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [voiceConcernsOpen, setVoiceConcernsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("checkins");
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [intakeCompleted, setIntakeCompleted] = useState<boolean | null>(null);
  const [checkingIntake, setCheckingIntake] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [intakeStatus, setIntakeStatus] = useState<{
    attorneyAttestedAt: string | null;
    attorneyConfirmDeadlineAt: string | null;
    intakeId: string | null;
    intakeJson: any;
  } | null>(null);
  
  const handleLogout = async () => {
    await signOut();
    navigate("/access");
  };

  // Defensive auth check: verify session on mount before running any queries
  useEffect(() => {
    async function verifyAuth() {
      try {
        if (!supabase || !isSupabaseConfigured()) {
          setCheckingAuth(false);
          return;
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking auth session:", error);
          setCheckingAuth(false);
          return;
        }

        if (!session) {
          // Check if client logged in via case number + PIN
          const clientCaseId = sessionStorage.getItem('client_case_id');
          if (clientCaseId) {
            // Client is logged in via case/PIN, proceed with loading
            setCheckingAuth(false);
            // Don't return - let the rest of the component load
          } else {
            // No session - gate immediately, don't proceed with intake checks
            setCheckingAuth(false);
            return;
          }
        }

        // Session exists, proceed with normal flow
        setCheckingAuth(false);
      } catch (err) {
        console.error("Error verifying auth:", err);
        setCheckingAuth(false);
      }
    }

    verifyAuth();
  }, []);

  // Gate: Show auth gate screen if not authenticated (defensive check)
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow through if logged in via sessionStorage (case/PIN login)
  const isSessionStorageLogin = !!sessionCaseId;
  
  if (!user && !isSessionStorageLogin) {
    return (
      <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">{SIGN_IN_REQUIRED_TITLE}</h2>
            </div>
            <p className="text-muted-foreground">
              {SIGN_IN_REQUIRED_BODY}
            </p>
            <Button
              onClick={() => window.location.assign('/auth?redirect=/client-portal')}
              className="w-full"
            >
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Set default case when cases load
  useEffect(() => {
    if (!casesLoading && userCases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(userCases[0].id);
    }
  }, [userCases, casesLoading, selectedCaseId]);

  // MVP Gate: Check if client has completed intake for the selected case before allowing portal access
  // Gate is per-case: each case requires its own intake completion
  // Also check intake status for attorney confirmation gating
  useEffect(() => {
    // Don't run intake checks if auth is still being verified or user is not authenticated
    if (checkingAuth || !user) {
      return;
    }

    async function checkIntakeCompletion() {
      // Use sessionStorage case ID as fallback
      const targetCaseId = caseId || sessionStorage.getItem('client_case_id');
      
      if (!targetCaseId) {
        // If no case selected yet, wait for cases to load
        if (!casesLoading) {
          setCheckingIntake(false);
          // If cases loaded but no caseId, allow access (will show empty state)
          setIntakeCompleted(true);
        }
        return;
      }

      try {
        console.log('ClientPortal: Loading intake for caseId', targetCaseId);
        const { data, error } = await supabaseGet('rc_client_intakes', 
          `select=id,case_id,intake_json,created_at,attorney_attested_at,attorney_confirm_deadline_at,intake_submitted_at&case_id=eq.${targetCaseId}&order=created_at.desc&limit=1`);

        console.log('ClientPortal: Intake data received', data);
        console.log('ClientPortal: attorney_attested_at =', Array.isArray(data) ? data[0]?.attorney_attested_at : data?.attorney_attested_at);

        if (error) {
          console.error("Error checking intake completion:", error);
          // On error, allow access (fail open for MVP)
          setIntakeCompleted(true);
          setIntakeStatus(null);
        } else {
          // Handle maybeSingle behavior - get first item if array
          const intakeData = Array.isArray(data) ? (data.length > 0 ? data[0] : null) : data;
          setIntakeCompleted(!!intakeData);
          if (intakeData) {
            setIntakeStatus({
              attorneyAttestedAt: intakeData.attorney_attested_at,
              attorneyConfirmDeadlineAt: intakeData.attorney_confirm_deadline_at,
              intakeId: intakeData.id,
              intakeJson: intakeData.intake_json,
            });
          } else {
            setIntakeStatus(null);
          }
        }
      } catch (err) {
        console.error("Error checking intake completion:", err);
        // On error, don't assume access - only set true if we have valid auth
        // Auth is already verified above, so safe to fail open here
        setIntakeCompleted(true);
      } finally {
        setCheckingIntake(false);
      }
    }

    checkIntakeCompletion();
  }, [caseId, casesLoading, selectedCaseId, checkingAuth, user]);

  // Check for crisis indicators
  useEffect(() => {
    // Don't run crisis checks if auth is still being verified or user is not authenticated
    if (checkingAuth || !caseId || !user?.id) return;
    
    async function checkCrisisIndicators() {
      try {
        const { data, error } = await supabaseGet('rc_client_checkins',
          `select=pain_scale,depression_scale,anxiety_scale&client_id=eq.${user.id}&case_id=eq.${caseId}&order=created_at.desc&limit=1`);

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const latest = data[0];
          const hasCrisis = latest.pain_scale >= 8 || 
                           (latest.depression_scale && latest.depression_scale >= 8) || 
                           (latest.anxiety_scale && latest.anxiety_scale >= 8);
          setShowCrisisAlert(hasCrisis);
        }
      } catch (err) {
        console.error("Error checking crisis indicators:", err);
      }
    }

    checkCrisisIndicators();
  }, [caseId, user?.id]);

  // Auto-redirect to intake after delay if not completed
  useEffect(() => {
    if (!checkingIntake && intakeCompleted === false) {
      const timer = setTimeout(() => {
        navigate("/client-intake");
      }, 5000); // 5 second delay
      return () => clearTimeout(timer);
    }
  }, [checkingIntake, intakeCompleted, navigate]);

  // Show intake gate message if intake not completed
  // Wrap with RoleGuard only if not using sessionStorage login
  const PortalContent = (
    <>
      {checkingIntake && (
        <div className="min-h-screen bg-rcms-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Loading...</p>
          </div>
        </div>
      )}

      {!checkingIntake && intakeCompleted === false && (
        <div className="min-h-screen bg-rcms-white flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {INTAKE_REQUIRED_BODY}
                </AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/client-intake")} className="w-full">
                  Go to Client Intake
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Redirecting automatically in a few seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );

  if (checkingIntake || intakeCompleted === false) {
    return isSessionStorageLogin ? PortalContent : (
      <RoleGuard requiredRole="client" redirectTo="/">
        {PortalContent}
      </RoleGuard>
    );
  }

  // Compute explicit states based on intake data (mutually exclusive)
  const intake = intakeStatus;
  const isConfirmed = !!intake?.attorneyAttestedAt;
  const isPending =
    !isConfirmed &&
    !!intake?.attorneyConfirmDeadlineAt &&
    Date.now() < new Date(intake.attorneyConfirmDeadlineAt).getTime();
  const isExpired =
    !isConfirmed &&
    !!intake?.attorneyConfirmDeadlineAt &&
    Date.now() >= new Date(intake.attorneyConfirmDeadlineAt).getTime();

  // Canonical intake state for consistent messaging (ClientPortal: post-submission flow)
  const canonicalIntakeState = intakeStatus
    ? resolveClientIntakeState({
        hasStarted: true,
        isSubmitted: isPending,
        isLocked: isConfirmed,
        tokenInvalidOrExpired: isExpired,
      })
    : null;

  return (
    <RoleGuard requiredRole="client" redirectTo="/">
      <div className="min-h-screen bg-rcms-white">
      {/* Attorney Confirmation Status Banner - Canonical state messaging */}
      {intakeStatus && canonicalIntakeState && (
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-6 py-3">
            {isConfirmed ? (
              // Confirmed state - MUST render when attorney_attested_at exists
              <Card className="bg-green-50 border-green-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-green-700 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-green-900 mb-2">
                        Attorney Confirmation Completed
                      </h3>
                      <p className="text-green-900 mb-1">
                        Your attorney confirmed your intake on {new Date(intake.attorneyAttestedAt!).toLocaleString()}.
                      </p>
                      <p className="text-green-900 font-medium">
                        You may now proceed.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : canonicalIntakeState === "SUBMITTED_PENDING_REVIEW" ? (
              <Alert variant="default" className="bg-amber-50 border-amber-200">
                <Clock className="h-4 w-4 text-amber-700" />
                <AlertDescription className="text-amber-900">
                  {CLIENT_INTAKE_STATE_MESSAGES.SUBMITTED_PENDING_REVIEW.body}
                  {intake?.attorneyConfirmDeadlineAt && (
                    <span className="block mt-2 text-sm">
                      If your attorney does not complete their review within 48 hours, intake will be deleted and must be restarted.
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : canonicalIntakeState === "EXPIRED_OR_INVALID" ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {CLIENT_INTAKE_STATE_MESSAGES.EXPIRED_OR_INVALID.body}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        </div>
      )}

      {/* SECTION 1 - HEADER BAR */}
      <header className="bg-rcms-navy border-b-4 border-rcms-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">
                <span className="text-white">Reconcile </span>
                <span className="text-rcms-orange">C.A.R.E.</span>
                <span className="text-white"> Client Portal</span>
              </h1>
              <p className="text-rcms-mint text-lg">
                Your care, communication, and progress in one place
              </p>
              {/* Case Selector */}
              {userCases.length > 0 && (
                <div className="mt-4 max-w-md">
                  <label className="text-sm font-medium text-white mb-2 block">
                    Select Case
                  </label>
                  <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent>
                      {userCases.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.client_label || `Case ${c.id.slice(0, 8)}`} - {c.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3 md:self-end md:mb-1">
              {/* Top Row: Notifications, Settings, Logout */}
              <div className="flex items-center gap-3 justify-end">
                <NotificationBell />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("settings")}
                  className="bg-white/10 text-white hover:bg-white hover:text-rcms-navy transition-all duration-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="bg-white/10 text-white hover:bg-white hover:text-rcms-navy transition-all duration-300"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
              
              {/* Primary Contact Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("communication")}
                  className="bg-rcms-gold text-black hover:bg-black hover:text-rcms-gold transition-all duration-300 border-rcms-gold"
                >
                  <Stethoscope className="w-4 h-4 mr-2" />
                  Contact RN CM
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("communication")}
                  className="bg-rcms-gold text-black hover:bg-black hover:text-rcms-gold transition-all duration-300 border-rcms-gold"
                >
                  <Briefcase className="w-4 h-4 mr-2" />
                  Message Attorney
                </Button>
              </div>
              
              {/* Report Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Dialog open={concernDialogOpen} onOpenChange={setConcernDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-rcms-mint text-black hover:bg-black hover:text-rcms-mint transition-all duration-300"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Report Concern
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <ReportConcernDialog 
                      caseId={caseId || ""} 
                      onSuccess={() => setConcernDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>

                <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      className="bg-rcms-coral text-white hover:bg-black hover:text-rcms-coral transition-all duration-300"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      File Complaint
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <FileComplaintForm onSuccess={() => setComplaintDialogOpen(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Care Team Contact Bar */}
      <CareTeamContactBar caseId={caseId || ""} />

      {/* Crisis Resources Banner */}
      <CrisisResourcesBanner showAlert={showCrisisAlert} />

      {/* Voice Concerns Banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <UserRound className="w-5 h-5 text-rcms-purple" />
                <Megaphone className="w-5 h-5 text-rcms-purple" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Have concerns about your provider care?</p>
                <p className="text-sm text-muted-foreground">
                  Your RN Care Manager is here to help. Share any issues confidentially.
                </p>
              </div>
            </div>
            <Dialog open={voiceConcernsOpen} onOpenChange={setVoiceConcernsOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="whitespace-nowrap">
                  <div className="flex items-center gap-1 mr-2">
                    <UserRound className="w-4 h-4 text-rcms-purple" />
                    <Megaphone className="w-4 h-4 text-rcms-purple" />
                  </div>
                  Voice Your Concerns
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                {caseId ? (
                  <VoiceConcernsForm caseId={caseId} />
                ) : (
                  <Alert>
                    <AlertDescription>
                      {NO_ACTIVE_CASE}
                    </AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* SECTION 2 - SNAPSHOT + TABS (navy→teal gradient) */}
      <section className="bg-gradient-navy-teal py-12">
        <div className="max-w-7xl mx-auto px-6 space-y-6">
          {/* Assessment Snapshot Explainer */}
          <AssessmentSnapshotExplainer 
            onUpdateSnapshot={() => setActiveTab("checkins")}
            onAskCara={() => {
              // Could trigger CARA modal here if implemented
              setActiveTab("communication");
            }}
          />
          
          {/* Wellness Snapshot */}
          <WellnessSnapshot 
            caseId={caseId || ""} 
            onViewProgress={() => setActiveTab("checkins")} 
          />
          
          {/* Baseline Progress Comparison */}
          <BaselineProgressComparison caseId={caseId || ""} />
          
          {/* Health Summary Chips */}
          <HealthSummaryChips caseId={caseId || ""} />

          {/* Progress Highlights */}
          <ProgressHighlights caseId={caseId || ""} />

          {/* Comprehensive Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto -mx-6 px-6 scrollbar-hide">
              <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-5 lg:grid-cols-10 bg-white border-2 border-rcms-gold shadow-lg">
                <TabsTrigger 
                  value="checkins"
                  className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
                >
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Wellness</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="journal"
                  className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
                >
                  <BookText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Journal</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="careplans"
                  className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Care Plans</span>
                </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Documents</span>
              </TabsTrigger>
              <TabsTrigger 
                value="timeline"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger 
                value="resources"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
              <TabsTrigger 
                value="goals"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">My Goals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="actions"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Action Items</span>
              </TabsTrigger>
              <TabsTrigger 
                value="appointments"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Clock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Appointments</span>
              </TabsTrigger>
              <TabsTrigger 
                value="providers"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
                onClick={() => navigate("/providers")}
              >
                <Building2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Providers</span>
              </TabsTrigger>
              <TabsTrigger 
                value="medications"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Medications</span>
              </TabsTrigger>
              <TabsTrigger 
                value="treatments"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Activity className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Treatments</span>
              </TabsTrigger>
              <TabsTrigger 
                value="allergies"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Allergies</span>
              </TabsTrigger>
              <TabsTrigger
                value="communication"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Communication</span>
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Quick Message</span>
              </TabsTrigger>
              <TabsTrigger
                value="intake-review"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">My Intake</span>
              </TabsTrigger>
              <TabsTrigger
                value="consent"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Consent</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-rcms-gold data-[state=active]:text-rcms-black hover:bg-rcms-gold/10 transition-all duration-300 whitespace-nowrap"
              >
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            </TabsList>
            </div>

            {/* Tab Content with white cards */}
            <div className="bg-white rounded-xl border-2 border-rcms-gold shadow-xl p-6">
              <TabsContent value="checkins" className="mt-0">
                <div className="space-y-4">
                  <div className="border-b-2 border-rcms-gold pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                      <ClipboardCheck className="w-6 h-6 text-rcms-teal" />
                      The Wellness Center
                    </h2>
                  </div>
                  <ClientCheckins />
                  <div className="mt-6 pt-6 border-t-2 border-rcms-gold">
                    <ClientJournal caseId={caseId || ""} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="careplans" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-rcms-teal" />
                    Care Plans
                  </h2>
                  <ClientCarePlanPrintButton caseId={caseId || ""} />
                </div>
                <CarePlansViewer caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="communication" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-rcms-teal" />
                    Messages / Communication Center
                  </h2>
                </div>
                <ClientMessaging caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-rcms-teal" />
                    Documents & Files
                  </h2>
                </div>
                <ClientDocuments caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-6 h-6 text-rcms-teal" />
                    Case Summary / Activity Timeline
                  </h2>
                </div>
                <CaseTimeline caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="resources" className="mt-0">
                <ResourceLibrary />
              </TabsContent>

              <TabsContent value="goals" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <ClipboardCheck className="w-6 h-6 text-rcms-teal" />
                    My Recovery Goals
                  </h2>
                </div>
                <ClientGoalTracker caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="actions" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-rcms-teal" />
                    My Action Items
                  </h2>
                </div>
                <ClientActionItems caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="appointments" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-6 h-6 text-rcms-teal" />
                    My Upcoming Appointments
                  </h2>
                </div>
                <ClientAppointmentCalendar caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="medications" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-rcms-teal" />
                    My Medications
                  </h2>
                </div>
                <ClientMedicationTracker caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="treatments" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-6 h-6 text-rcms-teal" />
                    My Treatments
                  </h2>
                </div>
                <ClientTreatmentTracker caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="allergies" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-rcms-teal" />
                    My Allergies
                  </h2>
                </div>
                <ClientAllergyTracker caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="messages" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-rcms-teal" />
                    Quick Message
                  </h2>
                </div>
                <ClientQuickMessage caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="journal" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <BookText className="w-6 h-6 text-rcms-teal" />
                    Personal Journal
                  </h2>
                </div>
                <ClientJournal caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="intake-review" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <FileText className="w-6 h-6 text-rcms-teal" />
                    My Intake Information
                  </h2>
                </div>
                <ClientIntakeReview caseId={caseId || ""} />
              </TabsContent>

              <TabsContent value="consent" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Shield className="w-6 h-6 text-rcms-teal" />
                    Privacy & Consent Management
                  </h2>
                </div>
                <div className="space-y-6">
                  <ClientConsentManagement caseId={caseId || ""} />
                  <ConsentDocumentViewer caseId={caseId || ""} showPrintButton={true} />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="flex items-center justify-between border-b-2 border-rcms-gold pb-4 mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Settings className="w-6 h-6 text-rcms-teal" />
                    Profile & Settings
                  </h2>
                </div>
                <ClientProfileSettings />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      {/* SECTION 3 - SUPPORT FOOTER (pale gold background) */}
      <section className="bg-rcms-pale-gold py-8">
        <div className="max-w-7xl mx-auto px-6">
          <SupportFooter />
        </div>
      </section>

      {/* SECTION 5 - FOOTER (deep navy) */}
      <footer className="bg-rcms-navy py-6 border-t-4 border-rcms-gold">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white text-sm">
            © 2025 Reconcile C.A.R.E. | Confidential & HIPAA Protected
          </p>
        </div>
      </footer>
    </div>
    </RoleGuard>
  );
}
