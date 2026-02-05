import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export function RestrictedBanner() {
  return (
    <Alert variant="destructive" className="mb-4">
      <ShieldAlert className="h-4 w-4" />
      <AlertDescription>
        <strong>Restricted Access:</strong> This case is marked as sensitive. Access is limited to
        designated personnel only.
      </AlertDescription>
    </Alert>
  );
}
