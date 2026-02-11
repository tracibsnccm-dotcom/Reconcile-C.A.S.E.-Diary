import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Mail, 
  Database, 
  FileText, 
  Link2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  status: "connected" | "disconnected" | "error";
  category: "calendar" | "email" | "crm" | "documents";
}

export default function IntegrationSettings() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "google-calendar",
      name: "Google Calendar",
      icon: <Calendar className="h-5 w-5" />,
      description: "Sync court dates and appointments",
      status: "disconnected",
      category: "calendar"
    },
    {
      id: "outlook",
      name: "Microsoft Outlook",
      icon: <Mail className="h-5 w-5" />,
      description: "Email integration and calendar sync",
      status: "disconnected",
      category: "email"
    },
    {
      id: "clio",
      name: "Clio",
      icon: <Database className="h-5 w-5" />,
      description: "Practice management software",
      status: "disconnected",
      category: "crm"
    },
    {
      id: "dropbox",
      name: "Dropbox",
      icon: <FileText className="h-5 w-5" />,
      description: "Document storage and sharing",
      status: "connected",
      category: "documents"
    },
    {
      id: "docusign",
      name: "DocuSign",
      icon: <FileText className="h-5 w-5" />,
      description: "Electronic signature platform",
      status: "connected",
      category: "documents"
    },
    {
      id: "zoom",
      name: "Zoom",
      icon: <Link2 className="h-5 w-5" />,
      description: "Video conferencing for client meetings",
      status: "disconnected",
      category: "calendar"
    }
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => {
      if (integration.id === id) {
        const newStatus = integration.status === "connected" ? "disconnected" : "connected";
        toast({
          title: newStatus === "connected" ? "Integration connected" : "Integration disconnected",
          description: `${integration.name} has been ${newStatus}`
        });
        return { ...integration, status: newStatus };
      }
      return integration;
    }));
  };

  const getStatusIcon = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Disconnected</Badge>;
    }
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = [];
    }
    acc[integration.category].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  const categoryLabels = {
    calendar: "Calendar & Scheduling",
    email: "Email & Communication",
    crm: "Case Management",
    documents: "Document Management"
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect your favorite tools to streamline your workflow
        </p>
      </div>

      {Object.entries(groupedIntegrations).map(([category, items]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h4>
          <div className="grid gap-3">
            {items.map(integration => (
              <Card key={integration.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1">{integration.icon}</div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{integration.name}</h4>
                        {getStatusIcon(integration.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                      {integration.status === "connected" && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button variant="ghost" size="sm">
                            Configure
                          </Button>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(integration.status)}
                    <Switch 
                      checked={integration.status === "connected"}
                      onCheckedChange={() => toggleIntegration(integration.id)}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Card className="p-6 bg-accent/50">
        <div className="flex items-start gap-3">
          <Link2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div className="space-y-2">
            <h4 className="font-medium">Need another integration?</h4>
            <p className="text-sm text-muted-foreground">
              Contact support to request additional integrations for your practice
            </p>
            <Button variant="outline" size="sm">
              Request Integration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
