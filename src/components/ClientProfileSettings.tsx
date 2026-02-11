import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { User, Mail, Phone, Bell, Lock, Shield, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { exportClientData } from "@/lib/clientDataExport";

export function ClientProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    full_name: "",
  });
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    checkin_reminders: true,
  });

  useEffect(() => {
    loadProfile();
    loadPreferences();
  }, [user?.id]);

  async function loadProfile() {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          email: data.email || user.email || "",
          full_name: data.full_name || "",
        });
      } else {
        // No profile exists yet, use defaults
        setProfile({
          display_name: "",
          email: user.email || "",
          full_name: "",
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  async function loadPreferences() {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading preferences:", error);
        return;
      }

      // Use defaults if no preferences exist
      if (data) {
        setPreferences({
          email_notifications: true,
          sms_notifications: false,
          checkin_reminders: true,
        });
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
    }
  }

  async function handleSaveProfile() {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          email: profile.email,
          full_name: profile.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePreferences() {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          email_notifications: preferences.email_notifications,
          sms_notifications: preferences.sms_notifications,
          checkin_reminders: preferences.checkin_reminders,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (error) throw error;
      toast.success("Preferences saved successfully");
    } catch (err: any) {
      console.error("Error saving preferences:", err);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportData() {
    if (!user?.id) return;
    
    setExportLoading(true);
    try {
      const result = await exportClientData(user.id);
      if (result.success) {
        toast.success("Your data has been downloaded successfully");
      } else {
        throw new Error("Export failed");
      }
    } catch (err: any) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export data");
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-rcms-teal" />
          Profile Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Your name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="your@email.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Your full legal name"
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleSaveProfile} 
            disabled={loading}
            className="w-full"
          >
            Save Profile Changes
          </Button>
        </div>
      </Card>

      <Separator />

      {/* Notification Preferences */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-rcms-teal" />
          Notification Preferences
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates via email
              </p>
            </div>
            <Switch
              checked={preferences.email_notifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, email_notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive text messages for urgent updates
              </p>
            </div>
            <Switch
              checked={preferences.sms_notifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, sms_notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Check-in Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to complete your wellness check-ins
              </p>
            </div>
            <Switch
              checked={preferences.checkin_reminders}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, checkin_reminders: checked })
              }
            />
          </div>

          <Button 
            onClick={handleSavePreferences} 
            disabled={loading}
            className="w-full"
          >
            Save Preferences
          </Button>
        </div>
      </Card>

      <Separator />

      {/* Security */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-rcms-teal" />
          Security & Privacy
        </h3>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your data is protected with industry-standard encryption and HIPAA-compliant security measures.
          </p>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setPasswordDialogOpen(true)}
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          
          <PasswordChangeDialog 
            open={passwordDialogOpen} 
            onOpenChange={setPasswordDialogOpen}
          />
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={handleExportData}
            disabled={exportLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            {exportLoading ? "Exporting..." : "Download My Data"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
