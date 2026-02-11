import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ConcernConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConcernConfirmationModal({ open, onOpenChange }: ConcernConfirmationModalProps) {
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    onOpenChange(false);
    navigate("/client-portal");
  };

  const handleViewConcerns = () => {
    onOpenChange(false);
    // TODO: Navigate to concerns list view
    // For now, just close the modal
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader className="space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-foreground">
            Your concern has been submitted.
          </DialogTitle>
          <DialogDescription className="text-center text-foreground">
            Your concern has been submitted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={handleReturnToDashboard}
            className="w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground"
          >
            Return to Dashboard
          </Button>
          <Button
            onClick={handleViewConcerns}
            variant="outline"
            className="w-full"
          >
            View My Submitted Concerns
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
