import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Clock } from "lucide-react";

export function RNCaseloadAtAGlance() {
  // Mock data - replace with real data from hooks
  const caseloadStats = {
    totalActive: 18,
    critical: 2,
    atRisk: 5,
    stable: 11,
    avgTimePerCase: 2.3,
    nearingReview: 4
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#0f2a6a]">Caseload At-a-Glance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Total Active Cases */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="text-sm text-muted-foreground mb-1">Total Active</div>
            <div className="text-3xl font-bold text-[#0f2a6a]">{caseloadStats.totalActive}</div>
            <div className="text-xs text-muted-foreground">cases</div>
          </div>

          {/* Critical Cases */}
          <div className="p-4 rounded-lg border bg-red-50 border-red-200">
            <div className="flex items-center gap-1 text-sm text-red-700 mb-1">
              <AlertTriangle className="h-3 w-3" />
              Critical
            </div>
            <div className="text-3xl font-bold text-red-600">{caseloadStats.critical}</div>
            <div className="text-xs text-red-600">needs immediate attention</div>
          </div>

          {/* At Risk Cases */}
          <div className="p-4 rounded-lg border bg-yellow-50 border-yellow-200">
            <div className="text-sm text-yellow-700 mb-1">At Risk</div>
            <div className="text-3xl font-bold text-yellow-600">{caseloadStats.atRisk}</div>
            <div className="text-xs text-yellow-600">requires monitoring</div>
          </div>

          {/* Stable Cases */}
          <div className="p-4 rounded-lg border bg-green-50 border-green-200">
            <div className="text-sm text-green-700 mb-1">Stable</div>
            <div className="text-3xl font-bold text-green-600">{caseloadStats.stable}</div>
            <div className="text-xs text-green-600">on track</div>
          </div>

          {/* Average Time Per Case */}
          <div className="p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Avg. Time/Case
            </div>
            <div className="text-3xl font-bold text-[#128f8b]">{caseloadStats.avgTimePerCase}h</div>
            <div className="text-xs text-muted-foreground">this week</div>
          </div>

          {/* Nearing Review */}
          <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-1 text-sm text-blue-700 mb-1">
              <TrendingUp className="h-3 w-3" />
              Nearing Review
            </div>
            <div className="text-3xl font-bold text-blue-600">{caseloadStats.nearingReview}</div>
            <div className="text-xs text-blue-600">within 7 days</div>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <Badge variant="secondary" className="mt-0.5">Insight</Badge>
            <p className="text-muted-foreground">
              Your critical cases are 11% of total caseload, slightly above the target of 10%.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Badge variant="secondary" className="mt-0.5">Tip</Badge>
            <p className="text-muted-foreground">
              {caseloadStats.nearingReview} care plans need review this week - schedule time today.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
