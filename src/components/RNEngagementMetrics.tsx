import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export function RNEngagementMetrics() {
  // Mock data - replace with real data from hooks
  const metrics = {
    surveysSent: 125,
    surveysCompleted: 108,
    responseRate: 86.4,
    targetRate: 90,
    pendingResponses: 17,
    thisWeekSent: 24,
    thisWeekCompleted: 22,
    weeklyResponseRate: 91.7,
    trend: "up", // "up" or "down"
    trendPercentage: 3.2
  };

  const getRateColor = (rate: number, target: number) => {
    if (rate >= target) return "text-green-600";
    if (rate >= target - 5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRateBgColor = (rate: number, target: number) => {
    if (rate >= target) return "bg-green-500";
    if (rate >= target - 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[#0f2a6a] flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Client Engagement Metrics
            </CardTitle>
            <CardDescription>Survey response tracking for supervisor review</CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">Supervisor View</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Response Rate */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Response Rate</span>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${getRateColor(metrics.responseRate, metrics.targetRate)}`}>
                {metrics.responseRate}%
              </span>
              {metrics.trend === "up" ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-xs ${metrics.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {metrics.trendPercentage}%
              </span>
            </div>
          </div>
          <Progress 
            value={metrics.responseRate} 
            className="h-3"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Target: {metrics.targetRate}%
            </span>
            <span className="text-xs text-muted-foreground">
              {metrics.surveysCompleted} of {metrics.surveysSent} surveys completed
            </span>
          </div>
        </div>

        {/* Alert if below target */}
        {metrics.responseRate < metrics.targetRate && (
          <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">
                Response rate below target
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {metrics.pendingResponses} surveys pending. Consider follow-up outreach.
              </p>
            </div>
          </div>
        )}

        {/* This Week Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{metrics.thisWeekSent}</div>
            <div className="text-xs text-muted-foreground mt-1">Sent This Week</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="text-2xl font-bold text-green-600">{metrics.thisWeekCompleted}</div>
            <div className="text-xs text-muted-foreground mt-1">Completed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">{metrics.weeklyResponseRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">Weekly Rate</div>
          </div>
        </div>

        {/* Pending Responses */}
        {metrics.pendingResponses > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Pending Responses</h4>
              <Badge variant="outline">{metrics.pendingResponses} cases</Badge>
            </div>
            <div className="space-y-2">
              {/* Mock pending items */}
              <div className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                <span>RCMS-2024-001 - Survey sent 3 days ago</span>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Send Reminder
                </Button>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-muted text-sm">
                <span>RCMS-2024-005 - Survey sent 5 days ago</span>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Send Reminder
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1">
            View All Surveys
          </Button>
          <Button className="flex-1">
            Send Bulk Reminder
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 rounded-lg bg-blue-50 border border-blue-200">
          <p className="font-medium text-blue-900 mb-1">Auto-Send Triggers:</p>
          <ul className="space-y-1 text-blue-700">
            <li>• 7 days after care plan approval</li>
            <li>• 30 days after case assignment</li>
            <li>• After significant care milestones</li>
            <li>• Monthly engagement surveys</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
