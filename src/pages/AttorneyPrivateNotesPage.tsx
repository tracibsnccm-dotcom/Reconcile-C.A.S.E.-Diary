import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import AttorneyPrivateCaseNotes from "@/components/attorney/AttorneyPrivateCaseNotes";
import { ArrowLeft } from "lucide-react";

export default function AttorneyPrivateNotesPage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate("/attorney/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Private Case Notes</h1>
        <p className="text-sm text-muted-foreground mb-4">Attorney-only working notes. Stored locally on this device. Not visible to RN or client.</p>
        <AttorneyPrivateCaseNotes />
      </div>
    </AppLayout>
  );
}
