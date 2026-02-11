import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

interface PricingCardProps {
  tier?: string | null;
  planPrice?: number | null;
  renewalDate?: string | null;
  status?: string;
}

export function PricingCard({ tier, planPrice, renewalDate, status = "Active" }: PricingCardProps) {
  const formatPrice = (price: number | null | undefined) => {
    if (!price) return "Contact Support";
    return `$${price.toLocaleString()}`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "TBD";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "past due":
        return "bg-red-100 text-red-800";
      case "suspended":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
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
              <Badge className="bg-[#0f2a6a] hover:bg-[#0f2a6a] text-white text-base px-3 py-1">
                {tier || "—"}
              </Badge>
              <Badge className="bg-[#b09837] hover:bg-[#b09837] text-black text-xs">
                Your Plan
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Monthly Subscription</p>
            <p className="text-2xl font-bold text-foreground">
              {formatPrice(planPrice)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Renewal Date</p>
            <p className="text-lg font-semibold text-foreground">
              {formatDate(renewalDate)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={getStatusColor(status)}>
              {status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            asChild
            className="bg-[#b09837] hover:bg-black hover:text-[#b09837] text-black transition-all"
          >
            <Link to="/attorney/billing?section=plan">Manage Plan</Link>
          </Button>
          <Button
            asChild
            variant="link"
            className="text-[#128f8b] hover:text-[#0f2a6a]"
          >
            <Link to="/attorney/billing?tab=invoices">View Invoices</Link>
          </Button>
        </div>

        <div id="rcms-subscription-detail" className="pt-4 border-t space-y-2" role="group" aria-label="Subscription pricing details">
          <div className="text-[0.98rem] text-foreground">
            <strong>Current Subscription Price:</strong>{" "}
            <span aria-live="polite">{planPrice ? `$${planPrice.toLocaleString('en-US')}` : "$—"}</span>
          </div>
          <div className="text-[0.92rem] text-muted-foreground">
            Administrative Coordination & Case Transfer Fees for accepting client referrals are billed separately at <strong>$1,500.00</strong> per referral + processing and applicable tax.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
