// AttorneyPendingIntakes — page that shows AttorneyIntakeTracker. (Ported from C.A.R.E.)

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AttorneyIntakeTracker } from "@/components/attorney/AttorneyIntakeTracker";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

const WRAPPER_CLASS = "min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-white font-sans";
const CARD_CLASS = "bg-slate-800 border border-slate-700 rounded-xl";

export default function AttorneyPendingIntakes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [expiredCount, setExpiredCount] = useState(0);

  useEffect(() => {
    if (!user?.id || !supabase) return;
    (async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const { data: expiredSessions } = await supabase
          .from("rc_client_intake_sessions")
          .select("id")
          .in("intake_status", ["expired", "expired_deleted"])
          .gte("expires_at", monthStart.toISOString())
          .lte("expires_at", monthEnd.toISOString());
        setExpiredCount(Array.isArray(expiredSessions) ? expiredSessions.length : 0);
      } catch {
        setExpiredCount(0);
      }
    })();
  }, [user]);

  if (!user) {
    return (
      <div className={`${WRAPPER_CLASS} flex items-center justify-center p-4`}>
        <Card className={`${CARD_CLASS} p-8 max-w-md text-center`}>
          <p className="text-slate-300 mb-4">Please log in to access this page.</p>
          <Button onClick={() => navigate("/attorney-login")} className="bg-orange-500 hover:bg-orange-600 text-white">
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`${WRAPPER_CLASS} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate("/attorney/dashboard")}
            className="text-slate-300 hover:text-white hover:bg-slate-700/50 border-slate-600 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-white">Intakes Awaiting Attorney Review</h1>
          <p className="text-slate-400 mt-1">Review intakes awaiting your confirmation</p>
        </div>

        <Card className={`${CARD_CLASS} border-l-4 border-orange-500`}>
          <CardHeader>
            <CardTitle className="text-base text-white">What this means</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-400">
            <p>
              The client has completed their intake. Review the information and confirm whether the case should proceed. After confirmation, the case proceeds to the AI care plan builder.
            </p>
            <p className="text-xs italic text-slate-500">
              Client view: While under review, the client sees their intake as submitted and awaiting attorney review.
            </p>
          </CardContent>
        </Card>

        {expiredCount > 0 && (
          <Card className={CARD_CLASS}>
            <CardContent className="p-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-400">Expired Intakes (this month)</p>
              <p className="text-2xl font-bold text-amber-500">{expiredCount}</p>
            </CardContent>
          </Card>
        )}

        <AttorneyIntakeTracker showHeader={false} />
      </div>
    </div>
  );
}
