import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EFilingWidget() {
  const savedPortals = [
    { name: "LA Superior", url: "https://efiling.lacourt.org", pending: 2 },
    { name: "CA District", url: "https://pacer.uscourts.gov", pending: 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileCheck className="h-4 w-4" />
          E-Filing Quick Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {savedPortals.length > 0 ? (
          <>
            {savedPortals.map((portal) => (
              <div
                key={portal.name}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-medium">{portal.name}</p>
                    {portal.pending > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-amber-600" />
                        <span className="text-xs text-amber-600">{portal.pending} pending</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={portal.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full">
              Manage Portals
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">No portals configured</p>
            <Button size="sm">Add E-Filing Portal</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
