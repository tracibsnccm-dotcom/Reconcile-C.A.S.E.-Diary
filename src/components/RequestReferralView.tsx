import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CreditCard, Wallet, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const REFERRAL_BASE_PRICE = 1500;

const TIER_DISCOUNTS: Record<string, number> = {
  basic: 0,
  premier: 0.05,
  elite: 0.1,
  platinum: 0.15,
};

export function RequestReferralView() {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [tier, setTier] = useState("basic");
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    // Load wallet balance
    const { data: wallet } = await supabase
      .from("attorney_wallet")
      .select("balance")
      .eq("attorney_id", user.id)
      .maybeSingle();

    setWalletBalance(wallet?.balance || 0);

    // Determine tier
    const balance = wallet?.balance || 0;
    if (balance >= 10000) setTier("platinum");
    else if (balance >= 5000) setTier("elite");
    else if (balance >= 2500) setTier("premier");
    else setTier("basic");

    // Load cases
    const { data: assignments } = await supabase
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
      .eq("user_id", user.id)
      .eq("role", "ATTORNEY");

    const cases = assignments
      ?.map((item: any) => item.cases)
      .filter((c: any) => c && c.status !== "CLOSED");

    setAvailableCases(cases || []);
  }

  async function handlePurchase(paymentMethod: "card" | "wallet") {
    if (!user) {
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
        description: "Please select a case to link this purchase.",
        variant: "destructive",
      });
      return;
    }

    const discount = TIER_DISCOUNTS[tier] || 0;
    const discountedPrice = REFERRAL_BASE_PRICE * (1 - discount);

    if (paymentMethod === "wallet" && walletBalance < discountedPrice) {
      toast({
        title: "Insufficient Funds",
        description: `Your eWallet balance is too low. Required: $${discountedPrice.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === "wallet") {
        // Deduct from wallet
        const { error: walletError } = await supabase
          .from("attorney_wallet")
          .update({ balance: walletBalance - discountedPrice })
          .eq("attorney_id", user.id);

        if (walletError) throw walletError;

        // Create transaction
        await supabase.from("wallet_transactions").insert({
          attorney_id: user.id,
          case_id: selectedCase,
          transaction_type: "referral_fee",
          amount: -discountedPrice,
          processing_fee: 0,
          tax: 0,
          total_amount: -discountedPrice,
          description: `Administrative Coordination & Case Transfer (${tier.toUpperCase()} tier discount)`,
          status: "completed",
          payment_method: "eWallet",
        });
      } else {
        // Card payment
        const processingFee = REFERRAL_BASE_PRICE * 0.0325;
        const total = REFERRAL_BASE_PRICE + processingFee;

        await supabase.from("wallet_transactions").insert({
          attorney_id: user.id,
          case_id: selectedCase,
          transaction_type: "referral_fee",
          amount: REFERRAL_BASE_PRICE,
          processing_fee: processingFee,
          tax: 0,
          total_amount: total,
          description: "Administrative Coordination & Case Transfer",
          status: "completed",
          payment_method: "Credit Card",
        });
      }

      // Notify RN team
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_role: "ATTORNEY",
        action: "referral_coordination_purchased",
        case_id: selectedCase,
        meta: {
          payment_method: paymentMethod,
          amount: paymentMethod === "wallet" ? discountedPrice : REFERRAL_BASE_PRICE,
          tier,
        },
      });

      toast({
        title: "Purchase Successful",
        description: "Your RN CM team has been notified and will begin coordination.",
      });

      loadData();
      setSelectedCase("");
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

  const discount = TIER_DISCOUNTS[tier] || 0;
  const discountedPrice = REFERRAL_BASE_PRICE * (1 - discount);
  const cardProcessingFee = REFERRAL_BASE_PRICE * 0.0325;
  const cardTotal = REFERRAL_BASE_PRICE + cardProcessingFee;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#b09837]/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[#b09837]" />
            About Referral Coordination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>
            <strong>Reconcile C.A.R.E.</strong> provides verified client referrals following
            complete intake and consent processes. Our RN Care Management team coordinates
            all clinical aspects, ensuring you receive well-documented cases ready for
            representation.
          </p>
          <p className="text-muted-foreground">
            The Administrative Coordination & Case Transfer Fee is <strong>non-refundable</strong> once
            the referral is released. Refunds, if granted, are issued as account credits.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Loyalty Tier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Tier:</span>
              <Badge
                variant={
                  tier === "platinum"
                    ? "default"
                    : tier === "elite"
                    ? "secondary"
                    : "outline"
                }
                className="text-sm"
              >
                {tier.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Discount:</span>
              <span className="font-semibold text-[#b09837]">
                {(discount * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">eWallet Balance:</span>
              <span className="font-semibold">${walletBalance.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Case</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="case-select">Link Purchase to Case</Label>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger id="case-select" className="mt-2">
                <SelectValue placeholder="Select a case..." />
              </SelectTrigger>
              <SelectContent>
                {availableCases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    RC-{c.id.slice(-8).toUpperCase()} - {c.client_label || "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableCases.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                No active cases found. Please create a case first.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#128f8b]" />
              Pay with eWallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Price:</span>
                <span className="line-through text-muted-foreground">
                  ${REFERRAL_BASE_PRICE.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm text-[#b09837]">
                <span>Loyalty Discount ({(discount * 100).toFixed(0)}%):</span>
                <span>-${(REFERRAL_BASE_PRICE * discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${discountedPrice.toLocaleString()}</span>
              </div>
            </div>
            <Button
              onClick={() => handlePurchase("wallet")}
              disabled={
                loading ||
                !selectedCase ||
                walletBalance < discountedPrice ||
                availableCases.length === 0
              }
              className="w-full bg-[#128f8b] hover:bg-[#128f8b]/90"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {loading ? "Processing..." : "Pay with eWallet"}
            </Button>
            {walletBalance < discountedPrice && (
              <p className="text-xs text-destructive">
                Insufficient balance. Add funds to your eWallet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#0f2a6a]" />
              Pay with Credit Card
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Price:</span>
                <span>${REFERRAL_BASE_PRICE.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing Fee (3.25%):</span>
                <span>${cardProcessingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>${cardTotal.toLocaleString()}</span>
              </div>
            </div>
            <Button
              onClick={() => handlePurchase("card")}
              disabled={loading || !selectedCase || availableCases.length === 0}
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {loading ? "Processing..." : "Pay with Card"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                Important Notes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
                <li>All fees are non-refundable once the referral is released</li>
                <li>Refunds, if granted, are issued as account credits only</li>
                <li>Save on fees by using your eWallet with loyalty discounts</li>
                <li>Your RN CM team will be notified immediately upon payment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
