import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { Activity, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";

interface HealthAnalyticsProps {
  caseId: string;
}

interface CheckinData {
  created_at: string;
  p_physical: number | null;
  p_psychological: number | null;
  p_psychosocial: number | null;
  p_professional: number | null;
  pain_scale: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  oxygen_saturation: number | null;
  temperature: number | null;
  blood_sugar: number | null;
  weight_lbs: number | null;
  bmi: number | null;
}

interface MedicationChange {
  date: string;
  medication: string;
  change: string;
}

// Helper function to convert 4P values to 1-5 scale
function normalize4PValue(value: number | null | undefined): number {
  if (value === null || value === undefined) return 3;
  // If value is 0-4 (old scale), add 1 to convert to 1-5
  if (value >= 0 && value <= 4) return value + 1;
  // If value is 0-100 (stored percentage), convert to 1-5 scale
  if (value > 4 && value <= 100) {
    return Math.max(1, Math.min(5, Math.round((value / 25) + 1)));
  }
  // If already 1-5, return as-is
  return Math.max(1, Math.min(5, value));
}

export function ClientHealthAnalytics({ caseId }: HealthAnalyticsProps) {
  const [timePeriod, setTimePeriod] = useState<"7" | "30" | "90" | "all">("30");
  const [checkins, setCheckins] = useState<CheckinData[]>([]);
  const [medications, setMedications] = useState<MedicationChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [caseId, timePeriod]);

  async function fetchData() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Calculate date filter
      let dateFilter = "";
      if (timePeriod !== "all") {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(timePeriod));
        dateFilter = `&created_at=gte.${daysAgo.toISOString()}`;
      }

      // Fetch check-ins
      const checkinsResponse = await fetch(
        `${supabaseUrl}/rest/v1/rc_client_checkins?case_id=eq.${caseId}${dateFilter}&order=created_at.asc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );

      if (checkinsResponse.ok) {
        const checkinsData = await checkinsResponse.json();
        setCheckins(checkinsData || []);
      }

      // Fetch medications (placeholder - adjust based on actual table structure)
      // Note: This is a simplified version - adjust the query based on your actual medications table
      const medsResponse = await fetch(
        `${supabaseUrl}/rest/v1/rc_medications?case_id=eq.${caseId}&order=created_at.desc&limit=50`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        }
      );

      if (medsResponse.ok) {
        const medsData = await medsResponse.json();
        // Transform medication data into change events
        // This is a placeholder - adjust based on your actual medication table structure
        const changes: MedicationChange[] = [];
        // Add logic here to track medication changes
        setMedications(changes);
      }
    } catch (err) {
      console.error("Error fetching analytics data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Prepare chart data for 4Ps
  const chartData = checkins.map((checkin) => ({
    date: format(new Date(checkin.created_at), "MMM d"),
    physical: Math.floor(normalize4PValue(checkin.p_physical)),
    psychological: Math.floor(normalize4PValue(checkin.p_psychological)),
    psychosocial: Math.floor(normalize4PValue(checkin.p_psychosocial)),
    professional: Math.floor(normalize4PValue(checkin.p_professional)),
    pain: Math.floor(checkin.pain_scale || 0),
  }));

  // Get latest vital signs
  const latestCheckin = checkins[checkins.length - 1];
  const previousCheckin = checkins[checkins.length - 2];

  // Calculate trends
  const getTrend = (current: number | null, previous: number | null) => {
    if (!current || !previous) return null;
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  // Calculate summary stats (rounded down to whole numbers)
  const avgPhysical = checkins.length > 0
    ? Math.floor(checkins.reduce((sum, c) => sum + normalize4PValue(c.p_physical), 0) / checkins.length)
    : 0;
  const avgPsychological = checkins.length > 0
    ? Math.floor(checkins.reduce((sum, c) => sum + normalize4PValue(c.p_psychological), 0) / checkins.length)
    : 0;
  const avgPsychosocial = checkins.length > 0
    ? Math.floor(checkins.reduce((sum, c) => sum + normalize4PValue(c.p_psychosocial), 0) / checkins.length)
    : 0;
  const avgProfessional = checkins.length > 0
    ? Math.floor(checkins.reduce((sum, c) => sum + normalize4PValue(c.p_professional), 0) / checkins.length)
    : 0;
  const avgPain = checkins.length > 0
    ? Math.floor(checkins.reduce((sum, c) => sum + (c.pain_scale || 0), 0) / checkins.length)
    : 0;

  if (loading) {
    return (
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardContent className="p-6">
          <p className="text-white text-center">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white text-2xl">Health Analytics</CardTitle>
          <p className="text-white/80 text-sm mt-1">
            Post-Injury Clinical Coordination: Structured tracking and documentation of how your injury and treatment affect you over time.
          </p>
        </CardHeader>
      </Card>

      {/* Time Period Selector */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              variant={timePeriod === "7" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("7")}
              className={timePeriod === "7" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              7 Days
            </Button>
            <Button
              variant={timePeriod === "30" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("30")}
              className={timePeriod === "30" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              30 Days
            </Button>
            <Button
              variant={timePeriod === "90" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("90")}
              className={timePeriod === "90" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              90 Days
            </Button>
            <Button
              variant={timePeriod === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setTimePeriod("all")}
              className={timePeriod === "all" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-white/20 border-white/30 text-white hover:bg-white/30"}
            >
              All Time
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Average Physical</p>
              <p className="text-2xl font-bold text-blue-600">{avgPhysical}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Average Psychological</p>
              <p className="text-2xl font-bold text-purple-600">{avgPsychological}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Average Psychosocial</p>
              <p className="text-2xl font-bold text-green-600">{avgPsychosocial}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Average Professional</p>
              <p className="text-2xl font-bold text-orange-600">{avgProfessional}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Average Pain</p>
              <p className="text-2xl font-bold text-red-600">{avgPain}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Check-ins Completed</p>
              <p className="text-2xl font-bold text-slate-800">{checkins.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4Ps Wellness Trends */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">4Ps Wellness Trends</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-lg p-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis domain={[1, 5]} stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="physical" stroke="#3b82f6" strokeWidth={2} name="Physical" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="psychological" stroke="#a855f7" strokeWidth={2} name="Psychological" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="psychosocial" stroke="#22c55e" strokeWidth={2} name="Psychosocial" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="professional" stroke="#f97316" strokeWidth={2} name="Professional" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-8">No data available for the selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Pain Level Trends */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Pain Level Trends</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-lg p-4">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis domain={[1, 5]} stroke="#6b7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="pain" stroke="#ef4444" strokeWidth={2} name="Pain Level" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-center py-8">No data available for the selected period</p>
          )}
        </CardContent>
      </Card>

      {/* Vital Signs Summary */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Vital Signs Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Blood Pressure */}
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Blood Pressure</p>
                <p className="text-lg font-semibold text-slate-800">
                  {latestCheckin?.blood_pressure_systolic && latestCheckin?.blood_pressure_diastolic
                    ? `${latestCheckin.blood_pressure_systolic}/${latestCheckin.blood_pressure_diastolic}`
                    : "—"}
                </p>
                {latestCheckin?.blood_pressure_systolic && previousCheckin?.blood_pressure_systolic && (
                  <div className="mt-2">{getTrend(latestCheckin.blood_pressure_systolic, previousCheckin.blood_pressure_systolic)}</div>
                )}
              </CardContent>
            </Card>

            {/* Heart Rate */}
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Heart Rate</p>
                <p className="text-lg font-semibold text-slate-800">
                  {latestCheckin?.heart_rate ? `${latestCheckin.heart_rate} bpm` : "—"}
                </p>
                {latestCheckin?.heart_rate && previousCheckin?.heart_rate && (
                  <div className="mt-2">{getTrend(latestCheckin.heart_rate, previousCheckin.heart_rate)}</div>
                )}
              </CardContent>
            </Card>

            {/* Oxygen Saturation */}
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">O2 Saturation</p>
                <p className="text-lg font-semibold text-slate-800">
                  {latestCheckin?.oxygen_saturation ? `${latestCheckin.oxygen_saturation}%` : "—"}
                </p>
                {latestCheckin?.oxygen_saturation && previousCheckin?.oxygen_saturation && (
                  <div className="mt-2">{getTrend(latestCheckin.oxygen_saturation, previousCheckin.oxygen_saturation)}</div>
                )}
              </CardContent>
            </Card>

            {/* Temperature */}
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Temperature</p>
                <p className="text-lg font-semibold text-slate-800">
                  {latestCheckin?.temperature ? `${latestCheckin.temperature}°F` : "—"}
                </p>
                {latestCheckin?.temperature && previousCheckin?.temperature && (
                  <div className="mt-2">{getTrend(latestCheckin.temperature, previousCheckin.temperature)}</div>
                )}
              </CardContent>
            </Card>

            {/* Blood Sugar */}
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Blood Sugar</p>
                <p className="text-lg font-semibold text-slate-800">
                  {latestCheckin?.blood_sugar ? `${latestCheckin.blood_sugar} mg/dL` : "—"}
                </p>
                {latestCheckin?.blood_sugar && previousCheckin?.blood_sugar && (
                  <div className="mt-2">{getTrend(latestCheckin.blood_sugar, previousCheckin.blood_sugar)}</div>
                )}
              </CardContent>
            </Card>

            {/* Weight */}
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">Weight</p>
                <p className="text-lg font-semibold text-slate-800">
                  {latestCheckin?.weight_lbs ? `${latestCheckin.weight_lbs} lbs` : "—"}
                </p>
                {latestCheckin?.weight_lbs && previousCheckin?.weight_lbs && (
                  <div className="mt-2">{getTrend(latestCheckin.weight_lbs, previousCheckin.weight_lbs)}</div>
                )}
              </CardContent>
            </Card>

            {/* BMI */}
            <Card className="bg-white">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-1">BMI</p>
                <p className="text-lg font-semibold text-slate-800">
                  {latestCheckin?.bmi ? latestCheckin.bmi.toFixed(1) : "—"}
                </p>
                {latestCheckin?.bmi && previousCheckin?.bmi && (
                  <div className="mt-2">{getTrend(latestCheckin.bmi, previousCheckin.bmi)}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Medication Timeline */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Medication Timeline</CardTitle>
        </CardHeader>
        <CardContent className="bg-white rounded-lg p-4">
          {medications.length > 0 ? (
            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                  <div className="text-sm text-slate-500 w-24">{format(new Date(med.date), "MMM d, yyyy")}</div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{med.medication}</p>
                    <p className="text-sm text-slate-600">{med.change}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">No medication changes recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
