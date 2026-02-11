import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { Shield, Lock, Smartphone } from "lucide-react";
import { toast } from "sonner";

export function AttorneySecuritySettings() {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [twoFactorEnabled] = useState(false);

  const handleEnable2FA = () => {
    toast.info("Two-factor authentication setup coming soon");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Last changed 30 days ago
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  {twoFactorEnabled ? "Enabled" : "Add an extra layer of security"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorEnabled ? (
                <Badge variant="default">Enabled</Badge>
              ) : (
                <Button variant="outline" onClick={handleEnable2FA}>
                  Enable
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Security Tips</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Use a strong, unique password</li>
              <li>• Enable two-factor authentication for extra security</li>
              <li>• Never share your password with anyone</li>
              <li>• Log out from shared devices</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <PasswordChangeDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
    </>
  );
}