import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordChangeDialog } from "./PasswordChangeDialog";

export function RNSecuritySettings() {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleEnable2FA = () => {
    toast.info("Two-factor authentication setup coming soon");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password & Authentication</CardTitle>
          <CardDescription>Manage your account security and login methods</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <Button onClick={() => setShowPasswordDialog(true)} variant="outline">
              Change Password
            </Button>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security with 2FA
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={(checked) => {
                  setTwoFactorEnabled(checked);
                  if (checked) handleEnable2FA();
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Biometric Login</Label>
                <p className="text-sm text-muted-foreground">
                  Use fingerprint or face recognition
                </p>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={setBiometricEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Login History</CardTitle>
          <CardDescription>Recent account access activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Today at 9:42 AM</span>
              <span className="text-muted-foreground">Desktop • Chrome</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Yesterday at 2:15 PM</span>
              <span className="text-muted-foreground">Mobile • Safari</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <PasswordChangeDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog} />
    </div>
  );
}
