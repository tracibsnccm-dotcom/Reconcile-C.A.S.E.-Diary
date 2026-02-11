import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConcernConfirmationModal } from "./ConcernConfirmationModal";

interface ReportConcernDialogProps {
  caseId: string;
  onSuccess?: () => void;
}

export function ReportConcernDialog({ caseId, onSuccess }: ReportConcernDialogProps) {
  const [concernAbout, setConcernAbout] = useState<string>("");
  const [concernDescription, setConcernDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!concernAbout || !concernDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert identified concern with client info
      // Concerns are routed to RN Supervisors/Managers, not regular RN CMs
      const { error: insertError } = await supabase
        .from("concerns")
        .insert({
          case_id: caseId,
          client_id: user.id,
          concern_description: concernDescription.trim(),
          provider_name: concernAbout,
          concern_category: "care_concern",
          concern_status: "Open",
        });

      if (insertError) throw insertError;

      // Audit log - RN Supervisors will see this in Concerns & Complaints Center
      await supabase.from("audit_logs").insert({
        action: "concern_reported",
        case_id: caseId,
        actor_id: user.id,
        actor_role: "CLIENT",
        meta: {
          concern_about: concernAbout,
          routed_to: "RN_SUPERVISOR",
        },
      });

      // Reset form
      setConcernAbout("");
      setConcernDescription("");
      
      // Show confirmation modal
      setShowConfirmation(true);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting concern:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit your concern. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Report a Concern</CardTitle>
          </div>
          <CardDescription>
            Share a concern about your care or experience
          </CardDescription>
        </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Your concern will be reviewed by our care team and routed to the appropriate personnel for follow-up.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="concern-about" className="required">
              Who is the concern about?
            </Label>
            <Select value={concernAbout} onValueChange={setConcernAbout}>
              <SelectTrigger id="concern-about">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RN_CM">RN Care Manager</SelectItem>
                <SelectItem value="RCMS_CLINICAL_MGMT">RN Clinical Manager</SelectItem>
                <SelectItem value="ATTORNEY">Attorney</SelectItem>
                <SelectItem value="PROVIDER">Provider</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concern-description" className="required">
              Describe your concern
            </Label>
            <Textarea
              id="concern-description"
              value={concernDescription}
              onChange={(e) => setConcernDescription(e.target.value)}
              placeholder="Please provide details about your concern..."
              className="min-h-[150px]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Concern"}
          </Button>
        </form>
      </CardContent>
      </Card>

      <ConcernConfirmationModal 
        open={showConfirmation} 
        onOpenChange={setShowConfirmation}
      />
    </>
  );
}
