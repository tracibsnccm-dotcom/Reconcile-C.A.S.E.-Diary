import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, FileEdit, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ComplaintDetailModal } from "./ComplaintDetailModal";
import { StatusBadge, getStatusProgress } from "./StatusBadge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";

interface Complaint {
  id: string;
  complaint_about: string;
  complaint_description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

interface ComplaintsLogTableProps {
  filters: {
    status: string;
    dateRange: string;
    role: string;
    type: string;
  };
  onUpdate: () => void;
  highlightId?: string;
}

export function ComplaintsLogTable({ filters, onUpdate, highlightId }: ComplaintsLogTableProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchComplaints();
  }, [filters]);

  const fetchComplaints = async () => {
    try {
      let query = supabase.from("complaints").select("*").order("created_at", { ascending: false });

      // Apply filters
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.role !== "all") {
        query = query.eq("complaint_about", filters.role);
      }

      // Date range filters
      if (filters.dateRange !== "all") {
        const now = new Date();
        let startDate = new Date();

        switch (filters.dateRange) {
          case "24hrs":
            startDate.setHours(now.getHours() - 24);
            break;
          case "48hrs":
            startDate.setHours(now.getHours() - 48);
            break;
          case "7days":
            startDate.setDate(now.getDate() - 7);
            break;
          case "30days":
            startDate.setDate(now.getDate() - 30);
            break;
          case "thisMonth":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }

        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      toast({
        title: "Error",
        description: "Unable to load complaints.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDueDate = (createdAt: string) => {
    return addDays(new Date(createdAt), 15);
  };

  const isDueSoon = (createdAt: string) => {
    const dueDate = getDueDate(createdAt);
    const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue > 0;
  };

  const isOverdue = (createdAt: string) => {
    const dueDate = getDueDate(createdAt);
    return dueDate < new Date();
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setDetailModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Complaints Log (Anonymous)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No complaints found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Role Involved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>15-Day Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {complaints.map((complaint) => {
                    const dueDate = getDueDate(complaint.created_at);
                    const dueSoon = isDueSoon(complaint.created_at);
                    const overdue = isOverdue(complaint.created_at);

                    return (
                      <TableRow key={complaint.id}>
                        <TableCell>{format(new Date(complaint.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                        <TableCell>{complaint.complaint_about.replace("_", " ")}</TableCell>
                        <TableCell>
                          <StatusBadge status={complaint.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={overdue ? "text-destructive font-semibold" : dueSoon ? "text-warning font-semibold" : ""}>
                              {format(dueDate, "MMM dd, yyyy")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(complaint)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedComplaint && (
        <ComplaintDetailModal
          complaintId={selectedComplaint.id}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          complaint={selectedComplaint}
        />
      )}
    </>
  );
}
