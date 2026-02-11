import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { TimelineView } from "./TimelineView";
import { StatusBadge, getStatusProgress } from "./StatusBadge";
import { Progress } from "@/components/ui/progress";
import { exportConcernPDF } from "@/lib/pdfExport";

interface ConcernDetailModalProps {
  concernId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concern: any;
}

export function ConcernDetailModal({ concernId, open, onOpenChange, concern }: ConcernDetailModalProps) {
  if (!concern || !concernId) return null;

  const progress = getStatusProgress(concern.concern_status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">Concern Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Case #{concern.case_id?.split('-').pop()?.substring(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={concern.concern_status} />
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportConcernPDF(concernId)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Generate PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Workflow Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Concern Details */}
          <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/30">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Provider</p>
              <p className="text-sm mt-1">{concern.provider_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Submitted</p>
              <p className="text-sm mt-1">{new Date(concern.created_at).toLocaleString()}</p>
            </div>
            {concern.visit_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visit Date</p>
                <p className="text-sm mt-1">{new Date(concern.visit_date).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Category</p>
              <p className="text-sm mt-1">{concern.concern_category || 'Care Concern'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-sm mt-1 whitespace-pre-wrap">{concern.concern_description}</p>
            </div>
            {concern.rn_followup_notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">RN Follow-Up Notes</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{concern.rn_followup_notes}</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <TimelineView itemId={concernId} itemType="concern" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
