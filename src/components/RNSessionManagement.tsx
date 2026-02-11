import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function RNSessionManagement() {
  const handleEndSession = (device: string) => {
    toast.success(`Session ended on ${device}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Devices currently logged into your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-3">
              <Monitor className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium flex items-center gap-2">
                  Desktop • Chrome
                  <Badge variant="default" className="bg-green-600">Current</Badge>
                </div>
                <div className="text-sm text-muted-foreground">Last active: Just now</div>
                <div className="text-sm text-muted-foreground">IP: 192.168.1.1</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Mobile • Safari</div>
                <div className="text-sm text-muted-foreground">Last active: 2 hours ago</div>
                <div className="text-sm text-muted-foreground">IP: 192.168.1.5</div>
              </div>
            </div>
            <Button onClick={() => handleEndSession("Mobile • Safari")} variant="outline" size="sm">
              End Session
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Tablet className="w-5 h-5 text-muted-foreground" />
              <div>
                <div className="font-medium">Tablet • Chrome</div>
                <div className="text-sm text-muted-foreground">Last active: Yesterday</div>
                <div className="text-sm text-muted-foreground">IP: 192.168.1.8</div>
              </div>
            </div>
            <Button onClick={() => handleEndSession("Tablet • Chrome")} variant="outline" size="sm">
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session Security</CardTitle>
          <CardDescription>Manage how long you stay logged in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Auto-logout after inactivity:</span>
              <span className="font-medium">30 minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Maximum session duration:</span>
              <span className="font-medium">12 hours</span>
            </div>
            <div className="flex justify-between">
              <span>Require re-authentication for sensitive actions:</span>
              <span className="font-medium">Enabled</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
