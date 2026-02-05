import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface InactivityModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onSaveExit: () => void;
}

export function InactivityModal({ isOpen, onContinue, onSaveExit }: InactivityModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onContinue()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/10">
              <Clock className="w-6 h-6 text-warning" />
            </div>
            <div>
              <DialogTitle>Still there?</DialogTitle>
              <DialogDescription className="mt-1">
                We've noticed you've been inactive for a while
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We're automatically saving your progress. You can continue now or come back 
            within the next <strong>7 days</strong> to resume where you left off.
          </p>

          <div className="flex gap-3">
            <Button onClick={onContinue} className="flex-1">
              Continue
            </Button>
            <Button variant="outline" onClick={onSaveExit} className="flex-1">
              Save & Exit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
