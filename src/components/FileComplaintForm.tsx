import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ComplaintConfirmationModal } from "./ComplaintConfirmationModal";

export function FileComplaintForm({ onSuccess }: { onSuccess?: () => void }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [complaintAbout, setComplaintAbout] = useState<string>("");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complaintAbout || !complaintDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert anonymous complaint (no client_id or case_id)
      const { error: insertError } = await supabase
        .from("complaints")
        .insert({
          complaint_about: complaintAbout,
          complaint_description: complaintDescription.trim(),
          status: "new",
        });

      if (insertError) throw insertError;

      // Audit log the complaint filing - RN Supervisors will see this in Concerns & Complaints Center
      await supabase.from("audit_logs").insert({
        action: "complaint_filed",
        actor_role: "CLIENT",
        meta: {
          complaint_about: complaintAbout,
          anonymous: true,
          routed_to: "RN_SUPERVISOR",
        },
      });

      // Reset form
      setComplaintAbout("");
      setComplaintDescription("");
      
      // Show confirmation modal
      setShowConfirmation(true);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting complaint:", error);
      toast({
        title: "Submission Failed",
        description: "Unable to submit your complaint. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-warning/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <CardTitle>File a Complaint (Anonymous)</CardTitle>
          </div>
          <CardDescription>
            Submit a confidential complaint to Reconcile C.A.R.E. Administration
          </CardDescription>
        </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Confidential & Anonymous</strong>
            <br />
            Complaints are reviewed within 24–48 hours. Findings or resolutions are provided within 15 days.
            No identifying information is stored with this complaint.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="complaint-about" className="required">
              Who is this complaint about?
            </Label>
            <Select value={complaintAbout} onValueChange={setComplaintAbout}>
              <SelectTrigger id="complaint-about">
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
            <Label htmlFor="complaint-description" className="required">
              Describe your complaint
            </Label>
            <Textarea
              id="complaint-description"
              value={complaintDescription}
              onChange={(e) => setComplaintDescription(e.target.value)}
              placeholder="Please provide as much detail as possible..."
              className="min-h-[150px]"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            variant="destructive"
          >
            {isSubmitting ? "Submitting..." : "Submit Anonymous Complaint"}
          </Button>
        </form>
      </CardContent>
      </Card>

      <ComplaintConfirmationModal 
        open={showConfirmation} 
        onOpenChange={setShowConfirmation}
      />
    </>
  );
}
