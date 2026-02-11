import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";

interface CaseHealth {
  status: "excellent" | "good" | "fair" | "poor";
  score: number;
  trend: "up" | "down" | "stable";
  criticalCases: number;
  stableCases: number;
  improvingCases: number;
}

export function RNCaseHealthOverview() {
  // Mock data - replace with real data from Supabase
  const health: CaseHealth = {
    status: "good",
    score: 78,
    trend: "up",
    criticalCases: 2,
    stableCases: 15,
    improvingCases: 8,
  };

  const getTrendIcon = () => {
    switch (health.trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "stable":
        return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case "excellent":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "fair":
        return "text-yellow-600";
      case "poor":
        return "text-red-600";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Caseload Health Overview</CardTitle>
        <CardDescription className="text-xs">Overall status of your active cases</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-medium">Overall Health Score</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-2">What is the Health Score?</p>
                  <p className="text-sm mb-2">
                    This score measures the overall health and progress of your caseload based on multiple factors including:
                  </p>
                  <ul className="text-sm list-disc list-inside space-y-1 mb-2">
                    <li>Client compliance and engagement</li>
                    <li>Treatment plan adherence</li>
                    <li>Progress toward recovery goals</li>
                    <li>Documentation completeness</li>
                    <li>Timely follow-ups and assessments</li>
                  </ul>
                  <p className="text-sm font-semibold mt-2">What it means:</p>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    <li><span className="font-medium text-green-600">Excellent (90-100%):</span> Cases progressing well, minimal intervention needed</li>
                    <li><span className="font-medium text-blue-600">Good (75-89%):</span> Stable progress, routine monitoring sufficient</li>
                    <li><span className="font-medium text-yellow-600">Fair (60-74%):</span> Some concerns, increased attention needed</li>
                    <li><span className="font-medium text-red-600">Poor (&lt;60%):</span> Requires immediate intervention and review</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className={`text-xl font-bold ${getStatusColor()}`}>
                {health.score}%
              </span>
              {getTrendIcon()}
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <Progress value={health.score} className="h-1.5" />
          <p className={`text-xs capitalize ${getStatusColor()}`}>{health.status}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center">
            <p className="text-xl font-bold text-red-600">{health.criticalCases}</p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-blue-600">{health.stableCases}</p>
            <p className="text-[10px] text-muted-foreground">Stable</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-green-600">{health.improvingCases}</p>
            <p className="text-[10px] text-muted-foreground">Improving</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
