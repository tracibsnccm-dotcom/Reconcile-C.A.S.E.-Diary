import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MedicalResearchWidget() {
  const quickSearches = [
    { query: "traumatic brain injury outcomes", category: "TBI" },
    { query: "spinal fusion recovery timeline", category: "Spine" },
    { query: "CRPS treatment protocols", category: "Pain" },
    { query: "PTSD medical documentation", category: "Mental Health" },
  ];

  const handleSearch = (query: string, platform: "westlaw" | "lexis") => {
    const urls = {
      westlaw: `https://1.next.westlaw.com/Search/Results.html?query=${encodeURIComponent(query)}`,
      lexis: `https://www.lexisnexis.com/en-us/products/lexis-plus.page?query=${encodeURIComponent(query)}`,
    };
    window.open(urls[platform], "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Medical Research
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">Quick searches for common medical issues</p>
        <div className="space-y-2">
          {quickSearches.map((search) => (
            <div key={search.query} className="flex items-center justify-between gap-2 p-2 border rounded-lg hover:bg-muted/50">
              <div className="flex-1 min-w-0">
                <Badge variant="secondary" className="text-xs mb-1">{search.category}</Badge>
                <p className="text-xs truncate">{search.query}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => handleSearch(search.query, "westlaw")}
                  title="Search Westlaw"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" variant="outline" className="w-full">
          <Search className="h-3 w-3 mr-2" />
          Custom Search
        </Button>
      </CardContent>
    </Card>
  );
}
