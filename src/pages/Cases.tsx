import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { CaseCard } from "@/components/CaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context/AppContext";
import { Plus, Search } from "lucide-react";
import { canSearchByName } from "@/lib/access";

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { cases, role } = useApp();
  
  const canSearchNames = canSearchByName(role);

  const filteredCases = cases.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // Case ID and RCMS ID are always searchable
    if (c.id.toLowerCase().includes(query) || c.client.rcmsId.toLowerCase().includes(query)) {
      return true;
    }
    // Name search only for privileged roles
    if (canSearchNames && c.client.fullName) {
      return c.client.fullName.toLowerCase().includes(query);
    }
    return false;
  });

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cases</h1>
            <p className="text-muted-foreground mt-1">Manage all client cases</p>
          </div>
          <Button className="bg-primary hover:bg-primary-dark">
            <Plus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={canSearchNames ? "Search by case #, ID or name" : "Search by case # or ID"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {!canSearchNames && searchQuery && (
              <p className="text-xs text-muted-foreground mt-1">
                Name search requires elevated access
              </p>
            )}
          </div>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCases.map((caseData) => (
            <CaseCard
              key={caseData.id}
              case={caseData}
              onClick={() => navigate(`/cases/${caseData.id}`)}
            />
          ))}
        </div>

        {filteredCases.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No cases found matching your search.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
