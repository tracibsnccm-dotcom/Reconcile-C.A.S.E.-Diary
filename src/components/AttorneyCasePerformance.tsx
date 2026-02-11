import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Clock, Target, CheckCircle2, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export function AttorneyCasePerformance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [caseStats, setCaseStats] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadPerformanceMetrics();
    loadCaseStats();
  }, [user]);

  async function loadPerformanceMetrics() {
    if (!user) return;

    try {
      // Get attorney metadata
      const { data: metadata } = await supabase
        .from("attorney_metadata")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      // Get cases count
      const { data: cases } = await supabase
        .from("case_assignments")
        .select("case_id, cases(*)")
        .eq("user_id", user.id)
        .eq("role", "ATTORNEY");

      // Get assignment offers stats
      const { data: offers } = await supabase
        .from("assignment_offers")
        .select("status")
        .eq("attorney_id", user.id);

      const acceptedOffers = offers?.filter(o => o.status === "accepted").length || 0;
      const declinedOffers = offers?.filter(o => o.status === "declined").length || 0;
      const totalOffers = offers?.length || 0;
      const acceptanceRate = totalOffers > 0 ? ((acceptedOffers / totalOffers) * 100).toFixed(1) : "0";

      setMetrics({
        activeCases: cases?.length || 0,
        capacity: metadata?.capacity_available || 0,
        capacityLimit: metadata?.capacity_limit || 10,
        acceptanceRate,
        totalReferrals: totalOffers,
        accepted: acceptedOffers,
        declined: declinedOffers,
      });
    } catch (error) {
      console.error("Error loading performance metrics:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCaseStats() {
    if (!user) return;

    try {
      const { data: cases } = await supabase
        .from("case_assignments")
        .select(`
          case_id,
          cases!inner(status, created_at)
        `)
        .eq("user_id", user.id)
        .eq("role", "ATTORNEY");

      if (cases) {
        // Group by month
        const monthlyData: { [key: string]: number } = {};
        cases.forEach((c: any) => {
          const month = new Date(c.cases.created_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          monthlyData[month] = (monthlyData[month] || 0) + 1;
        });

        const chartData = Object.entries(monthlyData).map(([month, count]) => ({
          month,
          cases: count,
        }));

        setCaseStats(chartData);
      }
    } catch (error) {
      console.error("Error loading case stats:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const pieData = [
    { name: "Accepted", value: metrics?.accepted || 0 },
    { name: "Declined", value: metrics?.declined || 0 },
  ];

  const capacityUsage = metrics?.capacityLimit > 0
    ? ((metrics.activeCases / metrics.capacityLimit) * 100).toFixed(0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Cases</p>
              <p className="text-2xl font-bold">{metrics?.activeCases || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Acceptance Rate</p>
              <p className="text-2xl font-bold">{metrics?.acceptanceRate}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Capacity Used</p>
              <p className="text-2xl font-bold">{capacityUsage}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <p className="text-2xl font-bold">{metrics?.totalReferrals || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Case Volume Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Case Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {caseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={caseStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No case data available
              </p>
            )}
          </CardContent>
        </Card>

        {/* Referral Acceptance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Referral Acceptance</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No referral data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Capacity Available</span>
            <span className="font-semibold">{metrics?.capacity || 0} slots remaining</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Accepted Referrals</span>
            <span className="font-semibold">{metrics?.accepted || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Declined Referrals</span>
            <span className="font-semibold">{metrics?.declined || 0}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
