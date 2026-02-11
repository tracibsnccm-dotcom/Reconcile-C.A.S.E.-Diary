import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, FileText, Briefcase, Wallet, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { RCMS_CONFIG } from "@/config/rcms";
import { RNCMServiceCatalog } from "@/components/RNCMServiceCatalog";
import { PricingCard } from "@/components/PricingCard";
import { TierComparisonTable } from "@/components/TierComparisonTable";
import { RNCMSpecialServices } from "@/components/RNCMSpecialServices";
import { PaymentMethodsManager } from "@/components/PaymentMethodsManager";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { InvoiceManager } from "@/components/InvoiceManager";
import { BillingAddress } from "@/components/BillingAddress";
import { BillingAlerts } from "@/components/BillingAlerts";
import { BillingUsageAnalytics } from "@/components/BillingUsageAnalytics";


export default function AttorneyBilling() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const qp = searchParams.get("tab") || searchParams.get("section");
  const defaultTab = (qp && ["plan","payment","invoices","analytics","alerts","services","ewallet"].includes(qp))
    ? qp
    : (typeof window !== 'undefined' && window.location.hash === '#rcms-referral-card' ? 'services' : 'services');

  const [tierData, setTierData] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [addAmount, setAddAmount] = useState("");
  const [fundAgreed, setFundAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadTierData();
    loadWalletData();
    loadTransactions();
  }, [user]);

  async function loadTierData() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attorney_metadata")
        .select("tier, plan_price, renewal_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setTierData(data);
    } catch (error) {
      console.error("Error loading tier data:", error);
    }
  }

  async function loadWalletData() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("attorney_wallet")
        .select("balance")
        .eq("attorney_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (!data) {
        // Create wallet if doesn't exist
        const { error: insertError } = await supabase
          .from("attorney_wallet")
          .insert({ attorney_id: user.id, balance: 0 });
        
        if (insertError) throw insertError;
        setWalletBalance(0);
      } else {
        setWalletBalance(data.balance);
      }
    } catch (error) {
      console.error("Error loading wallet data:", error);
    }
  }

  async function loadTransactions() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("attorney_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  }

  async function handleAddFunds() {
    if (!user || !fundAgreed) {
      toast({
        title: "Missing Information",
        description: "Please agree to the eWallet terms.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount < 1500) {
      toast({
        title: "Invalid Amount",
        description: "Minimum deposit is $1,500.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const processingFee = amount * 0.0325;
      const tax = 0; // Calculate based on billing address
      const total = amount + processingFee + tax;

      // Record acknowledgment
      const messageHash = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode("no-refund-policy"))
        .then(hash => Array.from(new Uint8Array(hash))
          .map(b => b.toString(16).padStart(2, "0"))
          .join(""));

      await supabase.from("wallet_acknowledgments").insert({
        attorney_id: user.id,
        ip_address: null,
        user_agent: navigator.userAgent,
        message_hash: messageHash,
      });

      // Create transaction
      await supabase.from("wallet_transactions").insert({
        attorney_id: user.id,
        transaction_type: "deposit",
        amount,
        processing_fee: processingFee,
        tax,
        total_amount: total,
        description: "eWallet deposit",
        status: "completed",
        payment_method: "Credit Card",
      });

      // Update wallet balance
      const { error: updateError } = await supabase
        .from("attorney_wallet")
        .update({ balance: walletBalance + amount })
        .eq("attorney_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Funds Added",
        description: `$${amount.toLocaleString()} has been added to your eWallet.`,
      });

      setAddAmount("");
      setFundAgreed(false);
      loadWalletData();
      loadTransactions();
    } catch (error) {
      console.error("Error adding funds:", error);
      toast({
        title: "Error",
        description: "Failed to add funds. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#0f2a6a]">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your plan, payments, and eWallet.
          </p>
        </div>

      <Tabs defaultValue={defaultTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="plan">Plan Details</TabsTrigger>
            <TabsTrigger value="payment">Payment Methods</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="analytics">Usage & Analytics</TabsTrigger>
            <TabsTrigger value="alerts">Billing Alerts</TabsTrigger>
            <TabsTrigger value="services">RN CM Services</TabsTrigger>
            <TabsTrigger value="ewallet">eWallet</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="plan" className="space-y-6">
          {/* Combined Pricing & Billing Information */}
          <Card className="border-[#e9e9e9] shadow-sm">
            <CardHeader className="bg-[#0f2a6a] text-white rounded-t-2xl">
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Your Plan & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tier</p>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#0f2a6a] text-white text-base px-3 py-1 rounded-md font-semibold">
                      {tierData?.tier || "—"}
                    </span>
                    <span className="bg-[#b09837] text-black text-xs px-2 py-1 rounded-md font-semibold">
                      Your Plan
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Monthly Subscription</p>
                  <p className="text-2xl font-bold text-foreground">
                    {tierData?.plan_price ? `$${tierData.plan_price.toLocaleString()}` : "Contact Support"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Renewal Date</p>
                  <p className="text-lg font-semibold text-foreground">
                    {tierData?.renewal_date 
                      ? new Date(tierData.renewal_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "TBD"}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm font-medium">
                    Active
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Card className="bg-muted border-border">
                  <CardContent className="pt-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Billing Terms</h3>
                    <p className="text-sm text-muted-foreground">
                      No setup fee. First month due at signing. Annual prepay{" "}
                      <b className="text-foreground">-10%</b>, quarterly billing optional,{" "}
                      <b className="text-foreground">3-month minimum</b>. Provider swaps:{" "}
                      {RCMS_CONFIG.billing.providerSwaps.policy}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div 
                id="rcms-subscription-detail" 
                className="rcms-subscription-detail pt-4 border-t space-y-2" 
                role="group" 
                aria-label="Subscription pricing details"
              >
                <div className="rcms-sub-line text-[0.98rem] text-[#111]">
                  <strong className="font-bold">Current Subscription Price:</strong>{" "}
                  <span id="rcms-current-price" aria-live="polite">
                    {tierData?.plan_price 
                      ? `$${tierData.plan_price.toLocaleString('en-US')}`
                      : "$—"}
                  </span>
                </div>
                <div className="rcms-sub-line rcms-micro text-[0.92rem] text-[#333]">
                  Administrative Coordination & Case Transfer Fees for accepting client referrals are billed separately at <strong className="font-bold">$1,500.00</strong> per referral + processing and applicable tax.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <SubscriptionManager 
            currentTier={tierData?.tier || "Basic"}
            planPrice={tierData?.plan_price || 0}
            renewalDate={tierData?.renewal_date 
              ? new Date(tierData.renewal_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "TBD"}
          />
          
          {/* Tier Comparison Table */}
          <TierComparisonTable currentTier={tierData?.tier} />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentMethodsManager />
          <BillingAddress />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceManager />
        </TabsContent>

        <TabsContent value="analytics">
          <BillingUsageAnalytics />
        </TabsContent>

        <TabsContent value="alerts">
          <BillingAlerts />
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <RNCMSpecialServices 
            walletBalance={walletBalance}
            isSubscriber={tierData?.tier !== 'basic'}
            caseId={undefined}
            attorneyId={user?.id}
          />

        </TabsContent>

        <TabsContent value="ewallet" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#b09837]">
                <Wallet className="h-5 w-5" />
                eWallet Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Current Balance</Label>
                <p className="text-4xl font-bold">${walletBalance.toLocaleString()}</p>
                {walletBalance < 1500 && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <p>Low balance—add funds to accept referrals.</p>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 border-2 border-[#b09837] rounded-lg">
                <h3 className="font-semibold">Add Funds</h3>
                <div>
                  <Label htmlFor="amount">Amount (minimum $1,500)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1500"
                    step="100"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="1500"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="fund-agree"
                    checked={fundAgreed}
                    onCheckedChange={(checked) => setFundAgreed(checked === true)}
                  />
                  <Label htmlFor="fund-agree" className="text-sm leading-relaxed cursor-pointer">
                    I understand eWallet funds are non-refundable and will be credited to my account only.
                  </Label>
                </div>

                <Button
                  onClick={handleAddFunds}
                  disabled={!fundAgreed || loading || parseFloat(addAmount) < 1500}
                  className="w-full bg-[#b09837] text-black hover:bg-[#b09837]/90"
                >
                  {loading ? "Processing..." : "Add Funds"}
                </Button>
              </div>

              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold text-sm">eWallet Refund / Credit Policy</h4>
                <p className="text-sm text-muted-foreground">
                  Funds added to your Reconcile C.A.R.E. eWallet are <strong>non-refundable</strong>. 
                  No cash refunds will be issued. If you request a return of funds, the remaining eWallet 
                  balance will be <strong>credited to your account</strong> to be applied against future 
                  platform fees or services.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Case ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Fees</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>{new Date(txn.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{txn.case_id ? `RC-${txn.case_id.slice(-8).toUpperCase()}` : "—"}</TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell>${txn.amount.toLocaleString()}</TableCell>
                        <TableCell>${txn.processing_fee.toLocaleString()}</TableCell>
                        <TableCell>${txn.tax.toLocaleString()}</TableCell>
                        <TableCell className="font-semibold">${txn.total_amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            txn.status === "completed" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {txn.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
