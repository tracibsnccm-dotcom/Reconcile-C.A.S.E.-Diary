import { useMemo } from "react";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { ClientCheckin } from "@/hooks/useClientCheckins";

interface CheckinChartProps {
  checkins: ClientCheckin[];
  maxEntries?: number;
  title?: string;
}

export function CheckinChart({ checkins, maxEntries = 7, title = "Recent Trend" }: CheckinChartProps) {
  const chartData = useMemo(() => {
    const recentCheckins = checkins.slice(0, maxEntries).reverse();
    
    return recentCheckins.map(checkin => ({
      date: format(new Date(checkin.created_at), 'MMM dd'),
      fullDate: format(new Date(checkin.created_at), 'PPp'),
      pain: checkin.pain_scale,
      physical: checkin.p_physical,
      psychological: checkin.p_psychological,
      psychosocial: checkin.p_psychosocial,
      purpose: checkin.p_purpose,
    }));
  }, [checkins, maxEntries]);

  if (chartData.length === 0) {
    return (
      <Card className="p-4 border-border">
        <p className="text-sm text-muted-foreground text-center">No check-in data yet</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-border">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend 
            wrapperStyle={{
              fontSize: '12px',
              color: 'hsl(var(--foreground))',
            }}
          />
          <Line 
            type="monotone" 
            dataKey="pain" 
            name="Pain (0-10)" 
            stroke="hsl(var(--destructive))" 
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
