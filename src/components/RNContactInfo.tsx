import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RNContactInfo() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  useEffect(() => {
    if (user?.id) {
      loadContactInfo();
    }
  }, [user?.id]);

  const loadContactInfo = async () => {
    try {
      const { data } = await supabase
        .from("rn_metadata")
        .select("phone, alternate_phone, office_location, emergency_contact_name, emergency_contact_phone")
        .eq("user_id", user?.id)
        .single();

      if (data) {
        setPhone(data.phone || "");
        setAlternatePhone(data.alternate_phone || "");
        setOfficeLocation(data.office_location || "");
        setEmergencyContact(data.emergency_contact_name || "");
        setEmergencyPhone(data.emergency_contact_phone || "");
      }
    } catch (error: any) {
      console.error("Error loading contact info:", error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("rn_metadata")
        .upsert({
          user_id: user.id,
          phone,
          alternate_phone: alternatePhone,
          office_location: officeLocation,
          emergency_contact_name: emergencyContact,
          emergency_contact_phone: emergencyPhone,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      toast.success("Contact information updated successfully");
    } catch (error: any) {
      console.error("Error saving contact info:", error);
      toast.error("Failed to update contact information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          Manage your contact details for clients, attorneys, and providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Primary Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alternatePhone">Alternate Phone</Label>
            <Input
              id="alternatePhone"
              type="tel"
              value={alternatePhone}
              onChange={(e) => setAlternatePhone(e.target.value)}
              placeholder="(555) 987-6543"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="officeLocation">Office Location</Label>
            <Input
              id="officeLocation"
              value={officeLocation}
              onChange={(e) => setOfficeLocation(e.target.value)}
              placeholder="City, State or Address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
            <Input
              id="emergencyContact"
              value={emergencyContact}
              onChange={(e) => setEmergencyContact(e.target.value)}
              placeholder="Contact person name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyPhone"
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
              placeholder="(555) 111-2222"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Contact Information"}
        </Button>
      </CardContent>
    </Card>
  );
}
