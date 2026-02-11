import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Goal {
  id: string;
  rn_id: string;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  current_progress: number;
  status: string;
  milestones?: any;
  created_at: string;
  updated_at: string;
}

export function useDiaryGoals(rnId: string | undefined) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!rnId) return;

    const fetchGoals = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rn_goals" as any)
          .select("*")
          .eq("rn_id", rnId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setGoals((data || []) as unknown as Goal[]);
      } catch (error) {
        console.error("Error fetching goals:", error);
        toast.error("Failed to load goals");
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();

    const channel = supabase
      .channel(`goals:${rnId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rn_goals",
          filter: `rn_id=eq.${rnId}`,
        },
        () => {
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [rnId]);

  const createGoal = async (goal: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from("rn_goals" as any)
        .insert({ ...goal, rn_id: rnId })
        .select()
        .single();

      if (error) throw error;

      toast.success("Goal created successfully");
      return data;
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("Failed to create goal");
      return null;
    }
  };

  const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from("rn_goals" as any)
        .update(updates)
        .eq("id", goalId);

      if (error) throw error;

      toast.success("Goal updated successfully");
    } catch (error) {
      console.error("Error updating goal:", error);
      toast.error("Failed to update goal");
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("rn_goals" as any)
        .delete()
        .eq("id", goalId);

      if (error) throw error;

      toast.success("Goal deleted successfully");
    } catch (error) {
      console.error("Error deleting goal:", error);
      toast.error("Failed to delete goal");
    }
  };

  return { goals, loading, createGoal, updateGoal, deleteGoal };
}
