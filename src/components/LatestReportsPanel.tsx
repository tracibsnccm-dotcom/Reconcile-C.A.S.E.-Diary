import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Check, Circle, Paperclip } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Report {
  id: string;
  case_id: string;
  report_title: string;
  report_type: string;
  generated_at: string;
  review_status: "pending" | "read";
  reviewed_by: string | null;
  reviewed_at: string | null;
  filed_status: "unfiled" | "filed";
  filed_by: string | null;
  filed_at: string | null;
}

export function LatestReportsPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('report-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_documents'
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from("report_documents")
        .select("*")
        .order("generated_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setReports((data || []) as Report[]);
    } catch (error: any) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleReviewStatus = async (report: Report) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newStatus = report.review_status === "pending" ? "read" : "pending";

    const { error } = await supabase
      .from("report_documents")
      .update({
        review_status: newStatus,
        reviewed_by: newStatus === "read" ? user.id : null,
        reviewed_at: newStatus === "read" ? new Date().toISOString() : null,
      })
      .eq("id", report.id);

    if (error) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: newStatus === "read" ? "Report marked as read" : "Report marked as pending",
        variant: "default",
      });
    }
  };

  const handleFileToCase = async (report: Report) => {
    const shortCaseId = report.case_id.slice(-8);
    
    if (!confirm(`Attach this report to case ${shortCaseId}?`)) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("report_documents")
      .update({
        filed_status: "filed",
        filed_by: user.id,
        filed_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (error) {
      toast({
        title: "Error filing report",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Report filed successfully",
        description: `Report attached to case ${shortCaseId}`,
        variant: "default",
      });
    }
  };

  return (
    <Card className="p-6 border-border">
      <div className="border-b-2 border-[hsl(var(--gold))] pb-2 mb-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Latest Reports
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No reports available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-semibold text-foreground">Date</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-foreground">Report Title</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-foreground">Case ID</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left py-3 px-2 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report, index) => (
                <tr 
                  key={report.id}
                  className={`border-b border-border hover:bg-accent/50 transition-colors ${
                    index % 2 === 0 ? "bg-background" : "bg-accent/20"
                  }`}
                >
                  <td className="py-3 px-2 text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(report.generated_at), { addSuffix: true })}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      {report.filed_status === "filed" && (
                        <Paperclip className="w-3 h-3 text-[hsl(var(--teal))]" />
                      )}
                      <span className="text-sm font-medium text-foreground">
                        {report.report_title}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-sm text-foreground">
                    #{report.case_id.slice(-8)}
                  </td>
                  <td className="py-3 px-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => toggleReviewStatus(report)}
                            className="flex items-center gap-2 px-3 py-1 rounded-full transition-colors hover:bg-accent"
                          >
                            {report.review_status === "pending" ? (
                              <>
                                <Circle className="w-3 h-3 fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" />
                                <span className="text-xs font-medium text-[hsl(var(--gold))]">
                                  Pending Review
                                </span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3 h-3 text-[hsl(var(--teal))]" />
                                <span className="text-xs font-medium text-[hsl(var(--teal))]">
                                  Read
                                </span>
                              </>
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark this report as {report.review_status === "pending" ? "reviewed" : "pending"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                  <td className="py-3 px-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            disabled={report.filed_status === "filed"}
                            onClick={() => handleFileToCase(report)}
                            className={
                              report.filed_status === "filed"
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-[hsl(var(--gold))] text-foreground hover:bg-foreground hover:text-[hsl(var(--gold))]"
                            }
                          >
                            📁 {report.filed_status === "filed" ? "Filed" : "File to Case"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {report.filed_status === "filed"
                              ? "Already filed"
                              : "Files this document into the permanent case record"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
