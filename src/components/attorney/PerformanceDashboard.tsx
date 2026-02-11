import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Award, Target, Clock, CheckCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function PerformanceDashboard() {
  const { cases } = useApp();

  const metrics = useMemo(() => {
    const activeCases = cases.filter(c => c.status !== 'CLOSED').length;
    const closedCases = cases.filter(c => c.status === 'CLOSED').length;
    const totalCases = cases.length;
    
    return {
      activeCases,
      closedCases,
      closureRate: totalCases > 0 ? Math.round((closedCases / totalCases) * 100) : 0,
      clientSatisfaction: 92
    };
  }, [cases]);

  const comparisonData = [
    { metric: 'Closure Rate', you: metrics.closureRate, firmAvg: 65, topPerformer: 85 },
    { metric: 'Response Time', you: 85, firmAvg: 70, topPerformer: 95 },
    { metric: 'Client Satisfaction', you: metrics.clientSatisfaction, firmAvg: 85, topPerformer: 97 }
  ];

  const skillsData = [
    { skill: 'Case Management', score: 85, benchmark: 75 },
    { skill: 'Client Communication', score: 92, benchmark: 80 },
    { skill: 'Documentation', score: 88, benchmark: 78 }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">88</h2>
            <p className="text-sm text-muted-foreground">Overall Performance Score</p>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">+5 from last month</span>
            </div>
          </div>
          <div className="p-4 rounded-full bg-primary/20">
            <Award className="h-12 w-12 text-primary" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <Badge variant="secondary">On Track</Badge>
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics.closureRate}%</p>
          <p className="text-sm text-muted-foreground">Closure Rate</p>
          <Progress value={metrics.closureRate} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <Badge variant="default">Excellent</Badge>
          </div>
          <p className="text-2xl font-bold text-foreground">{metrics.clientSatisfaction}%</p>
          <p className="text-sm text-muted-foreground">Client Satisfaction</p>
          <Progress value={metrics.clientSatisfaction} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <Badge variant="secondary">Good</Badge>
          </div>
          <p className="text-2xl font-bold text-foreground">18h</p>
          <p className="text-sm text-muted-foreground">Avg Response Time</p>
          <Progress value={75} className="mt-2" />
        </Card>
      </div>

      <Tabs defaultValue="comparison">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="comparison">Peer Comparison</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance vs. Firm Benchmarks</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="metric" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="you" fill="hsl(var(--primary))" name="Your Performance" />
                <Bar dataKey="firmAvg" fill="hsl(var(--secondary))" name="Firm Average" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="skills">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Skills Performance Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="skill" stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Radar name="Your Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
