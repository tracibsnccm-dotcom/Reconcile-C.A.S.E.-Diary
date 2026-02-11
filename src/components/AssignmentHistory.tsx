import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History } from "lucide-react";
import { format } from "date-fns";

interface AssignmentLog {
  id: string;
  assigned_timestamp: string;
  assigned_by: string;
  assignment_method: string;
  assigned_attorney_id: string;
  reviewed_by: string | null;
}

interface AssignmentHistoryProps {
  caseId: string;
}

export function AssignmentHistory({ caseId }: AssignmentHistoryProps) {
  const [logs, setLogs] = useState<AssignmentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignmentHistory();
  }, [caseId]);

  async function loadAssignmentHistory() {
    try {
      const { data, error } = await supabase
        .from("assignment_audit_log")
        .select("*")
        .eq("case_id", caseId)
        .order("assigned_timestamp", { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error loading assignment history:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--rcms-teal))]" />
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-[hsl(var(--rcms-teal))]" />
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No assignment history available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-[hsl(var(--rcms-teal))]" />
          Assignment History
        </CardTitle>
        <CardDescription>
          Complete log of attorney assignments for this case
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>Attorney</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Assigned By</TableHead>
              <TableHead>Reviewed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {format(new Date(log.assigned_timestamp), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell className="font-medium">
                  {log.assigned_attorney_id.slice(-8)}
                </TableCell>
                <TableCell>
                  <Badge variant={log.assignment_method === "round_robin" ? "default" : "secondary"}>
                    {log.assignment_method === "round_robin" ? "Round Robin" : "Manual"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{log.assigned_by}</Badge>
                </TableCell>
                <TableCell>
                  {log.reviewed_by || "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
