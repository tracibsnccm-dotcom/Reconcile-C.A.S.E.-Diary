import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

export function ReferralWalletBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadWalletData();
  }, [user]);

  async function loadWalletData() {
    if (!user) return;

    try {
      // Load wallet balance
      const { data: walletData } = await supabase
        .from("attorney_wallet")
        .select("balance")
        .eq("attorney_id", user.id)
        .maybeSingle();

      setBalance(walletData?.balance || 0);
    } catch (error) {
      console.error("Error loading wallet data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getTierName(bal: number): string {
    if (bal >= 5000) return "Platinum";
    if (bal >= 1500) return "Gold";
    return "Silver";
  }

  function getTierVariant(bal: number): "platinum" | "gold" | "silver" {
    if (bal >= 5000) return "platinum";
    if (bal >= 1500) return "gold";
    return "silver";
  }

  function getDiscountPercent(bal: number): number {
    if (bal >= 5000) return 30;
    if (bal >= 1500) return 20;
    return 10;
  }

  const tierName = getTierName(balance);
  const tierVariant = getTierVariant(balance);
  const discountPct = getDiscountPercent(balance);

  if (loading) {
    return (
      <div className="border-2 border-[#b09837] rounded-[14px] bg-white p-3 mb-4 shadow-md">
        <p className="text-sm text-muted-foreground">Loading wallet information...</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#b09837] rounded-[14px] bg-white p-3 mb-4 shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-center">
        {/* Balance */}
        <div>
          <div className="text-sm text-[#444] mb-0.5">eWallet Balance</div>
          <div className="text-lg font-extrabold text-[#0f2a6a]">
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Loyalty Tier */}
        <div>
          <div className="text-sm text-[#444] mb-1">Loyalty Tier</div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={tierVariant} className="text-sm px-3 py-1">
              {tierName}
            </Badge>
          </div>
          <div className="text-sm text-[#333]">
            Current discount: {discountPct}%
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-2 md:justify-end">
          <Button
            onClick={() => navigate("/attorney/billing?tab=ewallet")}
            className="bg-[#0f2a6a] text-white font-bold border-2 border-[#0f2a6a] rounded-lg px-3 py-2 hover:bg-[#0f2a6a]/90"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Add Funds
          </Button>
          <button
            onClick={() => navigate("/attorney/billing?tab=ewallet")}
            className="text-sm text-[#0f2a6a] underline hover:no-underline"
          >
            View eWallet details
          </button>
        </div>
      </div>

      {/* Refund Policy */}
      <div className="mt-3 text-sm text-[#333] bg-[#fff8e6] border-l-4 border-[#b09837] rounded-md p-2">
        ⚖️ <strong>Refund Policy:</strong> There are no cash refunds. Refunds, if granted, are
        issued as credits to the account or applied toward another service.
      </div>
    </div>
  );
}
