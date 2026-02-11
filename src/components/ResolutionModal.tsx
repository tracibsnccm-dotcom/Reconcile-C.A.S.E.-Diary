import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResolutionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  type: "concern" | "complaint";
  onResolved: () => void;
}

export function ResolutionModal({ open, onOpenChange, item, type, onResolved }: ResolutionModalProps) {
  const [findingsSummary, setFindingsSummary] = useState("");
  const [resolutionAction, setResolutionAction] = useState("");
  const [resolutionDate, setResolutionDate] = useState(new Date().toISOString().split("T")[0]);
  const [notifyClient, setNotifyClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!findingsSummary.trim() || !resolutionAction.trim()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (type === "concern") {
        // Update concern
        const { error } = await supabase
          .from("concerns")
          .update({
            concern_status: "Resolved",
            rn_followup_notes: `${findingsSummary}\n\nResolution Action: ${resolutionAction}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;

        // If notify client is checked, create a message
        if (notifyClient && item.client_id) {
          await supabase.from("messages").insert({
            case_id: item.case_id,
            sender_id: (await supabase.auth.getUser()).data.user?.id,
            recipient_role: "CLIENT",
            subject: "Your Concern Has Been Resolved",
            message_text: `Your concern has been reviewed and resolved.\n\nFindings: ${findingsSummary}\n\nAction Taken: ${resolutionAction}`,
            status: "pending",
          });
        }

        // Audit log
        await supabase.from("audit_logs").insert({
          action: "concern_resolved",
          case_id: item.case_id,
          actor_role: "RN_CM_DIRECTOR",
          meta: {
            concern_id: item.id,
            resolution_date: resolutionDate,
          },
        });
      } else {
        // Update complaint
        const { error } = await supabase
          .from("complaints")
          .update({
            status: "resolved",
            resolution_notes: `${findingsSummary}\n\nResolution Action: ${resolutionAction}`,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) throw error;

        // Audit log
        await supabase.from("audit_logs").insert({
          action: "complaint_resolved",
          actor_role: "RN_CM_DIRECTOR",
          meta: {
            complaint_id: item.id,
            resolution_date: resolutionDate,
          },
        });
      }

      toast({
        title: "Resolved",
        description: `${type === "concern" ? "Concern" : "Complaint"} has been marked as resolved.`,
      });

      onResolved();
      onOpenChange(false);

      // Reset form
      setFindingsSummary("");
      setResolutionAction("");
      setNotifyClient(false);
    } catch (error) {
      console.error("Error resolving:", error);
      toast({
        title: "Error",
        description: `Unable to resolve ${type}.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resolve {type === "concern" ? "Concern" : "Complaint"}</DialogTitle>
          <DialogDescription>
            Document findings and resolution actions taken
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="findings-summary" className="required">
              Summary of Findings
            </Label>
            <Textarea
              id="findings-summary"
              value={findingsSummary}
              onChange={(e) => setFindingsSummary(e.target.value)}
              placeholder="Describe the investigation findings..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-action" className="required">
              Resolution Action Taken
            </Label>
            <Textarea
              id="resolution-action"
              value={resolutionAction}
              onChange={(e) => setResolutionAction(e.target.value)}
              placeholder="Describe the actions taken to resolve this issue..."
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution-date">Resolution Date</Label>
            <Input
              id="resolution-date"
              type="date"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
            />
          </div>

          {type === "concern" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notify-client"
                checked={notifyClient}
                onCheckedChange={(checked) => setNotifyClient(checked as boolean)}
              />
              <Label htmlFor="notify-client" className="text-sm font-normal cursor-pointer">
                Notify client of resolution
              </Label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90"
            >
              {isSubmitting ? "Resolving..." : "Mark as Resolved"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
