import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Video, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  type: "document" | "video" | "guide";
  category: string;
  url: string;
}

export function RNResourceLibrary() {
  const resources: Resource[] = [
    {
      id: "1",
      title: "Care Plan Best Practices",
      type: "document",
      category: "Clinical Guidelines",
      url: "#",
    },
    {
      id: "2",
      title: "Medication Management Video",
      type: "video",
      category: "Training",
      url: "#",
    },
    {
      id: "3",
      title: "Documentation Standards",
      type: "guide",
      category: "Compliance",
      url: "#",
    },
    {
      id: "4",
      title: "Client Communication Tips",
      type: "document",
      category: "Best Practices",
      url: "#",
    },
  ];

  const getIcon = (type: Resource["type"]) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "guide":
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Resource Library
        </CardTitle>
        <CardDescription>Quick access to guides and training materials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {resources.map((resource) => (
            <Button
              key={resource.id}
              variant="ghost"
              className="w-full justify-start"
              asChild
            >
              <a href={resource.url} className="flex items-center gap-3">
                {getIcon(resource.type)}
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium">{resource.title}</p>
                  <p className="text-xs text-muted-foreground">{resource.category}</p>
                </div>
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
