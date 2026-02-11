import { useEffect, useState } from "react";
import { X, FileText, MessageSquare, FolderOpen, ExternalLink, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface CaseSummaryDrawerProps {
  caseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CaseSummaryDrawer({ caseId, isOpen, onClose }: CaseSummaryDrawerProps) {
  const [caseData, setCaseData] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen || !caseId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch case data
        const { data: caseInfo } = await supabase
          .from("cases")
          .select("*, client_label, status, atty_ref")
          .eq("id", caseId)
          .single();

        setCaseData(caseInfo);

        // Fetch latest reports
        const { data: reportsData } = await supabase
          .from("report_documents")
          .select("*")
          .eq("case_id", caseId)
          .order("generated_at", { ascending: false })
          .limit(5);

        setReports(reportsData || []);

        // Fetch recent messages
        const { data: messagesData } = await supabase
          .from("attorney_rn_messages")
          .select("*, profiles:sender_id(display_name)")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(5);

        setMessages(messagesData || []);

        // Fetch open follow-ups
        const { data: followUpsData } = await supabase
          .from("case_tasks")
          .select("*")
          .eq("case_id", caseId)
          .eq("status", "pending")
          .order("due_date", { ascending: true });

        setFollowUps(followUpsData || []);
      } catch (error) {
        console.error("Error fetching case summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Lock background scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, caseId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[35%] bg-card border-l border-border z-50",
          "shadow-lg overflow-y-auto"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between z-10">
          <h2 id="drawer-title" className="text-lg font-bold text-foreground">
            Case Summary
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading case summary...</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Client Snapshot */}
            <Card className="p-4 border-rcms-gold/30 bg-rcms-pale-gold/10">
              <h3 className="font-semibold text-foreground mb-2 border-b border-rcms-gold pb-1">
                Client Snapshot
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Case ID:</span>
                  <span className="font-medium text-foreground">{caseId.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium text-foreground">
                    {caseData?.client_label || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="bg-rcms-teal/10 text-rcms-teal border-rcms-teal/30">
                    {caseData?.status || "N/A"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attorney Ref:</span>
                  <span className="font-medium text-foreground">{caseData?.atty_ref || "N/A"}</span>
                </div>
              </div>
            </Card>

            {/* Latest Reports */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 border-b border-rcms-gold pb-1">
                Latest Reports ({reports.length})
              </h3>
              {reports.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet</p>
              ) : (
                <div className="space-y-2">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start gap-2 p-2 rounded hover:bg-accent cursor-pointer"
                      onClick={() => navigate(`/cases/${caseId}#reports`)}
                    >
                      <FileText className="w-4 h-4 text-rcms-teal flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {report.report_title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(report.generated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Messages */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 border-b border-rcms-gold pb-1">
                Recent Messages ({messages.length})
              </h3>
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className="p-2 rounded hover:bg-accent">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="w-3 h-3 text-rcms-teal" />
                        <span className="text-xs font-medium text-foreground">
                          {msg.profiles?.display_name || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 pl-5">
                        {msg.message_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Follow-Ups */}
            <Card className="p-4">
              <h3 className="font-semibold text-foreground mb-3 border-b border-rcms-gold pb-1">
                Open Follow-Ups ({followUps.length})
              </h3>
              {followUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending follow-ups</p>
              ) : (
                <div className="space-y-2">
                  {followUps.map((task) => (
                    <div key={task.id} className="flex items-start gap-2 p-2 rounded hover:bg-accent">
                      <Clock className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Due: {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4 border-t border-border">
              <Button
                className="w-full bg-rcms-navy hover:bg-rcms-navy/90 text-white"
                onClick={() => {
                  navigate(`/cases/${caseId}`);
                  onClose();
                }}
              >
                Open Full Case
              </Button>
              <Button
                variant="outline"
                className="w-full border-rcms-teal text-rcms-teal hover:bg-rcms-teal hover:text-white"
                onClick={() => {
                  navigate(`/dashboard?tab=rn-liaison&case=${caseId}`);
                  onClose();
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message RN CM
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  navigate(`/cases/${caseId}#documents`);
                  onClose();
                }}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                View Documents
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}