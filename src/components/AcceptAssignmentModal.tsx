import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

interface AcceptAssignmentModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  caseId: string;
  walletBalance: number;
}

export function AcceptAssignmentModal({
  open,
  onClose,
  onAccept,
  caseId,
  walletBalance,
}: AcceptAssignmentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [accepting, setAccepting] = useState(false);

  async function handleAccept() {
    if (!agreed) return;
    setAccepting(true);
    await onAccept();
    setAccepting(false);
  }

  function handleClose() {
    if (accepting) return;
    setAgreed(false);
    onClose();
  }

  const adminFee = 1500;
  const processingFee = adminFee * 0.0325;
  const tax = (adminFee + processingFee) * 0.0;
  const total = adminFee + processingFee + tax;
  const useWallet = walletBalance >= total;
  const insufficientFunds = !useWallet && walletBalance < total;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <AlertCircle className="h-6 w-6 text-[#b09837]" />
            Referral Agreement Summary
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border-2 border-[#b09837] bg-[#b09837]/5 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">Client intake completed and verified by RN CM</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">All legal and consent documents signed</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm">
                Referral delivered directly to attorney dashboard
              </p>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border bg-card p-4">
            <h3 className="font-semibold text-base">Fee Breakdown</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Administrative Coordination & Case Transfer Fee:
                </span>
                <span className="font-medium">${adminFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Fee (3.25%):</span>
                <span className="font-medium">${processingFee.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t font-semibold text-base">
                <span>Total Due:</span>
                <span className="text-[#b09837]">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-4 space-y-2 ${
            insufficientFunds ? "bg-destructive/10 border-destructive/20" : "bg-muted border-border"
          }`}>
            <div className="flex items-start gap-2">
              <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                insufficientFunds ? "text-destructive" : "text-[#b09837]"
              }`} />
              <div className="space-y-1">
                <p className={`font-semibold text-sm ${insufficientFunds ? "text-destructive" : ""}`}>
                  {useWallet 
                    ? "Payment will be deducted from your eWallet"
                    : insufficientFunds 
                      ? "Insufficient eWallet balance"
                      : "Payment will be charged to credit card on file"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {useWallet 
                    ? `Your eWallet balance of $${walletBalance.toLocaleString()} will be reduced by $${total.toFixed(2)}.`
                    : insufficientFunds
                      ? `Your eWallet balance ($${walletBalance.toLocaleString()}) is insufficient. Please add funds or update your payment method.`
                      : `Payment will be charged to your credit card. The administrative fee is non-refundable once the referral is accepted.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg border-2">
            <Checkbox
              id="agree-terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
              disabled={accepting}
            />
            <Label
              htmlFor="agree-terms"
              className="text-sm leading-relaxed cursor-pointer"
            >
              By accepting this referral, I acknowledge that all client intake forms
              and consents are complete. I understand that the $1,500 administrative
              coordination fee is <strong>non-refundable</strong> once charged, even if
              I choose not to proceed with the case or the attorney-client relationship
              ends.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={accepting}>
            Cancel
          </Button>
          {insufficientFunds ? (
            <Button
              onClick={() => window.location.href = "/attorney/billing?tab=ewallet"}
              className="bg-[#b09837] text-black hover:bg-[#b09837]/90"
            >
              Add Funds to eWallet
            </Button>
          ) : (
            <Button
              onClick={handleAccept}
              disabled={!agreed || accepting}
              className="bg-[#b09837] text-black hover:bg-[#b09837]/90"
            >
              {accepting ? "Processing..." : "Agree & Accept Referral"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
