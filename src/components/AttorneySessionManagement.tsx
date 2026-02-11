import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Monitor, Smartphone, LogOut, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function AttorneySessionManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogoutAllDevices = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success("Logged out from all devices");
      navigate('/');
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast.error("Failed to logout from all devices");
    } finally {
      setLoading(false);
    }
  };

  const currentSession = {
    device: 'Current Browser',
    location: 'Unknown Location',
    lastActive: 'Now',
    isCurrent: true,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Session Management
        </CardTitle>
        <CardDescription>
          Manage your active sessions and logged-in devices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Active Sessions</h3>
          
          <div className="space-y-3">
            <div className="flex items-start justify-between p-4 border rounded-lg bg-muted/30">
              <div className="flex gap-3 flex-1">
                <Monitor className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{currentSession.device}</p>
                    <Badge variant="default" className="text-xs">Current</Badge>
                  </div>
                  <div className="space-y-0.5 text-sm text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Last active: {currentSession.lastActive}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Tip
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            If you notice any suspicious activity or don't recognize a session, 
            log out from all devices immediately and change your password.
          </p>
        </div>

        <div className="pt-4 border-t space-y-3">
          <h4 className="text-sm font-semibold">Session Actions</h4>
          <Button 
            variant="destructive" 
            onClick={handleLogoutAllDevices}
            disabled={loading}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loading ? "Logging out..." : "Logout from All Devices"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            This will end all active sessions and require re-login
          </p>
        </div>
      </CardContent>
    </Card>
  );
}