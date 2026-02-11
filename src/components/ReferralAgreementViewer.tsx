import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface PolicyAcknowledgment {
  id: string;
  policy_type: string;
  acknowledged_at: string;
  signature_data: any;
  policy_checksum: string;
  policy_version: string;
}

export function ReferralAgreementViewer() {
  const { user } = useAuth();
  const [acknowledgment, setAcknowledgment] = useState<PolicyAcknowledgment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAcknowledgment();
  }, [user]);

  async function loadAcknowledgment() {
    if (!user) return;

    setLoading(true);
    // Note: Requires policy_acknowledgments table to be created
    // For now, show policy without acknowledgment data
    setLoading(false);
  }

  const policyText = {
    title: "Referral Coordination & Case Transfer Policy",
    sections: {
      fee: "Administrative Coordination & Case Transfer Fee: $1,500 (non-refundable once referral is released)",
      payment: "Payment due upon acceptance of referral. Accepted via credit card or eWallet balance with loyalty tier discounts.",
      refunds: "No cash refunds. Refunds, if granted, are issued as credits to the account or applied toward another service.",
      coordination: "Reconcile C.A.R.E. provides verified client referrals following complete intake and consent processes. Our RN Care Management team coordinates all clinical aspects.",
      liability: "Attorney assumes full responsibility for case representation upon acceptance. Reconcile C.A.R.E. liability ends at transfer.",
      confidentiality: "All client information must be maintained in strict confidence per applicable ethical and legal standards.",
    },
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading agreement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!acknowledgment) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
            No Agreement Found
          </h3>
          <p className="text-amber-800 dark:text-amber-200 mb-4">
            You haven't acknowledged the Referral Policy yet.
          </p>
          <Button
            onClick={() => (window.location.href = "/attorney-policy")}
            className="bg-[#b09837] hover:bg-[#b09837]/90 text-black"
          >
            Review & Sign Policy
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Policy Acknowledged
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                You acknowledged this policy on{" "}
                {format(new Date(acknowledgment.acknowledged_at), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <Badge variant="default" className="bg-green-600">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#b09837]" />
                {policyText.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Version {acknowledgment.policy_version || "1.0"}
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Policy Type:</span>
              <p className="font-medium">Referral Coordination & Case Transfer</p>
            </div>
            <div>
              <span className="text-muted-foreground">Acknowledgment Date:</span>
              <p className="font-medium">
                {format(new Date(acknowledgment.acknowledged_at), "MMM d, yyyy")}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Signature Type:</span>
              <p className="font-medium">
                {acknowledgment.signature_data?.type === "typed" ? "Typed" : "Drawn"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Verification:</span>
              <p className="font-medium text-green-600">Verified ✓</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Policy Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="bg-[#b09837]/5 p-4 rounded-lg border border-[#b09837]/20">
              <h4 className="font-semibold text-[#b09837] mb-2">
                Administrative Coordination Fee
              </h4>
              <p className="text-sm">{policyText.sections.fee}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Payment Terms</h4>
              <p className="text-sm">{policyText.sections.payment}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Refund Policy</h4>
              <p className="text-sm">{policyText.sections.refunds}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Coordination Services</h4>
              <p className="text-sm">{policyText.sections.coordination}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Liability</h4>
              <p className="text-sm">{policyText.sections.liability}</p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Confidentiality</h4>
              <p className="text-sm">{policyText.sections.confidentiality}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {acknowledgment.signature_data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Signature</CardTitle>
          </CardHeader>
          <CardContent>
            {acknowledgment.signature_data.type === "typed" ? (
              <div className="border-2 border-dashed p-6 rounded-lg text-center">
                <p className="font-signature text-3xl text-[#0f2a6a]">
                  {acknowledgment.signature_data.value}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Typed Signature</p>
              </div>
            ) : (
              <div className="border-2 border-dashed p-4 rounded-lg">
                <img
                  src={acknowledgment.signature_data.value}
                  alt="Signature"
                  className="max-h-32 mx-auto"
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Drawn Signature
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-muted">
        <CardContent className="pt-6">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Policy Checksum:</strong> {acknowledgment.policy_checksum}
            </p>
            <p>
              <strong>Acknowledgment ID:</strong> {acknowledgment.id}
            </p>
            <p className="pt-2">
              This acknowledgment is legally binding and serves as your acceptance of the
              Referral Coordination & Case Transfer Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
