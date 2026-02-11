import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";
import { differenceInDays, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

export default function CaseAnalyticsInsights() {
  const { cases } = useApp();

  const statusData = useMemo(() => {
    const statusCounts = cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const monthlyVolumeData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });
    return months.map(month => {
      const monthCases = cases.filter(c => {
        const caseDate = new Date(c.createdAt);
        return caseDate >= startOfMonth(month) && caseDate <= endOfMonth(month);
      });
      return {
        month: format(month, 'MMM'),
        cases: monthCases.length,
        closed: monthCases.filter(c => c.status === 'CLOSED').length
      };
    });
  }, [cases]);

  const metrics = useMemo(() => {
    const activeCases = cases.filter(c => c.status !== 'CLOSED');
    const closedCases = cases.filter(c => c.status === 'CLOSED');
    const avgResolutionTime = closedCases.length > 0
      ? Math.round(closedCases.reduce((sum, c) => 
          sum + differenceInDays(new Date(c.updatedAt || c.createdAt), new Date(c.createdAt)), 0
        ) / closedCases.length)
      : 0;
    return {
      active: activeCases.length,
      closed: closedCases.length,
      avgResolution: avgResolutionTime,
      closureRate: cases.length > 0 ? Math.round((closedCases.length / cases.length) * 100) : 0
    };
  }, [cases]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.active}</p>
              <p className="text-xs text-muted-foreground">Active Cases</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.closed}</p>
              <p className="text-xs text-muted-foreground">Closed Cases</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.avgResolution}d</p>
              <p className="text-xs text-muted-foreground">Avg Resolution</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <AlertTriangle className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{metrics.closureRate}%</p>
              <p className="text-xs text-muted-foreground">Closure Rate</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="volume">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="volume">Volume Trends</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
        </TabsList>
        <TabsContent value="volume">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Case Volume Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="cases" stroke="hsl(var(--primary))" strokeWidth={2} name="Total Cases" />
                <Line type="monotone" dataKey="closed" stroke="hsl(var(--success))" strokeWidth={2} name="Closed Cases" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
        <TabsContent value="status">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Case Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
