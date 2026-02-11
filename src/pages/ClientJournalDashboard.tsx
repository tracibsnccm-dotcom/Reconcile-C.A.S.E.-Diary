import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Brain, Heart } from "lucide-react";

// Mock data - in production, this would come from your Google Sheet
const mockJournalData = [
  { week: "Week 1", date: "2025-01-01", pain: 7, depression: 18, anxiety: 16, stress_total: 8 },
  { week: "Week 2", date: "2025-01-08", pain: 6, depression: 16, anxiety: 14, stress_total: 7 },
  { week: "Week 3", date: "2025-01-15", pain: 5, depression: 14, anxiety: 12, stress_total: 6 },
  { week: "Week 4", date: "2025-01-22", pain: 4, depression: 11, anxiety: 10, stress_total: 5 },
  { week: "Week 5", date: "2025-01-29", pain: 4, depression: 9, anxiety: 8, stress_total: 4 },
  { week: "Week 6", date: "2025-02-05", pain: 3, depression: 7, anxiety: 6, stress_total: 3 },
];

// PHQ-9 categories
function getDepressionCategory(score: number | null): string {
  if (score === null) return "No Data";
  if (score >= 20) return "Severe";
  if (score >= 15) return "Moderately Severe";
  if (score >= 10) return "Moderate";
  if (score >= 5) return "Mild";
  return "Minimal";
}

// GAD-7 categories
function getAnxietyCategory(score: number | null): string {
  if (score === null) return "No Data";
  if (score >= 15) return "Severe";
  if (score >= 10) return "Moderate";
  if (score >= 5) return "Mild";
  return "Minimal";
}

// Calculate 7-day moving average
function calculateMovingAverage(data: number[], window: number = 7): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(Math.round(avg * 10) / 10);
  }
  return result;
}

