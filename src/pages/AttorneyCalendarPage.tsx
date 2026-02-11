import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import AttorneyCalendar from "@/attorney/AttorneyCalendar";
import { ArrowLeft } from "lucide-react";

export default function AttorneyCalendarPage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate("/attorney/dashboard")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">Appointments</h1>
        <p className="text-muted-foreground mb-6">
          Read-only view of client-reported appointments and reminders. Not editable by attorney.
        </p>
        <AttorneyCalendar />
      </div>
    </AppLayout>
  );
}
