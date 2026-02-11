import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, AlertCircle, CheckCircle, Brain } from "lucide-react";

const predictions = [
  {
    caseId: "C-2024-1892",
    client: "Johnson, M.",
    predictedOutcome: "Settlement",
    confidence: 87,
    estimatedValue: "$45,000-$65,000",
    timeToResolution: "4-6 months",
    keyFactors: ["Clear liability", "Strong medical evidence", "Cooperative client"],
    risks: ["Pre-existing condition history"],
  },
  {
    caseId: "C-2024-1876",
    client: "Williams, R.",
    predictedOutcome: "Trial",
    confidence: 72,
    estimatedValue: "$80,000-$120,000",
    timeToResolution: "12-18 months",
    keyFactors: ["Significant damages", "Multiple defendants", "Expert testimony ready"],
    risks: ["Disputed liability", "Long treatment timeline"],
  },
  {
    caseId: "C-2024-1845",
    client: "Davis, K.",
    predictedOutcome: "Early Settlement",
    confidence: 91,
    estimatedValue: "$25,000-$35,000",
    timeToResolution: "2-3 months",
    keyFactors: ["Minor injuries", "Clear fault", "Quick recovery"],
    risks: ["Lower damages cap"],
  },
];

const historicalAccuracy = {
  totalPredictions: 156,
  correctOutcomes: 142,
  accuracy: 91,
  avgValueAccuracy: 88,
};

export function CaseOutcomePredictions() {
  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-primary/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI-Powered Case Predictions</h3>
            <p className="text-sm text-muted-foreground">
              Data-driven insights based on historical case outcomes and current factors
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <div className="text-sm text-muted-foreground">Historical Accuracy</div>
            <div className="text-2xl font-bold text-primary">{historicalAccuracy.accuracy}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Cases Analyzed</div>
            <div className="text-2xl font-bold">{historicalAccuracy.totalPredictions}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Correct Predictions</div>
            <div className="text-2xl font-bold text-green-600">{historicalAccuracy.correctOutcomes}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Value Accuracy</div>
            <div className="text-2xl font-bold">{historicalAccuracy.avgValueAccuracy}%</div>
          </div>
        </div>
      </Card>

      {/* Individual Case Predictions */}
      <div className="space-y-4">
        {predictions.map((pred, idx) => (
          <Card key={idx} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{pred.caseId}</h4>
                  <Badge variant="secondary">{pred.client}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{pred.predictedOutcome}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {pred.timeToResolution}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {pred.estimatedValue}
                </div>
                <div className="text-sm text-muted-foreground">Estimated Value</div>
              </div>
            </div>

            {/* Confidence Score */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Prediction Confidence</span>
                <span className="font-semibold">{pred.confidence}%</span>
              </div>
              <Progress value={pred.confidence} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Positive Factors */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Key Success Factors</span>
                </div>
                <ul className="space-y-1">
                  {pred.keyFactors.map((factor, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-green-600">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Factors */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>Risk Factors</span>
                </div>
                <ul className="space-y-1">
                  {pred.risks.map((risk, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-yellow-600">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* AI Recommendation */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Brain className="h-4 w-4 text-primary mt-0.5" />
                <div className="text-sm">
                  <span className="font-semibold">AI Recommendation: </span>
                  {pred.predictedOutcome === "Settlement" && (
                    <span className="text-muted-foreground">
                      Consider initiating settlement discussions within the next 30 days to maximize client value and minimize litigation costs.
                    </span>
                  )}
                  {pred.predictedOutcome === "Trial" && (
                    <span className="text-muted-foreground">
                      Prepare for trial while remaining open to high-value settlement offers. Focus on strengthening expert testimony.
                    </span>
                  )}
                  {pred.predictedOutcome === "Early Settlement" && (
                    <span className="text-muted-foreground">
                      Strong candidate for early resolution. Consider presenting demand letter within 2-3 weeks of completing initial medical treatment.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Model Information */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold mb-2">About These Predictions</p>
            <p>
              Our AI model analyzes historical case data, injury severity, liability factors, medical evidence, 
              jurisdiction patterns, and defendant behavior to generate predictions. While highly accurate, 
              these should be used as guidance alongside your professional judgment and case-specific factors.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
