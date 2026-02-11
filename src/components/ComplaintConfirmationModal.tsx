import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ComplaintConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComplaintConfirmationModal({ open, onOpenChange }: ComplaintConfirmationModalProps) {
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    onOpenChange(false);
    navigate("/client-portal");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-foreground">
            Your anonymous complaint has been received.
          </DialogTitle>
          <DialogDescription className="text-center text-foreground">
            Your anonymous complaint has been received.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="mt-4 border-muted">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-sm text-foreground">
            <strong>Confidential Processing</strong>
            <br />
            No identifiable data is stored with your complaint. All complaints are reviewed and responded to within 15 days.
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          <Button
            onClick={handleReturnToDashboard}
            className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground"
          >
            Return to Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
