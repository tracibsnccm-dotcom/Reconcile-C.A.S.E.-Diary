import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export function QuickStatsWidget() {
  const { cases } = useApp();

  const today = new Date().toDateString();
  const todayCases = cases.filter(
    (c) => new Date(c.createdAt || "").toDateString() === today
  ).length;

  const urgentCases = cases.filter((c) => c.status === "HOLD_SENSITIVE").length;
  const completedToday = cases.filter(
    (c) =>
      c.status === "CLOSED" &&
      new Date(c.updatedAt || "").toDateString() === today
  ).length;
  const activeCases = cases.filter(
    (c) => c.status === "IN_PROGRESS" || c.status === "ROUTED"
  ).length;

  const stats = [
    { label: "Today", value: todayCases, icon: FileText, color: "text-blue-600" },
    { label: "Urgent", value: urgentCases, icon: AlertTriangle, color: "text-red-600" },
    { label: "Active", value: activeCases, icon: Clock, color: "text-amber-600" },
    { label: "Completed", value: completedToday, icon: CheckCircle, color: "text-green-600" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
