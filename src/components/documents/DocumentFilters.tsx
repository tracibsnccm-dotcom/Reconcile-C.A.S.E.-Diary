import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Calendar as CalendarIcon, Upload, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DocumentFiltersProps {
  selectedCase: string;
  selectedType: string;
  selectedStatus: string;
  selectedCategory: string;
  searchQuery: string;
  dateRange: { from?: Date; to?: Date };
  showSensitiveOnly: boolean;
  showAwaitingOnly: boolean;
  showMyUploadsOnly: boolean;
  cases: Array<{ id: string }>;
  onCaseChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  onSensitiveOnlyChange: (value: boolean) => void;
  onAwaitingOnlyChange: (value: boolean) => void;
  onMyUploadsOnlyChange: (value: boolean) => void;
  onUploadClick: () => void;
  /** When true, hides Upload button and "Show Only Files Uploaded by Me" (e.g. attorney read-only). */
  hideUploadUI?: boolean;
}

export function DocumentFilters({
  selectedCase,
  selectedType,
  selectedStatus,
  selectedCategory,
  searchQuery,
  dateRange,
  showSensitiveOnly,
  showAwaitingOnly,
  showMyUploadsOnly,
  cases,
  onCaseChange,
  onTypeChange,
  onStatusChange,
  onCategoryChange,
  onSearchChange,
  onDateRangeChange,
  onSensitiveOnlyChange,
  onAwaitingOnlyChange,
  onMyUploadsOnlyChange,
  onUploadClick,
  hideUploadUI = false,
}: DocumentFiltersProps) {
  const handleClearFilters = () => {
    onCaseChange("all");
    onTypeChange("all");
    onStatusChange("all");
    onCategoryChange("all");
    onSearchChange("");
    onDateRangeChange({});
    onSensitiveOnlyChange(false);
    onAwaitingOnlyChange(false);
    onMyUploadsOnlyChange(false);
  };

  return (
    <Card className="p-6 border-border">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Filter & Search</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div>
          <Label>Select Case</Label>
          <Select value={selectedCase} onValueChange={onCaseChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Cases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              {cases.slice(0, 20).map((caseItem) => (
                <SelectItem key={caseItem.id} value={caseItem.id}>
                  {caseItem.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Document Type</Label>
          <Select value={selectedType} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Clinical Report">📑 Clinical Report</SelectItem>
              <SelectItem value="Legal Filing">⚖️ Legal Filing</SelectItem>
              <SelectItem value="Client Form">Client Form</SelectItem>
              <SelectItem value="Provider Note">⚕️ Provider Note</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Category</Label>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Medical">⚕️ Medical</SelectItem>
              <SelectItem value="Legal">⚖️ Legal</SelectItem>
              <SelectItem value="Financial">💰 Financial</SelectItem>
              <SelectItem value="Communication">💬 Communication</SelectItem>
              <SelectItem value="Other">📋 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Status</Label>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date Range</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  "Pick a date"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => onDateRangeChange(range || {})}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Toggle Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="sensitive-only"
            checked={showSensitiveOnly}
            onCheckedChange={onSensitiveOnlyChange}
          />
          <Label htmlFor="sensitive-only" className="cursor-pointer">
            🔒 Show Only Sensitive Documents
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="awaiting-only"
            checked={showAwaitingOnly}
            onCheckedChange={onAwaitingOnlyChange}
          />
          <Label htmlFor="awaiting-only" className="cursor-pointer">
            ⏳ Show Only Awaiting Review
          </Label>
        </div>

        {!hideUploadUI && (
          <div className="flex items-center space-x-2">
            <Switch
              id="my-uploads-only"
              checked={showMyUploadsOnly}
              onCheckedChange={onMyUploadsOnlyChange}
            />
            <Label htmlFor="my-uploads-only" className="cursor-pointer">
              👤 Show Only Files Uploaded by Me
            </Label>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <Button variant="outline" onClick={handleClearFilters}>
          <X className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
        {!hideUploadUI && (
          <Button 
            className="bg-[#b09837] text-black hover:bg-black hover:text-[#b09837]"
            onClick={onUploadClick}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload New Document
          </Button>
        )}
      </div>
    </Card>
  );
}
