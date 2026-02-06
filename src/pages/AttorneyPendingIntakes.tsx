import { useState, useEffect } from "react";
import { AttorneyLayout } from "@/components/AttorneyLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttorneyIntakeTracker } from "@/components/AttorneyIntakeTracker";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";

export default function AttorneyPendingIntakes() {
  const { user } = useAuth();
  const [expiredIntakesCount, setExpiredIntakesCount] = useState<number>(0);

  useEffect(() => {
    async function loadExpiredIntakesCount() {
      if (!user?.id) return;
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        let count = 0;
        const { data: expiredSessions, error: sessionsError } = await supabase
          .from("rc_client_intake_sessions")
          .select("id, case_id")
          .in("intake_status", ["expired", "expired_deleted"])
          .gte("expires_at", monthStart.toISOString())
          .lte("expires_at", monthEnd.toISOString());
        if (!sessionsError) count += expiredSessions?.length || 0;
        try {
          const { data: deletedIntakes, error: intakesError } = await supabase
            .from("intakes")
            .select("id")
            .not("deleted_at", "is", null)
            .gte("deleted_at", monthStart.toISOString())
            .lte("deleted_at", monthEnd.toISOString());
          if (!intakesError) count += deletedIntakes?.length || 0;
        } catch (_) {}
        setExpiredIntakesCount(count);
      } catch {
        setExpiredIntakesCount(0);
      }
    }
    loadExpiredIntakesCount();
  }, [user]);

  return (
    <AttorneyLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Intakes Awaiting Attorney Review</h1>
          <p className="text-white/90 mt-1">Review intakes awaiting your confirmation</p>
        </div>

        <Card className="bg-white rounded-lg shadow-lg border-l-4 border-orange-500">
          <CardHeader>
            <CardTitle className="text-base text-gray-900">What this means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <p>The client has completed their intake. Please review the information and confirm whether the case should proceed. Once reviewed, the case can be assigned to an RN for initial care planning.</p>
            <p className="text-xs italic text-gray-600">
              Client view: While under review, the client sees their intake as submitted and awaiting attorney review.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Expired Intakes (Data Deleted)</p>
              <p className="text-2xl font-bold text-amber-600">{expiredIntakesCount}</p>
            </div>
          </div>
        </Card>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <AttorneyIntakeTracker showHeader={false} />
        </div>
      </div>
    </AttorneyLayout>
  );
}
