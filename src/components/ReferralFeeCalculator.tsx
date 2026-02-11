import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";
import { z } from "zod";

const calculatorSchema = z.object({
  settlementAmount: z.number().min(0).max(100000000),
  contingencyPercent: z.number().min(0).max(100),
  caseExpenses: z.number().min(0).max(10000000),
});

export function ReferralFeeCalculator() {
  const [settlementAmount, setSettlementAmount] = useState<string>("");
  const [contingencyPercent, setContingencyPercent] = useState<string>("33");
  const [caseExpenses, setCaseExpenses] = useState<string>("");

  const REFERRAL_FEE = 1500;

  const parseNumber = (value: string): number => {
    const cleaned = value.replace(/[^0-9.]/g, "");
    return cleaned === "" ? 0 : parseFloat(cleaned);
  };

  const settlement = parseNumber(settlementAmount);
  const contingency = parseNumber(contingencyPercent);
  const expenses = parseNumber(caseExpenses);

  let grossFee = 0;
  let netProfit = 0;
  let roi = 0;
  let isValid = false;

  try {
    const validated = calculatorSchema.parse({
      settlementAmount: settlement,
      contingencyPercent: contingency,
      caseExpenses: expenses,
    });

    grossFee = validated.settlementAmount * (validated.contingencyPercent / 100);
    netProfit = grossFee - REFERRAL_FEE - validated.caseExpenses;
    roi = REFERRAL_FEE > 0 ? (netProfit / REFERRAL_FEE) * 100 : 0;
    isValid = true;
  } catch (error) {
    // Invalid input, show zeros
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#b09837]/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#b09837]" />
            Referral ROI Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Calculate your expected return on investment for accepting a referral case.
            Input the expected settlement and your contingency fee to see if the $1,500
            referral investment makes financial sense.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="settlement">Expected Settlement Amount</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="settlement"
                  type="text"
                  placeholder="50,000"
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  className="pl-7"
                  maxLength={15}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="contingency">Your Contingency Fee (%)</Label>
              <div className="relative mt-2">
                <Input
                  id="contingency"
                  type="text"
                  placeholder="33"
                  value={contingencyPercent}
                  onChange={(e) => setContingencyPercent(e.target.value)}
                  className="pr-7"
                  maxLength={5}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Typical range: 33-40%
              </p>
            </div>

            <div>
              <Label htmlFor="expenses">Estimated Case Expenses (Optional)</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="expenses"
                  type="text"
                  placeholder="2,000"
                  value={caseExpenses}
                  onChange={(e) => setCaseExpenses(e.target.value)}
                  className="pl-7"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Depositions, experts, filing fees, etc.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[#b09837]/20">
          <CardHeader>
            <CardTitle className="text-lg">Financial Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Settlement Amount:</span>
                <span className="font-semibold">{formatCurrency(settlement)}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">
                  Your Fee ({contingency}%):
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(grossFee)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Referral Fee:</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(REFERRAL_FEE)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm text-muted-foreground">Case Expenses:</span>
                <span className="font-semibold text-red-600">
                  -{formatCurrency(expenses)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 bg-[#b09837]/10 px-3 rounded-lg mt-4">
                <span className="font-semibold">Net Profit:</span>
                <span className="text-2xl font-bold text-[#b09837]">
                  {formatCurrency(netProfit)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 bg-gradient-to-r from-[#128f8b]/10 to-[#0f2a6a]/10 px-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#128f8b]" />
                  <span className="font-semibold">ROI:</span>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    roi >= 100 ? "text-green-600" : roi >= 0 ? "text-amber-600" : "text-red-600"
                  }`}
                >
                  {isValid && settlement > 0 ? `${roi.toFixed(0)}%` : "0%"}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-start gap-2">
                <DollarSign className="h-5 w-5 text-[#b09837] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground">
                  {roi >= 500 && (
                    <p className="text-green-600 font-semibold">
                      Excellent ROI! This case appears financially worthwhile.
                    </p>
                  )}
                  {roi >= 100 && roi < 500 && (
                    <p className="text-amber-600 font-semibold">
                      Good ROI. Consider case complexity and time investment.
                    </p>
                  )}
                  {roi >= 0 && roi < 100 && (
                    <p className="text-amber-600 font-semibold">
                      Low ROI. Carefully evaluate if this case is worth your time.
                    </p>
                  )}
                  {roi < 0 && (
                    <p className="text-red-600 font-semibold">
                      Negative ROI. This case may not be financially viable.
                    </p>
                  )}
                  {!isValid && settlement === 0 && (
                    <p>Enter case details to calculate your expected return.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Important Notes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-200">
              <li>This calculator provides estimates only - actual results may vary</li>
              <li>The $1,500 referral fee is non-refundable once the case is released</li>
              <li>Consider time investment, case complexity, and client needs beyond ROI</li>
              <li>Factor in potential appeals, liens, and other settlement deductions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
