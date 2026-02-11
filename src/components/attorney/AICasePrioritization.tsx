import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, TrendingUp, Zap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CasePriority {
  case_id: string;
  priority_score: number;
  priority_level: "critical" | "high" | "medium" | "low";
  reasons: string[];
  action_items: string[];
  deadline_risk: boolean;
}

export function AICasePrioritization({ cases }: { cases: any[] }) {
  const [priorities, setPriorities] = useState<CasePriority[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-case-prioritization", {
        body: { cases }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast({
            title: "Rate Limit Reached",
            description: "Too many requests. Please wait a moment and try again.",
            variant: "destructive"
          });
        } else if (data.error.includes("Payment required")) {
          toast({
            title: "AI Credits Needed",
            description: "Please add AI credits to your workspace to continue.",
            variant: "destructive"
          });
        }
        return;
      }

      setPriorities(data.priorities);
      toast({
        title: "Analysis Complete",
        description: `Prioritized ${data.priorities.length} cases`
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze cases. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case "critical": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-green-500/10 text-green-500 border-green-500/20";
    }
  };

  const getPriorityIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <Clock className="h-4 w-4" />;
      case "medium": return <TrendingUp className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Case Prioritization</h2>
          <p className="text-muted-foreground">Smart attention flagging powered by AI</p>
        </div>
        <Button onClick={analyzeCases} disabled={loading || cases.length === 0}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Analyze Cases
            </>
          )}
        </Button>
      </div>

      {priorities.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Click "Analyze Cases" to get AI-powered priority insights
          </p>
        </Card>
      )}

      <div className="grid gap-4">
        {priorities.map((priority) => {
          const caseInfo = cases.find(c => c.id === priority.case_id);
          return (
            <Card key={priority.case_id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">
                      Case #{caseInfo?.client_number || priority.case_id.slice(-8)}
                    </h3>
                    <Badge className={`${getPriorityColor(priority.priority_level)} border`}>
                      {getPriorityIcon(priority.priority_level)}
                      <span className="ml-1">{priority.priority_level.toUpperCase()}</span>
                    </Badge>
                    {priority.deadline_risk && (
                      <Badge variant="destructive" className="animate-pulse">
                        <Clock className="h-3 w-3 mr-1" />
                        Deadline Risk
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl font-bold">{priority.priority_score}</span>
                    <span className="text-sm text-muted-foreground">/ 10 urgency score</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Priority Reasons:</h4>
                  <ul className="space-y-1">
                    {priority.reasons.map((reason, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Recommended Actions:</h4>
                  <ul className="space-y-1">
                    {priority.action_items.map((action, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
