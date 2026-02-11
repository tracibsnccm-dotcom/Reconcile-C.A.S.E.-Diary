import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

interface TimelineNode {
  stage: string;
  timestamp: Date;
  role: "CLIENT" | "RN_CM" | "RCMS_CLINICAL_MGMT" | "CLINICAL_STAFF_EXTERNAL" | "PROVIDER" | "ATTORNEY";
  description: string;
  icon: string;
}

interface CaseTimelineViewProps {
  caseId: string;
  nodes?: TimelineNode[];
}

const roleColors = {
  CLIENT: "bg-blue-500",
  RN_CM: "bg-[hsl(var(--rcms-teal))]",
  RCMS_CLINICAL_MGMT: "bg-[hsl(var(--rcms-teal))]",
  CLINICAL_STAFF_EXTERNAL: "bg-[hsl(var(--rcms-teal))]",
  PROVIDER: "bg-green-500",
  ATTORNEY: "bg-[hsl(var(--rcms-gold))]",
};

const roleIcons = {
  CLIENT: "👤",
  RN_CM: "🩺",
  RCMS_CLINICAL_MGMT: "🩺",
  CLINICAL_STAFF_EXTERNAL: "🩺",
  PROVIDER: "🏥",
  ATTORNEY: "⚖️",
};

export function CaseTimelineView({ caseId, nodes = [] }: CaseTimelineViewProps) {
  const [zoom, setZoom] = useState(100);
  const [showMessages, setShowMessages] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);

  // Default timeline if no nodes provided
  const defaultNodes: TimelineNode[] = [
    {
      stage: "Intake",
      timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      role: "CLIENT",
      description: "Initial intake completed",
      icon: "📝",
    },
    {
      stage: "Clinical Review",
      timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      role: "RN_CM",
      description: "Clinical assessment assigned",
      icon: "🔍",
    },
    {
      stage: "Reports",
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      role: "PROVIDER",
      description: "Medical records requested",
      icon: "📋",
    },
    {
      stage: "Negotiation",
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      role: "ATTORNEY",
      description: "Settlement discussions initiated",
      icon: "💼",
    },
    {
      stage: "Settlement",
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      role: "ATTORNEY",
      description: "Final settlement draft",
      icon: "✅",
    },
  ];

  const timelineNodes = nodes.length > 0 ? nodes : defaultNodes;

  const handleZoomIn = () => setZoom(Math.min(200, zoom + 25));
  const handleZoomOut = () => setZoom(Math.max(50, zoom - 25));
  const handleFitScreen = () => setZoom(100);

  const exportTimeline = () => {
    toast.success("Exporting timeline to PDF...");
    // Implementation would generate PDF
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Case Timeline</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-messages"
                checked={showMessages}
                onCheckedChange={setShowMessages}
              />
              <Label htmlFor="show-messages" className="text-sm">Messages</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-documents"
                checked={showDocuments}
                onCheckedChange={setShowDocuments}
              />
              <Label htmlFor="show-documents" className="text-sm">Documents</Label>
            </div>
            <div className="flex items-center gap-1 border-l pl-4">
              <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleFitScreen}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={exportTimeline}>
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div
            className="relative min-h-[200px] py-8"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'left center' }}
          >
            {/* Horizontal line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border" />

            {/* Timeline nodes */}
            <div className="flex justify-between relative">
              {timelineNodes.map((node, idx) => (
                <div key={idx} className="flex flex-col items-center" style={{ flex: 1 }}>
                  {/* Node circle */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-xl relative z-10 border-4 border-background",
                      roleColors[node.role]
                    )}
                  >
                    {node.icon}
                  </div>

                  {/* Node content */}
                  <div className="mt-4 text-center max-w-[150px]">
                    <div className="font-semibold text-sm mb-1">{node.stage}</div>
                    <Badge variant="outline" className="mb-2">
                      {roleIcons[node.role]} {node.role.replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mb-1">
                      {node.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(node.timestamp, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t flex justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">Client</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--rcms-teal))]" />
            <span className="text-xs text-muted-foreground">RN Care Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Provider</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(var(--rcms-gold))]" />
            <span className="text-xs text-muted-foreground">Attorney</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
