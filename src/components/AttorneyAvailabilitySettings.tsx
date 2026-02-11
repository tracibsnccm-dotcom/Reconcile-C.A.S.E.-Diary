import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Clock, Calendar } from "lucide-react";

interface AvailabilitySettings {
  availableMonday: boolean;
  availableTuesday: boolean;
  availableWednesday: boolean;
  availableThursday: boolean;
  availableFriday: boolean;
  availableSaturday: boolean;
  availableSunday: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
}

export function AttorneyAvailabilitySettings() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilitySettings>({
    availableMonday: true,
    availableTuesday: true,
    availableWednesday: true,
    availableThursday: true,
    availableFriday: true,
    availableSaturday: false,
    availableSunday: false,
    startTime: "09:00",
    endTime: "17:00",
    timezone: "America/New_York",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadAvailability();
    }
  }, [user?.id]);

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('attorney_availability')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setAvailability({
          availableMonday: data.available_monday,
          availableTuesday: data.available_tuesday,
          availableWednesday: data.available_wednesday,
          availableThursday: data.available_thursday,
          availableFriday: data.available_friday,
          availableSaturday: data.available_saturday,
          availableSunday: data.available_sunday,
          startTime: data.start_time,
          endTime: data.end_time,
          timezone: data.timezone,
        });
      }
    } catch (error: any) {
      console.error('Error loading availability:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('attorney_availability')
        .upsert({
          user_id: user?.id,
          available_monday: availability.availableMonday,
          available_tuesday: availability.availableTuesday,
          available_wednesday: availability.availableWednesday,
          available_thursday: availability.availableThursday,
          available_friday: availability.availableFriday,
          available_saturday: availability.availableSaturday,
          available_sunday: availability.availableSunday,
          start_time: availability.startTime,
          end_time: availability.endTime,
          timezone: availability.timezone,
        });

      if (error) throw error;
      toast.success("Availability settings saved");
    } catch (error: any) {
      console.error('Error saving availability:', error);
      toast.error(error.message || "Failed to save availability");
    } finally {
      setLoading(false);
    }
  };

  const days = [
    { key: 'availableMonday', label: 'Monday' },
    { key: 'availableTuesday', label: 'Tuesday' },
    { key: 'availableWednesday', label: 'Wednesday' },
    { key: 'availableThursday', label: 'Thursday' },
    { key: 'availableFriday', label: 'Friday' },
    { key: 'availableSaturday', label: 'Saturday' },
    { key: 'availableSunday', label: 'Sunday' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Availability Schedule
        </CardTitle>
        <CardDescription>
          Set your weekly availability for receiving case assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Available Days</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {days.map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key}>{label}</Label>
                <Switch
                  id={key}
                  checked={availability[key as keyof AvailabilitySettings] as boolean}
                  onCheckedChange={(checked) =>
                    setAvailability({ ...availability, [key]: checked })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Working Hours
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Select
                value={availability.startTime}
                onValueChange={(value) =>
                  setAvailability({ ...availability, startTime: value })
                }
              >
                <SelectTrigger id="start-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Select
                value={availability.endTime}
                onValueChange={(value) =>
                  setAvailability({ ...availability, endTime: value })
                }
              >
                <SelectTrigger id="end-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={availability.timezone}
              onValueChange={(value) =>
                setAvailability({ ...availability, timezone: value })
              }
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Availability"}
        </Button>
      </CardContent>
    </Card>
  );
}