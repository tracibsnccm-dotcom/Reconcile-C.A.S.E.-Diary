import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Goal {
  id: string;
  goal_text: string;
  category: string;
  target_date: string | null;
  current_progress: number;
  status: string;
  created_at: string;
}

interface ClientGoalTrackerProps {
  caseId: string;
}

export function ClientGoalTracker({ caseId }: ClientGoalTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goal_text: "",
    category: "recovery",
    target_date: "",
  });

  useEffect(() => {
    fetchGoals();
  }, [caseId]);

  async function fetchGoals() {
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("client_goals")
        .select("*")
        .eq("client_id", user.data.user?.id)
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (err: any) {
      console.error("Error fetching goals:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGoal() {
    if (!newGoal.goal_text.trim()) {
      toast.error("Please enter a goal");
      return;
    }

    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("client_goals")
        .insert({
          client_id: user.data.user?.id,
          case_id: caseId,
          goal_text: newGoal.goal_text,
          category: newGoal.category,
          target_date: newGoal.target_date || null,
        });

      if (error) throw error;

      toast.success("Goal added successfully!");
      setNewGoal({ goal_text: "", category: "recovery", target_date: "" });
      setShowForm(false);
      fetchGoals();
    } catch (err: any) {
      console.error("Error adding goal:", err);
      toast.error("Failed to add goal");
    }
  }

  async function updateProgress(goalId: string, newProgress: number) {
    try {
      const { error } = await supabase
        .from("client_goals")
        .update({ 
          current_progress: newProgress,
          status: newProgress >= 100 ? "completed" : "active"
        })
        .eq("id", goalId);

      if (error) throw error;
      fetchGoals();
      
      if (newProgress >= 100) {
        toast.success("🎉 Goal completed! Great work!");
      }
    } catch (err: any) {
      console.error("Error updating progress:", err);
      toast.error("Failed to update progress");
    }
  }

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");

  return (
    <Card className="p-6 border-rcms-gold bg-white shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Target className="w-6 h-6 text-rcms-teal" />
          My Recovery Goals
        </h2>
        <Button
          onClick={() => setShowForm(!showForm)}
          size="sm"
          className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/20">
          <div className="space-y-4">
            <div>
              <Label>What goal would you like to achieve?</Label>
              <Input
                value={newGoal.goal_text}
                onChange={(e) => setNewGoal({ ...newGoal, goal_text: e.target.value })}
                placeholder="e.g., Reduce pain to 3/10, Return to work, Walk 30 minutes daily"
                maxLength={200}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recovery">Physical Recovery</SelectItem>
                    <SelectItem value="mental_health">Mental Health</SelectItem>
                    <SelectItem value="work">Return to Work</SelectItem>
                    <SelectItem value="daily_activities">Daily Activities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Target Date (Optional)</Label>
                <Input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddGoal} className="bg-rcms-gold text-rcms-black hover:bg-rcms-black hover:text-rcms-gold">
                Save Goal
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-24 bg-muted rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {activeGoals.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Active Goals</h3>
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="p-4 border border-border rounded-lg bg-background">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{goal.goal_text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {goal.category.replace("_", " ")} 
                          {goal.target_date && ` • Target: ${new Date(goal.target_date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progress</span>
                        <span className="text-sm font-semibold text-foreground">{goal.current_progress}%</span>
                      </div>
                      <Progress value={goal.current_progress} className="h-2" />
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProgress(goal.id, Math.min(100, goal.current_progress + 25))}
                        >
                          +25%
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProgress(goal.id, 100)}
                          className="text-green-600"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Completed Goals 🎉</h3>
              <div className="space-y-2">
                {completedGoals.map((goal) => (
                  <div key={goal.id} className="p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <p className="text-sm text-foreground line-through">{goal.goal_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {goals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No goals yet</p>
              <p className="text-sm mt-1">Set your first recovery goal to track your progress</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
