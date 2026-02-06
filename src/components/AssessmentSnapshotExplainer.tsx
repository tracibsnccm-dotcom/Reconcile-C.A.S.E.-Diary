import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Activity, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AssessmentSnapshotExplainerProps {
  onUpdateSnapshot?: () => void;
  onAskCara?: () => void;
  showUpdateButton?: boolean;
}

export const AssessmentSnapshotExplainer = ({ 
  onUpdateSnapshot, 
  onAskCara,
  showUpdateButton = true 
}: AssessmentSnapshotExplainerProps) => {
  return (
    <div className="border-2 border-primary/30 rounded-2xl bg-card shadow-lg p-6 my-6">
      <div className="flex items-start gap-3 mb-4">
        <Activity className="w-6 h-6 text-primary mt-1" />
        <div className="flex-1">
          <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">
            Assessment Snapshot — How to Use It
          </h3>
          <p className="text-base font-bold text-foreground mb-3">
            Your Snapshot summarizes your daily check-ins. Over time, these snapshots create a complete picture of your recovery journey — showing improvements, setbacks, and patterns that help you and your care team track progress.
          </p>
        </div>
      </div>

      <p className="text-black leading-relaxed mb-4">
        Each update captures how you're doing across your physical, emotional, social, and professional life. Over time, it forms a clear,
        date-stamped timeline of your progress and ongoing needs.
      </p>

      <div className="flex flex-wrap gap-4 mb-4">
        <TooltipProvider>
          <span className="flex items-center gap-1.5 text-sm">
            <strong>4Ps of Wellness</strong>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-primary cursor-help" aria-label="4Ps explanation" />
              </TooltipTrigger>
              <TooltipContent><p>Explanation coming soon</p></TooltipContent>
            </Tooltip>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <strong>SDOH</strong>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-primary cursor-help" aria-label="SDOH explanation" />
              </TooltipTrigger>
              <TooltipContent><p>Explanation coming soon</p></TooltipContent>
            </Tooltip>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <strong>Viability</strong>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-primary cursor-help" aria-label="Viability explanation" />
              </TooltipTrigger>
              <TooltipContent><p>Explanation coming soon</p></TooltipContent>
            </Tooltip>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <strong>Overall Health Indicator</strong>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-primary cursor-help" aria-label="Overall Health explanation" />
              </TooltipTrigger>
              <TooltipContent><p>Explanation coming soon</p></TooltipContent>
            </Tooltip>
          </span>
        </TooltipProvider>
      </div>

      <ul className="space-y-3 mb-4 ml-5">
        <li className="text-black">
          <strong className="text-foreground">Care Coordination:</strong> Your care plan and updates help identify patterns and support your recovery.
        </li>
        <li className="text-black">
          <strong className="text-foreground">Legal Advocacy:</strong> Your attorney uses your Snapshot as credible, time-stamped evidence to advocate for an advantageous settlement.
        </li>
        <li className="text-black">
          <strong className="text-foreground">You Stay in Control:</strong> You decide what to share — answer only what you're comfortable with.
        </li>
      </ul>

      <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 mb-4">
        <AlertDescription className="text-amber-900 dark:text-amber-100 font-semibold">
          Quick guide: aim for brief updates. Think of your Snapshot as your <em>progress tracker</em> and your <em>protection shield</em>.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap items-center gap-3">
        {showUpdateButton && onUpdateSnapshot && (
          <Button 
            onClick={onUpdateSnapshot}
            className="font-extrabold"
          >
            Update my Snapshot
          </Button>
        )}
        {onAskCara && (
          <Button 
            onClick={onAskCara}
            variant="outline"
            className="font-extrabold"
          >
            ✨ Ask CARA to help
          </Button>
        )}
        <Badge variant="outline" className="border-primary/30 text-primary font-extrabold px-3 py-1.5 text-sm rounded-full">
          📅 Daily check-in
        </Badge>
      </div>
    </div>
  );
};
