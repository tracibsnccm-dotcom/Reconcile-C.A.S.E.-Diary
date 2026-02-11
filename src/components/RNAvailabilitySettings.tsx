import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RNAvailabilitySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [availableForNewCases, setAvailableForNewCases] = useState(true);
  const [maxActiveCases, setMaxActiveCases] = useState("20");
  const [preferredShift, setPreferredShift] = useState("day");
  const [weekendAvailability, setWeekendAvailability] = useState(false);
  const [afterHoursAvailability, setAfterHoursAvailability] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAvailability();
    }
  }, [user?.id]);

  const loadAvailability = async () => {
    try {
      const { data } = await supabase
        .from("rn_metadata")
        .select("available_for_new_cases, max_active_cases, preferred_shift, weekend_availability, after_hours_availability")
        .eq("user_id", user?.id)
        .single();

      if (data) {
        setAvailableForNewCases(data.available_for_new_cases ?? true);
        setMaxActiveCases(String(data.max_active_cases || 20));
        setPreferredShift(data.preferred_shift || "day");
        setWeekendAvailability(data.weekend_availability ?? false);
        setAfterHoursAvailability(data.after_hours_availability ?? false);
      }
    } catch (error: any) {
      console.error("Error loading availability:", error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("rn_metadata")
        .upsert({
          user_id: user.id,
          available_for_new_cases: availableForNewCases,
          max_active_cases: parseInt(maxActiveCases),
          preferred_shift: preferredShift,
          weekend_availability: weekendAvailability,
          after_hours_availability: afterHoursAvailability,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      toast.success("Availability settings updated successfully");
    } catch (error: any) {
      console.error("Error saving availability:", error);
      toast.error("Failed to update availability settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Settings</CardTitle>
        <CardDescription>
          Manage your case load capacity and work schedule preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Available for New Cases</Label>
            <p className="text-sm text-muted-foreground">Accept new case assignments</p>
          </div>
          <Switch 
            checked={availableForNewCases} 
            onCheckedChange={setAvailableForNewCases}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxActiveCases">Maximum Active Cases</Label>
          <Select value={maxActiveCases} onValueChange={setMaxActiveCases}>
            <SelectTrigger id="maxActiveCases">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 cases</SelectItem>
              <SelectItem value="15">15 cases</SelectItem>
              <SelectItem value="20">20 cases</SelectItem>
              <SelectItem value="25">25 cases</SelectItem>
              <SelectItem value="30">30 cases</SelectItem>
              <SelectItem value="35">35 cases</SelectItem>
              <SelectItem value="40">40 cases</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Your preferred maximum caseload at any given time
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredShift">Preferred Shift</Label>
          <Select value={preferredShift} onValueChange={setPreferredShift}>
            <SelectTrigger id="preferredShift">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Day Shift (8 AM - 5 PM)</SelectItem>
              <SelectItem value="evening">Evening Shift (2 PM - 11 PM)</SelectItem>
              <SelectItem value="night">Night Shift (11 PM - 8 AM)</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Weekend Availability</Label>
            <p className="text-sm text-muted-foreground">Available for weekend consultations</p>
          </div>
          <Switch 
            checked={weekendAvailability} 
            onCheckedChange={setWeekendAvailability}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>After-Hours Availability</Label>
            <p className="text-sm text-muted-foreground">Available for urgent after-hours cases</p>
          </div>
          <Switch 
            checked={afterHoursAvailability} 
            onCheckedChange={setAfterHoursAvailability}
          />
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Availability Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
