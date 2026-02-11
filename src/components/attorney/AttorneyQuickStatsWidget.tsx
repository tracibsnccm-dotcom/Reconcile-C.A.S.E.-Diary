import { Card } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { differenceInHours, isToday } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function AttorneyQuickStatsWidget() {
  const { cases } = useApp();
  const navigate = useNavigate();
  const now = new Date();

  // Cases assigned today
  const todayCases = cases.filter((c) => isToday(new Date(c.createdAt)));

  // Urgent tasks (cases pending 72+ hours)
  const urgentCases = cases.filter((c) => {
    const hoursOld = differenceInHours(now, new Date(c.createdAt));
    return hoursOld >= 72 && c.status === "NEW";
  });

  // Completed today (cases marked as closed today)
  const completedToday = cases.filter((c) => {
    return c.status === "CLOSED" && c.updatedAt && isToday(new Date(c.updatedAt));
  });

  // Active cases
  const activeCases = cases.filter((c) => 
    c.status !== "CLOSED"
  );

  const stats = [
    { label: "Assigned Today", value: todayCases.length, icon: <TrendingUp className="h-4 w-4" />, color: "text-primary", bgColor: "bg-primary/10", to: "/attorney/cases?filter=assigned_today" },
    { label: "Urgent Tasks", value: urgentCases.length, icon: <AlertTriangle className="h-4 w-4" />, color: "text-destructive", bgColor: "bg-destructive/10", to: "/attorney/cases?filter=urgent" },
    { label: "Active Cases", value: activeCases.length, icon: <Clock className="h-4 w-4" />, color: "text-warning", bgColor: "bg-warning/10", to: "/attorney/cases?filter=active" },
    { label: "Completed Today", value: completedToday.length, icon: <CheckCircle className="h-4 w-4" />, color: "text-success", bgColor: "bg-success/10", to: "/attorney/cases?filter=completed_today" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card
          key={index}
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={() => navigate(stat.to)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(stat.to); } }}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <span className={stat.color}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