export default function ClientJournalDashboard() {
  // Calculate moving averages
  const depressionScores = mockJournalData.map(d => d.depression);
  const anxietyScores = mockJournalData.map(d => d.anxiety);
  const depressionMA = calculateMovingAverage(depressionScores);
  const anxietyMA = calculateMovingAverage(anxietyScores);

  const trendData = mockJournalData.map((d, i) => ({
    ...d,
    depressionMA: depressionMA[i],
    anxietyMA: anxietyMA[i],
  }));

  // Calculate positive screening rates (≥10 threshold)
  const depressionPositiveRate = Math.round(
    (depressionScores.filter(s => s >= 10).length / depressionScores.length) * 100
  );
  const anxietyPositiveRate = Math.round(
    (anxietyScores.filter(s => s >= 10).length / anxietyScores.length) * 100
  );

  // Current scores
  const latest = mockJournalData[mockJournalData.length - 1];
  const previous = mockJournalData[mockJournalData.length - 2];

  // Category distribution
  const depressionDist = mockJournalData.reduce((acc, d) => {
    const cat = getDepressionCategory(d.depression);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const anxietyDist = mockJournalData.reduce((acc, d) => {
    const cat = getAnxietyCategory(d.anxiety);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const depressionPieData = Object.entries(depressionDist).map(([name, value]) => ({
    name,
    value,
  }));

  const anxietyPieData = Object.entries(anxietyDist).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = {
    Minimal: "hsl(var(--chart-1))",
    Mild: "hsl(var(--chart-2))",
    Moderate: "hsl(var(--chart-3))",
    "Moderately Severe": "hsl(var(--chart-4))",
    Severe: "hsl(var(--chart-5))",
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Journal Analytics</h1>
          <p className="text-muted-foreground">
            Track mental health scores, trends, and screening rates over time
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Depression Score</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latest.depression}</div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={latest.depression < previous.depression ? "default" : "secondary"}>
                  {getDepressionCategory(latest.depression)}
                </Badge>
                {latest.depression < previous.depression ? (
                  <div className="flex items-center text-emerald-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {previous.depression - latest.depression} points
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {latest.depression - previous.depression} points
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Anxiety Score</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latest.anxiety}</div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={latest.anxiety < previous.anxiety ? "default" : "secondary"}>
                  {getAnxietyCategory(latest.anxiety)}
                </Badge>
                {latest.anxiety < previous.anxiety ? (
                  <div className="flex items-center text-emerald-600">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    {previous.anxiety - latest.anxiety} points
                  </div>
                ) : (
                  <div className="flex items-center text-amber-600">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {latest.anxiety - previous.anxiety} points
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pain Level</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latest.pain}/10</div>
              <p className="text-xs text-muted-foreground">
                {latest.pain < previous.pain ? "Improving" : "Monitoring"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stress Level</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latest.stress_total}/10</div>
              <p className="text-xs text-muted-foreground">
                {latest.stress_total < previous.stress_total ? "Decreasing" : "Stable"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends">Trends & Moving Averages</TabsTrigger>
            <TabsTrigger value="distribution">Category Distribution</TabsTrigger>
            <TabsTrigger value="screening">Screening Rates</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Depression Trend (PHQ-9)</CardTitle>
                  <CardDescription>
                    Weekly scores with 7-day moving average
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 27]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="depression"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        name="Depression Score"
                      />
                      <Line
                        type="monotone"
                        dataKey="depressionMA"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="7-Day MA"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Anxiety Trend (GAD-7)</CardTitle>
                  <CardDescription>
                    Weekly scores with 7-day moving average
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 21]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="anxiety"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        name="Anxiety Score"
                      />
                      <Line
                        type="monotone"
                        dataKey="anxietyMA"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="7-Day MA"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Symptoms Over Time</CardTitle>
                <CardDescription>
                  Comprehensive view of pain, depression, anxiety, and stress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockJournalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="pain"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      name="Pain (0-10)"
                    />
                    <Line
                      type="monotone"
                      dataKey="depression"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      name="Depression (PHQ-9)"
                    />
                    <Line
                      type="monotone"
                      dataKey="anxiety"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      name="Anxiety (GAD-7)"
                    />
                    <Line
                      type="monotone"
                      dataKey="stress_total"
                      stroke="hsl(var(--chart-4))"
                      strokeWidth={2}
                      name="Stress (0-10)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Depression Severity Distribution</CardTitle>
                  <CardDescription>
                    Based on PHQ-9 clinical cutoffs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={depressionPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {depressionPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.name as keyof typeof COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Anxiety Severity Distribution</CardTitle>
                  <CardDescription>
                    Based on GAD-7 clinical cutoffs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={anxietyPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {anxietyPieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[entry.name as keyof typeof COLORS]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="screening" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Positive Screening Rates</CardTitle>
                <CardDescription>
                  Percentage of entries with scores ≥10 (clinical threshold)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { name: "Depression (PHQ-9 ≥10)", rate: depressionPositiveRate },
                      { name: "Anxiety (GAD-7 ≥10)", rate: anxietyPositiveRate },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} label={{ value: "Positive Rate (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="rate" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <strong>Depression:</strong> {depressionPositiveRate}% of entries indicate
                    moderate or higher depression (≥10 on PHQ-9)
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Anxiety:</strong> {anxietyPositiveRate}% of entries indicate
                    moderate or higher anxiety (≥10 on GAD-7)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Source Note */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">📊 Data Integration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              This dashboard currently displays mock data for demonstration purposes. 
            </p>
            <p>
              <strong>To connect to your Google Sheet:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Export your "Submissions" sheet data to a JSON endpoint (Google Apps Script or API)</li>
              <li>Replace mockJournalData with a fetch call to your endpoint</li>
              <li>Use React Query or SWR for automatic data refreshing</li>
            </ol>
            <p className="text-xs mt-2">
              All calculations (PHQ-9/GAD-7 categories, moving averages, screening rates) 
              are implemented and will work with real data.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
