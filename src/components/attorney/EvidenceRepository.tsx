import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Video, FileText, MapPin, Calendar, Tag, Link as LinkIcon, Upload } from "lucide-react";

interface Evidence {
  id: string;
  caseId: string;
  caseName: string;
  type: "photo" | "video" | "document" | "physical";
  name: string;
  description: string;
  tags: string[];
  location?: string;
  dateCollected: string;
  chainOfCustody: string[];
  linkedDocuments?: string[];
}

export function EvidenceRepository() {
  const [evidence, setEvidence] = useState<Evidence[]>([
    {
      id: "1",
      caseId: "case-001",
      caseName: "Johnson v. State",
      type: "photo",
      name: "Accident Scene - Intersection",
      description: "Photos of accident scene showing skid marks and vehicle positions",
      tags: ["accident", "scene", "photos"],
      location: "5th & Main St",
      dateCollected: "2024-01-15",
      chainOfCustody: ["Officer Davis", "Evidence Tech Brown", "Attorney"],
      linkedDocuments: ["Police Report", "Witness Statement #1"]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCase, setFilterCase] = useState("all");

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "photo": return <Image className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "photo": return "bg-blue-500/10 text-blue-500";
      case "video": return "bg-purple-500/10 text-purple-500";
      case "document": return "bg-green-500/10 text-green-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const filteredEvidence = evidence.filter(e =>
    (e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     e.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (filterType === "all" || e.type === filterType) &&
    (filterCase === "all" || e.caseId === filterCase)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Evidence Repository</h2>
          <p className="text-muted-foreground">Centralized evidence tracking with chain of custody</p>
        </div>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Evidence
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search evidence by name, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="photo">Photos</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="physical">Physical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCase} onValueChange={setFilterCase}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Cases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            <SelectItem value="case-001">Johnson v. State</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredEvidence.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={getTypeBadgeColor(item.type)}>
                    {getTypeIcon(item.type)}
                    <span className="ml-1 capitalize">{item.type}</span>
                  </Badge>
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                </div>
                
                <div className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium">{item.caseName}</span>
                </div>

                <p className="text-sm mb-3">{item.description}</p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {item.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{item.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Collected: {new Date(item.dateCollected).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="bg-muted/50 p-3 rounded space-y-2">
                  <div className="text-sm font-medium">Chain of Custody:</div>
                  <div className="text-xs text-muted-foreground">
                    {item.chainOfCustody.join(" → ")}
                  </div>
                  {item.linkedDocuments && item.linkedDocuments.length > 0 && (
                    <div className="mt-2">
                      <div className="text-sm font-medium mb-1">Linked Documents:</div>
                      <div className="flex flex-wrap gap-2">
                        {item.linkedDocuments.map((doc) => (
                          <Badge key={doc} variant="secondary" className="text-xs">
                            <LinkIcon className="h-3 w-3 mr-1" />
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
