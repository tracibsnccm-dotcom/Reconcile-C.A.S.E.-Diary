// ClientPortal — sessionStorage client_case_id; public fetch for case data. (Ported from C.A.R.E. ClientPortalSimple, C.A.S.E. theme)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, Activity } from "lucide-react";
import { CASE_BRAND } from "@/constants/brand";
import { CANNOT_ACCESS_ACCOUNT } from "@/config/clientMessaging";

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
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
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

  async function loadCaseData(caseId: string) {
    try {
      setLoading(true);
      const { data, error: fetchError } = await publicSupabaseGet(
        "rc_cases",
        `select=id,case_number,case_status,case_type,date_of_injury,created_at,client_id&id=eq.${caseId}&is_superseded=eq.false&limit=1`
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

  const WRAPPER_CLASS = "min-h-screen bg-gradient-to-br from-[#3b6a9b] via-[#4a7fb0] to-[#6aa0cf] text-white font-sans";
  const CARD_CLASS = "bg-white rounded-lg shadow-lg p-6";

  if (loading) {
    return (
      <div className={`${WRAPPER_CLASS} flex items-center justify-center`}>
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
          <p>Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${WRAPPER_CLASS} flex items-center justify-center p-4`}>
        <Card className={`${CARD_CLASS} max-w-md w-full`}>
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/client-login")} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white w-full">
            Return to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={WRAPPER_CLASS}>
      <header className="border-b border-white/20 px-4 py-3 bg-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">{CASE_BRAND.diaryName}</h1>
            <p className="text-white/90 text-sm">
              Welcome{clientName ? `, ${clientName}` : ""} • Case: {caseNumber || "N/A"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-white/60 text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <Card className={CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-gray-900">Case Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-900">
            <div>
              <p className="text-gray-600 text-sm">Case Number</p>
              <p className="text-xl font-bold font-mono text-black">{caseData?.case_number || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="capitalize font-medium">{caseData?.case_status?.replace(/_/g, " ") || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Case Type</p>
              <p className="font-medium">{caseData?.case_type || "N/A"}</p>
            </div>
            {caseData?.date_of_injury && (
              <div>
                <p className="text-gray-600 text-sm">Date of Injury</p>
                <p className="font-medium">{new Date(caseData.date_of_injury).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              {CASE_BRAND.diaryName}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>Your diary entries and care plan will appear here.</p>
            <p className="text-gray-600 text-sm mt-2">
              After your attorney confirms your intake, you can log back in to view your care plan and track your recovery.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
