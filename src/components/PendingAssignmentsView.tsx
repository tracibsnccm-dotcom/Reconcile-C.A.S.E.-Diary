import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { DeclineAssignmentModal } from "./DeclineAssignmentModal";
import { AcceptAssignmentModal } from "./AcceptAssignmentModal";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface PendingOffer {
  id: string;
  case_id: string;
  offered_at: string;
  expires_at: string;
}

export function PendingAssignmentsView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<PendingOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<PendingOffer | null>(null);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [policySignedMap, setPolicySignedMap] = useState<Record<string, boolean>>({});
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    if (!user) return;
    loadOffers();
    checkPolicyStatus();
    loadWalletBalance();

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
          loadOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function loadOffers() {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("assignment_offers")
      .select("*")
      .eq("attorney_id", user.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("offered_at", { ascending: false });

    if (error) {
      console.error("Error loading offers:", error);
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  }

  async function checkPolicyStatus() {
    if (!user) return;
    // For now, assume policy is always signed - this can be enhanced with policy_acknowledgments table
    setPolicySignedMap({ [user.id]: true });
  }

  async function loadWalletBalance() {
    if (!user) return;

    const { data } = await supabase
      .from("attorney_wallet")
      .select("balance")
      .eq("attorney_id", user.id)
      .maybeSingle();

    setWalletBalance(data?.balance || 0);
  }

  async function handleAccept(offerId: string) {
    setLoading(true);
    try {
      const { error } = await supabase.rpc("accept_assignment_offer", {
        p_offer_id: offerId,
      });

      if (error) throw error;

      toast({
        title: "Assignment Accepted",
        description: "Redirecting to case details...",
      });

      const offer = offers.find((o) => o.id === offerId);
      if (offer) {
        navigate(`/cases/${offer.case_id}`);
      }
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowAcceptModal(false);
    }
  }

  async function handleDecline(offerId: string, reason: string, note?: string) {
    setLoading(true);
    try {
      const { error } = await supabase.rpc("decline_assignment_offer", {
        p_offer_id: offerId,
        p_reason: reason,
        p_note: note || null,
      });

      if (error) throw error;

      toast({
        title: "Assignment Declined",
        description: "The offer has been declined.",
      });

      loadOffers();
    } catch (error: any) {
      console.error("Error declining offer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to decline assignment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowDeclineModal(false);
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m remaining`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Loading pending assignments...</p>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Assignments</h3>
          <p className="text-muted-foreground">
            You don't have any pending client assignments at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {offers.map((offer) => {
        const caseId = `RC-${offer.case_id.slice(-8).toUpperCase()}`;
        const timeRemaining = getTimeRemaining(offer.expires_at);
        const policySigned = policySignedMap[user?.id || ""];

        return (
          <Card key={offer.id} className="border-[#b09837]/30">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">New Client Assignment</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Case ID: {caseId}
                  </p>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeRemaining}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Offered</p>
                  <p className="font-medium">
                    {new Date(offer.offered_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">
                    {new Date(offer.expires_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedOffer(offer);
                    setShowAcceptModal(true);
                  }}
                  className="flex-1 bg-[#b09837] hover:bg-[#b09837]/90 text-black"
                  disabled={!policySigned}
                >
                  Accept Client
                </Button>
                <Button
                  onClick={() => {
                    setSelectedOffer(offer);
                    setShowDeclineModal(true);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>

              {!policySigned && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ You must acknowledge the{" "}
                    <a
                      href="/attorney-policy"
                      className="underline font-semibold hover:text-amber-900 dark:hover:text-amber-100"
                    >
                      Referral Policy
                    </a>{" "}
                    before accepting assignments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {selectedOffer && (
        <>
          <DeclineAssignmentModal
            open={showDeclineModal}
            onClose={() => {
              setShowDeclineModal(false);
              setSelectedOffer(null);
            }}
            onDecline={(reason, note) => handleDecline(selectedOffer.id, reason, note)}
          />
          <AcceptAssignmentModal
            open={showAcceptModal}
            onClose={() => {
              setShowAcceptModal(false);
              setSelectedOffer(null);
            }}
            onAccept={() => handleAccept(selectedOffer.id)}
            caseId={`RC-${selectedOffer.case_id.slice(-8).toUpperCase()}`}
            walletBalance={walletBalance}
          />
        </>
      )}
    </div>
  );
}
