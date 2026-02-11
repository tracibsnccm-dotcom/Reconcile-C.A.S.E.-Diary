import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, UserPlus, CheckCircle } from "lucide-react";

export function RNActivityLog() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Log</CardTitle>
        <CardDescription>Your recent actions and system activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            {
              icon: FileText,
              action: "Created care plan",
              case: "Case RC-12345",
              time: "2 hours ago",
              type: "info",
            },
            {
              icon: MessageSquare,
              action: "Sent message to attorney",
              case: "Case RC-67890",
              time: "4 hours ago",
              type: "info",
            },
            {
              icon: CheckCircle,
              action: "Completed client check-in",
              case: "Case RC-34567",
              time: "5 hours ago",
              type: "success",
            },
            {
              icon: UserPlus,
              action: "Added new client medication",
              case: "Case RC-78901",
              time: "Yesterday at 3:45 PM",
              type: "info",
            },
            {
              icon: FileText,
              action: "Updated case notes",
              case: "Case RC-23456",
              time: "Yesterday at 2:15 PM",
              type: "info",
            },
          ].map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="p-2 rounded-lg bg-muted">
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{activity.action}</div>
                <div className="text-sm text-muted-foreground">{activity.case}</div>
              </div>
              <div className="text-sm text-muted-foreground">{activity.time}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
