import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConflictCheck {
  hasConflict: boolean;
  conflicts: Array<{
    id: string;
    title: string;
    scheduled_date: string;
    scheduled_time?: string;
  }>;
}

export function useDiaryConflicts(
  rnId: string | undefined,
  scheduledDate: string,
  scheduledTime: string | undefined,
  excludeEntryId?: string
) {
  const [conflicts, setConflicts] = useState<ConflictCheck>({
    hasConflict: false,
    conflicts: [],
  });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!rnId || !scheduledDate) return;

    const checkConflicts = async () => {
      setChecking(true);
      try {
        let query = supabase
          .from("rn_diary_entries")
          .select("id, title, scheduled_date, scheduled_time")
          .eq("rn_id", rnId)
          .eq("scheduled_date", scheduledDate)
          .in("completion_status", ["pending", "in_progress"]);

        if (excludeEntryId) {
          query = query.neq("id", excludeEntryId);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0 && scheduledTime) {
          // Check for time overlap (within 1 hour)
          const conflictingEntries = data.filter((entry) => {
            if (!entry.scheduled_time) return false;

            const [entryHour, entryMin] = entry.scheduled_time.split(":").map(Number);
            const [newHour, newMin] = scheduledTime.split(":").map(Number);

            const entryMinutes = entryHour * 60 + entryMin;
            const newMinutes = newHour * 60 + newMin;

            const diff = Math.abs(entryMinutes - newMinutes);
            return diff < 60; // Conflicts if within 1 hour
          });

          if (conflictingEntries.length > 0) {
            setConflicts({
              hasConflict: true,
              conflicts: conflictingEntries,
            });
            toast.warning("Schedule conflict detected!");
          } else {
            setConflicts({ hasConflict: false, conflicts: [] });
          }
        } else if (data && data.length > 0) {
          // Same day but no time specified - still warn
          setConflicts({
            hasConflict: true,
            conflicts: data,
          });
        } else {
          setConflicts({ hasConflict: false, conflicts: [] });
        }
      } catch (error) {
        console.error("Error checking conflicts:", error);
      } finally {
        setChecking(false);
      }
    };

    const timeoutId = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [rnId, scheduledDate, scheduledTime, excludeEntryId]);

  return { conflicts, checking };
}
