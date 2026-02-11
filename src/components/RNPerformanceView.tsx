import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

export function RNPerformanceView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics Overview</CardTitle>
          <CardDescription>Your case management performance for the current period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Notes ≤24h</div>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-3xl font-bold">94%</div>
              <div className="mt-2 h-2 rounded bg-muted">
                <div className="h-2 rounded bg-green-500" style={{ width: "94%" }} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Target: ≥ 90%</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Follow-Up Calls</div>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-3xl font-bold">91%</div>
              <div className="mt-2 h-2 rounded bg-muted">
                <div className="h-2 rounded bg-green-500" style={{ width: "91%" }} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Target: ≥ 90%</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Med Reconciliation</div>
                <TrendingDown className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold">87%</div>
              <div className="mt-2 h-2 rounded bg-muted">
                <div className="h-2 rounded bg-yellow-500" style={{ width: "87%" }} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Target: ≥ 90%</div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">Care Plans Current</div>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-3xl font-bold">96%</div>
              <div className="mt-2 h-2 rounded bg-muted">
                <div className="h-2 rounded bg-green-500" style={{ width: "96%" }} />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Target: ≥ 95%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Caseload Statistics</CardTitle>
          <CardDescription>Current active cases and capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Cases</span>
              <Badge variant="default">18 / 20</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">New Cases This Month</span>
              <Badge variant="secondary">5</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Closed Cases This Month</span>
              <Badge variant="secondary">3</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Case Duration</span>
              <Badge variant="secondary">42 days</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recognition & Achievements</CardTitle>
          <CardDescription>Recent milestones and commendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-0.5">⭐</Badge>
              <div>
                <div className="font-medium">100% On-Time Notes</div>
                <div className="text-muted-foreground">Achieved for 3 consecutive months</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="default" className="mt-0.5">🎯</Badge>
              <div>
                <div className="font-medium">Client Satisfaction</div>
                <div className="text-muted-foreground">98% positive feedback rating</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
