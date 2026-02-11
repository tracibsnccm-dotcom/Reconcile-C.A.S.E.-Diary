import { AppLayout } from "@/components/AppLayout";
import { KPI } from "@/components/KPI";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Download, FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { format, subDays, startOfYear } from "date-fns";
import { toast } from "sonner";

export default function Insights() {
  const { cases } = useApp();
  const [dateRange, setDateRange] = useState("30");

  const getDateRangeStart = () => {
    switch (dateRange) {
      case "30": return subDays(new Date(), 30);
      case "90": return subDays(new Date(), 90);
      case "ytd": return startOfYear(new Date());
      default: return subDays(new Date(), 30);
    }
  };

  const startDate = getDateRangeStart();

  // Calculate metrics
  const avgTimeToSettlement = "42 days"; // Mock data
  const avgProviderResponseTime = "3.2 days"; // Mock data
  const reportsReviewed = cases.filter(c => c.status === "IN_PROGRESS").length;
  const openFollowUps = cases.filter(c => c.status === "IN_PROGRESS" || c.status === "ROUTED").length;

  const exportData = (format: 'csv' | 'pdf') => {
    toast.success(`Exporting insights as ${format.toUpperCase()}...`);
    // Implementation would generate actual export
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
            <p className="text-muted-foreground mt-1">Performance metrics and trends</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 Days</SelectItem>
                <SelectItem value="90">Last 90 Days</SelectItem>
                <SelectItem value="ytd">Year to Date</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => exportData('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportData('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPI
            label="Avg. Time to Settlement"
            value={avgTimeToSettlement}
            note="Personal injury cases"
          />
          <KPI
            label="Provider Response Time"
            value={avgProviderResponseTime}
            note="Median: 2.8 days"
          />
          <KPI
            label="Reports Reviewed"
            value={reportsReviewed.toString()}
            note={`In last ${dateRange} days`}
          />
          <KPI
            label="Open Follow-Ups"
            value={openFollowUps.toString()}
            note="Requires attention"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[hsl(var(--rcms-teal))]" />
                Case Timeline Analytics
              </CardTitle>
              <CardDescription>Average duration by stage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Intake → Clinical Review</span>
                  <span className="font-semibold">5.2 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Clinical Review → Reports</span>
                  <span className="font-semibold">12.8 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Reports → Negotiation</span>
                  <span className="font-semibold">18.5 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Negotiation → Settlement</span>
                  <span className="font-semibold">23.1 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Follow-Ups by Stage
              </CardTitle>
              <CardDescription>Current distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pending Initial Review</span>
                  <span className="font-semibold">{Math.floor(openFollowUps * 0.3)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Awaiting Provider Response</span>
                  <span className="font-semibold">{Math.floor(openFollowUps * 0.4)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">In Negotiation</span>
                  <span className="font-semibold">{Math.floor(openFollowUps * 0.2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Final Documentation</span>
                  <span className="font-semibold">{Math.floor(openFollowUps * 0.1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
