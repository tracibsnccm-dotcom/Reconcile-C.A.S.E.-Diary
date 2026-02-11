import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, TrendingUp, Users, DollarSign } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#b09837", "#128f8b", "#0f2a6a", "#ef4444", "#8b5cf6"];

export function ReferralSourceTracking() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadReferrals();
  }, [user]);

  async function loadReferrals() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("attorney_id", user.id)
      .order("referral_date", { ascending: false });

    if (!error) {
      setReferrals(data || []);
    }
    setLoading(false);
  }

  // Mock source data - in production, this would come from referral metadata
  const sourceData = [
    { source: "Direct Intake", count: Math.floor(referrals.length * 0.4), value: 40 },
    { source: "Partner Law Firm", count: Math.floor(referrals.length * 0.25), value: 25 },
    { source: "Medical Provider", count: Math.floor(referrals.length * 0.20), value: 20 },
    { source: "Client Referral", count: Math.floor(referrals.length * 0.10), value: 10 },
    { source: "Other", count: Math.floor(referrals.length * 0.05), value: 5 },
  ].filter(s => s.count > 0);

  const geographicData = [
    { region: "Northeast", cases: Math.floor(referrals.length * 0.30) },
    { region: "Southeast", cases: Math.floor(referrals.length * 0.25) },
    { region: "Midwest", cases: Math.floor(referrals.length * 0.20) },
    { region: "Southwest", cases: Math.floor(referrals.length * 0.15) },
    { region: "West", cases: Math.floor(referrals.length * 0.10) },
  ].filter(r => r.cases > 0);

  const topSources = sourceData.slice(0, 3);

  const totalSettlements = referrals
    .filter(r => r.settlement_amount)
    .reduce((sum, r) => sum + Number(r.settlement_amount), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading source tracking data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#b09837]/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#b09837]" />
            Referral Source Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track where your referrals are coming from and identify your most valuable
            referral sources to strengthen strategic partnerships.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sourceData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active referral channels</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topSources[0]?.source || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {topSources[0]?.count || 0} referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Top Region
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{geographicData[0]?.region || "N/A"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {geographicData[0]?.cases || 0} cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalSettlements.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From all sources</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.source} (${entry.value}%)`}
                  >
                    {sourceData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No source data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {geographicData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={geographicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cases" fill="#128f8b" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No geographic data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Referrals</TableHead>
                <TableHead className="text-right">Percentage</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceData.length > 0 ? (
                sourceData.map((source, index) => (
                  <TableRow key={source.source}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        {source.source}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{source.count}</TableCell>
                    <TableCell className="text-right">{source.value}%</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        {index === 0 ? "Top Source" : "Active"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No source data available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-[#128f8b]/20 bg-[#128f8b]/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-[#128f8b] flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-[#128f8b]">Insights & Recommendations:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Focus on strengthening relationships with your top referral sources</li>
                <li>Consider expanding in regions with lower referral volume</li>
                <li>Track settlement outcomes by source to identify quality indicators</li>
                <li>Develop marketing strategies targeting underperforming sources</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
