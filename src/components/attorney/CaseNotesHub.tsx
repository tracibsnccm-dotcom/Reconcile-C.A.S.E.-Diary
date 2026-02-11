import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Plus, Search, Filter, Lock, Users, Tag } from "lucide-react";

const mockNotes = [
  {
    id: "1",
    title: "Initial Client Meeting Notes",
    content: "Discussed case details, injury timeline, and treatment history...",
    visibility: "private",
    tags: ["intake", "consultation"],
    createdAt: "2024-06-15",
    updatedAt: "2024-06-15",
  },
  {
    id: "2",
    title: "Medical Records Review",
    content: "Reviewed 45 pages of medical records from primary care physician...",
    visibility: "shared",
    tags: ["medical", "evidence"],
    createdAt: "2024-06-18",
    updatedAt: "2024-06-20",
  },
  {
    id: "3",
    title: "Settlement Strategy Discussion",
    content: "Discussed potential settlement ranges with team...",
    visibility: "private",
    tags: ["strategy", "settlement"],
    createdAt: "2024-06-22",
    updatedAt: "2024-06-22",
  },
];

const categories = [
  { value: "all", label: "All Notes", count: 24 },
  { value: "intake", label: "Intake", count: 8 },
  { value: "medical", label: "Medical", count: 12 },
  { value: "legal", label: "Legal Research", count: 6 },
  { value: "strategy", label: "Strategy", count: 5 },
  { value: "correspondence", label: "Correspondence", count: 15 },
];

export function CaseNotesHub() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showNewNote, setShowNewNote] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Case Notes & Documentation</h3>
          <p className="text-sm text-muted-foreground">
            Centralized repository for all case-related notes and documentation
          </p>
        </div>
        <Button onClick={() => setShowNewNote(!showNewNote)}>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
              {cat.label}
              <Badge variant="secondary" className="ml-1">
                {cat.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-4">
            {showNewNote && (
              <Card className="p-6 border-primary/50">
                <div className="space-y-4">
                  <Input placeholder="Note Title" />
                  <Textarea
                    placeholder="Start typing your note..."
                    rows={6}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Lock className="mr-2 h-4 w-4" />
                        Private
                      </Button>
                      <Button variant="outline" size="sm">
                        <Tag className="mr-2 h-4 w-4" />
                        Add Tags
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => setShowNewNote(false)}>
                        Cancel
                      </Button>
                      <Button>Save Note</Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {mockNotes.map((note) => (
              <Card key={note.id} className="p-6 hover:bg-muted/50 cursor-pointer transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <FileText className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{note.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {note.visibility === "private" ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Users className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated {note.updatedAt}
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Notes</div>
          <div className="text-2xl font-bold">48</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">This Week</div>
          <div className="text-2xl font-bold">7</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Private</div>
          <div className="text-2xl font-bold">32</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Shared</div>
          <div className="text-2xl font-bold">16</div>
        </Card>
      </div>
    </div>
  );
}
