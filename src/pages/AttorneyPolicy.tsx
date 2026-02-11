import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Shield, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AttorneyPolicy() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [firm, setFirm] = useState("");
  const [signatureType, setSignatureType] = useState<"typed" | "drawn">("typed");
  const [submitting, setSubmitting] = useState(false);

  const policyText = {
    verified: "Reconcile C.A.R.E. issues referrals only after all client intake forms and required authorizations have been completed and verified by an RN Care Manager. Referrals are based on client-provided and verified information. Reconcile C.A.R.E. is not responsible for ongoing attorney-client relationship outcomes.",
    fee: "Each accepted referral triggers a $1,500 Administrative Coordination & Case Transfer Fee, covering case verification, consent validation, and secure data transfer. A 3.25% processing fee and applicable taxes are added automatically. Payment is due immediately upon acceptance via credit card on file or pre-funded wallet (minimum $1,500). ACH is not accepted.",
    refund: "All payments are final. Fees are non-refundable once a referral is released, regardless of whether the attorney or client proceeds. Reconcile C.A.R.E. provides a verified introduction only and does not mediate disputes.",
    tracking: "Attorneys can view referral metrics under \"Referrals,\" including counts, acceptance rates, fees paid, and reported settlements.",
    compliance: "Reconcile C.A.R.E. facilitates administrative coordination and introductions only, does not provide legal advice, and does not share in attorney fees. Acceptance of a referral authorizes immediate processing of applicable charges."
  };

  const generateChecksum = (text: string) => {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join(""));
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  async function handleSubmit() {
    if (!agreed || !name.trim() || !user) {
      toast({
        title: "Missing Information",
        description: "Please complete all required fields and agree to the policy.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const policyContent = Object.values(policyText).join("\n\n");
      const checksum = await generateChecksum(policyContent);

      let signatureBlob = null;
      if (signatureType === "drawn" && canvasRef.current) {
        signatureBlob = canvasRef.current.toDataURL();
      }

      const { error } = await supabase.from("policy_acceptances").insert({
        attorney_id: user.id,
        attorney_name: name.trim(),
        firm: firm.trim() || null,
        title: title.trim() || null,
        signature_type: signatureType,
        typed_signature_text: signatureType === "typed" ? name.trim() : null,
        signature_blob: signatureBlob,
        policy_version: "2025-10-30",
        checksum,
        ip_address: null,
        user_agent: navigator.userAgent,
      });

      if (error) throw error;

      toast({
        title: "Acknowledgment Recorded",
        description: "You can now accept client referrals.",
      });

      navigate("/attorney-portal");
    } catch (error) {
      console.error("Error submitting acknowledgment:", error);
      toast({
        title: "Error",
        description: "Failed to record acknowledgment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#0f2a6a] text-white py-6 border-b">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">Reconcile C.A.R.E. — Referral Policy & Acknowledgment</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-[#b09837]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <DollarSign className="h-6 w-6 text-[#b09837] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Fee</h3>
                  <p className="text-sm text-muted-foreground">
                    $1,500 per accepted referral + 3.25% processing + applicable tax
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#b09837]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-[#128f8b] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    Credit Card on File or Pre-Funded Account (min $1,500)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[#b09837]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <FileText className="h-6 w-6 text-[#0f2a6a] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-1">Refunds</h3>
                  <p className="text-sm text-muted-foreground">
                    Non-refundable once referral released
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Policy Text */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#0f2a6a]">Policy Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2 text-[#0f2a6a]">Verified Referral Process</h3>
              <p className="text-sm leading-relaxed">{policyText.verified}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-[#0f2a6a]">Administrative Coordination & Case Transfer Fee</h3>
              <p className="text-sm leading-relaxed">{policyText.fee}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-[#0f2a6a]">Refund Policy</h3>
              <p className="text-sm leading-relaxed">{policyText.refund}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-[#0f2a6a]">Referral Tracking & Reporting</h3>
              <p className="text-sm leading-relaxed">{policyText.tracking}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2 text-[#0f2a6a]">Compliance & Acknowledgment</h3>
              <p className="text-sm leading-relaxed">{policyText.compliance}</p>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledge & Sign */}
        <Card className="border-2 border-[#b09837]">
          <CardHeader>
            <CardTitle className="text-[#b09837]">Acknowledge & Sign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-3">
              <Checkbox
                id="agree-policy"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
              />
              <Label htmlFor="agree-policy" className="text-sm leading-relaxed cursor-pointer">
                I have read and agree to the Referral Policy.
              </Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Attorney at Law"
                />
              </div>
              <div>
                <Label htmlFor="firm">Firm</Label>
                <Input
                  id="firm"
                  value={firm}
                  onChange={(e) => setFirm(e.target.value)}
                  placeholder="Law Firm Name"
                />
              </div>
            </div>

            <div>
              <Label>Signature Method</Label>
              <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as "typed" | "drawn")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="typed">Type Signature</TabsTrigger>
                  <TabsTrigger value="drawn">Draw Signature</TabsTrigger>
                </TabsList>
                <TabsContent value="typed" className="mt-4">
                  <div className="p-6 border-2 border-dashed rounded-lg text-center">
                    <p className="text-3xl font-signature">{name || "Your signature will appear here"}</p>
                  </div>
                </TabsContent>
                <TabsContent value="drawn" className="mt-4">
                  <div className="space-y-2">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="border-2 border-dashed rounded-lg w-full cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                    />
                    <Button onClick={clearCanvas} variant="outline" size="sm">
                      Clear Signature
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Date: {new Date().toLocaleString()}
              </p>
              <Button
                onClick={handleSubmit}
                disabled={!agreed || !name.trim() || submitting}
                className="bg-[#b09837] text-black hover:bg-[#b09837]/90"
              >
                {submitting ? "Processing..." : "Acknowledge & Sign"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
