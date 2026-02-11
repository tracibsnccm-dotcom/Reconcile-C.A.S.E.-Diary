import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WizardNavProps {
  step: number;
  setStep: (step: number) => void;
  last: number;
  canAdvance?: boolean;
  blockReason?: string;
}

export function WizardNav({ step, setStep, last, canAdvance = true, blockReason }: WizardNavProps) {
  return (
    <div className="space-y-3 pt-4 border-t border-border">
      {blockReason && !canAdvance && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Cannot proceed:</strong> {blockReason}
          </AlertDescription>
        </Alert>
      )}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          aria-label="Go to previous step"
        >
          <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground" role="status" aria-live="polite">
          Step {step + 1} of {last + 1}
        </span>
        <Button
          onClick={() => setStep(Math.min(last, step + 1))}
          disabled={step === last || !canAdvance}
          aria-label={!canAdvance && blockReason ? `Cannot proceed: ${blockReason}` : 'Go to next step'}
        >
          Next
          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
