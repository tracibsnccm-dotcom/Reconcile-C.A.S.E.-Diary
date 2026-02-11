import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CaseHandoff {
  id: string;
  case_id: string;
  from_rn_id: string;
  to_rn_id: string;
  handoff_reason: string;
  status: string;
  critical_alerts?: string;
  care_plan_summary?: string;
  pending_tasks?: string;
  medications_list?: string;
  created_at: string;
  accepted_at?: string;
  completed_at?: string;
}

export function useCaseHandoffs() {
  const [handoffs, setHandoffs] = useState<CaseHandoff[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHandoffs();

    const channel = supabase
      .channel("case-handoffs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "case_handoffs",
        },
        () => {
          fetchHandoffs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchHandoffs = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("case_handoffs")
        .select("*")
        .or(`from_rn_id.eq.${user.id},to_rn_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setHandoffs(data || []);
    } catch (error) {
      console.error("Error fetching handoffs:", error);
      toast.error("Failed to load handoffs");
    } finally {
      setLoading(false);
    }
  };

  const acceptHandoff = async (handoffId: string) => {
    try {
      const { error } = await supabase
        .from("case_handoffs")
        .update({ 
          status: "accepted",
          accepted_at: new Date().toISOString()
        })
        .eq("id", handoffId);

      if (error) throw error;
      toast.success("Handoff accepted");
    } catch (error) {
      console.error("Error accepting handoff:", error);
      toast.error("Failed to accept handoff");
    }
  };

  const declineHandoff = async (handoffId: string) => {
    try {
      const { error } = await supabase
        .from("case_handoffs")
        .update({ status: "declined" })
        .eq("id", handoffId);

      if (error) throw error;
      toast.success("Handoff declined");
    } catch (error) {
      console.error("Error declining handoff:", error);
      toast.error("Failed to decline handoff");
    }
  };

  const completeHandoff = async (handoffId: string) => {
    try {
      const { error } = await supabase
        .from("case_handoffs")
        .update({ 
          status: "completed",
          completed_at: new Date().toISOString()
        })
        .eq("id", handoffId);

      if (error) throw error;
      toast.success("Handoff completed");
    } catch (error) {
      console.error("Error completing handoff:", error);
      toast.error("Failed to complete handoff");
    }
  };

  return { handoffs, loading, acceptHandoff, declineHandoff, completeHandoff, refreshHandoffs: fetchHandoffs };
}
