import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, Calendar, AlertCircle } from "lucide-react";
import { differenceInDays } from "date-fns";

interface SOLDeadline {
  caseId: string;
  client: string;
  incidentDate: string;
  caseType: string;
  jurisdiction: string;
  solYears: number;
  deadlineDate: string;
  daysRemaining: number;
  riskLevel: "critical" | "warning" | "safe";
  tollingEvents: string[];
}

const mockDeadlines: SOLDeadline[] = [
  {
    caseId: "C-2024-1892",
    client: "Johnson, M.",
    incidentDate: "2023-03-15",
    caseType: "Personal Injury - Auto Accident",
    jurisdiction: "California",
    solYears: 2,
    deadlineDate: "2025-03-15",
    daysRemaining: 254,
    riskLevel: "safe",
    tollingEvents: [],
  },
  {
    caseId: "C-2024-1876",
    client: "Williams, R.",
    incidentDate: "2023-08-20",
    caseType: "Medical Malpractice",
    jurisdiction: "California",
    solYears: 1,
    deadlineDate: "2024-08-20",
    daysRemaining: 55,
    riskLevel: "warning",
    tollingEvents: ["Discovery rule applies - symptoms manifested 2024-01-10"],
  },
  {
    caseId: "C-2024-1845",
    client: "Davis, K.",
    incidentDate: "2022-11-05",
    caseType: "Workers Compensation",
    jurisdiction: "California",
    solYears: 1,
    deadlineDate: "2024-07-15",
    daysRemaining: 19,
    riskLevel: "critical",
    tollingEvents: [],
  },
];

export function StatutesOfLimitationsTracker() {
  const [deadlines, setDeadlines] = useState<SOLDeadline[]>(mockDeadlines);
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all");

  const filteredDeadlines = deadlines.filter(d => 
    filter === "all" || d.riskLevel === filter
  );

  const criticalCount = deadlines.filter(d => d.riskLevel === "critical").length;
  const warningCount = deadlines.filter(d => d.riskLevel === "warning").length;

  return (
    <div className="space-y-6">
      {/* Header Alert */}
      <Card className="p-6 bg-gradient-to-r from-red-500/10 to-transparent border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Statute of Limitations Tracking</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Critical risk management tool - Automatically tracks filing deadlines to prevent malpractice claims
            </p>
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 border-red-500/50 bg-red-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Critical</span>
                </div>
                <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                <div className="text-xs text-muted-foreground">Under 30 days</div>
              </Card>
              <Card className="p-4 border-yellow-500/50 bg-yellow-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Warning</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                <div className="text-xs text-muted-foreground">30-90 days</div>
              </Card>
              <Card className="p-4 border-green-500/50 bg-green-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Safe</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {deadlines.length - criticalCount - warningCount}
                </div>
                <div className="text-xs text-muted-foreground">Over 90 days</div>
              </Card>
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All Cases
        </Button>
        <Button
          variant={filter === "critical" ? "destructive" : "outline"}
          onClick={() => setFilter("critical")}
        >
          Critical Only
        </Button>
        <Button
          variant={filter === "warning" ? "outline" : "outline"}
          onClick={() => setFilter("warning")}
          className={filter === "warning" ? "bg-yellow-500/10 border-yellow-500/50" : ""}
        >
          Warnings
        </Button>
      </div>

      {/* Deadlines List */}
      <div className="space-y-3">
        {filteredDeadlines.map((deadline, idx) => (
          <Card
            key={idx}
            className={`p-6 ${
              deadline.riskLevel === "critical"
                ? "border-red-500/50 bg-red-500/5"
                : deadline.riskLevel === "warning"
                ? "border-yellow-500/50 bg-yellow-500/5"
                : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold">{deadline.caseId}</h4>
                  <Badge variant="secondary">{deadline.client}</Badge>
                  {deadline.riskLevel === "critical" && (
                    <Badge variant="destructive" className="animate-pulse">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      URGENT
                    </Badge>
                  )}
                  {deadline.riskLevel === "warning" && (
                    <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Attention Needed
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {deadline.caseType} • {deadline.jurisdiction}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  deadline.riskLevel === "critical" ? "text-red-600" :
                  deadline.riskLevel === "warning" ? "text-yellow-600" :
                  "text-green-600"
                }`}>
                  {deadline.daysRemaining}
                </div>
                <div className="text-sm text-muted-foreground">days remaining</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Incident Date</div>
                <div className="font-medium">{deadline.incidentDate}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">SOL Period</div>
                <div className="font-medium">{deadline.solYears} year(s)</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Filing Deadline</div>
                <div className="font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {deadline.deadlineDate}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Status</div>
                <div className="font-medium">
                  {deadline.daysRemaining > 90 ? "On Track" : 
                   deadline.daysRemaining > 30 ? "Monitor" : "FILE NOW"}
                </div>
              </div>
            </div>

            {deadline.tollingEvents.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium mb-2">Tolling Events:</div>
                {deadline.tollingEvents.map((event, i) => (
                  <div key={i} className="text-sm text-muted-foreground">• {event}</div>
                ))}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Add Tolling Event
              </Button>
              <Button size="sm" variant="outline">
                Set Alert
              </Button>
              {deadline.riskLevel === "critical" && (
                <Button size="sm" variant="destructive">
                  File Complaint Now
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-2">How SOL Tracking Works</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Automatically calculates filing deadlines based on incident date and jurisdiction</li>
              <li>• Multi-level alerts at 90, 60, and 30 days before deadline</li>
              <li>• Track tolling events that extend deadlines</li>
              <li>• Integration with court filing system for one-click complaint filing</li>
              <li>• Comprehensive audit trail for malpractice protection</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
