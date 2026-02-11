import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserCheck } from "lucide-react";

interface IntakeReviewAssignmentProps {
  caseId: string;
  onAssignmentComplete?: () => void;
}

interface Attorney {
  user_id: string;
  display_name: string;
  capacity_available: number;
}

export function IntakeReviewAssignment({ caseId, onAssignmentComplete }: IntakeReviewAssignmentProps) {
  const [autoAssign, setAutoAssign] = useState(true);
  const [selectedAttorney, setSelectedAttorney] = useState<string>("");
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(false);
  const [roundRobinEnabled, setRoundRobinEnabled] = useState(false);

  useEffect(() => {
    checkRoundRobinSettings();
    loadAttorneys();
  }, []);

  async function checkRoundRobinSettings() {
    try {
      const { data } = await supabase
        .from("round_robin_settings")
        .select("enabled, allow_manual_override")
        .limit(1)
        .single();

      if (data) {
        setRoundRobinEnabled(data.enabled);
        setAutoAssign(data.enabled && !data.allow_manual_override);
      }
    } catch (error) {
      console.error("Error checking settings:", error);
    }
  }

  async function loadAttorneys() {
    try {
      const { data, error } = await supabase
        .from("attorney_metadata")
        .select(`
          user_id,
          capacity_available,
          profiles!attorney_metadata_user_id_fkey (
            display_name
          )
        `)
        .eq("status", "Active")
        .gt("capacity_available", 0);

      if (error) throw error;

      const attorneyList = (data || []).map((a: any) => ({
        user_id: a.user_id,
        display_name: a.profiles.display_name,
        capacity_available: a.capacity_available,
      }));

      setAttorneys(attorneyList);
    } catch (error) {
      console.error("Error loading attorneys:", error);
    }
  }

  async function handleAssignment() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (autoAssign) {
        // Use round robin assignment
        const { data, error } = await supabase.rpc("assign_attorney_round_robin", {
          p_case_id: caseId,
          p_reviewed_by: user.id,
        });

        if (error) throw error;
        
        toast.success("Attorney assigned via round robin");
      } else {
        // Manual assignment
        if (!selectedAttorney) {
          toast.error("Please select an attorney");
          return;
        }

        const { error: assignError } = await supabase
          .from("case_assignments")
          .insert({
            case_id: caseId,
            user_id: selectedAttorney,
            role: "ATTORNEY",
          });

        if (assignError) throw assignError;

        // Get attorney current capacity
        const { data: attorney } = await supabase.from("attorney_metadata").select("capacity_available").eq("user_id", selectedAttorney).single();
        
        const { error: updateError } = await supabase.rpc("update_attorney_capacity", {
          p_attorney_id: selectedAttorney,
          p_new_capacity_available: (attorney?.capacity_available || 1) - 1
        });

        if (updateError) console.error("Error updating capacity:", updateError);

        // Log assignment
        const { error: logError } = await supabase.from("assignment_audit_log").insert({
          case_id: caseId,
          assigned_attorney_id: selectedAttorney,
          assigned_by: "Manual",
          reviewed_by: user.id,
          assignment_method: "manual",
        });

        if (logError) console.error("Error logging assignment:", logError);

        toast.success("Attorney assigned manually");
      }

      onAssignmentComplete?.();
    } catch (error: any) {
      console.error("Error assigning attorney:", error);
      toast.error(error.message || "Failed to assign attorney");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-[hsl(var(--rcms-teal))]" />
          Attorney Assignment
        </CardTitle>
        <CardDescription>
          Assign this case to an attorney for representation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {roundRobinEnabled && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-assign"
              checked={autoAssign}
              onCheckedChange={(checked) => setAutoAssign(checked as boolean)}
            />
            <Label htmlFor="auto-assign" className="font-medium">
              Auto-assign attorney (via round robin)
            </Label>
          </div>
        )}

        {!autoAssign && (
          <div className="space-y-2">
            <Label htmlFor="attorney-select">Select Attorney</Label>
            <Select value={selectedAttorney} onValueChange={setSelectedAttorney}>
              <SelectTrigger id="attorney-select">
                <SelectValue placeholder="Choose an attorney..." />
              </SelectTrigger>
              <SelectContent>
                {attorneys.map((attorney) => (
                  <SelectItem key={attorney.user_id} value={attorney.user_id}>
                    {attorney.display_name} (Capacity: {attorney.capacity_available})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button onClick={handleAssignment} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {autoAssign ? "Assign via Round Robin" : "Assign to Selected Attorney"}
        </Button>
      </CardContent>
    </Card>
  );
}
