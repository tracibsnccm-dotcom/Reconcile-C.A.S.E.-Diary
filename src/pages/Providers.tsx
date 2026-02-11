import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProviderCard } from "@/components/ProviderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Megaphone, UserRound } from "lucide-react";
import { VoiceConcernsForm } from "@/components/VoiceConcernsForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientAppointmentBooking } from "@/components/appointments/ClientAppointmentBooking";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/context/AppContext";

interface Provider {
  id: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
  distanceMiles?: number;
  active: boolean;
  schedulingUrl?: string;
}

export default function Providers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceConcernsOpen, setVoiceConcernsOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const { cases: userCases } = useApp();
  const caseId = userCases?.[0]?.id as string | undefined;

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        specialty: p.specialty,
        city: p.city || "",
        state: p.state || "",
        active: p.accepting_patients,
      }));

      setProviders(formatted);
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProviders = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Provider Directory</h1>
            <p className="text-muted-foreground mt-1">Find and manage healthcare providers</p>
          </div>
          <div className="flex gap-3">
            {caseId && <ClientAppointmentBooking caseId={caseId} />}
            <Dialog open={voiceConcernsOpen} onOpenChange={setVoiceConcernsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-primary/10 hover:bg-primary/20 border-primary">
                  <div className="flex items-center gap-1 mr-2">
                    <UserRound className="w-4 h-4 text-rcms-purple" />
                    <Megaphone className="w-4 h-4 text-rcms-purple" />
                  </div>
                  Voice Your Concerns
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                {caseId ? (
                  <VoiceConcernsForm caseId={caseId} />
                ) : (
                  <Alert>
                    <AlertDescription>
                      No active case found. Please complete intake first.
                    </AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Voice Concerns Explainer */}
        <Alert className="mb-6">
          <div className="flex items-center gap-1">
            <UserRound className="w-4 h-4 text-rcms-purple" />
            <Megaphone className="w-4 h-4 text-rcms-purple" />
          </div>
          <AlertDescription>
            <strong>Voice Your Concerns:</strong> If you've had any issues or concerns about your
            care or interactions with a provider, use the "Voice Your Concerns" button above. Your
            RN Care Manager will review and follow up with you through secure messaging.
          </AlertDescription>
        </Alert>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search providers by name, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProviders.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>

        {filteredProviders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No providers found matching your search.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
