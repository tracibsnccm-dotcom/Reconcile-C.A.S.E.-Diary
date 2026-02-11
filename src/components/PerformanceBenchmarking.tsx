import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Award, Target, Clock, DollarSign } from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";

export function PerformanceBenchmarking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  async function loadStats() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("attorney_id", user.id);

    if (!error && data) {
      const total = data.length;
      const accepted = data.filter(r => r.acceptance_status === "accepted").length;
      const avgSettlement = data
        .filter(r => r.settlement_amount)
        .reduce((sum, r) => sum + Number(r.settlement_amount), 0) / 
        (data.filter(r => r.settlement_amount).length || 1);

      setStats({
        total,
        accepted,
        conversionRate: total > 0 ? (accepted / total) * 100 : 0,
        avgSettlement,
        settlements: data.filter(r => r.settlement_amount).length,
      });
    }
    setLoading(false);
  }

  // Network averages (mock data - would come from aggregate analytics)
  const networkAverages = {
    conversionRate: 75,
    avgSettlement: 45000,
    responseTime: 8,
    caseSuccess: 80,
  };

  const yourMetrics = stats ? {
    conversionRate: stats.conversionRate,
    avgSettlement: stats.avgSettlement,
    responseTime: 6, // Mock - would track actual response times
    caseSuccess: 85, // Mock - would calculate from outcomes
  } : null;

  const radarData = yourMetrics ? [
    {
      metric: "Conversion Rate",
      you: (yourMetrics.conversionRate / networkAverages.conversionRate) * 100,
      network: 100,
    },
    {
      metric: "Avg Settlement",
      you: (yourMetrics.avgSettlement / networkAverages.avgSettlement) * 100,
      network: 100,
    },
    {
      metric: "Response Time",
      you: (networkAverages.responseTime / yourMetrics.responseTime) * 100, // Inverted - lower is better
      network: 100,
    },
    {
      metric: "Case Success",
      you: (yourMetrics.caseSuccess / networkAverages.caseSuccess) * 100,
      network: 100,
    },
  ] : [];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading performance data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Performance Data Yet</h3>
          <p className="text-muted-foreground">
            Accept your first referral to start tracking your performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const performanceTier = 
    yourMetrics && yourMetrics.conversionRate >= 80 ? "Elite" :
    yourMetrics && yourMetrics.conversionRate >= 70 ? "Premier" :
    yourMetrics && yourMetrics.conversionRate >= 60 ? "Standard" : "Developing";

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#b09837]/10 to-background border-[#b09837]/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-[#b09837]" />
                Your Performance Tier
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Based on conversion rate and case outcomes
              </p>
            </div>
            <Badge
              variant={performanceTier === "Elite" ? "default" : "secondary"}
              className="text-lg px-4 py-1"
            >
              {performanceTier}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {performanceTier === "Elite" && "Outstanding performance! You're in the top tier of our attorney network."}
            {performanceTier === "Premier" && "Great work! You're performing above network average."}
            {performanceTier === "Standard" && "Good performance. There's room for improvement."}
            {performanceTier === "Developing" && "Keep working on improving your acceptance and case outcomes."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                {stats.conversionRate.toFixed(1)}%
              </span>
              {stats.conversionRate >= networkAverages.conversionRate ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <Progress value={stats.conversionRate} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Network avg: {networkAverages.conversionRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Avg Settlement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">
                ${(stats.avgSettlement / 1000).toFixed(0)}k
              </span>
              {stats.avgSettlement >= networkAverages.avgSettlement ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <Progress 
              value={(stats.avgSettlement / networkAverages.avgSettlement) * 100} 
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground">
              Network avg: ${(networkAverages.avgSettlement / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">6h</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <Progress value={75} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Network avg: {networkAverages.responseTime}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Case Success
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">85%</span>
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <Progress value={85} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Network avg: {networkAverages.caseSuccess}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Comparison</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your metrics vs. network average
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 150]} />
              <Radar
                name="Your Performance"
                dataKey="you"
                stroke="#b09837"
                fill="#b09837"
                fillOpacity={0.6}
              />
              <Radar
                name="Network Average"
                dataKey="network"
                stroke="#128f8b"
                fill="#128f8b"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <TrendingUp className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">Strengths</p>
                <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                  Your response time is excellent, putting you ahead of 80% of attorneys in the
                  network. Your case success rate also exceeds the average.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <Target className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Areas for Improvement
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Focus on improving your conversion rate by carefully evaluating case quality
                  before declining. Consider accepting more cases that align with your practice areas.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[#128f8b]/5 border border-[#128f8b]/20">
              <Award className="h-5 w-5 text-[#128f8b] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Next Milestone</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Accept {Math.ceil((80 - stats.conversionRate) / 100 * stats.total)} more
                  referrals to reach Premier tier (80% conversion rate)
                </p>
                <Progress value={stats.conversionRate} max={80} className="h-2 mt-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
