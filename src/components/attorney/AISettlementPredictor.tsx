import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, AlertCircle, Loader2, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SettlementPrediction {
  conservative_estimate: number;
  realistic_estimate: number;
  optimistic_estimate: number;
  confidence_level: "low" | "medium" | "high";
  key_factors: string[];
  risks?: string[];
  strengths?: string[];
  medical_costs_estimate?: number;
  pain_suffering_multiplier?: number;
  comparable_cases?: string;
}

export function AISettlementPredictor({ caseData }: { caseData: any }) {
  const [prediction, setPrediction] = useState<SettlementPrediction | null>(null);
  const [loading, setLoading] = useState(false);

  const predictSettlement = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-settlement-predictor", {
        body: { caseData }
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast({
            title: "Rate Limit Reached",
            description: "Too many requests. Please wait a moment.",
            variant: "destructive"
          });
        } else if (data.error.includes("Payment required")) {
          toast({
            title: "AI Credits Needed",
            description: "Please add AI credits to continue.",
            variant: "destructive"
          });
        }
        return;
      }

      setPrediction(data.prediction);
      toast({
        title: "Prediction Complete",
        description: "AI analysis generated settlement estimates"
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Prediction Failed",
        description: "Unable to generate prediction. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case "high": return "bg-green-500/10 text-green-500";
      case "medium": return "bg-yellow-500/10 text-yellow-500";
      default: return "bg-red-500/10 text-red-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Settlement Predictor</h2>
          <p className="text-muted-foreground">Data-driven settlement value estimates</p>
        </div>
        <Button onClick={predictSettlement} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Predict Value
            </>
          )}
        </Button>
      </div>

      {!prediction && !loading && (
        <Card className="p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Click "Predict Value" to get AI-powered settlement estimates
          </p>
        </Card>
      )}

      {prediction && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Conservative</div>
              <div className="text-3xl font-bold text-blue-500">
                {formatCurrency(prediction.conservative_estimate)}
              </div>
            </Card>
            <Card className="p-6 text-center border-2 border-primary">
              <div className="text-sm text-muted-foreground mb-2">Realistic</div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(prediction.realistic_estimate)}
              </div>
              <Badge className="mt-2">Recommended</Badge>
            </Card>
            <Card className="p-6 text-center">
              <div className="text-sm text-muted-foreground mb-2">Optimistic</div>
              <div className="text-3xl font-bold text-green-500">
                {formatCurrency(prediction.optimistic_estimate)}
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Confidence Level</h3>
                <Badge className={getConfidenceColor(prediction.confidence_level)}>
                  {prediction.confidence_level.toUpperCase()}
                </Badge>
              </div>
            </div>

            {prediction.medical_costs_estimate && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Estimated Medical Costs:</span>
                  <span className="font-semibold">{formatCurrency(prediction.medical_costs_estimate)}</span>
                </div>
                {prediction.pain_suffering_multiplier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pain & Suffering Multiplier:</span>
                    <span className="font-semibold">{prediction.pain_suffering_multiplier}x</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Key Value Factors:</h4>
                <ul className="space-y-1">
                  {prediction.key_factors.map((factor, idx) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {prediction.strengths && prediction.strengths.length > 0 && (
                <div className="bg-green-500/5 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Case Strengths:
                  </h4>
                  <ul className="space-y-1">
                    {prediction.strengths.map((strength, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-green-500">+</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.risks && prediction.risks.length > 0 && (
                <div className="bg-red-500/5 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Risk Factors:
                  </h4>
                  <ul className="space-y-1">
                    {prediction.risks.map((risk, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-red-500">−</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {prediction.comparable_cases && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">Comparable Cases:</h4>
                  <p className="text-sm">{prediction.comparable_cases}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
