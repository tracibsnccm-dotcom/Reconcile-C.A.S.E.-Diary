import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import AttorneyRNClinicalCoordination from "@/attorney/AttorneyRNClinicalCoordination";
import { ArrowLeft } from "lucide-react";

export default function AttorneyRNCoordinationPage() {
  const navigate = useNavigate();
  return (
    <AppLayout>
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate("/attorney/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-foreground mb-2">RN Clinical Coordination</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Read-only view of RN care coordination once released. Draft RN work is not visible to attorneys.
        </p>
        <AttorneyRNClinicalCoordination />
      </div>
    </AppLayout>
  );
}
