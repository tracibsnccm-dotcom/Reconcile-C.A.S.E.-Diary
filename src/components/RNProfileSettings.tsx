import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordChangeDialog } from "./PasswordChangeDialog";
import { ProfilePhotoUpload } from "./ProfilePhotoUpload";

export function RNProfileSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [credentials, setCredentials] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [urgentAlerts, setUrgentAlerts] = useState(true);
  const [caseUpdates, setCaseUpdates] = useState(true);
  const [clientMessages, setClientMessages] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadPreferences();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email, full_name, profile_photo_url")
        .eq("user_id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setDisplayName(data.display_name || "");
        setEmail(data.email || "");
        setFullName(data.full_name || "");
        setProfilePhotoUrl(data.profile_photo_url || null);
      }

      // Load RN-specific metadata
      const { data: rnData } = await supabase
        .from("rn_metadata")
        .select("credentials, license_number, license_state")
        .eq("user_id", user?.id)
        .single();

      if (rnData) {
        setCredentials(rnData.credentials || "");
        setLicenseNumber(rnData.license_number || "");
        setLicenseState(rnData.license_state || "");
      }
    } catch (error: any) {
      console.error("Error loading profile:", error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (data) {
        setEmailNotifications(data.email_notifications ?? true);
        setSmsNotifications(data.sms_notifications ?? false);
        setUrgentAlerts(data.urgent_alerts ?? true);
        setCaseUpdates(data.case_updates ?? true);
        setClientMessages(data.client_messages ?? true);
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update or insert RN metadata
      const { error: rnError } = await supabase
        .from("rn_metadata")
        .upsert({
          user_id: user.id,
          credentials,
          license_number: licenseNumber,
          license_state: licenseState,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (rnError) throw rnError;

      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          urgent_alerts: urgentAlerts,
          case_updates: caseUpdates,
          client_messages: clientMessages,
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      toast.success("Notification preferences saved");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <ProfilePhotoUpload
        currentPhotoUrl={profilePhotoUrl}
        userName={displayName || fullName}
        onPhotoUpdated={(url) => setProfilePhotoUrl(url)}
      />

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your RN CM profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you appear to clients"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Legal Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credentials">Credentials</Label>
              <Input
                id="credentials"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
                placeholder="e.g., RN, BSN, CCM"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="RN License Number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseState">License State</Label>
              <Input
                id="licenseState"
                value={licenseState}
                onChange={(e) => setLicenseState(e.target.value)}
                placeholder="State of licensure"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={loading}>
            {loading ? "Saving..." : "Save Profile Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive alerts and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive text message alerts</p>
            </div>
            <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Urgent Alerts</Label>
              <p className="text-sm text-muted-foreground">Critical case alerts and emergencies</p>
            </div>
            <Switch checked={urgentAlerts} onCheckedChange={setUrgentAlerts} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Case Updates</Label>
              <p className="text-sm text-muted-foreground">Status changes and case milestones</p>
            </div>
            <Switch checked={caseUpdates} onCheckedChange={setCaseUpdates} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Client Messages</Label>
              <p className="text-sm text-muted-foreground">New messages from clients</p>
            </div>
            <Switch checked={clientMessages} onCheckedChange={setClientMessages} />
          </div>

          <Button onClick={handleSavePreferences} disabled={loading}>
            {loading ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Security & Privacy</CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowPasswordDialog(true)} variant="outline">
            Change Password
          </Button>
        </CardContent>
      </Card>

      <PasswordChangeDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
    </div>
  );
}
