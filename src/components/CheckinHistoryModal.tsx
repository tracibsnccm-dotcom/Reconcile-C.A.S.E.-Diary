import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Download, Printer } from "lucide-react";
import { fetchCheckinTrends, CheckinTrend } from "@/hooks/useClientCheckins";
import { toast } from "sonner";

interface CheckinHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
}

export function CheckinHistoryModal({ open, onOpenChange, caseId }: CheckinHistoryModalProps) {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [range, setRange] = useState<30 | 90 | 180>(90);
  const [trends, setTrends] = useState<CheckinTrend[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && caseId) {
      loadTrends();
    }
  }, [open, caseId, period, range]);

  async function loadTrends() {
    setLoading(true);
    try {
      const data = await fetchCheckinTrends(caseId, period, range);
      setTrends(data);
    } catch (error: any) {
      toast.error("Failed to load trends: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = trends.map(trend => ({
    date: format(new Date(trend.bucket), period === 'day' ? 'MMM dd' : period === 'week' ? 'MMM dd' : 'MMM yyyy'),
    fullDate: format(new Date(trend.bucket), 'PPP'),
    pain: Number(trend.pain_avg),
    depression: Number(trend.depression_avg),
    anxiety: Number(trend.anxiety_avg),
    physical: trend.physical_avg,
    psychological: trend.psychological_avg,
    psychosocial: trend.psychosocial_avg,
    purpose: trend.purpose_avg,
    count: trend.n,
  }));

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    const csv = [
      ['Date', 'Pain Avg', 'Depression Avg', 'Anxiety Avg', 'Physical', 'Psychological', 'Psychosocial', 'Purpose', 'Count'],
      ...chartData.map(row => [
        row.fullDate,
        row.pain,
        row.depression || '',
        row.anxiety || '',
        row.physical,
        row.psychological,
        row.psychosocial,
        row.purpose,
        row.count,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkin-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Chart data exported");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Check-in History</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-4 items-center">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Time Range</label>
              <Tabs value={range.toString()} onValueChange={(v) => setRange(Number(v) as 30 | 90 | 180)}>
                <TabsList>
                  <TabsTrigger value="30">30 Days</TabsTrigger>
                  <TabsTrigger value="90">90 Days</TabsTrigger>
                  <TabsTrigger value="180">180 Days</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Grouping</label>
              <Tabs value={period} onValueChange={(v) => setPeriod(v as 'day' | 'week' | 'month')}>
                <TabsList>
                  <TabsTrigger value="day">Daily</TabsTrigger>
                  <TabsTrigger value="week">Weekly</TabsTrigger>
                  <TabsTrigger value="month">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading trends...</div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No data available for selected range</div>
          ) : (
            <>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Mental Health Scales</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        domain={[0, 10]}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="pain" name="Pain" stroke="hsl(var(--destructive))" strokeWidth={2} />
                      <Line type="monotone" dataKey="depression" name="Depression" stroke="#6366f1" strokeWidth={2} />
                      <Line type="monotone" dataKey="anxiety" name="Anxiety" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">4P's Assessment Trends</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="physical" name="Physical" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="psychological" name="Psychological" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="psychosocial" name="Psychosocial" stroke="#8b5cf6" strokeWidth={2} />
                      <Line type="monotone" dataKey="purpose" name="Purpose" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Showing {period === 'day' ? 'daily' : period === 'week' ? 'weekly' : 'monthly'} averages 
                over the last {range} days ({chartData.length} data points)
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
