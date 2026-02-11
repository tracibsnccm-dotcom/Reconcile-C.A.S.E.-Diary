import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { differenceInMinutes, parseISO, format } from "date-fns";

interface DiaryEntry {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time?: string;
  reminder_enabled: boolean;
  reminder_minutes_before?: number;
  completion_status: string;
}

export function useDiaryNotifications(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const checkReminders = async () => {
      try {
        const { data: entries, error } = await supabase
          .from("rn_diary_entries")
          .select("*")
          .eq("rn_id", userId)
          .eq("reminder_enabled", true)
          .in("completion_status", ["pending", "in_progress"])
          .gte("scheduled_date", format(new Date(), "yyyy-MM-dd"));

        if (error) throw error;
        if (!entries) return;

        const now = new Date();

        entries.forEach((entry: DiaryEntry) => {
          const scheduledDateTime = entry.scheduled_time
            ? parseISO(`${entry.scheduled_date}T${entry.scheduled_time}`)
            : parseISO(`${entry.scheduled_date}T09:00:00`);

          const minutesUntil = differenceInMinutes(scheduledDateTime, now);
          const reminderMinutes = entry.reminder_minutes_before || 30;

          // Show notification if within reminder window
          if (minutesUntil > 0 && minutesUntil <= reminderMinutes) {
            const hasShown = localStorage.getItem(`reminder_${entry.id}`);
            
            if (!hasShown) {
              toast.info(
                `Reminder: ${entry.title} is scheduled in ${minutesUntil} minutes`,
                {
                  duration: 10000,
                  action: {
                    label: "View",
                    onClick: () => {
                      window.location.href = "/rncm/diary";
                    }
                  }
                }
              );
              
              localStorage.setItem(`reminder_${entry.id}`, "true");
              
              // Clear the flag after the scheduled time
              setTimeout(() => {
                localStorage.removeItem(`reminder_${entry.id}`);
              }, reminderMinutes * 60 * 1000);
            }
          }

          // Check for overdue entries
          if (minutesUntil < 0 && entry.completion_status === "pending") {
            const hasShownOverdue = localStorage.getItem(`overdue_${entry.id}`);
            
            if (!hasShownOverdue) {
              toast.error(
                `Overdue: ${entry.title} was scheduled ${Math.abs(minutesUntil)} minutes ago`,
                {
                  duration: 15000,
                  action: {
                    label: "Complete",
                    onClick: () => {
                      window.location.href = "/rncm/diary";
                    }
                  }
                }
              );
              
              localStorage.setItem(`overdue_${entry.id}`, "true");
            }
          }
        });
      } catch (error) {
        console.error("Error checking reminders:", error);
      }
    };

    // Check reminders every 5 minutes
    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userId]);
}
