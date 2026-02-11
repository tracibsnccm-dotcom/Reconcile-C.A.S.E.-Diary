import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Shield, Search, CheckCircle, XCircle } from "lucide-react";

export function ConflictChecker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      setSearchResults({
        query: searchQuery,
        conflicts: searchQuery.toLowerCase().includes("johnson") ? 1 : 0,
        potentialConflicts: Math.random() > 0.7 ? 1 : 0,
        clear: searchQuery.toLowerCase().includes("smith"),
      });
      setIsSearching(false);
    }, 1000);
  };

  const recentChecks = [
    { name: "Williams, Robert", date: "2024-06-26", result: "clear", caseType: "Personal Injury" },
    { name: "Davis, Katherine", date: "2024-06-25", result: "clear", caseType: "Workers Comp" },
    { name: "Johnson Medical Group", date: "2024-06-24", result: "conflict", caseType: "Medical Malpractice" },
    { name: "Smith & Associates", date: "2024-06-23", result: "clear", caseType: "Contract Dispute" },
  ];

  return (
    <div className="space-y-6">
      {/* Conflict Check Tool */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Conflict of Interest Check</h3>
            <p className="text-sm text-muted-foreground">
              Search for potential conflicts before taking on new cases
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="conflict-search">Search Party Name or Entity</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="conflict-search"
                placeholder="Enter client, adverse party, or entity name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={!searchQuery || isSearching}>
                <Search className="mr-2 h-4 w-4" />
                {isSearching ? "Searching..." : "Check"}
              </Button>
            </div>
          </div>

          {searchResults && (
            <Card className={`p-6 ${
              searchResults.conflicts > 0 
                ? "border-red-500/50 bg-red-500/5"
                : searchResults.potentialConflicts > 0
                ? "border-yellow-500/50 bg-yellow-500/5"
                : "border-green-500/50 bg-green-500/5"
            }`}>
              <div className="flex items-start gap-3 mb-4">
                {searchResults.conflicts > 0 ? (
                  <XCircle className="h-6 w-6 text-red-600 mt-1" />
                ) : searchResults.potentialConflicts > 0 ? (
                  <AlertTriangle className="h-6 w-6 text-yellow-600 mt-1" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">
                    {searchResults.conflicts > 0 
                      ? "Conflict Detected"
                      : searchResults.potentialConflicts > 0
                      ? "Potential Conflict Found"
                      : "No Conflicts Found"
                    }
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Search query: <span className="font-semibold">"{searchResults.query}"</span>
                  </p>

                  {searchResults.conflicts > 0 && (
                    <div className="space-y-2">
                      <div className="p-3 bg-background rounded-lg">
                        <div className="font-medium mb-1">Direct Conflict Found</div>
                        <div className="text-sm text-muted-foreground">
                          This party was previously represented in Case C-2023-0845 (Johnson v. Acme Corp) 
                          which is adverse to the current inquiry. Review ethics rules before proceeding.
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary">Case: C-2023-0845</Badge>
                          <Badge variant="secondary">Status: Active</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {searchResults.potentialConflicts > 0 && (
                    <div className="space-y-2">
                      <div className="p-3 bg-background rounded-lg">
                        <div className="font-medium mb-1">Related Party Match</div>
                        <div className="text-sm text-muted-foreground">
                          A related entity appears in a closed case. Additional review recommended to ensure no conflict exists.
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary">Case: C-2022-1234</Badge>
                          <Badge variant="secondary">Status: Closed</Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {searchResults.clear && (
                    <div className="text-sm">
                      No conflicts detected in current or past cases. Safe to proceed with intake, 
                      but remember to run additional checks on all parties as they are identified.
                    </div>
                  )}
                </div>
              </div>

              {(searchResults.conflicts > 0 || searchResults.potentialConflicts > 0) && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">View Full Report</Button>
                  <Button variant="outline" size="sm">Request Ethics Review</Button>
                </div>
              )}
            </Card>
          )}
        </div>
      </Card>

      {/* Recent Checks */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Recent Conflict Checks</h4>
        <div className="space-y-3">
          {recentChecks.map((check, idx) => (
            <Card key={idx} className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {check.result === "clear" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {check.caseType} • {check.date}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    check.result === "clear"
                      ? "bg-green-500/10 text-green-700 border-green-500/20"
                      : "bg-red-500/10 text-red-700 border-red-500/20"
                  }
                >
                  {check.result === "clear" ? "No Conflict" : "Conflict"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Checks</div>
          <div className="text-2xl font-bold">248</div>
          <div className="text-xs text-muted-foreground mt-1">This year</div>
        </Card>
        <Card className="p-4 border-red-500/20 bg-red-500/5">
          <div className="text-sm text-muted-foreground">Conflicts Found</div>
          <div className="text-2xl font-bold text-red-600">7</div>
          <div className="text-xs text-muted-foreground mt-1">2.8% rate</div>
        </Card>
        <Card className="p-4 border-green-500/20 bg-green-500/5">
          <div className="text-sm text-muted-foreground">Cases Protected</div>
          <div className="text-2xl font-bold text-green-600">241</div>
          <div className="text-xs text-muted-foreground mt-1">97.2%</div>
        </Card>
      </div>

      {/* Best Practices */}
      <Card className="p-6 bg-muted/30">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-2">Conflict Check Best Practices</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Run checks on all parties and related entities before accepting new cases</li>
              <li>• Check variations of names and business entities</li>
              <li>• Review both active and closed cases for potential conflicts</li>
              <li>• Document all conflict checks and clearances</li>
              <li>• When in doubt, request an ethics review</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
