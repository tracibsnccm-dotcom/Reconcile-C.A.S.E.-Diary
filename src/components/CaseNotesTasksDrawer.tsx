import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { listCaseActivity, type CaseActivity } from "@/lib/caseRequestsApi";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface CaseNotesTasksDrawerProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Note {
  id: string;
  note_text: string;
  visibility: string;
  created_at: string;
  created_by: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  assigned_role: string | null;
  status: string;
  created_at: string;
}

export function CaseNotesTasksDrawer({ caseId, open, onOpenChange }: CaseNotesTasksDrawerProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newNote, setNewNote] = useState("");
  const [noteVisibility, setNoteVisibility] = useState("private");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [clientCommActivity, setClientCommActivity] = useState<CaseActivity[]>([]);

  const fetchClientComm = useCallback(async () => {
    if (!caseId) return;
    const res = await listCaseActivity(caseId);
    if (res.error) return;
    setClientCommActivity((res.data || []).filter((a) => a.activity_type === "client_communication"));
  }, [caseId]);

  useEffect(() => {
    if (open) {
      fetchNotes();
      fetchTasks();
      fetchClientComm();
    }
  }, [open, caseId, fetchClientComm]);

  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from("case_notes")
      .select("*")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching notes", description: error.message, variant: "destructive" });
    } else {
      setNotes(data || []);
    }
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("case_tasks")
      .select("*")
      .eq("case_id", caseId)
      .order("due_date", { ascending: true });

    if (error) {
      toast({ title: "Error fetching tasks", description: error.message, variant: "destructive" });
    } else {
      setTasks(data || []);
    }
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("case_notes").insert({
      case_id: caseId,
      created_by: user.id,
      note_text: newNote,
      visibility: noteVisibility,
    });

    if (error) {
      toast({ title: "Error saving note", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Note saved successfully", variant: "default" });
      setNewNote("");
      fetchNotes();
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("case_tasks").insert({
      case_id: caseId,
      created_by: user.id,
      title: newTaskTitle,
      due_date: newTaskDueDate || null,
      assigned_role: newTaskAssignee || null,
      status: "pending",
    });

    if (error) {
      toast({ title: "Error adding task", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task added successfully", variant: "default" });
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskAssignee("");
      fetchTasks();
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "pending" : "done";

    const { error } = await supabase
      .from("case_tasks")
      .update({ 
        status: newStatus,
        completed_at: newStatus === "done" ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error updating task", description: error.message, variant: "destructive" });
    } else {
      fetchTasks();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[35%] sm:max-w-none bg-[#faf4d6] overflow-y-auto">
        <SheetHeader className="bg-[hsl(var(--gold))] -mx-6 -mt-6 px-6 py-4">
          <SheetTitle className="text-foreground">Case Notes & Tasks</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="notes" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-3">
              <Label>Add New Note</Label>
              <Textarea
                placeholder="Enter your note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[100px]"
              />
              <Select value={noteVisibility} onValueChange={setNoteVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="shared_rn">Shared with RN CM</SelectItem>
                  <SelectItem value="shared_provider">Shared with Provider</SelectItem>
                  <SelectItem value="shared_all">Shared with All</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSaveNote}
                className="w-full bg-[hsl(var(--gold))] text-foreground hover:bg-foreground hover:text-[hsl(var(--gold))]"
              >
                Save Note
              </Button>
            </div>

            <div className="space-y-3 mt-6">
              <Label>Recent Notes</Label>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 bg-background rounded-lg border">
                    <p className="text-sm">{note.note_text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                      <span className="text-xs px-2 py-1 bg-secondary rounded">
                        {note.visibility.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 mt-6 pt-4 border-t">
              <Label>Client communications (Attorney → Client)</Label>
              {clientCommActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">None</p>
              ) : (
                clientCommActivity.map((a) => {
                  const typeMatch = a.summary?.match(/^Client communication \((\w+)\)/);
                  const commType = typeMatch ? typeMatch[1] : "";
                  const ccRn = a.visibility === "attorney_rn";
                  return (
                    <div key={a.id} className="p-3 bg-background rounded-lg border">
                      <div className="flex flex-wrap items-center gap-1 mb-1">
                        <span className="text-xs font-medium">Attorney → Client</span>
                        {commType && <span className="text-xs text-muted-foreground">({commType})</span>}
                        {ccRn && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">CC&apos;d to RN</span>}
                      </div>
                      <p className="text-sm">{a.details || a.summary}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {format(new Date(a.created_at), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-3">
              <Label>Add New Task</Label>
              <Input
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Assign To</Label>
                  <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATTORNEY">Attorney</SelectItem>
                      <SelectItem value="RN_CM">RN CM</SelectItem>
                      <SelectItem value="RCMS_CLINICAL_MGMT">RN Clinical Manager</SelectItem>
                      <SelectItem value="CLINICAL_STAFF_EXTERNAL">Clinical Staff</SelectItem>
                      <SelectItem value="PROVIDER">Provider</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleAddTask}
                className="w-full bg-[hsl(var(--gold))] text-foreground hover:bg-foreground hover:text-[hsl(var(--gold))]"
              >
                Add Task
              </Button>
            </div>

            <div className="space-y-3 mt-6">
              <Label>Tasks</Label>
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks yet</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-background rounded-lg border">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={() => handleToggleTaskStatus(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                          {task.title}
                        </p>
                        {task.due_date && (
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(task.due_date), "MMM dd, yyyy")}
                            </span>
                          </div>
                        )}
                        {task.assigned_role && (
                          <span className="text-xs px-2 py-0.5 bg-secondary rounded mt-1 inline-block">
                            {task.assigned_role.replace("_", " ")}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        task.status === "done" 
                          ? "bg-green-100 text-green-800" 
                          : task.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {task.status === "in_progress" ? "In Progress" : task.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
