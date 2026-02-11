import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface CheckinData {
  created_at: string;
  pain_scale: number;
  depression_scale: number;
  anxiety_scale: number;
  p_physical: number;
  p_psychological: number;
  p_psychosocial: number;
  p_purpose: number;
}

interface WellnessTrendChartProps {
  checkins: CheckinData[];
}

export const WellnessTrendChart = ({ checkins }: WellnessTrendChartProps) => {
  const chartData = checkins
    .slice(-14) // Last 14 check-ins
    .map((checkin) => ({
      date: format(new Date(checkin.created_at), 'MMM dd'),
      pain: checkin.pain_scale,
      depression: checkin.depression_scale,
      anxiety: checkin.anxiety_scale,
      wellness: Math.round(
        (checkin.p_physical + checkin.p_psychological + checkin.p_psychosocial + checkin.p_purpose) / 4
      ),
    }));

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Wellness Trends (Last 14 Check-ins)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <YAxis 
              domain={[0, 100]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="wellness" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              name="Overall Wellness"
              dot={{ fill: 'hsl(var(--primary))' }}
            />
            <Line 
              type="monotone" 
              dataKey="pain" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Pain Level"
              dot={{ fill: '#ef4444' }}
            />
            <Line 
              type="monotone" 
              dataKey="depression" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Depression"
              dot={{ fill: '#8b5cf6' }}
            />
            <Line 
              type="monotone" 
              dataKey="anxiety" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Anxiety"
              dot={{ fill: '#f59e0b' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
