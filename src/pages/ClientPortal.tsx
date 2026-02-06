// ClientPortal — uses sessionStorage (client_case_id, client_case_number, client_name) from login.
// Full tabbed portal with Wellness, Journal, Medications, Treatments, Appointments, Messages, Profile.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  LogOut,
  Activity,
  BookOpen,
  Pill,
  Stethoscope,
  Calendar,
  MessageSquare,
  User,
  Home,
} from "lucide-react";
import { CASE_BRAND } from "@/constants/brand";
import { CANNOT_ACCESS_ACCOUNT } from "@/config/clientMessaging";
import { ClientWellnessCheckin } from "@/components/ClientWellnessCheckin";
import { ClientJournal } from "@/components/ClientJournal";
import { ClientMedicationTracker } from "@/components/ClientMedicationTracker";
import { ClientTreatmentTracker } from "@/components/ClientTreatmentTracker";
import { ClientAppointments } from "@/components/ClientAppointments";
import { ClientMessaging } from "@/components/ClientMessaging";
import { ClientProfileSettings } from "@/components/ClientProfileSettings";

interface CaseData {
  id: string;
  case_number: string | null;
  case_status: string | null;
  case_type: string | null;
  date_of_injury: string | null;
  created_at: string;
  client_id?: string | null;
}

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
  if (!response.ok) return { data: null, error: new Error(`${response.status}`) };
  const data = await response.json();
  return { data, error: null };
}

export default function ClientPortal() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const WRAPPER_STYLE = {
    background: "linear-gradient(145deg, #3b6a9b 0%, #4a7fb0 40%, #5a90c0 70%, #6aa0cf 100%)",
  };
  const CARD_CLASS = "bg-white rounded-lg shadow-lg border border-slate-200";

  useEffect(() => {
    const storedCaseId = sessionStorage.getItem("client_case_id");
    const storedCaseNumber = sessionStorage.getItem("client_case_number");
    const storedClientName = sessionStorage.getItem("client_name");

    if (!storedCaseId) {
      navigate("/client-login", { replace: true });
      return;
    }

    setCaseId(storedCaseId);
    setCaseNumber(storedCaseNumber);
    setClientName(storedClientName);
    loadCaseData(storedCaseId);
  }, [navigate]);

  async function loadCaseData(caseIdParam: string) {
    try {
      setLoading(true);
      const { data, error: fetchError } = await publicSupabaseGet(
        'rc_cases',
        `select=id,case_number,case_status,case_type,date_of_injury,created_at,client_id&id=eq.${caseIdParam}&is_superseded=eq.false&limit=1`
      );
      if (fetchError) throw new Error(fetchError.message);
      const caseRecord = Array.isArray(data) ? data[0] : data;
      if (!caseRecord) throw new Error(CANNOT_ACCESS_ACCOUNT);
      setCaseData(caseRecord as CaseData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : CANNOT_ACCESS_ACCOUNT);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("client_case_id");
    sessionStorage.removeItem("client_case_number");
    sessionStorage.removeItem("client_name");
    navigate("/client-login", { replace: true });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-sans" style={WRAPPER_STYLE}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-sans" style={WRAPPER_STYLE}>
        <Alert variant="destructive" className="max-w-md bg-white">
          <AlertDescription>{error}</AlertDescription>
          <Button onClick={() => navigate("/client-login")} className="mt-4">Return to Login</Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans" style={WRAPPER_STYLE}>
      <header className="border-b border-white/20 px-4 py-3 bg-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{CASE_BRAND.diaryName}</h1>
            <p className="text-white/90 text-sm">
              Welcome{clientName ? `, ${clientName}` : ""} • Case: {caseNumber || "N/A"}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="border-white/60 text-white hover:bg-white/20">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-white/95 border border-slate-200 rounded-lg p-1 gap-1">
            <TabsTrigger value="home" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Home className="w-4 h-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="wellness" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" />
              Wellness
            </TabsTrigger>
            <TabsTrigger value="journal" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-2" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="medications" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Pill className="w-4 h-4 mr-2" />
              Medications
            </TabsTrigger>
            <TabsTrigger value="treatments" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Stethoscope className="w-4 h-4 mr-2" />
              Treatments
            </TabsTrigger>
            <TabsTrigger value="appointments" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Appts
            </TabsTrigger>
            <TabsTrigger value="messages" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-gray-700 data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-4">
            <Card className={CARD_CLASS}>
              <CardHeader>
                <CardTitle className="text-gray-900">Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-gray-700">
                <div>
                  <p className="text-gray-500 text-sm">Case Number</p>
                  <p className="text-orange-600 font-mono font-semibold">{caseData?.case_number || caseNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Status</p>
                  <p className="capitalize">{caseData?.case_status?.replace(/_/g, " ") || "Active"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Case Type</p>
                  <p>{caseData?.case_type || "N/A"}</p>
                </div>
                {caseData?.date_of_injury && (
                  <div>
                    <p className="text-gray-500 text-sm">Date of Injury</p>
                    <p>{new Date(caseData.date_of_injury).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className={CARD_CLASS}>
              <CardHeader>
                <CardTitle className="text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" className="h-20 flex flex-col border-slate-200 text-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 bg-white" onClick={() => setActiveTab("wellness")}>
                  <Activity className="w-6 h-6 mb-1" />
                  <span className="text-xs">Check-in</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col border-slate-200 text-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 bg-white" onClick={() => setActiveTab("journal")}>
                  <BookOpen className="w-6 h-6 mb-1" />
                  <span className="text-xs">Journal</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col border-slate-200 text-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 bg-white" onClick={() => setActiveTab("appointments")}>
                  <Calendar className="w-6 h-6 mb-1" />
                  <span className="text-xs">Appointments</span>
                </Button>
                <Button variant="outline" className="h-20 flex flex-col border-slate-200 text-gray-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 bg-white" onClick={() => setActiveTab("messages")}>
                  <MessageSquare className="w-6 h-6 mb-1" />
                  <span className="text-xs">Messages</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wellness">{caseId && <ClientWellnessCheckin caseId={caseId} />}</TabsContent>
          <TabsContent value="journal">{caseId && <ClientJournal caseId={caseId} />}</TabsContent>
          <TabsContent value="medications">{caseId && <ClientMedicationTracker caseId={caseId} />}</TabsContent>
          <TabsContent value="treatments">{caseId && <ClientTreatmentTracker caseId={caseId} />}</TabsContent>
          <TabsContent value="appointments">{caseId && <ClientAppointments caseId={caseId} />}</TabsContent>
          <TabsContent value="messages">{caseId && <ClientMessaging caseId={caseId} />}</TabsContent>
          <TabsContent value="profile">
            {caseId ? <ClientProfileSettings /> : <div className="text-center py-12 text-white/80">Loading...</div>}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
