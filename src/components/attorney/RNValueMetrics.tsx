import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, DollarSign, TrendingUp, FileCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

interface RNValueMetricsProps {
  attorneyId: string;
}

interface Metrics {
  hoursSavedThisMonth: number;
  costSavingsThisMonth: number;
  tasksCompletedThisMonth: number;
  efficiencyGainPercent: number;
  monthlyTrend: Array<{ month: string; hours: number; savings: number }>;
}

export function RNValueMetrics({ attorneyId }: RNValueMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [attorneyId]);

  const loadMetrics = async () => {
    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // Get time entries for this month
      const { data: entries, error } = await supabase
        .from("rn_time_entries")
        .select("*")
        .eq("attorney_id", attorneyId)
        .gte("entry_date", startOfMonth.toISOString());

      if (error) throw error;

      const totalMinutesSaved = entries?.reduce((sum, entry) => 
        sum + (entry.estimated_attorney_time_saved_minutes || 0), 0) || 0;
      const hoursSaved = totalMinutesSaved / 60;
      const avgRate = 350; // Default hourly rate
      const costSavings = hoursSaved * avgRate;
      const tasksCompleted = entries?.length || 0;

      // Calculate efficiency gain (assuming attorney capacity is 160 hours/month)
      const efficiencyGain = (hoursSaved / 160) * 100;

      // Get last 6 months trend
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: trendData } = await supabase
        .from("rn_time_entries")
        .select("*")
        .eq("attorney_id", attorneyId)
        .gte("entry_date", sixMonthsAgo.toISOString());

      const monthlyTrend = generateMonthlyTrend(trendData || []);

      setMetrics({
        hoursSavedThisMonth: Math.round(hoursSaved * 10) / 10,
        costSavingsThisMonth: Math.round(costSavings),
        tasksCompletedThisMonth: tasksCompleted,
        efficiencyGainPercent: Math.round(efficiencyGain),
        monthlyTrend,
      });
    } catch (error) {
      console.error("Error loading RN value metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrend = (data: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: { [key: string]: { hours: number; savings: number } } = {};

    data.forEach(entry => {
      const date = new Date(entry.entry_date);
      const monthKey = `${months[date.getMonth()]}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { hours: 0, savings: 0 };
      }

      const hours = (entry.estimated_attorney_time_saved_minutes || 0) / 60;
      monthlyData[monthKey].hours += hours;
      monthlyData[monthKey].savings += hours * 350;
    });

    return Object.keys(monthlyData).slice(-6).map(month => ({
      month,
      hours: Math.round(monthlyData[month].hours * 10) / 10,
      savings: Math.round(monthlyData[month].savings),
    }));
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-24 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">RN Case Management Value</h3>
        <p className="text-sm text-muted-foreground">
          Time and cost savings provided by your dedicated RN Case Manager this month
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Hours Saved</div>
              <div className="text-2xl font-bold">{metrics.hoursSavedThisMonth}h</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">This Month</p>
        </Card>

        <Card className="p-6 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Cost Savings</div>
              <div className="text-2xl font-bold text-green-600">
                ${metrics.costSavingsThisMonth.toLocaleString()}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">At $350/hr rate</p>
        </Card>

        <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
              <div className="text-2xl font-bold">{metrics.tasksCompletedThisMonth}</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">By RN CM</p>
        </Card>

        <Card className="p-6 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Efficiency Gain</div>
              <div className="text-2xl font-bold text-purple-600">{metrics.efficiencyGainPercent}%</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Of monthly capacity</p>
        </Card>
      </div>

      {/* Trends Chart */}
      {metrics.monthlyTrend.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">6-Month Savings Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Hours Saved"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="savings"
                stroke="#10b981"
                strokeWidth={2}
                name="Cost Savings ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ROI Summary */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-transparent">
        <h4 className="font-semibold mb-3">Return on Investment</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your RN CM Monthly Cost:</span>
            <span className="font-semibold">$3,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Attorney Time Savings Value:</span>
            <span className="font-semibold text-green-600">
              ${metrics.costSavingsThisMonth.toLocaleString()}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-semibold">Net Value This Month:</span>
            <span className="text-lg font-bold text-green-600">
              ${(metrics.costSavingsThisMonth - 3000).toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Your RN Case Manager has saved you {metrics.hoursSavedThisMonth} hours this month, 
            allowing you to focus on higher-value legal work.
          </p>
        </div>
      </Card>
    </div>
  );
}
