import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/auth/supabaseAuth";
import { useApp } from "@/context/AppContext";
import { ROLES } from "@/config/rcms";
import { User, Bell, Lock, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const { role } = useApp();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleSaveProfile = () => {
    toast.success("Profile settings saved");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Profile Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {role === ROLES.CLIENT
                    ? "Please contact your attorney's office to update your email address."
                    : "Contact support to change your email address"}
                </p>
              </div>

              <div>
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={user?.id || ""}
                  disabled
                  className="bg-muted font-mono text-xs"
                />
              </div>

              <Button onClick={handleSaveProfile} className="mt-4">
                Save Profile
              </Button>
            </div>
          </Card>

          {/* Notification Preferences */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-6">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your care
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive text message alerts
                  </p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={smsNotifications}
                  onCheckedChange={setSmsNotifications}
                />
              </div>

              <Button onClick={handleSaveNotifications} className="mt-4">
                Save Preferences
              </Button>
            </div>
          </Card>

          {/* Security */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Security</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Update your password to keep your account secure
                </p>
                <Button variant="outline">Change Password</Button>
              </div>
            </div>
          </Card>

          {/* Privacy */}
          <Card className="p-6 border-border">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Privacy & Data</h2>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Your data is protected and HIPAA compliant. We never share your personal
                health information without your explicit consent.
              </p>
              <div className="flex gap-2">
                <Button variant="outline">View Privacy Policy</Button>
                <Button variant="outline">Download My Data</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
