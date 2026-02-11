import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useEmergencyAlertGuard() {
  const [hasIncompleteAlerts, setHasIncompleteAlerts] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkForIncompleteAlerts();

    // Subscribe to changes in emergency alerts
    const channel = supabase
      .channel('emergency-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rn_emergency_alerts'
        },
        () => {
          checkForIncompleteAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkForIncompleteAlerts = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for incomplete emergency alerts assigned to this RN
      const { data, error } = await supabase
        .from("rn_emergency_alerts")
        .select("id, alert_type, case_id")
        .is("addressed_at", null)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);

      if (error) throw error;

      setHasIncompleteAlerts((data?.length || 0) > 0);
    } catch (error) {
      console.error("Error checking emergency alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const recordAttempt = async () => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);

    if (newCount >= 3) {
      await notifySupervisor();
      setAttemptCount(0); // Reset after notification
    }
  };

  const notifySupervisor = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get RN's name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single();

      // Get incomplete alerts details
      const { data: alerts } = await supabase
        .from("rn_emergency_alerts")
        .select(`
          id,
          alert_type,
          case_id,
          cases(client_number, client_label)
        `)
        .is("addressed_at", null)
        .or(`assigned_to.eq.${user.id},created_by.eq.${user.id}`);

      const alertDetails = alerts?.map(a => ({
        alert_type: a.alert_type,
        case: `${(a.cases as any)?.client_number || 'Unknown'}`
      }));

      // Notify supervisors
      await supabase.rpc("notify_roles", {
        role_names: ["RN_CM_DIRECTOR", "SUPER_ADMIN"],
        notification_title: "⚠️ Emergency Alert Compliance Issue",
        notification_message: `${profile?.display_name || 'An RN'} attempted to navigate away from emergency alerts 3 times without completion. Immediate follow-up required.`,
        notification_type: "error",
        notification_link: "/rn/dashboard",
        notification_metadata: {
          rn_id: user.id,
          rn_name: profile?.display_name,
          attempt_count: 3,
          incomplete_alerts: alertDetails,
          timestamp: new Date().toISOString()
        }
      });

      toast.error("Your supervisor has been notified of incomplete emergency alerts", {
        duration: 5000
      });
    } catch (error) {
      console.error("Error notifying supervisor:", error);
    }
  };

  return {
    hasIncompleteAlerts,
    attemptCount,
    loading,
    recordAttempt,
    checkForIncompleteAlerts
  };
}
