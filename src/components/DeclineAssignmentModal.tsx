import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface DeclineAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onDecline: (reason: string, note?: string) => void;
}

const DECLINE_REASONS = [
  "Conflict of interest",
  "Outside practice area",
  "Capacity reached",
  "Geographic constraint",
  "Other",
];

export function DeclineAssignmentModal({
  open,
  onClose,
  onDecline,
}: DeclineAssignmentModalProps) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    if (!reason) return;

    if (reason === "Other" && !note.trim()) {
      return;
    }

    setSubmitting(true);
    onDecline(reason, note.trim() || undefined);
  }

  function handleClose() {
    if (submitting) return;
    setReason("");
    setNote("");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Decline Client Assignment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="decline-reason">
              Reason for Decline <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason} disabled={submitting}>
              <SelectTrigger id="decline-reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {DECLINE_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="decline-note">
                Please specify <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="decline-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain your reason (max 300 characters)"
                maxLength={300}
                rows={3}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground text-right">
                {note.length}/300
              </p>
            </div>
          )}

          <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Declining returns this client to the round-robin queue. You will not lose
            your rotation position.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || (reason === "Other" && !note.trim()) || submitting}
            className="bg-[#b09837] text-black hover:bg-[#b09837]/90"
          >
            {submitting ? "Submitting..." : "Submit Decline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
