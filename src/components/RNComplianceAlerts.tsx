import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Clock, FileText } from "lucide-react";
import { format, addDays } from "date-fns";

export function RNComplianceAlerts() {
  // Mock data - replace with real data from hooks
  const alerts = [
    {
      id: "1",
      type: "license",
      title: "RN License Renewal Due",
      description: "Your nursing license expires in 45 days",
      dueDate: addDays(new Date(), 45),
      priority: "medium",
      status: "pending"
    },
    {
      id: "2",
      type: "training",
      title: "HIPAA Annual Training",
      description: "Required compliance training must be completed",
      dueDate: addDays(new Date(), 14),
      priority: "high",
      status: "overdue"
    },
    {
      id: "3",
      type: "ceu",
      title: "CEU Hours for License Renewal",
      description: "15 of 30 required hours completed",
      dueDate: addDays(new Date(), 90),
      priority: "medium",
      status: "in_progress"
    },
    {
      id: "4",
      type: "audit",
      title: "Quality Audit Scheduled",
      description: "Case documentation review on Jan 30",
      dueDate: new Date("2024-01-30"),
      priority: "high",
      status: "pending"
    },
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const activeAlerts = alerts.filter(a => a.status !== "completed");
  const highPriorityCount = activeAlerts.filter(a => a.priority === "high").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#0f2a6a]">Compliance Center</CardTitle>
          {highPriorityCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {highPriorityCount} Urgent
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                alert.status === "overdue" ? "bg-red-50 border-red-200" : "bg-card"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-2">
                  {getStatusIcon(alert.status)}
                  <div>
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
                {getPriorityBadge(alert.priority)}
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Due:</span>{" "}
                  {format(alert.dueDate, "MMM d, yyyy")}
                </div>
                <Button size="sm" variant="outline">
                  Take Action
                </Button>
              </div>
            </div>
          ))}
        </div>

        {activeAlerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-muted-foreground">All compliance requirements up to date!</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <Button variant="ghost" className="w-full text-sm">
            View All Compliance Items →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
