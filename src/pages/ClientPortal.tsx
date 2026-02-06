// ClientPortal — sessionStorage client_case_id, client_case_number; get-client-case Edge Function for case data. (Ported from C.A.R.E., C.A.S.E. theme)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogOut, BookOpen, MessageSquare } from "lucide-react";
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

async function fetchClientCase(caseId: string, caseNumber: string): Promise<CaseData> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-client-case`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ case_id: caseId, case_number: caseNumber }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Request failed (${res.status})`);
  }
  return res.json();
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

    if (!storedCaseId || !storedCaseNumber) {
      navigate("/client-login", { replace: true });
      return;
    }

    setCaseId(storedCaseId);
    setCaseNumber(storedCaseNumber);
    setClientName(storedClientName);
    loadCaseData(storedCaseId, storedCaseNumber);
  }, [navigate]);

  async function loadCaseData(caseId: string, caseNumber: string) {
    try {
      setLoading(true);
      const caseRecord = await fetchClientCase(caseId, caseNumber);
      setCaseData(caseRecord);
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

  const WRAPPER_STYLE = {
    background: "linear-gradient(145deg, #3b6a9b 0%, #4a7fb0 40%, #5a90c0 70%, #6aa0cf 100%)",
  };
  const CARD_CLASS = "bg-white rounded-lg shadow-lg p-6";

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
    <div className="min-h-screen text-white font-sans" style={WRAPPER_STYLE}>
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
              <BookOpen className="w-5 h-5 text-orange-500" />
              Diary entries
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p className="text-gray-600">Your diary entries will appear here as you add them.</p>
            <p className="text-gray-500 text-sm mt-2">Use your C.A.S.E. Diary to document your recovery and care plan progress.</p>
          </CardContent>
        </Card>

        <Card className={CARD_CLASS}>
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              Messages
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p className="text-gray-600">Messages from your care team will appear here.</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
