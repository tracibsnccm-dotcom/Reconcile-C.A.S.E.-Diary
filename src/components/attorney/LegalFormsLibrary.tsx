import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Search, Star, Clock, FolderOpen } from "lucide-react";

const formsCategories = [
  { value: "all", label: "All Forms", count: 142 },
  { value: "pleadings", label: "Pleadings", count: 28 },
  { value: "discovery", label: "Discovery", count: 35 },
  { value: "motions", label: "Motions", count: 24 },
  { value: "settlement", label: "Settlement", count: 18 },
  { value: "intake", label: "Intake", count: 12 },
  { value: "correspondence", label: "Correspondence", count: 25 },
];

const forms = [
  {
    name: "Complaint - Personal Injury",
    category: "pleadings",
    jurisdiction: "State",
    lastUpdated: "2024-06-15",
    downloads: 45,
    favorite: true,
  },
  {
    name: "Interrogatories - Standard Set",
    category: "discovery",
    jurisdiction: "State",
    lastUpdated: "2024-06-10",
    downloads: 38,
    favorite: true,
  },
  {
    name: "Motion to Compel Discovery",
    category: "motions",
    jurisdiction: "State",
    lastUpdated: "2024-05-28",
    downloads: 22,
    favorite: false,
  },
  {
    name: "Settlement Demand Letter",
    category: "settlement",
    jurisdiction: "All",
    lastUpdated: "2024-06-20",
    downloads: 67,
    favorite: true,
  },
  {
    name: "Medical Authorization Release",
    category: "intake",
    jurisdiction: "Federal",
    lastUpdated: "2024-06-01",
    downloads: 89,
    favorite: false,
  },
  {
    name: "Request for Production of Documents",
    category: "discovery",
    jurisdiction: "State",
    lastUpdated: "2024-06-12",
    downloads: 31,
    favorite: false,
  },
];

const recentlyUsed = [
  { name: "Complaint - Personal Injury", date: "Today", category: "pleadings" },
  { name: "Settlement Demand Letter", date: "Yesterday", category: "settlement" },
  { name: "Interrogatories - Standard Set", date: "2 days ago", category: "discovery" },
];

export function LegalFormsLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredForms = forms.filter(form => 
    (selectedCategory === "all" || form.category === selectedCategory) &&
    (searchQuery === "" || form.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Legal Forms Library</h3>
          <p className="text-sm text-muted-foreground">
            Pre-drafted forms and templates for your practice
          </p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Upload Custom Form
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search forms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
          {formsCategories.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
              {cat.label}
              <Badge variant="secondary" className="ml-1">
                {cat.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {formsCategories.map((cat) => (
          <TabsContent key={cat.value} value={cat.value} className="space-y-6">
            {/* Recently Used */}
            {cat.value === "all" && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Recently Used</h4>
                </div>
                <div className="space-y-2">
                  {recentlyUsed.map((form, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{form.name}</div>
                          <div className="text-xs text-muted-foreground">{form.date}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Forms List */}
            <div className="grid grid-cols-1 gap-3">
              {filteredForms.map((form, idx) => (
                <Card
                  key={idx}
                  className="p-4 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{form.name}</h4>
                          {form.favorite && (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          <span>Jurisdiction: {form.jurisdiction}</span>
                          <span>•</span>
                          <span>Updated: {form.lastUpdated}</span>
                          <span>•</span>
                          <span>{form.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        Preview
                      </Button>
                      <Button size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Forms</div>
          <div className="text-2xl font-bold">142</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Favorites</div>
          <div className="text-2xl font-bold">18</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Custom Forms</div>
          <div className="text-2xl font-bold">7</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">This Month</div>
          <div className="text-2xl font-bold">52</div>
        </Card>
      </div>
    </div>
  );
}
