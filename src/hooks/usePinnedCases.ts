import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "@/hooks/use-toast";

export function usePinnedCases() {
  const [pinnedCaseIds, setPinnedCaseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchPinnedCases = async () => {
      const { data, error } = await supabase
        .from("pinned_cases")
        .select("case_id, position")
        .eq("user_id", user.id)
        .order("position", { ascending: true });

      if (error) {
        console.error("Error fetching pinned cases:", error);
      } else {
        setPinnedCaseIds(data?.map((p) => p.case_id) || []);
      }
      setLoading(false);
    };

    fetchPinnedCases();

    // Subscribe to changes
    const channel = supabase
      .channel("pinned_cases_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pinned_cases",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchPinnedCases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const togglePin = async (caseId: string) => {
    if (!user) return;

    const isPinned = pinnedCaseIds.includes(caseId);

    if (isPinned) {
      // Unpin
      const { error } = await supabase
        .from("pinned_cases")
        .delete()
        .eq("user_id", user.id)
        .eq("case_id", caseId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to unpin case",
          variant: "destructive",
        });
      } else {
        setPinnedCaseIds((prev) => prev.filter((id) => id !== caseId));
        toast({
          title: "Case unpinned",
          description: "Case removed from pinned list",
        });
      }
    } else {
      // Pin
      const { error } = await supabase
        .from("pinned_cases")
        .insert({
          user_id: user.id,
          case_id: caseId,
          position: pinnedCaseIds.length,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to pin case",
          variant: "destructive",
        });
      } else {
        setPinnedCaseIds((prev) => [...prev, caseId]);
        toast({
          title: "Case pinned",
          description: "Case added to pinned list",
        });
      }
    }
  };

  const reorderPins = async (newOrder: string[]) => {
    if (!user) return;

    const updates = newOrder.map((caseId, index) => ({
      user_id: user.id,
      case_id: caseId,
      position: index,
    }));

    const { error } = await supabase
      .from("pinned_cases")
      .upsert(updates, { onConflict: "user_id,case_id" });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reorder pinned cases",
        variant: "destructive",
      });
    } else {
      setPinnedCaseIds(newOrder);
    }
  };

  return {
    pinnedCaseIds,
    loading,
    togglePin,
    reorderPins,
    isPinned: (caseId: string) => pinnedCaseIds.includes(caseId),
  };
}