import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpCircle, ArrowDownCircle, XCircle, RefreshCw, Calendar, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionManagerProps {
  currentTier: string;
  planPrice: number;
  renewalDate: string;
}

export function SubscriptionManager({ currentTier, planPrice, renewalDate }: SubscriptionManagerProps) {
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [downgradeDialogOpen, setDowngradeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const plans = [
    { name: "Basic", price: 150, features: ["5 referrals/month", "Basic support", "Standard features"] },
    { name: "Professional", price: 500, features: ["15 referrals/month", "Priority support", "Advanced features", "Analytics"] },
    { name: "Enterprise", price: 1500, features: ["Unlimited referrals", "24/7 support", "All features", "Custom integrations"] },
  ];

  const handleUpgrade = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }
    toast.success(`Upgraded to ${selectedPlan} plan successfully`);
    setUpgradeDialogOpen(false);
  };

  const handleDowngrade = () => {
    if (!selectedPlan) {
      toast.error("Please select a plan");
      return;
    }
    toast.success(`Downgraded to ${selectedPlan} plan. Changes will take effect on ${renewalDate}`);
    setDowngradeDialogOpen(false);
  };

  const handleCancel = () => {
    toast.success("Subscription cancelled. Your plan will remain active until " + renewalDate);
    setCancelDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            Manage Subscription
          </CardTitle>
          <CardDescription>
            Upgrade, downgrade, or cancel your subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold">{currentTier}</p>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <p className="text-2xl font-bold">${planPrice.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Next billing date: {renewalDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="w-full">
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upgrade Your Plan</DialogTitle>
                  <DialogDescription>
                    Choose a higher tier to unlock more features and referrals
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(p => p.price > planPrice).map(plan => (
                        <SelectItem key={plan.name} value={plan.name}>
                          {plan.name} - ${plan.price}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPlan && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="font-semibold mb-2">{selectedPlan} Plan Features:</p>
                      <ul className="text-sm space-y-1">
                        {plans.find(p => p.name === selectedPlan)?.features.map((feature, i) => (
                          <li key={i}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpgrade}>
                    Upgrade Now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={downgradeDialogOpen} onOpenChange={setDowngradeDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Downgrade Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Downgrade Your Plan</DialogTitle>
                  <DialogDescription>
                    Changes will take effect at the end of your current billing period
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.filter(p => p.price < planPrice).map(plan => (
                        <SelectItem key={plan.name} value={plan.name}>
                          {plan.name} - ${plan.price}/month
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedPlan && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-sm font-semibold mb-2">Please Note:</p>
                      <ul className="text-sm space-y-1">
                        <li>• Change effective on {renewalDate}</li>
                        <li>• You'll retain current features until then</li>
                        <li>• Lower tier has fewer referrals</li>
                      </ul>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDowngradeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDowngrade}>
                    Confirm Downgrade
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Subscription</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel your subscription?
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <p className="text-sm font-semibold mb-2">Cancellation Details:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Your plan remains active until {renewalDate}</li>
                      <li>• No refund for the current period</li>
                      <li>• You'll lose access to all features after {renewalDate}</li>
                      <li>• Case data will be retained for 90 days</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Having issues?</strong> Contact our support team at{" "}
                      <a href="mailto:support@reconcilecare.com" className="text-primary underline">
                        support@reconcilecare.com
                      </a>
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                    Keep Subscription
                  </Button>
                  <Button variant="destructive" onClick={handleCancel}>
                    Confirm Cancellation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Billing Cycle Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Monthly Billing</p>
                <p className="text-sm text-muted-foreground">Pay monthly, cancel anytime</p>
              </div>
              <Badge variant="default">Current</Badge>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Quarterly Billing</p>
                <p className="text-sm text-muted-foreground">Save 5% with 3-month commitment</p>
              </div>
              <Badge variant="secondary">Save 5%</Badge>
            </div>
          </div>

          <div className="p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Annual Billing</p>
                <p className="text-sm text-muted-foreground">Save 10% with yearly payment</p>
              </div>
              <Badge variant="secondary">Save 10%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}