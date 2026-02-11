import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ReferralPurchaseCardProps {
  walletBalance: number;
  attorneyId?: string;
  tierData?: { tier: string };
  onPurchaseComplete?: () => void;
}

const REFERRAL_BASE_PRICE = 1500;

// Loyalty tier discounts matching eWallet structure
const TIER_DISCOUNTS: Record<string, number> = {
  basic: 0,
  premier: 0.05,   // 5%
  elite: 0.10,     // 10%
  platinum: 0.15,  // 15%
};

export function ReferralPurchaseCard({ 
  walletBalance, 
  attorneyId, 
  tierData,
  onPurchaseComplete 
}: ReferralPurchaseCardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [availableCases, setAvailableCases] = useState<any[]>([]);

  const tier = tierData?.tier?.toLowerCase() || "basic";
  const discount = TIER_DISCOUNTS[tier] || 0;
  const walletPrice = REFERRAL_BASE_PRICE * (1 - discount);
  const showWallet = walletBalance >= walletPrice;

  useEffect(() => {
    if (attorneyId) {
      loadAvailableCases();
    }
  }, [attorneyId]);

  async function loadAvailableCases() {
    if (!attorneyId) return;

    try {
      const { data, error } = await supabase
        .from("case_assignments")
        .select(`
          case_id,
          cases (
            id,
            client_label,
            atty_ref,
            status
          )
        `)
        .eq("user_id", attorneyId)
        .eq("role", "ATTORNEY");

      if (error) throw error;

      const cases = data
        ?.map((item: any) => item.cases)
        .filter((c: any) => c && c.status !== "CLOSED");

      setAvailableCases(cases || []);
    } catch (error) {
      console.error("Error loading cases:", error);
    }
  }

  async function handlePayCard() {
    if (!attorneyId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCase) {
      toast({
        title: "Case Required",
        description: "Please link this purchase to a case.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const processingFee = REFERRAL_BASE_PRICE * 0.0325;
      const tax = 0; // Calculate based on billing address
      const total = REFERRAL_BASE_PRICE + processingFee + tax;

      // Create transaction record
      const { error: txnError } = await supabase
        .from("wallet_transactions")
        .insert({
          attorney_id: attorneyId,
          case_id: selectedCase,
          transaction_type: "referral_fee",
          amount: REFERRAL_BASE_PRICE,
          processing_fee: processingFee,
          tax,
          total_amount: total,
          description: "Administrative Coordination & Case Transfer",
          status: "completed",
          payment_method: "Credit Card",
        });

      if (txnError) throw txnError;

      // Notify RN CM team
      await notifyRNTeam(selectedCase, "card", REFERRAL_BASE_PRICE);

      toast({
        title: "Purchase Successful",
        description: `Referral coordination fee paid. Your RN CM team has been notified.`,
      });

      onPurchaseComplete?.();
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handlePayWallet() {
    if (!attorneyId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCase) {
      toast({
        title: "Case Required",
        description: "Please link this purchase to a case.",
        variant: "destructive",
      });
      return;
    }

    if (walletBalance < walletPrice) {
      toast({
        title: "Insufficient Funds",
        description: `Your eWallet balance is too low. Required: $${walletPrice.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Deduct from wallet
      const { error: walletError } = await supabase
        .from("attorney_wallet")
        .update({ balance: walletBalance - walletPrice })
        .eq("attorney_id", attorneyId);

      if (walletError) throw walletError;

      // Create transaction record
      const { error: txnError } = await supabase
        .from("wallet_transactions")
        .insert({
          attorney_id: attorneyId,
          case_id: selectedCase,
          transaction_type: "referral_fee",
          amount: -walletPrice,
          processing_fee: 0,
          tax: 0,
          total_amount: -walletPrice,
          description: `Administrative Coordination & Case Transfer (${tier.toUpperCase()} tier discount applied)`,
          status: "completed",
          payment_method: "eWallet",
        });

      if (txnError) throw txnError;

      // Notify RN CM team
      await notifyRNTeam(selectedCase, "ewallet", walletPrice);

      toast({
        title: "Purchase Successful",
        description: `Referral coordination fee paid via eWallet. Your RN CM team has been notified.`,
      });

      onPurchaseComplete?.();
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function notifyRNTeam(caseId: string, paymentMethod: string, amount: number) {
    try {
      // This would trigger a notification to RN CM Manager/Director
      await supabase.from("audit_logs").insert({
        actor_id: attorneyId,
        actor_role: "ATTORNEY",
        action: "referral_coordination_purchased",
        case_id: caseId,
        meta: {
          payment_method: paymentMethod,
          amount,
          tier,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error logging referral purchase:", error);
    }
  }

  return (
    <section id="rcms-referral-card" className="space-y-2">
      <p className="text-[#333] text-[1rem] leading-relaxed">
        Order à la carte clinical services. Purchases are linked to your case and routed to our RN Care Management team.
      </p>
      <p className="text-[#333] text-[1rem] leading-relaxed">
        ⚖️ <strong className="text-[#0f2a6a]">Refund Policy:</strong> There are no cash refunds. Refunds, if granted, are issued as credits to the account or applied toward another service.
      </p>
    </section>
  );
}
