import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDiaryConflicts } from "./useDiaryConflicts";

interface DraggedEntry {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  rn_id: string;
}

export function useDiaryDragDrop(onSuccess?: () => void) {
  const [draggedEntry, setDraggedEntry] = useState<DraggedEntry | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (entry: DraggedEntry) => {
    setDraggedEntry(entry);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Don't clear draggedEntry immediately to allow drop to access it
    setTimeout(() => setDraggedEntry(null), 100);
  };

  const handleDrop = async (targetDate: string, targetTime?: string) => {
    if (!draggedEntry) return;

    try {
      // Check for conflicts
      const { data: conflicts } = await supabase
        .from("rn_diary_entries")
        .select("id, title, scheduled_time")
        .eq("rn_id", draggedEntry.rn_id)
        .eq("scheduled_date", targetDate)
        .neq("id", draggedEntry.id)
        .in("completion_status", ["pending", "in_progress"]);

      // If there's a time and conflicts exist, warn user
      if (targetTime && conflicts && conflicts.length > 0) {
        const [targetHour, targetMin] = targetTime.split(":").map(Number);
        const targetMinutes = targetHour * 60 + targetMin;

        const hasTimeConflict = conflicts.some((conflict) => {
          if (!conflict.scheduled_time) return false;
          const [conflictHour, conflictMin] = conflict.scheduled_time.split(":").map(Number);
          const conflictMinutes = conflictHour * 60 + conflictMin;
          return Math.abs(targetMinutes - conflictMinutes) < 60;
        });

        if (hasTimeConflict) {
          toast.warning("This time slot conflicts with another entry");
        }
      }

      // Update the entry
      const updateData: any = {
        scheduled_date: targetDate,
        updated_at: new Date().toISOString(),
      };

      if (targetTime) {
        updateData.scheduled_time = targetTime;
      }

      const { error } = await supabase
        .from("rn_diary_entries")
        .update(updateData)
        .eq("id", draggedEntry.id);

      if (error) throw error;

      toast.success(`Rescheduled to ${targetDate}${targetTime ? ` at ${targetTime}` : ""}`);
      onSuccess?.();
    } catch (error) {
      console.error("Error rescheduling entry:", error);
      toast.error("Failed to reschedule entry");
    } finally {
      setDraggedEntry(null);
      setIsDragging(false);
    }
  };

  return {
    draggedEntry,
    isDragging,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  };
}