import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  LogOut, 
  Activity, 
  BookOpen, 
  Pill, 
  Stethoscope, 
  Calendar, 
  MessageSquare, 
  User,
  FileText,
  Home,
  ClipboardList
} from "lucide-react";
import { isUnableToReach, isParticipationUndetermined } from "@/lib/tenVsHelpers";
import { PARTICIPATION_COPY } from "@/constants/participationMessaging";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { ensureClientBindingForCase } from "@/lib/clientCaseBinding";
import { CANNOT_ACCESS_ACCOUNT } from "@/config/clientMessaging";
import { ClientStatusSummary } from "@/components/client/ClientStatusSummary";

// Import C.A.S.E. components
import { ClientJournal } from "@/components/ClientJournal";
import { ClientMedicationTracker } from "@/components/ClientMedicationTracker";
import { ClientTreatmentTracker } from "@/components/ClientTreatmentTracker";
import { ClientMessages } from "@/components/ClientMessages";
import { ClientProfile } from "@/components/ClientProfile";
import { ConsentDocumentViewer } from "@/components/ConsentDocumentViewer";
import { ClientCarePlanPrintButton } from "@/components/ClientCarePlanPrintButton";
import { ClientWellnessCheckin } from "@/components/ClientWellnessCheckin";
import { ClientAppointments } from "@/components/ClientAppointments";
import { ClientHealthAnalytics } from "@/components/ClientHealthAnalytics";

interface CaseData {
  id: string;
  case_number: string | null;
  case_status: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  created_at: string;
  client_id?: string | null;
}

