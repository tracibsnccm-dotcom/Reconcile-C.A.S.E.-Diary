import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActionItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  created_at: string;
  completed_at: string | null;
}

interface ClientActionItemsProps {
  caseId: string;
}

export function ClientActionItems({ caseId }: ClientActionItemsProps) {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActionItems();
  }, [caseId]);

  async function fetchActionItems() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("client_action_items")
        .select("*")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .order("priority", { ascending: false })
        .order("due_date", { ascending: true });

      if (error) throw error;
      setActionItems(data || []);
    } catch (err: any) {
      console.error("Error fetching action items:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCompletion(itemId: string, currentStatus: string) {
    try {
      const newStatus = currentStatus === "completed" ? "pending" : "completed";
      
      const { error } = await supabase
        .from("client_action_items")
        .update({ 
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null
        })
        .eq("id", itemId);

      if (error) throw error;
      fetchActionItems();
      
      if (newStatus === "completed") {
        toast.success("✓ Task completed!");
      }
    } catch (err: any) {
      console.error("Error updating action item:", err);
      toast.error("Failed to update task");
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-red-600 bg-red-50 border-red-200";
      case "high": return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default: return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const pendingItems = actionItems.filter(item => item.status !== "completed" && item.status !== "cancelled");
  const completedItems = actionItems.filter(item => item.status === "completed");

  return (
    <Card className="p-6 border-rcms-gold bg-white shadow-xl">
      <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-6">
        <CheckSquare className="w-6 h-6 text-rcms-teal" />
        My Action Items
      </h2>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-muted rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {pendingItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">To Do</h3>
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 border rounded-lg ${
                      isOverdue(item.due_date) ? "border-red-300 bg-red-50" : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.status === "completed"}
                        onCheckedChange={() => toggleCompletion(item.id, item.status)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-foreground">{item.title}</p>
                          {item.priority !== "low" && (
                            <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                        )}
                        {item.due_date && (
                          <div className="flex items-center gap-1 mt-2 text-sm">
                            {isOverdue(item.due_date) ? (
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className={isOverdue(item.due_date) ? "text-red-600 font-medium" : "text-muted-foreground"}>
                              {isOverdue(item.due_date) ? "Overdue: " : "Due: "}
                              {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-muted-foreground mb-3">Completed</h3>
              <div className="space-y-2">
                {completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-green-200 bg-green-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={true}
                        onCheckedChange={() => toggleCompletion(item.id, item.status)}
                      />
                      <p className="text-sm text-foreground line-through">{item.title}</p>
                      {item.completed_at && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(item.completed_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {actionItems.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No action items yet</p>
              <p className="text-sm mt-1">Your care team will add tasks here for you to complete</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
