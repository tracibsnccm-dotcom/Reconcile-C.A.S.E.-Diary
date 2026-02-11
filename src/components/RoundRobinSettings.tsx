import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Settings } from "lucide-react";

interface RoundRobinSettingsType {
  id: string;
  enabled: boolean;
  check_capacity: boolean;
  allow_manual_override: boolean;
  reset_rotation_days: number | null;
}

export function RoundRobinSettings() {
  const [settings, setSettings] = useState<RoundRobinSettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from("round_robin_settings")
        .select("*")
        .limit(1)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Failed to load round robin settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("round_robin_settings")
        .update({
          enabled: settings.enabled,
          check_capacity: settings.check_capacity,
          allow_manual_override: settings.allow_manual_override,
          reset_rotation_days: settings.reset_rotation_days,
          updated_by: user?.id,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Round robin settings saved");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--rcms-teal))]" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-[hsl(var(--rcms-teal))]" />
          Round Robin Assignment Settings
        </CardTitle>
        <CardDescription>
          Configure automatic attorney assignment for unrepresented clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, enabled: checked as boolean })
            }
          />
          <Label htmlFor="enabled" className="font-medium">
            Enable Round Robin Assignments
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="check_capacity"
            checked={settings.check_capacity}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, check_capacity: checked as boolean })
            }
          />
          <Label htmlFor="check_capacity">
            Include Only Attorneys Below Capacity Limit
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="allow_manual_override"
            checked={settings.allow_manual_override}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, allow_manual_override: checked as boolean })
            }
          />
          <Label htmlFor="allow_manual_override">
            Allow Manual Override by RN CM Director
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset_days">Reset Rotation Every (days)</Label>
          <Input
            id="reset_days"
            type="number"
            min="1"
            value={settings.reset_rotation_days || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                reset_rotation_days: parseInt(e.target.value) || null,
              })
            }
            placeholder="30"
            className="max-w-[200px]"
          />
        </div>

        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
