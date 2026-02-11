import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const settlementSchema = z.object({
  caseId: z.string().uuid(),
  settlementAmount: z.number().min(0).max(100000000),
  settlementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  outcome: z.enum(["settled", "dismissed", "trial_verdict", "other"]),
  notes: z.string().max(2000).optional(),
});

export function SettlementReportingForm() {
  const { user } = useAuth();
  const [caseId, setCaseId] = useState("");
  const [availableCases, setAvailableCases] = useState<any[]>([]);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementDate, setSettlementDate] = useState("");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useState(() => {
    loadCases();
  });

  async function loadCases() {
    if (!user) return;

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
      .filter((c: any) => c);

    setAvailableCases(cases || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit settlement reports.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(settlementAmount.replace(/[^0-9.]/g, ""));

    try {
      const validated = settlementSchema.parse({
        caseId,
        settlementAmount: amount,
        settlementDate,
        outcome,
        notes: notes.trim() || undefined,
      });

      setLoading(true);

      // Update referral record if exists
      const { error: updateError } = await supabase
        .from("referrals")
        .update({
          settlement_amount: validated.settlementAmount,
          acceptance_status: "settled",
          notes: validated.notes,
        })
        .eq("case_id", validated.caseId)
        .eq("attorney_id", user.id);

      if (updateError) throw updateError;

      // Log audit trail
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_role: "ATTORNEY",
        action: "settlement_reported",
        case_id: validated.caseId,
        meta: {
          settlement_amount: validated.settlementAmount,
          settlement_date: validated.settlementDate,
          outcome: validated.outcome,
          notes: validated.notes,
        },
      });

      toast({
        title: "Settlement Reported",
        description: "Thank you for updating the case outcome.",
      });

      setSubmitted(true);
      setCaseId("");
      setSettlementAmount("");
      setSettlementDate("");
      setOutcome("");
      setNotes("");

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: "Please check your inputs and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Submission Failed",
          description: error.message || "Unable to submit settlement report.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-2">
            Settlement Reported Successfully
          </h3>
          <p className="text-green-800 dark:text-green-200">
            Thank you for keeping us updated on your case outcome.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[#b09837]/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#b09837]" />
            Report Case Settlement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Help us track the success of our referrals by reporting case outcomes. This
            information helps improve our matching process and demonstrates the value of
            our referral network.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settlement Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="case-select">Case *</Label>
                <Select value={caseId} onValueChange={setCaseId} required>
                  <SelectTrigger id="case-select" className="mt-2">
                    <SelectValue placeholder="Select case..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCases.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        RC-{c.id.slice(-8).toUpperCase()} - {c.client_label || "Unnamed"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="outcome">Case Outcome *</Label>
                <Select value={outcome} onValueChange={setOutcome} required>
                  <SelectTrigger id="outcome" className="mt-2">
                    <SelectValue placeholder="Select outcome..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                    <SelectItem value="trial_verdict">Trial Verdict</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="settlement-amount">Settlement Amount *</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="settlement-amount"
                    type="text"
                    placeholder="50,000"
                    value={settlementAmount}
                    onChange={(e) => setSettlementAmount(e.target.value)}
                    className="pl-7"
                    maxLength={15}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Gross settlement before fees
                </p>
              </div>

              <div>
                <Label htmlFor="settlement-date">Settlement Date *</Label>
                <Input
                  id="settlement-date"
                  type="date"
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details about the settlement or case outcome..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2 min-h-[100px]"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {notes.length}/2000 characters
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !caseId || !outcome || !settlementAmount || !settlementDate}
              className="w-full bg-[#b09837] hover:bg-[#b09837]/90 text-black"
            >
              {loading ? "Submitting..." : "Submit Settlement Report"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="text-sm space-y-2">
            <p className="font-semibold text-amber-900 dark:text-amber-100">Privacy Notice:</p>
            <p className="text-amber-800 dark:text-amber-200">
              Settlement information is used internally to track referral outcomes and improve
              our services. This data is kept confidential and used only for quality assurance
              and reporting purposes.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
