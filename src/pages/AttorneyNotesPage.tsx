import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import AttorneyCaseNotes from "@/components/attorney/AttorneyCaseNotes";
import { ArrowLeft } from "lucide-react";

export default function AttorneyNotesPage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate("/attorney/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Case Notes</h1>
        <AttorneyCaseNotes />
      </div>
    </AppLayout>
  );
}
