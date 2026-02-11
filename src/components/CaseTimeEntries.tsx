import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Clock, TrendingUp, User } from "lucide-react";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  activity_type: string;
  activity_description: string;
  time_spent_minutes: number;
  estimated_attorney_time_saved_minutes: number;
  created_at: string;
  rn_user?: {
    display_name: string;
  };
}

interface CaseTimeEntriesProps {
  caseId: string;
}

const activityLabels: Record<string, string> = {
  medical_record_review: "Medical Record Review",
  provider_communication: "Provider Communication",
  appointment_coordination: "Appointment Coordination",
  treatment_plan_review: "Treatment Plan Review",
  insurance_authorization: "Insurance Authorization",
  care_plan_development: "Care Plan Development",
  client_education: "Client Education",
  documentation: "Clinical Documentation",
  case_research: "Case Research",
  team_coordination: "Team Coordination",
};

export function CaseTimeEntries({ caseId }: CaseTimeEntriesProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [caseId]);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data: entriesData, error } = await supabase
        .from("rn_time_entries")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch RN names separately
      if (entriesData && entriesData.length > 0) {
        const rnIds = [...new Set(entriesData.map(e => e.rn_user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", rnIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

        const enrichedEntries = entriesData.map(entry => ({
          ...entry,
          rn_user: { display_name: profileMap.get(entry.rn_user_id) || "RN CM" }
        }));

        setEntries(enrichedEntries as any);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error("Error fetching time entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalTime = () => entries.reduce((sum, e) => sum + e.time_spent_minutes, 0);
  const getTotalSavings = () => entries.reduce((sum, e) => sum + e.estimated_attorney_time_saved_minutes, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading time entries...
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            RN Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No time entries logged for this case yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          RN Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-primary/5">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Total Entries</div>
              <div className="text-2xl font-bold">{entries.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-primary/5">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">RN Time</div>
              <div className="text-2xl font-bold">{(getTotalTime() / 60).toFixed(1)} hrs</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Attorney Time Saved</div>
              <div className="text-2xl font-bold text-green-600">
                {(getTotalSavings() / 60).toFixed(1)} hrs
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries */}
        <div className="space-y-3">
          {entries.map((entry) => (
            <Card key={entry.id} className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold mb-1">
                      {activityLabels[entry.activity_type] || entry.activity_type}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      {entry.rn_user?.display_name || "RN CM"}
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {format(new Date(entry.created_at), "MMM dd, yyyy")}
                    <br />
                    {format(new Date(entry.created_at), "h:mm a")}
                  </div>
                </div>

                {entry.activity_description && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {entry.activity_description}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">RN Time:</span>
                    <span className="font-medium">{entry.time_spent_minutes} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Saved:</span>
                    <span className="font-medium text-green-600">
                      {entry.estimated_attorney_time_saved_minutes} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
