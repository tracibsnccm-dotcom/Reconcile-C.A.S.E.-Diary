import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreVertical, FolderOpen, Share2, Shield, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentActionsMenuProps {
  documentId: string;
  caseId: string;
  isSensitive: boolean;
  cases: Array<{ id: string }>;
  onActionComplete: () => void;
}

export function DocumentActionsMenu({
  documentId,
  caseId,
  isSensitive,
  cases,
  onActionComplete,
}: DocumentActionsMenuProps) {
  const { toast } = useToast();
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleMarkSensitive = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ is_sensitive: !isSensitive })
        .eq("id", documentId);

      if (error) throw error;

      // Log activity to activity log
      const user = await supabase.auth.getUser();
      await supabase.from("document_activity_log").insert({
        document_id: documentId,
        action_type: isSensitive ? "unmarked_sensitive" : "marked_sensitive",
        performed_by: user.data.user?.id,
        performed_by_role: "ATTORNEY",
        metadata: { previous_sensitive: isSensitive }
      });

      toast({
        title: isSensitive ? "Removed Sensitive Flag" : "Marked as Sensitive",
        description: isSensitive 
          ? "Document is no longer marked as sensitive" 
          : "Document marked as sensitive. RN CM and directors notified.",
      });

      onActionComplete();
    } catch (error) {
      console.error("Error marking document:", error);
      toast({
        title: "Error",
        description: "Failed to update document",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFileToCase = async () => {
    if (!selectedCase) {
      toast({
        title: "No Case Selected",
        description: "Please select a case to file this document",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ case_id: selectedCase })
        .eq("id", documentId);

      if (error) throw error;

      // Log activity to activity log
      const user = await supabase.auth.getUser();
      await supabase.from("document_activity_log").insert({
        document_id: documentId,
        action_type: "filed_to_case",
        performed_by: user.data.user?.id,
        performed_by_role: "ATTORNEY",
        metadata: { previous_case: caseId, new_case: selectedCase }
      });

      toast({
        title: "Document Filed",
        description: `Document successfully filed to case ${selectedCase}`,
      });

      setShowFileDialog(false);
      onActionComplete();
    } catch (error) {
      console.error("Error filing document:", error);
      toast({
        title: "Error",
        description: "Failed to file document",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleShareWithRN = async () => {
    setProcessing(true);
    try {
      // Get RN CM users assigned to this case
      const { data: assignments } = await supabase
        .from("case_assignments")
        .select("user_id")
        .eq("case_id", caseId)
        .in("role", ["RN_CM", "RCMS_CLINICAL_MGMT"]);

      if (assignments && assignments.length > 0) {
        const rnIds = assignments.map(a => a.user_id);
        
        const { error } = await supabase
          .from("documents")
          .update({ shared_with: rnIds })
          .eq("id", documentId);

        if (error) throw error;

        // Log activity to activity log
        const user = await supabase.auth.getUser();
        await supabase.from("document_activity_log").insert({
          document_id: documentId,
          action_type: "shared_with_rn",
          performed_by: user.data.user?.id,
          performed_by_role: "ATTORNEY",
          metadata: { shared_with_count: rnIds.length }
        });

        // Send notifications to RN CMs
        for (const rnId of rnIds) {
          await supabase.from("notifications").insert({
            user_id: rnId,
            title: "Document Shared With You",
            message: `A document has been shared with you for case ${caseId}`,
            type: "info",
            link: `/documents?doc=${documentId}`,
          });
        }

        toast({
          title: "Document Shared",
          description: `Shared with ${rnIds.length} RN CM(s)`,
        });

        setShowShareDialog(false);
        onActionComplete();
      } else {
        toast({
          title: "No RN CM Found",
          description: "No RN CM assigned to this case",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sharing document:", error);
      toast({
        title: "Error",
        description: "Failed to share document",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRequestReport = async () => {
    setProcessing(true);
    try {
      // Create a task for clinical report request
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase.from("case_tasks").insert({
        case_id: caseId,
        title: "Clinical Report Requested",
        description: `Clinical report requested for document: ${documentId}`,
        status: "pending",
        assigned_role: "RN_CM",
        created_by: user.data.user?.id,
      });

      if (error) throw error;

      // Log activity to activity log
      const taskUser = await supabase.auth.getUser();
      await supabase.from("document_activity_log").insert({
        document_id: documentId,
        action_type: "clinical_report_requested",
        performed_by: taskUser.data.user?.id,
        performed_by_role: "ATTORNEY",
        metadata: { case_id: caseId }
      });

      toast({
        title: "Report Requested",
        description: "Clinical report request has been created",
      });

      setShowReportDialog(false);
      onActionComplete();
    } catch (error) {
      console.error("Error requesting report:", error);
      toast({
        title: "Error",
        description: "Failed to create report request",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShowFileDialog(true)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            🗂 File to Another Case
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
            <Share2 className="mr-2 h-4 w-4" />
            📤 Share with RN CM
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleMarkSensitive} disabled={processing}>
            <Shield className="mr-2 h-4 w-4" />
            {isSensitive ? "🔓 Unmark Sensitive" : "🔒 Mark as Sensitive"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
            <FileText className="mr-2 h-4 w-4" />
            🧾 Request Clinical Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* File to Another Case Dialog */}
      <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File to Another Case</DialogTitle>
            <DialogDescription>
              Select a case to file this document to
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger>
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases
                  .filter((c) => c.id !== caseId)
                  .slice(0, 20)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowFileDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleFileToCase} disabled={processing || !selectedCase}>
                {processing ? "Filing..." : "File Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share with RN Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share with RN CM</DialogTitle>
            <DialogDescription>
              This will share the document with all RN Case Managers assigned to this case
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareWithRN} disabled={processing}>
              {processing ? "Sharing..." : "Share Document"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Clinical Report</DialogTitle>
            <DialogDescription>
              This will create a task for the RN CM to provide a clinical report related to this document
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestReport} disabled={processing}>
              {processing ? "Requesting..." : "Request Report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
