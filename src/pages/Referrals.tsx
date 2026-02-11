import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, TrendingUp, PieChart, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { ReferralsDashboardWidget } from "@/components/ReferralsDashboardWidget";
import { ReferralWalletBanner } from "@/components/ReferralWalletBanner";
import { PendingAssignmentsView } from "@/components/PendingAssignmentsView";
import { RequestReferralView } from "@/components/RequestReferralView";
import { AttorneyAssignmentHistory } from "@/components/AttorneyAssignmentHistory";
import { ReferralFeeCalculator } from "@/components/ReferralFeeCalculator";
import { SettlementReportingForm } from "@/components/SettlementReportingForm";
import { ReferralAgreementViewer } from "@/components/ReferralAgreementViewer";
import { ReferralSourceTracking } from "@/components/ReferralSourceTracking";
import { PerformanceBenchmarking } from "@/components/PerformanceBenchmarking";

interface Referral {
  id: string;
  case_id: string;
  referral_date: string;
  acceptance_status: string;
  settlement_amount: number | null;
  admin_fee_charged: number;
  payment_status: string;
  notes: string | null;
}

const COLORS = ["#b09837", "#128f8b", "#0f2a6a", "#ef4444"];

export default function Referrals() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!user) return;
    loadReferrals();
  }, [user, statusFilter, startDate, endDate]);

  async function loadReferrals() {
    if (!user) return;

    setLoading(true);

    let query = supabase
      .from("referrals")
      .select("*")
      .eq("attorney_id", user.id)
      .order("referral_date", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("acceptance_status", statusFilter as any);
    }

    if (startDate) {
      query = query.gte("referral_date", startDate);
    }

    if (endDate) {
      query = query.lte("referral_date", endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading referrals:", error);
    } else {
      setReferrals(data || []);
    }

    setLoading(false);
  }


  const statusData = [
    { name: "Accepted", value: referrals.filter((r) => r.acceptance_status === "accepted").length },
    { name: "Declined", value: referrals.filter((r) => r.acceptance_status === "declined").length },
    { name: "Pending", value: referrals.filter((r) => r.acceptance_status === "pending").length },
    { name: "Settled", value: referrals.filter((r) => r.acceptance_status === "settled").length },
  ];

  const monthlyData = referrals.reduce((acc: any[], ref) => {
    const month = new Date(ref.referral_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
    const existing = acc.find((item) => item.month === month);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, []);

  const settlementData = referrals
    .filter((r) => r.settlement_amount)
    .reduce((acc: any[], ref) => {
      const month = new Date(ref.referral_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      const existing = acc.find((item) => item.month === month);
      if (existing) {
        existing.amount += Number(ref.settlement_amount);
      } else {
        acc.push({ month, amount: Number(ref.settlement_amount) });
      }
      return acc;
    }, []);

  const totalAccepted = referrals.filter((r) => r.acceptance_status === "accepted").length;
  const conversionRate = referrals.length > 0 ? (totalAccepted / referrals.length) * 100 : 0;
  const avgSettlement =
    referrals.filter((r) => r.settlement_amount).length > 0
      ? referrals
          .filter((r) => r.settlement_amount)
          .reduce((sum, r) => sum + Number(r.settlement_amount), 0) /
        referrals.filter((r) => r.settlement_amount).length
      : 0;
  const totalFees = totalAccepted * 1500;

  return (
    <AppLayout>
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold">Referrals</h1>
          <p className="text-muted-foreground mt-1">
            Manage client referrals, assignments, and coordination services
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="request">Request</TabsTrigger>
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="settlement">Settlement</TabsTrigger>
              <TabsTrigger value="agreement">Agreement</TabsTrigger>
              <TabsTrigger value="sources">Sources</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="wallet">eWallet</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <ReferralsDashboardWidget />

            <Card className="bg-[#b09837]/5 border-[#b09837]/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-[#b09837] flex-shrink-0 mt-0.5" />
                  <p className="text-sm">
                    <strong>Reconcile C.A.R.E.</strong> provides verified client referrals
                    following full intake and consent completion. The Administrative
                    Coordination & Case Transfer Fee is non-refundable once the referral is
                    released.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Conversion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-[#b09837]">
                    {conversionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAccepted} / {referrals.length} accepted
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg Settlement Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${avgSettlement.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Per settled case</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lifetime Referral Value
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    $
                    {referrals
                      .filter((r) => r.settlement_amount)
                      .reduce((sum, r) => sum + Number(r.settlement_amount), 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Total settlements</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Admin Fees Paid
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalFees.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalAccepted} × $1,500
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Referral Details</CardTitle>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger id="status-filter">
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="settled">Settled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="flex-1">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Loading...</p>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No referrals found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Referral Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Settlement $</TableHead>
                        <TableHead>Fee Charged</TableHead>
                        <TableHead>Payment Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {referrals.map((ref) => (
                        <TableRow key={ref.id}>
                          <TableCell className="font-medium">
                            RC-{ref.case_id.slice(-8).toUpperCase()}
                          </TableCell>
                          <TableCell>
                            {new Date(ref.referral_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ref.acceptance_status === "accepted"
                                  ? "default"
                                  : ref.acceptance_status === "declined"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {ref.acceptance_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ref.settlement_amount
                              ? `$${Number(ref.settlement_amount).toLocaleString()}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>${Number(ref.admin_fee_charged).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={ref.payment_status === "paid" ? "default" : "secondary"}
                            >
                              {ref.payment_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <PendingAssignmentsView />
          </TabsContent>

          <TabsContent value="request" className="space-y-6">
            <RequestReferralView />
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <ReferralFeeCalculator />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <AttorneyAssignmentHistory />
          </TabsContent>

          <TabsContent value="settlement" className="space-y-6">
            <SettlementReportingForm />
          </TabsContent>

          <TabsContent value="agreement" className="space-y-6">
            <ReferralAgreementViewer />
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <ReferralSourceTracking />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceBenchmarking />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-[#b09837]" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RePieChart>
                      <Pie
                        data={statusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[#128f8b]" />
                    Referrals per Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#b09837" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Settlement Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={settlementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#128f8b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <ReferralWalletBanner />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
