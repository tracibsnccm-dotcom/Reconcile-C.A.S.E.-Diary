import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export function RNCommunicationPriority() {
  // Mock data - replace with real data from hooks
  const communications = [
    {
      id: "1",
      type: "message",
      from: "Attorney Johnson",
      subject: "Urgent: Authorization needed for Sarah M.",
      priority: "high",
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
      caseId: "RCMS-2024-001",
      unread: true
    },
    {
      id: "2",
      type: "callback",
      from: "Client: John D.",
      subject: "Medication side effects concern",
      priority: "high",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      caseId: "RCMS-2024-002",
      unread: true
    },
    {
      id: "3",
      type: "message",
      from: "Dr. Smith's Office",
      subject: "Care plan update available",
      priority: "medium",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      caseId: "RCMS-2024-003",
      unread: false
    },
    {
      id: "4",
      type: "lastContact",
      from: "Client: Maria G.",
      subject: "No contact in 8 days",
      priority: "medium",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
      caseId: "RCMS-2024-004",
      unread: false
    },
  ];

  const getTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4" />;
      case "callback":
        return <Phone className="h-4 w-4" />;
      case "lastContact":
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[#0f2a6a]">Communication Priority Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {communications.map((comm) => (
            <div
              key={comm.id}
              className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                comm.unread ? "bg-blue-50 border-blue-200" : "bg-card"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getIcon(comm.type)}
                  <div>
                    <div className="font-semibold text-sm">{comm.from}</div>
                    <div className="text-xs text-muted-foreground">{comm.caseId}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {getPriorityBadge(comm.priority)}
                  {comm.unread && (
                    <Badge variant="secondary" className="text-xs">Unread</Badge>
                  )}
                </div>
              </div>
              
              <p className="text-sm mb-2">{comm.subject}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {getTimeAgo(comm.timestamp)}
                </span>
                <div className="flex gap-2">
                  {comm.type === "message" && (
                    <Button size="sm" variant="outline">Reply</Button>
                  )}
                  {comm.type === "callback" && (
                    <Button size="sm" variant="default">Call Now</Button>
                  )}
                  {comm.type === "lastContact" && (
                    <Button size="sm" variant="outline">Schedule Contact</Button>
                  )}
                  <Button size="sm" variant="ghost">View Case</Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {communications.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No pending communications</p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold">{communications.filter(c => c.unread).length}</span>
            <span className="text-muted-foreground"> unread messages</span>
          </div>
          <Button size="sm" variant="outline">View All Communications</Button>
        </div>
      </CardContent>
    </Card>
  );
}
