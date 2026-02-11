/**
 * RN Resources Dialog — opened via (window as any).openRNResourcesDialog.
 * Used by the "Resources" card in RNPortalLanding Tools & Resources.
 * Extracted from RNQuickActionsBar when execution tiles moved to /rn/queue.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FileText, BookOpen, Video, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  type: "document" | "video" | "guide";
  category: string;
  url: string;
}

const resources: Resource[] = [
  { id: "1", title: "Care Plan Best Practices", type: "document", category: "Clinical Guidelines", url: "#" },
  { id: "2", title: "Medication Management Video", type: "video", category: "Training", url: "#" },
  { id: "3", title: "Documentation Standards", type: "guide", category: "Compliance", url: "#" },
  { id: "4", title: "Client Communication Tips", type: "document", category: "Best Practices", url: "#" },
];

function getIcon(type: Resource["type"]) {
  switch (type) {
    case "document":
      return <FileText className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "guide":
      return <BookOpen className="h-4 w-4" />;
  }
}

export function RNResourcesDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (window as any).openRNResourcesDialog = () => setOpen(true);
    return () => {
      delete (window as any).openRNResourcesDialog;
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Resource Library
          </DialogTitle>
          <DialogDescription>
            Quick access to guides and training materials
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {resources.map((r) => (
            <Button key={r.id} variant="ghost" className="w-full justify-start" asChild>
              <a href={r.url} className="flex items-center gap-3">
                {getIcon(r.type)}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.category}</p>
                </div>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
