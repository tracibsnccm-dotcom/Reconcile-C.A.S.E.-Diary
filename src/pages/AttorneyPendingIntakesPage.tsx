import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttorneyIntakeTracker } from "@/components/AttorneyIntakeTracker";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";

export default function AttorneyPendingIntakesPage() {
  const { user } = useAuth();
  const [expiredIntakesCount, setExpiredIntakesCount] = useState<number>(0);

  // Load expired intakes count for current month
  useEffect(() => {
    async function loadExpiredIntakesCount() {
      if (!user?.id) return;

      try {
        // Get current month start and end
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        let count = 0;

        // Check rc_client_intake_sessions for expired/deleted status with deleted_at in current month
        const { data: expiredSessions, error: sessionsError } = await supabase
          .from("rc_client_intake_sessions")
          .select("id, case_id")
          .in("intake_status", ["expired", "expired_deleted"])
          .gte("expires_at", monthStart.toISOString())
          .lte("expires_at", monthEnd.toISOString());

        if (sessionsError) {
          console.error("Error loading expired intakes from sessions:", sessionsError);
        } else {
          count += expiredSessions?.length || 0;
        }

        // Also check intakes table for deleted_at in current month
        const { data: deletedIntakes, error: intakesError } = await supabase
          .from("intakes")
          .select("id")
          .not("deleted_at", "is", null)
          .gte("deleted_at", monthStart.toISOString())
          .lte("deleted_at", monthEnd.toISOString());

        if (intakesError) {
          console.error("Error loading expired intakes from intakes table:", intakesError);
        } else {
          // Add count from intakes table (avoid double counting if case_id matches)
          const deletedIntakesCount = deletedIntakes?.length || 0;
          // Simple sum - if there's overlap, it's acceptable per requirements
          count += deletedIntakesCount;
        }

        setExpiredIntakesCount(count);
      } catch (error) {
        console.error("Error loading expired intakes count:", error);
        setExpiredIntakesCount(0);
      }
    }

    loadExpiredIntakesCount();
  }, [user]);

  return (
    <AppLayout>
      <div className="p-8 pb-24 lg:pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Intakes Awaiting Attorney Review</h1>
          <p className="text-muted-foreground mt-1">Review intakes awaiting your confirmation</p>
        </div>

        {/* What this means — attorney-only explanatory copy */}
        <Card className="mb-6 border-l-4 border-primary">
          <CardHeader>
            <CardTitle className="text-base">What this means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>The client has completed their intake. Please review the information and confirm whether the case should proceed. Once reviewed, the case can be assigned to an RN for initial care planning.</p>
            <p className="text-xs italic text-muted-foreground/90">
              Client view: While under review, the client sees their intake as submitted and awaiting attorney review.
            </p>
          </CardContent>
        </Card>

        {/* Expired Intakes Monthly Stat */}
        <div className="mb-6">
          <Card className="p-4 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-1">
                  Expired Intakes (Data Deleted)
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  {expiredIntakesCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Intake Tracker */}
        <div className="mb-6">
          <AttorneyIntakeTracker showHeader={false} />
        </div>
      </div>
    </AppLayout>
  );
}
