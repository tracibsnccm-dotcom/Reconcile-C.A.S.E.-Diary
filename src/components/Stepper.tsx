import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
  step: number;
  setStep: (step: number) => void;
  labels: string[];
}

export function Stepper({ step, setStep, labels }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {labels.map((label, idx) => (
          <div key={idx} className="flex items-center flex-1 last:flex-none">
            <button
              onClick={() => setStep(idx)}
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                idx === step
                  ? "bg-primary text-primary-foreground border-primary"
                  : idx < step
                  ? "bg-success text-success-foreground border-success"
                  : "bg-muted text-muted-foreground border-border"
              )}
              aria-label={`Step ${idx + 1}: ${label}`}
              aria-current={idx === step ? "step" : undefined}
            >
              {idx < step ? <Check className="w-5 h-5" /> : idx + 1}
            </button>
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden md:inline",
                idx === step ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {label}
            </span>
            {idx < labels.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2",
                  idx < step ? "bg-success" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
