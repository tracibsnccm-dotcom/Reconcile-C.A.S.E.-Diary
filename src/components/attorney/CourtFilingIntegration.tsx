import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Plus, Trash2, AlertCircle } from "lucide-react";
import { useState } from "react";

export function CourtFilingIntegration() {
  const [savedLinks, setSavedLinks] = useState([
    { id: 1, name: "LA Superior Court E-Filing", url: "https://efiling.lacourt.org", username: "your_username" },
    { id: 2, name: "CA District Court PACER", url: "https://pacer.uscourts.gov", username: "your_username" },
  ]);

  return (
    <div className="space-y-6">
      {/* Integration Overview */}
      <Card className="p-6 border-2 border-blue-200 bg-blue-50/50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Connect Your E-Filing Accounts</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reconcile C.A.R.E. acts as your central hub - save quick access links to your existing 
              e-filing accounts (FileAndServe, Tyler Technologies, PACER, etc.) for one-click access.
            </p>
            <Badge className="bg-blue-600">No API Integration Required</Badge>
          </div>
        </div>
      </Card>

      {/* Saved Links */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your E-Filing Quick Links</h3>
        <div className="space-y-3 mb-4">
          {savedLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div>
                <div className="font-medium">{link.name}</div>
                <div className="text-sm text-muted-foreground">Username: {link.username}</div>
                <div className="text-xs text-muted-foreground mt-1">{link.url}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Portal
                  </a>
                </Button>
                <Button size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add New E-Filing Portal
        </Button>
      </Card>

      {/* Add New Link Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Add New Court Portal</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Portal Name</Label>
            <Input placeholder="e.g., LA Superior Court E-Filing" />
          </div>
          <div className="space-y-2">
            <Label>Portal URL</Label>
            <Input placeholder="https://efiling.example.com" />
          </div>
          <div className="space-y-2">
            <Label>Your Username (for reference)</Label>
            <Input placeholder="your_username" />
          </div>
          <Button>Save Portal Link</Button>
        </div>
      </Card>

      {/* Popular E-Filing Providers */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Popular E-Filing Providers</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            { name: "FileAndServe", url: "https://www.fileandserve.com" },
            { name: "Tyler Technologies", url: "https://www.tylertech.com" },
            { name: "PACER (Federal Courts)", url: "https://pacer.uscourts.gov" },
            { name: "California Courts E-Filing", url: "https://www.courts.ca.gov/efiling.htm" },
          ].map((provider, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <span className="font-medium text-sm">{provider.name}</span>
              <Button size="sm" variant="ghost" asChild>
                <a href={provider.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