// Public fetch for case data
async function publicSupabaseGet(table: string, query: string) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return { data: null, error: new Error("Supabase not configured") };
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?${query}`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!response.ok) {
    return { data: null, error: new Error(`${response.status}`) };
  }
  
  const data = await response.json();
  return { data, error: null };
}

// Document link component
function DocumentLink({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 bg-white border border-slate-200 hover:bg-blue-50 rounded-lg transition-colors group shadow-sm"
    >
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-amber-500 group-hover:text-amber-400" />
        <div>
          <p className="text-slate-800 font-medium">{title}</p>
          <p className="text-slate-500 text-sm">{description}</p>
        </div>
      </div>
    </button>
  );
}

export default function ClientPortalSimple() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");
  const [showConsentViewer, setShowConsentViewer] = useState(false);
  const [unableToReachCarePlan, setUnableToReachCarePlan] = useState(false);

  useEffect(() => {
    const storedCaseId = sessionStorage.getItem('client_case_id');
    const storedCaseNumber = sessionStorage.getItem('client_case_number');
    const storedClientName = sessionStorage.getItem('client_name');

    if (!storedCaseId) {
      navigate('/client-login', { replace: true });
      return;
    }

    setCaseId(storedCaseId);
    setCaseNumber(storedCaseNumber);
    setClientName(storedClientName);
    loadCaseData(storedCaseId);
  }, [navigate]);

  async function loadClientNameFromProfile(caseId: string) {
    try {
      const { data: caseRow } = await publicSupabaseGet(
        'rc_cases',
        `id=eq.${caseId}&is_superseded=eq.false&select=client_id&limit=1`
      );
      const row = Array.isArray(caseRow) ? caseRow?.[0] : caseRow;
      let cid = (row as { client_id?: string })?.client_id;
      if (!cid) {
        const { clientId } = await ensureClientBindingForCase(supabase, caseId);
        cid = clientId;
      }
      if (!cid) return;
      const { data: c } = await publicSupabaseGet(
        'rc_clients',
        `id=eq.${cid}&select=first_name,last_name&limit=1`
      );
      const client = Array.isArray(c) ? c?.[0] : c;
      const fn = (client as { first_name?: string })?.first_name;
      const ln = (client as { last_name?: string })?.last_name;
      if (fn || ln) {
        const name = [fn, ln].filter(Boolean).join(' ').trim() || null;
        if (name) setClientName(name);
      }
    } catch (_) {
      // Keep existing sessionStorage-derived clientName on failure
    }
  }

  async function loadCaseData(caseId: string) {
    try {
      setLoading(true);
      const { data, error: fetchError } = await publicSupabaseGet(
        'rc_cases',
        `select=id,case_number,case_status,case_type,date_of_injury,created_at,client_id&id=eq.${caseId}&is_superseded=eq.false&limit=1`
      );

      if (fetchError) throw new Error(fetchError.message);
      
      const caseRecord = Array.isArray(data) ? data[0] : data;
      if (!caseRecord) throw new Error(CANNOT_ACCESS_ACCOUNT);

      setCaseData(caseRecord as CaseData);
      await loadClientNameFromProfile(caseId);
    } catch (err: any) {
      setError(err.message || CANNOT_ACCESS_ACCOUNT);
    } finally {
      setLoading(false);
    }
  }

  // Load 10-Vs draft from storage to detect "Unable to reach" for client care plan banner (D-7).
  // Hardened: fetch/parse errors or null draft → unableToReach=false, no banner, no crash.
  useEffect(() => {
    if (!caseId || !supabase || !isSupabaseConfigured()) return;
    (async () => {
      try {
        const { data, error } = await supabase.storage.from('rcms-documents').download(`care-plan-drafts/${caseId}.json`);
        if (error || !data) {
          setUnableToReachCarePlan(false);
          return;
        }
        const text = await data.text();
        let draft: unknown = null;
        try {
          draft = JSON.parse(text);
        } catch {
          setUnableToReachCarePlan(false);
          return;
        }
        if (draft == null) {
          setUnableToReachCarePlan(false);
          return;
        }
        setUnableToReachCarePlan(isParticipationUndetermined(draft) || isUnableToReach(draft));
      } catch {
        setUnableToReachCarePlan(false);
      }
    })();
  }, [caseId]);

  function handleLogout() {
    sessionStorage.removeItem('client_case_id');
    sessionStorage.removeItem('client_case_number');
    sessionStorage.removeItem('client_name');
    navigate('/client-login', { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-white">
        <div className="text-center text-slate-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p>Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-white p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => navigate('/client-login')} className="mt-4">
            Return to Login
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-white">
      {/* Header */}
      <header className="bg-white/80 border-b border-slate-200 shadow-sm px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-amber-500">C.A.S.E. Portal</h1>
            <p className="text-slate-600 text-sm">
              Welcome{clientName ? `, ${clientName}` : ''} • Case: {caseNumber || 'N/A'}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="text-slate-600 border-slate-300 hover:bg-slate-100">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-white border-b border-slate-200 p-1 gap-1 scrollbar-hide">
            <TabsTrigger value="home" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Home className="w-4 h-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="wellness" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Wellness
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="journal" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="medications" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Pill className="w-4 h-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="treatments" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Stethoscope className="w-4 h-4 mr-2" />
              Treatments
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Appts
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Docs
            </TabsTrigger>
            <TabsTrigger value="careplan" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <ClipboardList className="w-4 h-4 mr-2" />
              Care Plan
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-slate-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Home Tab */}
          <TabsContent value="home" className="space-y-4">
            <ClientStatusSummary caseStatus={caseData?.case_status ?? null} />
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-slate-600">
                <div>
                  <p className="text-slate-500 text-sm">Case Number</p>
                  <p className="text-amber-500 font-mono">{caseData?.case_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Status</p>
                  <p className="capitalize">{caseData?.case_status?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Case Type</p>
                  <p>{caseData?.case_type || 'N/A'}</p>
                </div>
                {caseData?.date_of_injury && (
                  <div>
                    <p className="text-slate-500 text-sm">Date of Injury</p>
                    <p>{new Date(caseData.date_of_injury).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-200 text-slate-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 bg-white"
                  onClick={() => setActiveTab("wellness")}
                >
                  <Activity className="w-6 h-6 mb-1" />
                  <span className="text-xs">Check-in</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-200 text-slate-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 bg-white"
                  onClick={() => setActiveTab("journal")}
                >
                  <BookOpen className="w-6 h-6 mb-1" />
                  <span className="text-xs">Journal</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-200 text-slate-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 bg-white"
                  onClick={() => setActiveTab("appointments")}
                >
                  <Calendar className="w-6 h-6 mb-1" />
                  <span className="text-xs">Appointments</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center border-slate-200 text-slate-600 hover:bg-amber-500 hover:text-white hover:border-amber-500 bg-white"
                  onClick={() => setActiveTab("messages")}
                >
                  <MessageSquare className="w-6 h-6 mb-1" />
                  <span className="text-xs">Messages</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Wellness Tab */}
          <TabsContent value="wellness">
            {caseId && <ClientWellnessCheckin caseId={caseId} />}
          </TabsContent>

          {/* Health Analytics Tab */}
          <TabsContent value="analytics">
            {caseId && <ClientHealthAnalytics caseId={caseId} />}
          </TabsContent>

          {/* Journal Tab */}
          <TabsContent value="journal">
            {caseId && <ClientJournal caseId={caseId} />}
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            {caseId && <ClientMedicationTracker caseId={caseId} />}
          </TabsContent>

          {/* Treatments Tab */}
          <TabsContent value="treatments">
            {caseId && <ClientTreatmentTracker caseId={caseId} />}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments">
            {caseId && <ClientAppointments caseId={caseId} />}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            {caseId && <ClientMessages caseId={caseId} />}
          </TabsContent>

          {/* Care Plan Tab */}
          <TabsContent value="careplan" className="space-y-4">
            {unableToReachCarePlan && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTitle className="text-amber-900">Action Needed: Review Your Care Plan</AlertTitle>
                <AlertDescription>
                  <p className="text-amber-800 text-sm mb-3">
                    {PARTICIPATION_COPY.unable_to_determine.clientBanner}
                  </p>
                  <Button
                    onClick={() => setActiveTab("messages")}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {PARTICIPATION_COPY.unable_to_determine.clientCtaLabel}
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-slate-800 flex items-center gap-2 mb-3">
                      <ClipboardList className="w-5 h-5 text-amber-500" />
                      Care Plan
                    </CardTitle>
                    <p className="text-slate-500 text-sm">
                      {unableToReachCarePlan
                        ? "Please message your RN Care Manager to review and update your plan."
                        : "Your care plan is developed by your RN Care Manager. Review your Documents for consent forms and other materials."}
                    </p>
                  </div>
                  <ClientCarePlanPrintButton caseId={caseId || ""} />
                </div>
              </CardHeader>
              <CardContent className="text-slate-600">
                <p className="text-sm">
                  Care plan details are shared by your RN Care Manager through the portal and documents. Use the Messages tab to communicate with your care team.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  My Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                <div className="space-y-3">
                  <p className="text-slate-500 text-sm mb-4">Click on a document to view and print.</p>
                  
                  {/* Document List */}
                  <div className="space-y-2">
                    <DocumentLink 
                      title="Signed Consent Documents" 
                      description="Service Agreement, HIPAA Authorization, and other consent forms"
                      onClick={() => setShowConsentViewer(true)}
                    />
                  </div>
                </div>
                
                {/* Consent Viewer Modal */}
                {showConsentViewer && caseId && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                      <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-slate-800">Signed Consent Documents</h3>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowConsentViewer(false)}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          ✕ Close
                        </Button>
                      </div>
                      <div className="p-4">
                        <ConsentDocumentViewer caseId={caseId} showPrintButton={true} />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab — render only when caseId is bound; otherwise loading state */}
          <TabsContent value="profile">
            {!caseId ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center text-slate-600">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
                  <p>Loading case context…</p>
                </div>
              </div>
            ) : (
              <ClientProfile
                caseId={caseId}
                onProfileSaved={() => loadClientNameFromProfile(caseId)}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
