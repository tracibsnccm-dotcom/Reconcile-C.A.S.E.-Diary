import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Check, UserPlus, FileCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConcernDetailModal } from "./ConcernDetailModal";
import { StatusBadge, getStatusProgress } from "./StatusBadge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Concern {
  id: string;
  case_id: string;
  client_id: string;
  concern_description: string;
  provider_name: string;
  concern_status: string;
  created_at: string;
  updated_at: string;
}

interface ConcernsLogTableProps {
  filters: {
    status: string;
    dateRange: string;
    role: string;
    type: string;
  };
  onUpdate: () => void;
  highlightId?: string;
}

export function ConcernsLogTable({ filters, onUpdate, highlightId }: ConcernsLogTableProps) {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConcern, setSelectedConcern] = useState<Concern | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchConcerns();
  }, [filters]);

  const fetchConcerns = async () => {
    try {
      let query = supabase.from("concerns").select("*").order("created_at", { ascending: false });

      // Apply filters
      if (filters.status !== "all") {
        if (filters.status === "open") {
          query = query.eq("concern_status", "Open");
        } else if (filters.status === "resolved") {
          query = query.eq("concern_status", "Resolved");
        }
      }

      if (filters.role !== "all") {
        query = query.eq("provider_name", filters.role);
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
      setConcerns(data || []);
    } catch (error) {
      console.error("Error fetching concerns:", error);
      toast({
        title: "Error",
        description: "Unable to load concerns.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (concernId: string) => {
    try {
      const { error } = await supabase
        .from("concerns")
        .update({ concern_status: "Under Review" })
        .eq("id", concernId);

      if (error) throw error;

      toast({
        title: "Acknowledged",
        description: "Concern receipt has been acknowledged.",
      });

      fetchConcerns();
      onUpdate();
    } catch (error) {
      console.error("Error acknowledging concern:", error);
      toast({
        title: "Error",
        description: "Unable to acknowledge concern.",
        variant: "destructive",
      });
    }
  };


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Concerns Log (Identified)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading concerns...</div>
          ) : concerns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No concerns found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Submitted</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Role Involved</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {concerns.map((concern) => (
                    <TableRow key={concern.id}>
                      <TableCell>{format(new Date(concern.created_at), "MMM dd, yyyy HH:mm")}</TableCell>
                      <TableCell className="font-medium">Client #{concern.client_id.slice(0, 8)}</TableCell>
                      <TableCell className="font-mono text-xs">{concern.case_id.slice(0, 8)}</TableCell>
                      <TableCell>{concern.provider_name}</TableCell>
                      <TableCell>
                        <StatusBadge status={concern.concern_status} />
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedConcern(concern);
                            setDetailModalOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedConcern && (
        <ConcernDetailModal
          concernId={selectedConcern?.id || null}
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          concern={selectedConcern}
        />
      )}
    </>
  );
}
