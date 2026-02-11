import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Bell, Moon, Clock } from "lucide-react";

export function AttorneyNotificationTiming() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00");
  const [weekendNotifications, setWeekendNotifications] = useState(true);
  const [urgentOverride, setUrgentOverride] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        const prefs = data as any;
        setQuietHoursEnabled(prefs.quiet_hours_enabled || false);
        setQuietHoursStart(prefs.quiet_hours_start || "22:00");
        setQuietHoursEnd(prefs.quiet_hours_end || "08:00");
        setWeekendNotifications(prefs.weekend_notifications !== false);
        setUrgentOverride(prefs.urgent_override !== false);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
        } as any);

      if (error) throw error;
      toast.success("Notification timing saved");
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Notification Timing
        </CardTitle>
        <CardDescription>
          Control when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Moon className="w-5 h-5 text-primary" />
              <div>
                <Label htmlFor="quiet-hours">Quiet Hours (Do Not Disturb)</Label>
                <p className="text-sm text-muted-foreground">
                  Pause non-urgent notifications during specific hours
                </p>
              </div>
            </div>
            <Switch
              id="quiet-hours"
              checked={quietHoursEnabled}
              onCheckedChange={setQuietHoursEnabled}
            />
          </div>

          {quietHoursEnabled && (
            <div className="pl-12 space-y-4 border-l-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Select value={quietHoursStart} onValueChange={setQuietHoursStart}>
                    <SelectTrigger id="quiet-start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Select value={quietHoursEnd} onValueChange={setQuietHoursEnd}>
                    <SelectTrigger id="quiet-end">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map(time => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="urgent-override">Urgent Notifications Override</Label>
                  <p className="text-sm text-muted-foreground">
                    Critical alerts bypass quiet hours
                  </p>
                </div>
                <Switch
                  id="urgent-override"
                  checked={urgentOverride}
                  onCheckedChange={setUrgentOverride}
                />
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekend-notifications">Weekend Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications on Saturdays and Sundays
                </p>
              </div>
              <Switch
                id="weekend-notifications"
                checked={weekendNotifications}
                onCheckedChange={setWeekendNotifications}
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex gap-2">
            <Bell className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold mb-1">What counts as urgent?</h4>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Court deadline within 24 hours</li>
                <li>• Emergency client contact</li>
                <li>• Critical case updates</li>
                <li>• System security alerts</li>
              </ul>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? "Saving..." : "Save Notification Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}