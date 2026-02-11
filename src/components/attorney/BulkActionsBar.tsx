import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Archive, 
  Trash2, 
  Mail, 
  Tag, 
  CheckSquare,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  itemType: "cases" | "documents" | "messages";
}

export default function BulkActionsBar({ 
  selectedCount, 
  onClearSelection,
  itemType 
}: BulkActionsBarProps) {
  const { toast } = useToast();
  const [bulkAction, setBulkAction] = useState<string>("");

  const handleBulkAction = async (action: string) => {
    switch (action) {
      case "export":
        toast({ title: `Exporting ${selectedCount} ${itemType}...` });
        break;
      case "archive":
        toast({ title: `Archiving ${selectedCount} ${itemType}...` });
        break;
      case "delete":
        toast({ 
          title: `Deleting ${selectedCount} ${itemType}...`,
          variant: "destructive" 
        });
        break;
      case "tag":
        toast({ title: `Adding tags to ${selectedCount} ${itemType}...` });
        break;
      case "email":
        toast({ title: `Preparing email for ${selectedCount} items...` });
        break;
      case "complete":
        toast({ title: `Marking ${selectedCount} items as complete...` });
        break;
    }
    
    // Clear selection after action
    setTimeout(() => {
      onClearSelection();
      setBulkAction("");
    }, 1000);
  };

  if (selectedCount === 0) return null;

  const getActions = () => {
    const commonActions = [
      { value: "export", label: "Export", icon: <Download className="h-4 w-4" /> },
      { value: "archive", label: "Archive", icon: <Archive className="h-4 w-4" /> },
      { value: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" /> }
    ];

    if (itemType === "cases") {
      return [
        ...commonActions,
        { value: "tag", label: "Add Tag", icon: <Tag className="h-4 w-4" /> }
      ];
    }

    if (itemType === "documents") {
      return [
        ...commonActions,
        { value: "email", label: "Send via Email", icon: <Mail className="h-4 w-4" /> }
      ];
    }

    if (itemType === "messages") {
      return [
        { value: "complete", label: "Mark as Complete", icon: <CheckSquare className="h-4 w-4" /> },
        { value: "archive", label: "Archive", icon: <Archive className="h-4 w-4" /> },
        { value: "delete", label: "Delete", icon: <Trash2 className="h-4 w-4" /> }
      ];
    }

    return commonActions;
  };

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 bg-primary text-primary-foreground rounded-lg shadow-lg p-3 animate-in slide-in-from-bottom-5">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          <span className="font-medium">{selectedCount} selected</span>
        </div>

        <div className="h-6 w-px bg-primary-foreground/30" />

        <Select value={bulkAction} onValueChange={(value) => {
          setBulkAction(value);
          handleBulkAction(value);
        }}>
          <SelectTrigger className="w-[180px] bg-primary-foreground text-primary">
            <SelectValue placeholder="Choose action..." />
          </SelectTrigger>
          <SelectContent>
            {getActions().map(action => (
              <SelectItem key={action.value} value={action.value}>
                <div className="flex items-center gap-2">
                  {action.icon}
                  {action.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClearSelection}
          className="hover:bg-primary-foreground/20 text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
