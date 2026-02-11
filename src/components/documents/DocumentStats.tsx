import { Card } from "@/components/ui/card";
import { FileText, Clock, Shield, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentStatsProps {
  totalDocuments: number;
  awaitingReview: number;
  sensitiveFiles: number;
  lastUpdated: string;
}

export function DocumentStats({
  totalDocuments,
  awaitingReview,
  sensitiveFiles,
  lastUpdated,
}: DocumentStatsProps) {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Total Documents
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>All documents uploaded across all cases</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-2xl font-bold text-foreground">{totalDocuments}</p>
            </div>
            <FileText className="w-8 h-8 text-[#b09837]" />
          </div>
        </Card>

        <Card className="p-4 border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Awaiting Review
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Documents pending review by staff</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-2xl font-bold text-amber-600">{awaitingReview}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </Card>

        <Card className="p-4 border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Sensitive Files
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Documents marked as sensitive/confidential</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-2xl font-bold text-red-600">{sensitiveFiles}</p>
            </div>
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4 border-border hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Last Updated
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Most recent document upload within the past 7 days</p>
                  </TooltipContent>
                </Tooltip>
              </p>
              <p className="text-lg font-semibold text-foreground">{lastUpdated}</p>
            </div>
            <FileText className="w-8 h-8 text-[#128f8b]" />
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
