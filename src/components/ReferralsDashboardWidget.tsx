import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Clock, DollarSign, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReferralStats {
  total_received: number;
  total_accepted: number;
  pending_decision: number;
  total_fees_paid: number;
  total_settlements: number;
}

export function ReferralsDashboardWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats>({
    total_received: 0,
    total_accepted: 0,
    pending_decision: 0,
    total_fees_paid: 0,
    total_settlements: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  async function loadStats() {
    if (!user) return;

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("referrals")
        .select("acceptance_status, admin_fee_charged, settlement_amount, payment_status")
        .eq("attorney_id", user.id);

      if (error) throw error;

      const stats: ReferralStats = {
        total_received: data?.length || 0,
        total_accepted: data?.filter((r) => r.acceptance_status === "accepted").length || 0,
        pending_decision: data?.filter((r) => r.acceptance_status === "pending").length || 0,
        total_fees_paid:
          data
            ?.filter((r) => r.payment_status === "paid")
            .reduce((sum, r) => sum + Number(r.admin_fee_charged || 0), 0) || 0,
        total_settlements:
          data
            ?.filter((r) => r.settlement_amount)
            .reduce((sum, r) => sum + Number(r.settlement_amount || 0), 0) || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error("Error loading referral stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-[#b09837]">Referral Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[#0f2a6a]/5 to-background">
      <CardHeader>
        <CardTitle className="text-[#b09837] flex items-center gap-2">
          <Users className="h-5 w-5" />
          Referral Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
            <Users className="h-5 w-5 text-[#128f8b] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-2xl font-bold">{stats.total_received}</p>
              <p className="text-sm text-muted-foreground">Referrals Received</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-2xl font-bold">{stats.total_accepted}</p>
              <p className="text-sm text-muted-foreground">Referrals Accepted</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-2xl font-bold">{stats.pending_decision}</p>
              <p className="text-sm text-muted-foreground">Pending Decision</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-card border">
            <DollarSign className="h-5 w-5 text-[#b09837] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-2xl font-bold">
                ${stats.total_fees_paid.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Fees Paid</p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-[#b09837]/10 border border-[#b09837]/20">
          <TrendingUp className="h-5 w-5 text-[#b09837] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-[#b09837]">
              ${stats.total_settlements.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Total Reported Settlements</p>
          </div>
        </div>

        <Button
          onClick={() => navigate("/referrals")}
          className="w-full bg-[#b09837] text-black hover:bg-[#b09837]/90"
        >
          View Detailed Referral Report
        </Button>
      </CardContent>
    </Card>
  );
}
