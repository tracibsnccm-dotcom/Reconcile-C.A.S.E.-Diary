/**
 * ClientProfile — Client Block 1 (Profile Revision)
 * Profile source of truth table: rc_clients
 * Fields used: first_name, last_name, email, phone (email read-only for login safety)
 * Previously, UI was reading from: rc_clients (unchanged)
 * Now, UI reads from: rc_clients (source of truth; intake must not overwrite after profile saved)
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  isRcClientsAuthBindingError,
  getRcClientsBindingUserMessage,
  getRcClientsBindingDiagnosticDetail,
} from "@/lib/rcClientsErrorUtils";
import { CLIENT_PROFILE_BINDING_REFRESH } from "@/config/clientMessaging";
import { supabase } from "@/integrations/supabase/client";
import { clearRoleCaches } from "@/lib/roleCacheUtils";
import { ensureClientBindingForCase } from "@/lib/clientCaseBinding";

/** Email display: profile (rc_clients) > auth.user.email > "Not provided". Auth may be null for PIN-only client portal. */
function useAuthEmail(): string | null {
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthEmail(user?.email ?? null));
  }, []);
  return authEmail;
}

interface ClientProfileProps {
  caseId: string;
  /** Called after profile is saved so the parent can refresh header/display name from rc_clients */
  onProfileSaved?: () => void;
}

interface ClientData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  preferred_contact_method: string | null;
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_phone: string | null;
}

