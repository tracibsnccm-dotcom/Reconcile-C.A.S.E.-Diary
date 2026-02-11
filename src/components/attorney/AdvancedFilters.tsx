import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Filter, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface FilterConfig {
  status?: string[];
  priority?: string[];
  dateRange?: { from: Date; to: Date };
  assignedTo?: string;
  tags?: string[];
  searchTerm?: string;
  caseType?: string;
  amount?: { min: number; max: number };
}

interface AdvancedFiltersProps {
  onApplyFilters: (filters: FilterConfig) => void;
  filterType: "cases" | "documents" | "tasks" | "clients";
}

export default function AdvancedFilters({ onApplyFilters, filterType }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>({});
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const updateFilter = (key: keyof FilterConfig, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const count = Object.values(filters).filter(v => 
      v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true)
    ).length;
    setActiveFiltersCount(count);
    onApplyFilters(filters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({});
    setActiveFiltersCount(0);
    onApplyFilters({});
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 rounded-full h-5 w-5 p-0 flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Filter {filterType}</h4>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            )}
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={filters.status?.[0]} 
              onValueChange={(value) => updateFilter("status", [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select 
              value={filters.priority?.[0]} 
              onValueChange={(value) => updateFilter("priority", [value])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Case Type (for cases filter) */}
          {filterType === "cases" && (
            <div className="space-y-2">
              <Label>Case Type</Label>
              <Select 
                value={filters.caseType} 
                onValueChange={(value) => updateFilter("caseType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal-injury">Personal Injury</SelectItem>
                  <SelectItem value="workers-comp">Workers Compensation</SelectItem>
                  <SelectItem value="medical-malpractice">Medical Malpractice</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Amount Range (for cases) */}
          {filterType === "cases" && (
            <div className="space-y-2">
              <Label>Case Value Range</Label>
              <div className="flex gap-2">
                <Input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.amount?.min || ""}
                  onChange={(e) => updateFilter("amount", { 
                    ...filters.amount, 
                    min: parseInt(e.target.value) 
                  })}
                />
                <Input 
                  type="number" 
                  placeholder="Max"
                  value={filters.amount?.max || ""}
                  onChange={(e) => updateFilter("amount", { 
                    ...filters.amount, 
                    max: parseInt(e.target.value) 
                  })}
                />
              </div>
            </div>
          )}

          {/* Search Term */}
          <div className="space-y-2">
            <Label>Search</Label>
            <Input 
              placeholder="Search keywords..." 
              value={filters.searchTerm || ""}
              onChange={(e) => updateFilter("searchTerm", e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
