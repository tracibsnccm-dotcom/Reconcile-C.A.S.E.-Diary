import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface AssignmentHistory {
  id: string;
  case_id: string;
  status: string;
  offered_at: string;
  responded_at: string | null;
  decline_reason: string | null;
  decline_note: string | null;
}

export function AttorneyAssignmentHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "accepted" | "declined">("all");

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  async function loadHistory() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("assignment_offers")
      .select("*")
      .eq("attorney_id", user.id)
      .in("status", ["accepted", "declined", "expired"])
      .order("offered_at", { ascending: false });

    if (error) {
      console.error("Error loading assignment history:", error);
    } else {
      setHistory(data || []);
    }

    setLoading(false);
  }

  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const stats = {
    total: history.length,
    accepted: history.filter((h) => h.status === "accepted").length,
    declined: history.filter((h) => h.status === "declined").length,
    expired: history.filter((h) => h.status === "expired").length,
  };

  const acceptanceRate =
    stats.total > 0
      ? ((stats.accepted / stats.total) * 100).toFixed(1)
      : "0.0";

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Offers</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold">{stats.accepted}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Declined</p>
              <p className="text-2xl font-bold">{stats.declined}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-sm text-muted-foreground">Acceptance Rate</p>
              <p className="text-2xl font-bold">{acceptanceRate}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assignment History</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "accepted" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("accepted")}
              >
                Accepted
              </Button>
              <Button
                variant={filter === "declined" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("declined")}
              >
                Declined
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Offered</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No assignment history found
                  </TableCell>
                </TableRow>
              ) : (
                filteredHistory.map((item) => {
                  const caseId = `RC-${item.case_id.slice(-8).toUpperCase()}`;
                  const responseTime = item.responded_at
                    ? Math.round(
                        (new Date(item.responded_at).getTime() -
                          new Date(item.offered_at).getTime()) /
                          (1000 * 60 * 60)
                      )
                    : null;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{caseId}</TableCell>
                      <TableCell>
                        {format(new Date(item.offered_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {responseTime !== null ? `${responseTime}h` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "accepted"
                              ? "default"
                              : item.status === "declined"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {item.status === "accepted" && (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          )}
                          {item.status === "declined" && (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.decline_reason || "—"}
                        {item.decline_note && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.decline_note}
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
