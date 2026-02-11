import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Settings, GripVertical, ExternalLink, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export interface Widget {
  id: string;
  name: string;
  category: "clinical" | "legal-tool" | "custom";
  component: React.ComponentType<any>;
  defaultEnabled: boolean;
  customUrl?: string;
}

interface CustomTool {
  id: string;
  name: string;
  url: string;
}

interface WidgetGridProps {
  availableWidgets: Widget[];
  storageKey?: string;
}

export function WidgetGrid({ availableWidgets, storageKey = "attorney-widgets" }: WidgetGridProps) {
  const [enabledWidgets, setEnabledWidgets] = useState<string[]>([]);
  const [widgetOrder, setWidgetOrder] = useState<string[]>([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customTools, setCustomTools] = useState<CustomTool[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newToolName, setNewToolName] = useState("");
  const [newToolUrl, setNewToolUrl] = useState("");

  // Load saved preferences
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    const savedOrder = localStorage.getItem(`${storageKey}-order`);
    const savedCustom = localStorage.getItem(`${storageKey}-custom`);
    
    if (saved) {
      setEnabledWidgets(JSON.parse(saved));
    } else {
      setEnabledWidgets(
        availableWidgets.filter((w) => w.defaultEnabled).map((w) => w.id)
      );
    }
    
    if (savedOrder) {
      setWidgetOrder(JSON.parse(savedOrder));
    }
    
    if (savedCustom) {
      setCustomTools(JSON.parse(savedCustom));
    }
  }, [storageKey, availableWidgets]);

  // Save preferences
  const savePreferences = (widgetIds: string[]) => {
    setEnabledWidgets(widgetIds);
    localStorage.setItem(storageKey, JSON.stringify(widgetIds));
  };

  const saveOrder = (order: string[]) => {
    setWidgetOrder(order);
    localStorage.setItem(`${storageKey}-order`, JSON.stringify(order));
  };

  const saveCustomTools = (tools: CustomTool[]) => {
    setCustomTools(tools);
    localStorage.setItem(`${storageKey}-custom`, JSON.stringify(tools));
  };

  const toggleWidget = (widgetId: string) => {
    const updated = enabledWidgets.includes(widgetId)
      ? enabledWidgets.filter((id) => id !== widgetId)
      : [...enabledWidgets, widgetId];
    savePreferences(updated);
  };

  const addCustomTool = () => {
    if (!newToolName.trim() || !newToolUrl.trim()) {
      toast.error("Please enter both name and URL");
      return;
    }

    const newTool: CustomTool = {
      id: `custom-${Date.now()}`,
      name: newToolName.trim(),
      url: newToolUrl.trim(),
    };

    const updated = [...customTools, newTool];
    saveCustomTools(updated);
    savePreferences([...enabledWidgets, newTool.id]);
    
    setNewToolName("");
    setNewToolUrl("");
    setIsAddingCustom(false);
    toast.success("Custom tool added!");
  };

  const removeCustomTool = (id: string) => {
    const updated = customTools.filter((t) => t.id !== id);
    saveCustomTools(updated);
    savePreferences(enabledWidgets.filter((wid) => wid !== id));
    toast.success("Custom tool removed");
  };

  // Create custom widgets from tools
  const CustomToolWidget = ({ tool }: { tool: CustomTool }) => (
    <Card>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">{tool.name}</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => removeCustomTool(tool.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button size="sm" variant="outline" className="w-full" asChild>
          <a href={tool.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-2" />
            Open Tool
          </a>
        </Button>
      </div>
    </Card>
  );

  // Merge built-in and custom widgets
  const allWidgets = [
    ...availableWidgets,
    ...customTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      category: "custom" as const,
      component: () => <CustomToolWidget tool={tool} />,
      defaultEnabled: true,
      customUrl: tool.url,
    })),
  ];

  const activeWidgets = allWidgets.filter((w) => enabledWidgets.includes(w.id));

  // Sort by saved order
  const sortedWidgets = widgetOrder.length > 0
    ? [...activeWidgets].sort((a, b) => {
        const aIndex = widgetOrder.indexOf(a.id);
        const bIndex = widgetOrder.indexOf(b.id);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      })
    : activeWidgets;

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newOrder = [...sortedWidgets];
    const draggedItem = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(index, 0, draggedItem);

    const newOrderIds = newOrder.map((w) => w.id);
    saveOrder(newOrderIds);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Header with customization */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Dashboard</h2>
        <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Customize Widgets
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customize Your Dashboard</DialogTitle>
              <DialogDescription>
                Select which widgets to display on your dashboard. Changes are saved automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Clinical Features */}
              <div>
                <h3 className="font-semibold mb-3 text-primary">Clinical Features</h3>
                <div className="space-y-3">
                  {availableWidgets
                    .filter((w) => w.category === "clinical")
                    .map((widget) => (
                      <div key={widget.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={widget.id}
                          checked={enabledWidgets.includes(widget.id)}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                        <Label
                          htmlFor={widget.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {widget.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Legal Tool Integrations */}
              <div>
                <h3 className="font-semibold mb-3 text-blue-600">Legal Tool Access</h3>
                <div className="space-y-3">
                  {availableWidgets
                    .filter((w) => w.category === "legal-tool")
                    .map((widget) => (
                      <div key={widget.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={widget.id}
                          checked={enabledWidgets.includes(widget.id)}
                          onCheckedChange={() => toggleWidget(widget.id)}
                        />
                        <Label
                          htmlFor={widget.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {widget.name}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>

              {/* Custom Tools */}
              <div>
                <h3 className="font-semibold mb-3">Custom Tools</h3>
                <div className="space-y-3">
                  {customTools.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={tool.id}
                          checked={enabledWidgets.includes(tool.id)}
                          onCheckedChange={() => toggleWidget(tool.id)}
                        />
                        <Label
                          htmlFor={tool.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {tool.name}
                        </Label>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCustomTool(tool.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Dialog open={isAddingCustom} onOpenChange={setIsAddingCustom}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Custom Tool
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Custom Tool</DialogTitle>
                      <DialogDescription>
                        Add a quick access link to any external tool or website.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="tool-name">Tool Name</Label>
                        <Input
                          id="tool-name"
                          placeholder="e.g., Court Portal, Time Tracker"
                          value={newToolName}
                          onChange={(e) => setNewToolName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tool-url">URL</Label>
                        <Input
                          id="tool-url"
                          placeholder="https://..."
                          value={newToolUrl}
                          onChange={(e) => setNewToolUrl(e.target.value)}
                        />
                      </div>
                      <Button onClick={addCustomTool} className="w-full">
                        Add Tool
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedWidgets.map((widget, index) => {
          const WidgetComponent = widget.component;
          return (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group cursor-move transition-opacity ${
                draggedIndex === index ? "opacity-50" : ""
              }`}
            >
              <div className="absolute -top-2 -left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-primary text-primary-foreground rounded-full p-1">
                  <GripVertical className="h-3 w-3" />
                </div>
              </div>
              <WidgetComponent />
            </div>
          );
        })}

        {/* Empty state */}
        {sortedWidgets.length === 0 && (
          <Card className="col-span-full p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No widgets enabled. Click "Customize Widgets" to add tools to your dashboard.
            </p>
            <Button onClick={() => setIsCustomizing(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Widgets
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
