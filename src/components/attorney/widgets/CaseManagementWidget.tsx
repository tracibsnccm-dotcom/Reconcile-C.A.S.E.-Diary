import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Briefcase, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CaseManagementWidget() {
  const connection = {
    platform: "Clio",
    connected: false,
    lastSync: null,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Practice Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {connection.connected ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{connection.platform}</p>
                <p className="text-xs text-muted-foreground">
                  Last synced: {connection.lastSync || "Never"}
                </p>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" asChild>
                <a href="https://app.clio.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Open Clio
                </a>
              </Button>
              <Button size="sm" variant="ghost">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Connect your practice management software
            </p>
            <Button size="sm">Connect Clio</Button>
            <p className="text-xs text-muted-foreground mt-2">
              Or add quick access link
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
