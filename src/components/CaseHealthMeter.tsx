import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CaseHealthMeterProps {
  status: string;
}

const stages = [
  { key: "NEW", label: "Intake", description: "Initial client intake and case creation" },
  { key: "AWAITING_CONSENT", label: "Clinical Review", description: "RN CM compiling provider reports and medical documentation" },
  { key: "IN_PROGRESS", label: "Reports", description: "Medical reports and assessments being gathered" },
  { key: "NEGOTIATION", label: "Negotiation", description: "Settlement negotiation in progress" },
  { key: "SETTLEMENT", label: "Settlement", description: "Settlement agreement reached" },
  { key: "CLOSED", label: "Closed", description: "Case fully resolved and closed" }
];

export function CaseHealthMeter({ status }: CaseHealthMeterProps) {
  const currentStageIndex = stages.findIndex(s => s.key === status);
  const progressPercentage = currentStageIndex >= 0 
    ? Math.round(((currentStageIndex + 1) / stages.length) * 100) 
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Case Health Meter</span>
        <span className="text-sm font-bold text-foreground">{progressPercentage}%</span>
      </div>
      
      <div className="relative">
        <Progress value={progressPercentage} className="h-3" />
        
        <div className="flex justify-between mt-2">
          <TooltipProvider>
            {stages.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isPending = index > currentStageIndex;

              return (
                <Tooltip key={stage.key}>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center">
                      <div 
                        className={`w-3 h-3 rounded-full border-2 transition-colors ${
                          isCompleted 
                            ? 'bg-[hsl(var(--navy))] border-[hsl(var(--navy))]' 
                            : isCurrent 
                            ? 'bg-[hsl(var(--gold))] border-[hsl(var(--gold))]' 
                            : 'bg-[#c7e8e3] border-[#c7e8e3]'
                        }`}
                      />
                      <span className={`text-xs mt-1 ${
                        isCurrent ? 'text-[hsl(var(--gold))] font-semibold' : 'text-muted-foreground'
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{stage.label}</p>
                    <p className="text-sm text-muted-foreground">{stage.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
