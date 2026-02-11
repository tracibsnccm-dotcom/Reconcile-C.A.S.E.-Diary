import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, Briefcase } from "lucide-react";
import { format, startOfDay, startOfWeek } from "date-fns";

interface TimeStats {
  today: number;
  week: number;
  casesToday: number;
}

export function RNTimeStatsWidget() {
  const [stats, setStats] = useState<TimeStats>({ today: 0, week: 0, casesToday: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now).toISOString();

      // Get today's entries
      const { data: todayData } = await supabase
        .from("rn_time_entries")
        .select("time_spent_minutes, case_id")
        .eq("rn_user_id", user.id)
        .gte("created_at", todayStart);

      // Get this week's entries
      const { data: weekData } = await supabase
        .from("rn_time_entries")
        .select("time_spent_minutes")
        .eq("rn_user_id", user.id)
        .gte("created_at", weekStart);

      const todayMinutes = todayData?.reduce((sum, e) => sum + e.time_spent_minutes, 0) || 0;
      const weekMinutes = weekData?.reduce((sum, e) => sum + e.time_spent_minutes, 0) || 0;
      const uniqueCasesToday = new Set(todayData?.map(e => e.case_id) || []).size;

      setStats({
        today: todayMinutes,
        week: weekMinutes,
        casesToday: uniqueCasesToday
      });
    } catch (error) {
      console.error("Error fetching time stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Time Tracking Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Today</span>
            </div>
            <div className="text-xl font-bold">
              {loading ? "..." : `${(stats.today / 60).toFixed(1)} hrs`}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">This Week</span>
            </div>
            <div className="text-xl font-bold">
              {loading ? "..." : `${(stats.week / 60).toFixed(1)} hrs`}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Cases Today</span>
            </div>
            <div className="text-xl font-bold">
              {loading ? "..." : stats.casesToday}
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground text-center">
              Last updated: {format(new Date(), "h:mm a")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
