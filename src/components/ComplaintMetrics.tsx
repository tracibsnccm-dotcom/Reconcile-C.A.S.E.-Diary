import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileText, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComplaintMetrics {
  newComplaints: number;
  underInvestigation: number;
  resolvedWithin15Days: number;
  totalOpen: number;
}

export function ComplaintMetrics() {
  const [metrics, setMetrics] = useState<ComplaintMetrics>({
    newComplaints: 0,
    underInvestigation: 0,
    resolvedWithin15Days: 0,
    totalOpen: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscription
    const channel = supabase
      .channel("complaint-changes")
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
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      // Get all complaints
      const { data: complaints, error } = await supabase
        .from("complaints")
        .select("*");

      if (error) throw error;

      if (!complaints) {
        setMetrics({
          newComplaints: 0,
          underInvestigation: 0,
          resolvedWithin15Days: 0,
          totalOpen: 0,
        });
        return;
      }

      // Calculate metrics
      const newCount = complaints.filter((c) => c.status === "new").length;
      const investigationCount = complaints.filter((c) => c.status === "under_investigation").length;
      
      // Count resolved within 15 days
      const resolvedWithin15 = complaints.filter((c) => {
        if (c.status !== "resolved" || !c.resolved_at) return false;
        const createdAt = new Date(c.created_at);
        const resolvedAt = new Date(c.resolved_at);
        const daysDiff = (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 15;
      }).length;

      const totalOpen = newCount + investigationCount;

      setMetrics({
        newComplaints: newCount,
        underInvestigation: investigationCount,
        resolvedWithin15Days: resolvedWithin15,
        totalOpen,
      });
    } catch (error) {
      console.error("Error fetching complaint metrics:", error);
      toast({
        title: "Error Loading Metrics",
        description: "Unable to load complaint metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Complaint Log</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <CardTitle>Complaint Log</CardTitle>
        </div>
        <CardDescription>Anonymous complaint tracking and compliance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-destructive" />
              <p className="text-sm font-medium text-muted-foreground">New Complaints</p>
            </div>
            <p className="text-3xl font-bold">{metrics.newComplaints}</p>
            {metrics.newComplaints > 0 && (
              <Badge variant="destructive" className="text-xs">
                Requires Review
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <p className="text-sm font-medium text-muted-foreground">Under Investigation</p>
            </div>
            <p className="text-3xl font-bold">{metrics.underInvestigation}</p>
            {metrics.underInvestigation > 0 && (
              <Badge variant="secondary" className="text-xs">
                In Progress
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <p className="text-sm font-medium text-muted-foreground">Resolved (≤15 Days)</p>
            </div>
            <p className="text-3xl font-bold">{metrics.resolvedWithin15Days}</p>
            <Badge variant="outline" className="text-xs text-success">
              Compliant
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Total Open</p>
            </div>
            <p className="text-3xl font-bold">{metrics.totalOpen}</p>
            {metrics.totalOpen === 0 && (
              <Badge variant="outline" className="text-xs">
                All Clear
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
