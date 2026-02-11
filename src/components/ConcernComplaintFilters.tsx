import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface FilterProps {
  filters: {
    status: string;
    dateRange: string;
    role: string;
    type: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ConcernComplaintFilters({ filters, onFiltersChange }: FilterProps) {
  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Exporting to PDF...");
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log("Exporting to CSV...");
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-filter">Date Range</Label>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => onFiltersChange({ ...filters, dateRange: value })}
            >
              <SelectTrigger id="date-filter">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="24hrs">Last 24 Hours</SelectItem>
                <SelectItem value="48hrs">Last 48 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-filter">Role Involved</Label>
            <Select
              value={filters.role}
              onValueChange={(value) => onFiltersChange({ ...filters, role: value })}
            >
              <SelectTrigger id="role-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="RN_CM">RN Care Manager</SelectItem>
                <SelectItem value="RCMS_CLINICAL_MGMT">RN Clinical Manager</SelectItem>
                <SelectItem value="ATTORNEY">Attorney</SelectItem>
                <SelectItem value="PROVIDER">Provider</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-filter">Type</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => onFiltersChange({ ...filters, type: value })}
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="concern">Concerns</SelectItem>
                <SelectItem value="complaint">Complaints</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Export</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                className="flex-1"
              >
                <FileText className="h-4 w-4 mr-1" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
