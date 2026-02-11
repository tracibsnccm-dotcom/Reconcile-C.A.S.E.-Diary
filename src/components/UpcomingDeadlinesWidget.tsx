import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, isToday, isBefore, addDays, startOfDay } from "date-fns";

interface Task {
  id: string;
  dueDate: Date;
  caseId: string;
  description: string;
  assignedTo?: string;
  status: "overdue" | "due_soon" | "scheduled" | "completed";
}

// Mock data - in production, this would come from case metadata
const mockTasks: Task[] = [
  {
    id: "1",
    dueDate: new Date(Date.now() - 86400000), // Yesterday - overdue
    caseId: "CASE-2024-003",
    description: "Consent expiring - renewal required",
    assignedTo: "Lisa Chen",
    status: "overdue",
  },
  {
    id: "2",
    dueDate: new Date(), // Today
    caseId: "CASE-2024-001",
    description: "Medical records report due",
    assignedTo: "Maria Garcia",
    status: "due_soon",
  },
  {
    id: "3",
    dueDate: addDays(new Date(), 2),
    caseId: "CASE-2024-005",
    description: "Pre-trial conference scheduled",
    assignedTo: "Robert Johnson",
    status: "due_soon",
  },
  {
    id: "4",
    dueDate: addDays(new Date(), 5),
    caseId: "CASE-2024-007",
    description: "Settlement review meeting",
    assignedTo: "Lisa Chen",
    status: "scheduled",
  },
  {
    id: "5",
    dueDate: addDays(new Date(), 10),
    caseId: "CASE-2024-002",
    description: "Provider appointment follow-up",
    status: "scheduled",
  },
];

function getTaskStatus(task: Task): Task["status"] {
  const today = startOfDay(new Date());
  const taskDate = startOfDay(task.dueDate);
  
  if (isBefore(taskDate, today)) return "overdue";
  if (isToday(taskDate) || isBefore(taskDate, addDays(today, 3))) return "due_soon";
  return "scheduled";
}

function getStatusBadge(status: Task["status"]) {
  switch (status) {
    case "overdue":
      return (
        <Badge variant="destructive" className="bg-[#ff7b7b] text-white border-none">
          Overdue
        </Badge>
      );
    case "due_soon":
      return (
        <Badge className="bg-[#b09837] text-black border-none hover:bg-[#b09837]/90">
          Due Soon
        </Badge>
      );
    case "scheduled":
      return (
        <Badge className="bg-[#128f8b] text-white border-none hover:bg-[#128f8b]/90">
          Scheduled
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/50">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
  }
}

export function UpcomingDeadlinesWidget() {
  const navigate = useNavigate();
  
  // Sort tasks by due date and take top 5
  const sortedTasks = [...mockTasks]
    .map(task => ({ ...task, status: getTaskStatus(task) }))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const handleViewAll = () => {
    // Navigate to a tasks/calendar view
    navigate("/cases");
  };

  return (
    <Card className="p-6 border-border h-full">
      <div className="mb-4 pb-3 border-b-2 border-[#b09837]">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Deadlines
        </h2>
      </div>
      
      <div className="space-y-3 mb-4">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No upcoming deadlines</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 pb-3 border-b border-border last:border-0 hover:bg-accent/5 -mx-2 px-2 py-2 rounded transition-colors cursor-pointer"
              onClick={() => navigate(`/cases/${task.caseId}`)}
            >
              <Calendar className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {task.caseId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  </div>
                  {getStatusBadge(task.status)}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="font-medium">
                    {format(task.dueDate, "MMM dd, yyyy")}
                  </span>
                  {task.assignedTo && (
                    <>
                      <span>•</span>
                      <span>{task.assignedTo}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Button
        onClick={handleViewAll}
        className="w-full bg-[#b09837] text-black hover:bg-black hover:text-[#b09837] transition-colors font-medium"
      >
        View All Tasks
      </Button>
    </Card>
  );
}
