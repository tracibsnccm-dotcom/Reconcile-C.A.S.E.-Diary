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
      {/* Desktop: two-row grid (4 cols), centered, wider boxes */}
      <div className="hidden sm:flex flex-col items-center gap-4">
        {/* Row 1: Demographics, Incident/Injury, Post-Injury, Pre-Injury */}
        <div className="flex flex-wrap justify-center gap-3">
          {labels.slice(0, 4).map((label, idx) => (
            <StepBox
              key={idx}
              idx={idx}
              label={label}
              step={step}
              setStep={setStep}
            />
          ))}
        </div>
        {/* Row 2: Mental Health, 4Ps, SDOH, Review */}
        <div className="flex flex-wrap justify-center gap-3">
          {labels.slice(4, 8).map((label, i) => {
            const idx = i + 4;
            return (
              <StepBox
                key={idx}
                idx={idx}
                label={label}
                step={step}
                setStep={setStep}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile: simplified progress indicator + stacked/compact step list */}
      <div className="sm:hidden space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1" role="status" aria-live="polite">
          <span className="text-base font-medium text-black">
            Step {step + 1} of {labels.length}
          </span>
          <span className="text-base text-muted-foreground">
            — {labels[step]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {labels.map((label, idx) => (
            <StepBox
              key={idx}
              idx={idx}
              label={label}
              step={step}
              setStep={setStep}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StepBoxProps {
  idx: number;
  label: string;
  step: number;
  setStep: (step: number) => void;
  compact?: boolean;
}

function StepBox({ idx, label, step, setStep, compact }: StepBoxProps) {
  const isActive = idx === step;
  const isComplete = idx < step;

  return (
    <button
      type="button"
      onClick={() => setStep(idx)}
      className={cn(
        "flex items-center gap-2 rounded-lg border-2 transition-all text-left",
        "min-w-[120px] px-4 py-2",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        compact ? "min-w-0 w-full" : "min-w-[200px] w-[200px]",
        isActive &&
          "bg-primary text-white border-primary shadow-md",
        isComplete && !isActive && "bg-success/10 text-gray-700 border-success",
        !isActive && !isComplete && "bg-muted/50 text-gray-700 border-border hover:border-primary/50"
      )}
      aria-label={`Step ${idx + 1}: ${label}`}
      aria-current={isActive ? "step" : undefined}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center w-8 h-8 rounded-full border-2 text-base font-semibold",
          isActive && "bg-white text-primary border-white",
          isComplete && !isActive && "bg-success text-success-foreground border-success",
          !isActive && !isComplete && "bg-muted border-border"
        )}
      >
        {isComplete ? <Check className="w-5 h-5" aria-hidden="true" /> : idx + 1}
      </span>
      <span className={cn(
        "font-medium text-base line-clamp-2 break-normal",
        isActive && "text-white"
      )}>
        {label}
      </span>
    </button>
  );
}
