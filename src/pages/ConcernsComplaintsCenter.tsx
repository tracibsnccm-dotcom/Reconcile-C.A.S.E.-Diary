import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConcernsLogTable } from "@/components/ConcernsLogTable";
import { ComplaintsLogTable } from "@/components/ComplaintsLogTable";
import { ConcernComplaintFilters } from "@/components/ConcernComplaintFilters";
import { AlertTriangle, FileText, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Metrics {
  newConcerns48hrs: number;
  openComplaints: number;
  resolvedThisMonth: number;
  avgResolutionTime: number;
}

export default function ConcernsComplaintsCenter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [metrics, setMetrics] = useState<Metrics>({
    newConcerns48hrs: 0,
    openComplaints: 0,
    resolvedThisMonth: 0,
    avgResolutionTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    dateRange: "all",
    role: "all",
    type: "all",
  });
  const { toast } = useToast();
  
  // Get tab and ID from URL params
  const activeTab = searchParams.get('tab') || 'concerns';
  const highlightId = searchParams.get('id');

  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscriptions
    const concernsChannel = supabase
      .channel("concerns-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "concerns",
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    const complaintsChannel = supabase
      .channel("complaints-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "complaints",
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(concernsChannel);
      supabase.removeChannel(complaintsChannel);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      // Get concerns from last 48 hours
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      const { data: recentConcerns } = await supabase
        .from("concerns")
        .select("*")
        .gte("created_at", fortyEightHoursAgo.toISOString())
        .eq("concern_status", "Open");

      // Get open complaints
      const { data: complaints } = await supabase
        .from("complaints")
        .select("*")
        .in("status", ["new", "under_investigation"]);

      // Get resolved items this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: resolvedConcerns } = await supabase
        .from("concerns")
        .select("*")
        .eq("concern_status", "Resolved")
        .gte("updated_at", startOfMonth.toISOString());

      const { data: resolvedComplaints } = await supabase
        .from("complaints")
        .select("*")
        .eq("status", "resolved")
        .gte("resolved_at", startOfMonth.toISOString());

      // Calculate average resolution time
      let totalResolutionDays = 0;
      let resolvedCount = 0;

      if (resolvedConcerns) {
        resolvedConcerns.forEach((concern) => {
          const created = new Date(concern.created_at);
          const updated = new Date(concern.updated_at);
          const days = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          totalResolutionDays += days;
          resolvedCount++;
        });
      }

      if (resolvedComplaints) {
        resolvedComplaints.forEach((complaint) => {
          if (complaint.resolved_at) {
            const created = new Date(complaint.created_at);
            const resolved = new Date(complaint.resolved_at);
            const days = (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            totalResolutionDays += days;
            resolvedCount++;
          }
        });
      }

      const avgResolutionTime = resolvedCount > 0 ? Math.round(totalResolutionDays / resolvedCount) : 0;

      setMetrics({
        newConcerns48hrs: recentConcerns?.length || 0,
        openComplaints: complaints?.length || 0,
        resolvedThisMonth: (resolvedConcerns?.length || 0) + (resolvedComplaints?.length || 0),
        avgResolutionTime,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      toast({
        title: "Error Loading Metrics",
        description: "Unable to load dashboard metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
          <span>Compliance Dashboard</span>
          <span className="opacity-75">(Role: RN CM DIRECTOR)</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">
          Concerns & Complaints Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor, investigate, and resolve client concerns and anonymous complaints
        </p>
      </header>

      {/* Summary Tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-sm font-medium">New Concerns (48hrs)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.newConcerns48hrs}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-warning" />
              <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.openComplaints}</div>
            <p className="text-xs text-muted-foreground mt-1">Under investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <CardTitle className="text-sm font-medium">Resolved This Month</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.resolvedThisMonth}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed cases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{metrics.avgResolutionTime}</div>
            <p className="text-xs text-muted-foreground mt-1">Days to resolution</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <ConcernComplaintFilters filters={filters} onFiltersChange={setFilters} />

      {/* Tabs for Concerns and Complaints */}
      <Tabs value={activeTab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="concerns">Concerns Log (Identified)</TabsTrigger>
          <TabsTrigger value="complaints">Complaints Log (Anonymous)</TabsTrigger>
        </TabsList>

            <TabsContent value="concerns">
              <ConcernsLogTable filters={filters} onUpdate={fetchMetrics} highlightId={highlightId || undefined} />
            </TabsContent>

            <TabsContent value="complaints">
              <ComplaintsLogTable filters={filters} onUpdate={fetchMetrics} highlightId={highlightId || undefined} />
            </TabsContent>
      </Tabs>
    </main>
  );
}
