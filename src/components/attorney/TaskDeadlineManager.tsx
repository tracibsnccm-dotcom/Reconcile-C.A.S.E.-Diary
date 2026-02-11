import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar, AlertCircle, CheckCircle2, Clock, Filter } from "lucide-react";
import { useState } from "react";
import { format, isToday, isPast, differenceInDays, addDays } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string;
  caseId: string;
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

export default function TaskDeadlineManager() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Submit court documents',
      description: 'File motion for summary judgment',
      caseId: 'RC-12345678',
      dueDate: new Date(),
      priority: 'high',
      status: 'pending'
    },
    {
      id: '2',
      title: 'Review medical records',
      description: 'Complete analysis of latest treatment reports',
      caseId: 'RC-87654321',
      dueDate: addDays(new Date(), 1),
      priority: 'high',
      status: 'in-progress'
    }
  ]);

  const toggleTaskStatus = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ));
  };

  const getDueDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isPast(date)) return 'Overdue';
    return `${differenceInDays(date, new Date())} days`;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge variant="secondary">Medium</Badge>;
      case 'low': return <Badge variant="outline">Low</Badge>;
      default: return null;
    }
  };

  const overdueTasks = tasks.filter(t => isPast(t.dueDate) && t.status !== 'completed');
  const todayTasks = tasks.filter(t => isToday(t.dueDate) && t.status !== 'completed');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-destructive">{overdueTasks.length}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-warning">{todayTasks.length}</p>
              <p className="text-sm text-muted-foreground">Due Today</p>
            </div>
            <Clock className="h-8 w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{tasks.filter(t => t.status !== 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-success">{tasks.filter(t => t.status === 'completed').length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Tasks & Deadlines</h2>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      task.status === 'completed' ? 'border-success/50 bg-success/5' : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onCheckedChange={() => toggleTaskStatus(task.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold text-foreground ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                            {task.title}
                          </h4>
                          {getPriorityBadge(task.priority)}
                        </div>
                        <p className={`text-sm text-muted-foreground mb-2 ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                          {task.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{task.caseId}</span>
                          <span>•</span>
                          <span>{getDueDateLabel(task.dueDate)} • {format(task.dueDate, 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              {overdueTasks.length > 0 ? (
                <div className="space-y-3">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                      <div className="flex items-start gap-4">
                        <Checkbox checked={false} onCheckedChange={() => toggleTaskStatus(task.id)} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <CheckCircle2 className="h-12 w-12 text-success mb-4" />
                  <p className="text-sm text-muted-foreground">No overdue tasks!</p>
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              {todayTasks.length > 0 ? (
                <div className="space-y-3">
                  {todayTasks.map(task => (
                    <div key={task.id} className="p-4 rounded-lg border border-warning/50 bg-warning/5">
                      <div className="flex items-start gap-4">
                        <Checkbox checked={false} onCheckedChange={() => toggleTaskStatus(task.id)} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No tasks due today</p>
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card className="p-6">
            <ScrollArea className="h-[600px] pr-4">
              {tasks.filter(t => t.status === 'completed').length > 0 ? (
                <div className="space-y-3">
                  {tasks.filter(t => t.status === 'completed').map(task => (
                    <div key={task.id} className="p-4 rounded-lg border border-success/50 bg-success/5">
                      <div className="flex items-start gap-4">
                        <Checkbox checked={true} onCheckedChange={() => toggleTaskStatus(task.id)} />
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground line-through opacity-50">{task.title}</h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No completed tasks yet</p>
                </div>
              )}
            </ScrollArea>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
