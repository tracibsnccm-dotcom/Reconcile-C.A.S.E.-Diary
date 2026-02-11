import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, X } from "lucide-react";
import { DeclineAssignmentModal } from "./DeclineAssignmentModal";
import { AcceptAssignmentModal } from "./AcceptAssignmentModal";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PendingOffer {
  id: string;
  case_id: string;
  expires_at: string;
}

export function AssignmentAlertBanner() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [pendingOffer, setPendingOffer] = useState<PendingOffer | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [hasPolicySigned, setHasPolicySigned] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user || !hasRole("ATTORNEY")) return;

    loadPendingOffer();
    checkPolicyStatus();
    loadWalletBalance();

    // Set up realtime subscription
    const channel = supabase
      .channel("assignment_offers_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assignment_offers",
          filter: `attorney_id=eq.${user.id}`,
        },
        () => {
          loadPendingOffer();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, hasRole]);

  useEffect(() => {
    if (!pendingOffer) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(pendingOffer.expires_at).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expired");
        loadPendingOffer();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [pendingOffer]);

  async function loadPendingOffer() {
    if (!user) return;

    const { data, error } = await supabase
      .from("assignment_offers")
      .select("id, case_id, expires_at")
      .eq("attorney_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("offered_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error loading pending offer:", error);
      return;
    }

    setPendingOffer(data);
    setDismissed(false);
  }

  async function checkPolicyStatus() {
    if (!user) return;

    const { data, error } = await supabase
      .from("policy_acceptances")
      .select("id")
      .eq("attorney_id", user.id)
      .eq("policy_version", "2025-10-30")
      .maybeSingle();

    if (error) {
      console.error("Error checking policy status:", error);
      return;
    }

    setHasPolicySigned(!!data);
  }

  async function loadWalletBalance() {
    if (!user) return;

    const { data, error } = await supabase
      .from("attorney_wallet")
      .select("balance")
      .eq("attorney_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading wallet balance:", error);
      return;
    }

    setWalletBalance(data?.balance || 0);
  }

  async function handleAccept() {
    if (!pendingOffer) return;

    try {
      const { data, error } = await supabase.rpc("accept_assignment_offer", {
        p_offer_id: pendingOffer.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; case_id?: string };

      if (!result.success) {
        toast({
          title: "Unable to Accept",
          description: result.error || "This offer is no longer available.",
          variant: "destructive",
        });
        loadPendingOffer();
        return;
      }

      toast({
        title: "Client Accepted",
        description: "You have successfully accepted this client assignment.",
      });

      setPendingOffer(null);
      setShowAcceptModal(false);

      // Redirect to case detail
      if (result.case_id) {
        window.location.href = `/case-detail/${result.case_id}`;
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Error",
        description: "Failed to accept assignment. Please try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDecline(reason: string, note?: string) {
    if (!pendingOffer) return;

    try {
      const { data, error } = await supabase.rpc("decline_assignment_offer", {
        p_offer_id: pendingOffer.id,
        p_reason: reason,
        p_note: note,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        toast({
          title: "Unable to Decline",
          description: result.error || "Failed to process your decline.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Assignment Declined",
        description: "The client has been returned to the queue.",
      });

      setPendingOffer(null);
      setShowDeclineModal(false);
    } catch (error) {
      console.error("Error declining offer:", error);
      toast({
        title: "Error",
        description: "Failed to decline assignment. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!pendingOffer || dismissed) return null;

  const caseId = `RC-${pendingOffer.case_id.slice(-8).toUpperCase()}`;

  return (
    <>
      <div className="bg-[#b09837] text-black border-b border-black/10 animate-pulse-soft">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                New client needs representation. You were selected by fair rotation.
              </p>
              <p className="text-sm opacity-90">
                Case ID: {caseId} • Time remaining: {timeLeft}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!hasPolicySigned ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      disabled
                      className="bg-black text-[#b09837] hover:bg-black/90"
                    >
                      Accept Client
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Action required: Acknowledge Referral Policy to proceed.</p>
                    <Button
                      size="sm"
                      variant="link"
                      onClick={() => navigate("/attorney/policy")}
                      className="text-xs p-0 h-auto"
                    >
                      Review Policy
                    </Button>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                onClick={() => setShowAcceptModal(true)}
                className="bg-black text-[#b09837] hover:bg-black/90"
              >
                Accept Client
              </Button>
            )}
            <Button
              onClick={() => setShowDeclineModal(true)}
              variant="outline"
              className="border-black text-black hover:bg-black/10"
            >
              Decline
            </Button>
            <Button
              onClick={() => setDismissed(true)}
              variant="ghost"
              size="icon"
              className="text-black hover:bg-black/10"
              aria-label="Dismiss banner temporarily"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DeclineAssignmentModal
        open={showDeclineModal}
        onClose={() => setShowDeclineModal(false)}
        onDecline={handleDecline}
      />

      <AcceptAssignmentModal
        open={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        onAccept={handleAccept}
        caseId={caseId}
        walletBalance={walletBalance}
      />
    </>
  );
}
