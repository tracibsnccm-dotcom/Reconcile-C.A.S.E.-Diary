import { Card } from "@/components/ui/card";
import { Clock, FileText, AlertCircle, UserCheck, Activity } from "lucide-react";

interface TimelineEvent {
  id: string;
  type: "case_created" | "checkin" | "plan_updated" | "concern" | "rn_followup";
  title: string;
  description: string;
  timestamp: string;
}

interface CaseTimelineProps {
  caseId: string;
}

export function CaseTimeline({ caseId }: CaseTimelineProps) {
  // Mock timeline events - in production, fetch from database
  const events: TimelineEvent[] = [
    {
      id: "1",
      type: "case_created",
      title: "Case Opened",
      description: "Your case was created and assigned to the care team",
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      type: "plan_updated",
      title: "Care Plan Updated",
      description: "RN care manager updated your preliminary care plan",
      timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      type: "checkin",
      title: "Check-in Submitted",
      description: "You submitted a wellness check-in",
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      type: "rn_followup",
      title: "RN Follow-up",
      description: "Care manager reviewed your progress and updated notes",
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      type: "concern",
      title: "Concern Logged",
      description: "You reported a care concern, now under review",
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const getIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "case_created":
        return <Activity className="w-4 h-4" />;
      case "checkin":
        return <UserCheck className="w-4 h-4" />;
      case "plan_updated":
        return <FileText className="w-4 h-4" />;
      case "concern":
        return <AlertCircle className="w-4 h-4" />;
      case "rn_followup":
        return <Clock className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="p-6 border-primary/20">
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-primary" />
        Case Activity Timeline
      </h2>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-primary/20"></div>

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Icon dot */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center z-10">
                {getIcon(event.type)}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
