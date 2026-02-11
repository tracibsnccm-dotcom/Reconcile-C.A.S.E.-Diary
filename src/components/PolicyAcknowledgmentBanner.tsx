import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";

export function PolicyAcknowledgmentBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasSigned, setHasSigned] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkPolicyStatus();
  }, [user]);

  async function checkPolicyStatus() {
    if (!user) return;

    const { data, error } = await supabase
      .from("policy_acceptances")
      .select("id, policy_version")
      .eq("attorney_id", user.id)
      .eq("policy_version", "2025-10-30")
      .maybeSingle();

    if (error) {
      console.error("Error checking policy status:", error);
      return;
    }

    setHasSigned(!!data);
  }

  if (hasSigned || dismissed) return null;

  return (
    <div className="bg-[#b09837] text-black border-b border-black/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="font-medium">
            Action needed: Review and acknowledge the Referral Policy to accept system referrals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/attorney/policy")}
            className="bg-black text-[#b09837] hover:bg-black/90"
          >
            Review Policy
          </Button>
          <Button
            onClick={() => setDismissed(true)}
            variant="outline"
            className="border-black text-black hover:bg-black/10"
          >
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
