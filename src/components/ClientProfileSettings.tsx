import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "lucide-react";
import { toast } from "sonner";

/**
 * Client profile/settings for C.A.S.E. portal.
 * Uses case_id from sessionStorage; loads/saves client name and contact from rc_clients
 * (via rc_cases.client_id). No Supabase auth — sessionStorage login only.
 */
export function ClientProfileSettings() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("client_case_id");
    if (stored) setCaseId(stored);
  }, []);

  useEffect(() => {
    if (caseId) loadProfile();
  }, [caseId]);

  async function loadProfile() {
    if (!caseId) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const caseRes = await fetch(
        `${supabaseUrl}/rest/v1/rc_cases?id=eq.${caseId}&select=client_id&limit=1`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (!caseRes.ok) return;
      const caseData = await caseRes.json();
      const row = Array.isArray(caseData) ? caseData[0] : caseData;
      const clientId = (row as { client_id?: string })?.client_id;
      if (!clientId) return;
      const clientRes = await fetch(
        `${supabaseUrl}/rest/v1/rc_clients?id=eq.${clientId}&select=first_name,last_name,email,phone&limit=1`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (!clientRes.ok) return;
      const clientData = await clientRes.json();
      const client = Array.isArray(clientData) ? clientData[0] : clientData;
      if (client) {
        setProfile({
          first_name: (client as { first_name?: string }).first_name ?? "",
          last_name: (client as { last_name?: string }).last_name ?? "",
          email: (client as { email?: string }).email ?? "",
          phone: (client as { phone?: string }).phone ?? "",
        });
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  async function handleSave() {
    if (!caseId) return;
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const caseRes = await fetch(
        `${supabaseUrl}/rest/v1/rc_cases?id=eq.${caseId}&select=client_id&limit=1`,
        { headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` } }
      );
      if (!caseRes.ok) throw new Error("Could not load case");
      const caseData = await caseRes.json();
      const row = Array.isArray(caseData) ? caseData[0] : caseData;
      const clientId = (row as { client_id?: string })?.client_id;
      if (!clientId) {
        toast.error("Client record not linked yet. Contact your attorney's office.");
        return;
      }
      const res = await fetch(
        `${supabaseUrl}/rest/v1/rc_clients?id=eq.${clientId}`,
        {
          method: 'PATCH',
          headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            first_name: profile.first_name || null,
            last_name: profile.last_name || null,
            email: profile.email || null,
            phone: profile.phone || null,
          })
        }
      );
      if (!res.ok) throw new Error("Failed to update profile");
      toast.success("Profile updated successfully");
      const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
      if (name) sessionStorage.setItem("client_name", name);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  if (!caseId) {
    return (
      <Card className="bg-white shadow-lg border border-slate-200">
        <CardContent className="p-8 text-center text-gray-600">Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border border-slate-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-orange-500" />
          Profile
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="mt-1" />
          </div>
          <Button onClick={handleSave} disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
            {loading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
