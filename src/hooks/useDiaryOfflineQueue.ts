import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OfflineQueueItem {
  id: string;
  rn_id: string;
  operation_type: string;
  operation_data: any;
  retry_count: number;
  last_error?: string;
  created_at: string;
}

export function useDiaryOfflineQueue() {
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQueue = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("rn_offline_queue" as any)
          .select("*")
          .eq("rn_id", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setQueueItems((data || []) as unknown as OfflineQueueItem[]);
      } catch (error) {
        console.error("Error fetching offline queue:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();

    const channel = supabase
      .channel("offline-queue")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rn_offline_queue",
        },
        () => {
          fetchQueue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const retryItem = async (itemId: string, operationType: string, operationData: any) => {
    try {
      // Execute the operation based on type
      if (operationType === "create_entry") {
        const { error } = await supabase.from("rn_diary_entries").insert(operationData);
        if (error) throw error;
      } else if (operationType === "update_entry") {
        const { error } = await supabase
          .from("rn_diary_entries")
          .update(operationData)
          .eq("id", operationData.id);
        if (error) throw error;
      }

      // Remove from queue on success
      await supabase.from("rn_offline_queue" as any).delete().eq("id", itemId);
      
      toast.success("Sync completed successfully");
    } catch (error) {
      console.error("Error retrying operation:", error);
      
      // Update retry count and error
      await supabase
        .from("rn_offline_queue" as any)
        .update({
          retry_count: queueItems.find(i => i.id === itemId)!.retry_count + 1,
          last_error: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", itemId);
      
      toast.error("Sync failed, will retry later");
    }
  };

  const clearQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("rn_offline_queue" as any)
        .delete()
        .eq("rn_id", user.id);

      if (error) throw error;

      toast.success("Queue cleared");
    } catch (error) {
      console.error("Error clearing queue:", error);
      toast.error("Failed to clear queue");
    }
  };

  return { queueItems, loading, retryItem, clearQueue };
}