interface CaseData {
  case_number: string | null;
  date_of_injury: string | null;
  case_status: string | null;
  assigned_rn_name: string | null;
  attorney_name: string | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const RELATIONSHIPS = [
  "Spouse",
  "Parent",
  "Sibling",
  "Child",
  "Friend",
  "Other",
];

export function ClientProfile({ caseId, onProfileSaved }: ClientProfileProps) {
  const { toast } = useToast();
  const authEmail = useAuthEmail();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ClientData>>({});
  const [bindingError, setBindingError] = useState<string | null>(null);
  const [resolvedClientId, setResolvedClientId] = useState<string | null>(null);

  /** Resolve clientId from rc_cases.client_id; if NULL, run self-heal binder and return resolved id. */
  async function resolveCaseClientId(caseId: string): Promise<string | null> {
    const { clientId } = await ensureClientBindingForCase(supabase, caseId);
    return clientId;
  }

  useEffect(() => {
    fetchProfileData();
  }, [caseId]);

  async function fetchProfileData(): Promise<ClientData | null> {
    try {
      setLoading(true);
      setBindingError(null);
      setResolvedClientId(null);

      // Resolve client_id: read rc_cases.client_id; if NULL run self-heal binder
      const clientId = await resolveCaseClientId(caseId);
      if (!clientId) {
        setBindingError(CLIENT_PROFILE_BINDING_REFRESH);
        return null;
      }
      setResolvedClientId(clientId);

      // Fetch case details (case_number, date_of_injury, attorney_id, case_status)
      const { data: caseRow, error: caseErr } = await supabase
        .from("rc_cases")
        .select("case_number, date_of_injury, attorney_id, case_status")
        .eq("id", caseId)
        .eq("is_superseded", false)
        .maybeSingle();

      if (caseErr) {
        setBindingError(CLIENT_PROFILE_BINDING_REFRESH);
        return null;
      }

      let attorneyName: string | null = null;
      if (caseRow?.attorney_id) {
        const { data: att } = await supabase.from("rc_users").select("full_name").eq("id", caseRow.attorney_id).single();
        attorneyName = att?.full_name ?? null;
      }

      setCaseData({
        case_number: caseRow?.case_number ?? null,
        date_of_injury: caseRow?.date_of_injury ?? null,
        case_status: caseRow?.case_status ?? null,
        assigned_rn_name: null,
        attorney_name: attorneyName ?? (caseRow?.attorney_id ? "Not available" : null),
      });

      // Fetch rc_clients by resolved clientId
      const { data: client, error: clientErr } = await supabase
        .from("rc_clients")
        .select("*")
        .eq("id", clientId)
        .maybeSingle();

      if (clientErr || !client) {
        setBindingError(CLIENT_PROFILE_BINDING_REFRESH);
        return null;
      }

      setClientData(client);
      setFormData(client);

      // Optional backfill: when rc_clients.email is null/empty and auth has an email, update only once
      const profileEmail = (client.email || "").trim();
      if (!profileEmail) {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user?.email) return;
          supabase.from("rc_clients").update({ email: user.email }).eq("id", client.id).then(({ error }) => {
            if (!error) {
              setClientData((prev) => (prev ? { ...prev, email: user.email! } : null));
              setFormData((prev) => ({ ...prev, email: user.email! }));
            }
          });
        });
      }
      return client;
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setBindingError(CLIENT_PROFILE_BINDING_REFRESH);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!caseId) {
      setSaveError("Cannot save profile: missing caseId/clientId binding.");
      return;
    }
    if (!resolvedClientId) {
      setSaveError("Cannot save profile: missing caseId/clientId binding.");
      return;
    }
    if (!clientData) {
      setSaveError(`Cannot save profile: no rc_clients row found for client_id=${resolvedClientId}`);
      return;
    }

    const fn = (formData.first_name || "").trim();
    const ln = (formData.last_name || "").trim();
    if (!fn || !ln) {
      setSaveError("First name and last name are required.");
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      const updateData: Partial<ClientData> = {
        first_name: fn,
        last_name: ln,
        phone: (formData.phone || "").trim() || null,
      };

      const res = await supabase
        .from("rc_clients")
        .update(updateData)
        .eq("id", clientData.id)
        .select("id, first_name, last_name, email, phone")
        .single();

      if (res.error) {
        setSaveError(`Save failed: ${res.error.message}` + (res.error.code ? ` (${res.error.code})` : ""));
        console.error("Profile save error:", res.error.message, res.error.code);
        const errForCheck = new Error(res.error.message);
        if (isRcClientsAuthBindingError(errForCheck)) {
          toast({ title: "Error", description: getRcClientsBindingUserMessage(), variant: "destructive" });
          console.warn("rc_clients binding diagnostic:", getRcClientsBindingDiagnosticDetail(errForCheck));
        } else {
          toast({ title: "Error", description: "Failed to save profile: " + res.error.message, variant: "destructive" });
        }
        return;
      }

      const refetched = await fetchProfileData();
      if (!refetched) {
        setSaveError("Save reported success but refetch failed or returned no row.");
        return;
      }
      const match =
        refetched.first_name === updateData.first_name &&
        refetched.last_name === updateData.last_name &&
        (refetched.phone || "") === (updateData.phone || "");
      if (!match) {
        setSaveError("Save reported success but refetch did not reflect changes. Possible wrong row target.");
        return;
      }

      setIsEditing(false);
      clearRoleCaches();
      onProfileSaved?.();
      toast({ title: "Profile updated", description: "Your profile information has been saved successfully." });
    } catch (err: unknown) {
      console.error("Profile save failed:", err instanceof Error ? err.message : String(err));
      const msg = isRcClientsAuthBindingError(err as Error)
        ? getRcClientsBindingUserMessage()
        : (err instanceof Error ? err.message : "Unknown error");
      setSaveError("Failed to save profile: " + msg);
      if (isRcClientsAuthBindingError(err as Error)) {
        toast({ title: "Error", description: getRcClientsBindingUserMessage(), variant: "destructive" });
        console.warn("rc_clients binding diagnostic:", getRcClientsBindingDiagnosticDetail(err as Error));
      } else {
        toast({ title: "Error", description: "Failed to save profile: " + msg, variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (clientData) {
      setFormData(clientData);
    }
    setSaveError(null);
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-slate-600">Loading profile...</p>
      </div>
    );
  }

  if (bindingError) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-900 font-medium" role="alert">{bindingError}</p>
      </div>
    );
  }

  const data = clientData || formData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <User className="w-6 h-6" />
                My Profile
              </CardTitle>
              <p className="text-white/80 text-sm mt-1">
                View and update your personal information
              </p>
            </div>
            {!isEditing && (
              <Button
                onClick={() => { setSaveError(null); setIsEditing(true); }}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
            {isEditing && (
              <div className="flex flex-col items-end gap-2">
                {saveError && (
                  <p className="text-sm text-red-800 w-full" role="alert">{saveError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={cancelEdit}
                    variant="outline"
                    className="bg-white hover:bg-slate-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={saveProfile}
                    disabled={saving}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#4fb9af' }}>
        <CardHeader>
          <CardTitle className="text-white">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">First Name *</Label>
              {isEditing ? (
                <Input
                  value={formData.first_name || ""}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="First Name"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.first_name || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">Last Name *</Label>
              {isEditing ? (
                <Input
                  value={formData.last_name || ""}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="Last Name"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.last_name || "Not provided"}</p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-white">Date of Birth</Label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.date_of_birth || ""}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="bg-white border-slate-200"
              />
            ) : (
              <p className="text-white/90 mt-1">
                {data.date_of_birth ? format(new Date(data.date_of_birth), "MMM d, yyyy") : "Not provided"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Phone Number</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="(555) 123-4567"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.phone || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">Email Address</Label>
              <p className="text-white/90 mt-1">{(data.email ?? authEmail ?? "").trim() || "Not provided"}</p>
              <p className="text-white/70 text-xs mt-1">Email changes require admin support to protect login access.</p>
            </div>
          </div>
          <div>
            <Label className="text-white">Preferred Contact Method</Label>
            {isEditing ? (
              <Select
                value={formData.preferred_contact_method || ""}
                onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value })}
              >
                <SelectTrigger className="bg-white border-slate-200">
                  <SelectValue placeholder="Select contact method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-white/90 mt-1">
                {data.preferred_contact_method
                  ? data.preferred_contact_method.charAt(0).toUpperCase() + data.preferred_contact_method.slice(1)
                  : "Not provided"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#4fb9af' }}>
        <CardHeader>
          <CardTitle className="text-white">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Street Address</Label>
            {isEditing ? (
              <Input
                value={formData.street_address || ""}
                onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                className="bg-white border-slate-200"
                placeholder="123 Main St"
              />
            ) : (
              <p className="text-white/90 mt-1">{data.street_address || "Not provided"}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-white">City</Label>
              {isEditing ? (
                <Input
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="City"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.city || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">State</Label>
              {isEditing ? (
                <Select
                  value={formData.state || ""}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white/90 mt-1">{data.state || "Not provided"}</p>
              )}
            </div>
            <div>
              <Label className="text-white">ZIP Code</Label>
              {isEditing ? (
                <Input
                  value={formData.zip_code || ""}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="12345"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.zip_code || "Not provided"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#4fb9af' }}>
        <CardHeader>
          <CardTitle className="text-white">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white">Name</Label>
            {isEditing ? (
              <Input
                value={formData.emergency_contact_name || ""}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="bg-white border-slate-200"
                placeholder="Emergency contact name"
              />
            ) : (
              <p className="text-white/90 mt-1">{data.emergency_contact_name || "Not provided"}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Relationship</Label>
              {isEditing ? (
                <Select
                  value={formData.emergency_contact_relationship || ""}
                  onValueChange={(value) => setFormData({ ...formData, emergency_contact_relationship: value })}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((rel) => (
                      <SelectItem key={rel} value={rel.toLowerCase()}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-white/90 mt-1">
                  {data.emergency_contact_relationship
                    ? data.emergency_contact_relationship.charAt(0).toUpperCase() + data.emergency_contact_relationship.slice(1)
                    : "Not provided"}
                </p>
              )}
            </div>
            <div>
              <Label className="text-white">Phone Number</Label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formData.emergency_contact_phone || ""}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="bg-white border-slate-200"
                  placeholder="(555) 123-4567"
                />
              ) : (
                <p className="text-white/90 mt-1">{data.emergency_contact_phone || "Not provided"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Information (Read-only) */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white">Case Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-white">Case Number</Label>
            <p className="text-white/90 mt-1">{caseData?.case_number || "Not available"}</p>
          </div>
          <div>
            <Label className="text-white">Date of Injury</Label>
            <p className="text-white/90 mt-1">
              {caseData?.date_of_injury
                ? format(new Date(caseData.date_of_injury), "MMM d, yyyy")
                : "Not available"}
            </p>
          </div>
          {caseData?.case_status != null && (
            <div>
              <Label className="text-white">Status</Label>
              <p className="text-white/90 mt-1">{caseData.case_status.replace(/_/g, " ")}</p>
            </div>
          )}
          <div>
            <Label className="text-white">Assigned RN</Label>
            <p className="text-white/90 mt-1">{caseData?.assigned_rn_name || "Not assigned"}</p>
          </div>
          <div>
            <Label className="text-white">Attorney</Label>
            <p className="text-white/90 mt-1">{caseData?.attorney_name ?? "Not available"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
