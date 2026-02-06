// ClientPortal — uses sessionStorage (client_case_id, client_case_number, client_name) from login. No get-client-case call.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, MessageSquare } from "lucide-react";
import { CASE_BRAND } from "@/constants/brand";

export default function ClientPortal() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
    setReady(true);
  }, [navigate]);

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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white font-sans" style={WRAPPER_STYLE}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p>Loading your portal...</p>
        </div>
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
              <p className="text-xl font-bold font-mono text-black">{caseNumber ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Client Name</p>
              <p className="font-medium">{clientName ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="font-medium">Your case has been confirmed. Care plan generation in progress.</p>
            </div>
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
