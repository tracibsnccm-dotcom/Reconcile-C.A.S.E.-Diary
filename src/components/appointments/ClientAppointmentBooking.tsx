import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
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
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";

interface Provider {
  id: string;
  name: string;
  specialty: string;
  city: string;
  state: string;
}

interface ClientAppointmentBookingProps {
  caseId: string;
}

export function ClientAppointmentBooking({ caseId }: ClientAppointmentBookingProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("id, name, specialty, city, state")
        .eq("accepting_patients", true)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to load providers");
    }
  }

  async function handleSubmit() {
    if (!selectedProvider || !title.trim() || !date) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("client_appointments").insert([
        {
          case_id: caseId,
          client_id: user!.id,
          provider_ref_id: selectedProvider,
          title: title.trim(),
          appointment_date: format(date, "yyyy-MM-dd"),
          appointment_time: time || null,
          location: location.trim() || null,
          notes: notes.trim() || null,
        },
      ]);

      if (error) throw error;

      toast.success("Appointment request submitted successfully");
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error submitting appointment:", error);
      toast.error("Failed to submit appointment request");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedProvider("");
    setTitle("");
    setDate(undefined);
    setTime("");
    setLocation("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary-dark">
          <CalendarIcon className="w-4 h-4 mr-2" />
          Request Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Provider Appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="provider">Provider *</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} - {provider.specialty}
                    {provider.city && ` (${provider.city}, ${provider.state})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Appointment Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow-up Visit, Initial Consultation"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Appointment Date *</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div>
              <Label htmlFor="time">
                <Clock className="w-4 h-4 inline mr-1" />
                Preferred Time
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Provider's office, telehealth, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or information for the provider..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedProvider || !title.trim() || !date}
              className="bg-primary hover:bg-primary-dark"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
