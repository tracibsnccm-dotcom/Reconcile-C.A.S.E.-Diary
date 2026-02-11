import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { TimelineView } from "./TimelineView";
import { StatusBadge, getStatusProgress } from "./StatusBadge";
import { Progress } from "@/components/ui/progress";
import { exportComplaintPDF } from "@/lib/pdfExport";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ComplaintDetailModalProps {
  complaintId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaint: any;
}

export function ComplaintDetailModal({ complaintId, open, onOpenChange, complaint }: ComplaintDetailModalProps) {
  if (!complaint || !complaintId) return null;

  const progress = getStatusProgress(complaint.status);
  const dueDate = new Date(complaint.created_at);
  dueDate.setDate(dueDate.getDate() + 15);
  const daysRemaining = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;
  const isDueSoon = daysRemaining >= 0 && daysRemaining <= 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">Anonymous Complaint Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Complaint #{complaint.id?.substring(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={complaint.status} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportComplaintPDF(complaintId)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Generate PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 15-Day SLA Alert */}
          {complaint.status !== 'resolved' && (
            <Alert variant={isOverdue ? "destructive" : isDueSoon ? "default" : undefined}>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {isOverdue ? (
                  <>
                    <strong>Overdue by {Math.abs(daysRemaining)} days</strong> - This complaint exceeded the 15-day resolution requirement.
                  </>
                ) : isDueSoon ? (
                  <>
                    <strong>{daysRemaining} days remaining</strong> - Resolution due by {dueDate.toLocaleDateString()}
                  </>
                ) : (
                  <>
                    <strong>{daysRemaining} days remaining</strong> - Resolution due by {dueDate.toLocaleDateString()}
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Workflow Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Complaint Details */}
          <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Regarding</p>
              <p className="text-sm mt-1">{complaint.complaint_about}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted</p>
              <p className="text-sm mt-1">{new Date(complaint.created_at).toLocaleString()}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{complaint.complaint_description}</p>
            </div>
            {complaint.resolution_notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Resolution Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{complaint.resolution_notes}</p>
              </div>
            )}
            {complaint.resolved_at && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resolved At</p>
                <p className="text-sm mt-1">{new Date(complaint.resolved_at).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <TimelineView itemId={complaintId} itemType="complaint" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
