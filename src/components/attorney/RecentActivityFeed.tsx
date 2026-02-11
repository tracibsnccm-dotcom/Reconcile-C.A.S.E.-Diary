import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, UserPlus, CheckCircle, Calendar, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

interface Activity {
  id: string;
  type: "case_assigned" | "document_uploaded" | "message_sent" | "case_updated" | "appointment_scheduled" | "task_completed";
  title: string;
  description: string;
  timestamp: Date;
  caseId?: string;
  icon: React.ReactNode;
  color: string;
}

export default function RecentActivityFeed() {
  const { cases } = useApp();
  const navigate = useNavigate();

  // Generate recent activities from cases
  const activities: Activity[] = cases
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      type: "case_assigned" as const,
      title: "New Case Assigned",
      description: `${c.client?.rcmsId || c.id.slice(-8)} — ${c.client?.fullName || c.client?.displayNameMasked || "Unknown"}`,
      timestamp: new Date(c.createdAt),
      caseId: c.id,
      icon: <UserPlus className="h-4 w-4" />,
      color: "text-primary"
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 8);

  const getActivityIcon = (activity: Activity) => {
    const iconClass = `p-2 rounded-lg ${
      activity.type === "case_assigned" ? "bg-primary/10" :
      activity.type === "document_uploaded" ? "bg-blue-500/10" :
      activity.type === "message_sent" ? "bg-accent/10" :
      activity.type === "task_completed" ? "bg-success/10" :
      activity.type === "appointment_scheduled" ? "bg-warning/10" :
      "bg-muted"
    }`;

    return <div className={iconClass}>{activity.icon}</div>;
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.caseId) {
      navigate(`/case-detail/${activity.caseId}`);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Badge variant="secondary" className="text-xs">
          Last 24 hours
        </Badge>
      </div>

      {activities.length === 0 ? (
        <div className="flex items-center gap-2 py-4">
          <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground">No recent activity</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[200px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
              >
                {getActivityIcon(activity)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
