import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { useNavigate } from "react-router-dom";

export function EWalletSummary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadBalance();
  }, [user]);

  async function loadBalance() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attorney_wallet")
        .select("balance")
        .eq("attorney_id", user.id)
        .maybeSingle();

      if (error) throw error;

      setBalance(data?.balance || 0);
    } catch (error) {
      console.error("Error loading wallet balance:", error);
    } finally {
      setLoading(false);
    }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#b09837]">
          <Wallet className="h-5 w-5" />
          eWallet Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Wallet Balance */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <p className="text-3xl font-bold">${balance.toLocaleString()}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => navigate("/attorney/billing?tab=ewallet")}
                className="flex-1 bg-[#b09837] text-black hover:bg-[#b09837]/90"
              >
                Add Funds
              </Button>
              <Button
                onClick={() => navigate("/attorney/billing?tab=ewallet")}
                variant="outline"
                className="flex-1"
              >
                Manage Funds
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
