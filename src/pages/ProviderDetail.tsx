import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ClientAppointmentBooking } from "@/components/appointments/ClientAppointmentBooking";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { ProviderRatingsDisplay } from "@/components/provider/ProviderRatingsDisplay";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Stethoscope,
  Building,
  FileText,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  specialty: string;
  practice_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  npi: string | null;
  bio: string | null;
  accepting_patients: boolean;
  is_active: boolean;
}

interface AvailabilitySlot {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function ProviderDetail() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { cases: userCases } = useApp();
  const caseId = userCases?.[0]?.id as string | undefined;

  const [provider, setProvider] = useState<Provider | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (providerId) {
      fetchProviderDetails();
    }
  }, [providerId]);

  async function fetchProviderDetails() {
    try {
      setLoading(true);

      // Fetch provider
      const { data: providerData, error: providerError } = await supabase
        .from("providers")
        .select("*")
        .eq("id", providerId)
        .maybeSingle();

      if (providerError) throw providerError;

      if (!providerData) {
        toast.error("Provider not found");
        navigate("/providers");
        return;
      }

      setProvider(providerData);

      // Fetch availability
      const { data: availData, error: availError } = await supabase
        .from("provider_availability_slots")
        .select("day_of_week, start_time, end_time, is_available")
        .eq("provider_id", providerId)
        .eq("is_available", true)
        .order("day_of_week")
        .order("start_time");

      if (availError) throw availError;
      setAvailability(availData || []);
    } catch (error: any) {
      console.error("Error fetching provider:", error);
      toast.error("Failed to load provider details");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-center text-muted-foreground">Loading provider details...</p>
        </div>
      </AppLayout>
    );
  }

  if (!provider) {
    return (
      <AppLayout>
        <div className="p-8">
          <p className="text-center text-muted-foreground">Provider not found</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/providers")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Directory
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{provider.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" />
                  {provider.specialty}
                </Badge>
                {provider.accepting_patients && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success">
                    Accepting New Patients
                  </Badge>
                )}
              </div>
            </div>
            {caseId && <ClientAppointmentBooking caseId={caseId} />}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {provider.bio && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  About
                </h2>
                <p className="text-muted-foreground whitespace-pre-wrap">{provider.bio}</p>
              </Card>
            )}

            {/* Availability */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Availability
              </h2>
              {availability.length === 0 ? (
                <p className="text-muted-foreground">
                  No availability information available. Please contact the provider directly.
                </p>
              ) : (
                <div className="space-y-3">
                  {DAYS.map((day, dayIdx) => {
                    const daySlots = availability.filter((s) => s.day_of_week === dayIdx);
                    if (daySlots.length === 0) return null;

                    return (
                      <div key={dayIdx} className="flex items-start gap-4">
                        <div className="w-28 font-medium text-foreground">{day}</div>
                        <div className="flex-1 space-y-1">
                          {daySlots.map((slot, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Clock className="w-3 h-3 text-primary" />
                              <span className="text-muted-foreground">
                                {slot.start_time} - {slot.end_time}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Ratings & Reviews */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Client Reviews</h2>
              <ProviderRatingsDisplay providerId={providerId!} />
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Practice Info */}
            {provider.practice_name && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  Practice
                </h3>
                <p className="text-muted-foreground">{provider.practice_name}</p>
              </Card>
            )}

            {/* Contact Info */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                {provider.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-primary" />
                    <a
                      href={`tel:${provider.phone}`}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {provider.phone}
                    </a>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary" />
                    <a
                      href={`mailto:${provider.email}`}
                      className="text-sm text-muted-foreground hover:text-primary"
                    >
                      {provider.email}
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Location */}
            {(provider.address || provider.city || provider.state) && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Location
                </h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  {provider.address && <p>{provider.address}</p>}
                  {(provider.city || provider.state) && (
                    <p>
                      {provider.city}
                      {provider.city && provider.state && ", "}
                      {provider.state} {provider.zip_code}
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* NPI */}
            {provider.npi && (
              <Card className="p-6">
                <h3 className="font-semibold mb-2">NPI Number</h3>
                <p className="text-sm text-muted-foreground">{provider.npi}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
