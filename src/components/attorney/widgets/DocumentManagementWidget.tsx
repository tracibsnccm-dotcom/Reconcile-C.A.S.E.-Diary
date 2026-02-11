import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FolderOpen, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DocumentManagementWidget() {
  const connection = {
    platform: "NetDocuments",
    connected: false,
    recentDocs: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FolderOpen className="h-4 w-4" />
          Document Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {connection.connected ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{connection.platform}</p>
                <p className="text-xs text-muted-foreground">
                  {connection.recentDocs} recent medical records
                </p>
              </div>
              <Badge variant="secondary">Connected</Badge>
            </div>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <a href="https://netdocuments.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-2" />
                Open NetDocuments
              </a>
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Connect your document management system
            </p>
            <Button size="sm">Connect System</Button>
            <p className="text-xs text-muted-foreground mt-2">
              Supports NetDocuments, iManage, Worldox
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
