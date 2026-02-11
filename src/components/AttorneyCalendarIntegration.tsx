import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Check, X } from "lucide-react";

export function AttorneyCalendarIntegration() {
  const [googleConnected, setGoogleConnected] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);

  const handleGoogleConnect = () => {
    toast.info("Google Calendar integration coming soon");
    // Future: Implement OAuth flow
  };

  const handleOutlookConnect = () => {
    toast.info("Outlook Calendar integration coming soon");
    // Future: Implement OAuth flow
  };

  const handleDisconnect = (provider: 'google' | 'outlook') => {
    if (provider === 'google') {
      setGoogleConnected(false);
      toast.success("Google Calendar disconnected");
    } else {
      setOutlookConnected(false);
      toast.success("Outlook Calendar disconnected");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Calendar Integration
        </CardTitle>
        <CardDescription>
          Sync your appointments and deadlines with external calendars
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-muted-foreground">
                  Sync appointments and deadlines
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {googleConnected ? (
                <>
                  <Badge variant="default" className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Connected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('google')}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoogleConnect}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-700/10 rounded">
                <Calendar className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="font-medium">Outlook Calendar</p>
                <p className="text-sm text-muted-foreground">
                  Sync appointments and deadlines
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {outlookConnected ? (
                <>
                  <Badge variant="default" className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Connected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('outlook')}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOutlookConnect}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </div>

        {(googleConnected || outlookConnected) && (
          <div className="pt-4 border-t space-y-4">
            <h3 className="text-sm font-semibold">Sync Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sync-enabled">Two-way Sync</Label>
                <p className="text-sm text-muted-foreground">
                  Updates from calendar will reflect in the platform
                </p>
              </div>
              <Switch
                id="sync-enabled"
                checked={syncEnabled}
                onCheckedChange={setSyncEnabled}
              />
            </div>
          </div>
        )}

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">What gets synced?</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Court dates and hearings</li>
            <li>• Client appointments</li>
            <li>• Filing deadlines</li>
            <li>• Case milestones</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}