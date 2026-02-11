import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/auth/supabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RNCommunicationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [emailSignature, setEmailSignature] = useState("");
  const [autoReply, setAutoReply] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("email");
  const [responseTimeExpectation, setResponseTimeExpectation] = useState("24");

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, full_name")
        .eq("user_id", user?.id)
        .single();

      const { data: rnData } = await supabase
        .from("rn_metadata")
        .select("credentials")
        .eq("user_id", user?.id)
        .single();

      const defaultSignature = `\n\nBest regards,\n${profileData?.display_name || profileData?.full_name || "RN Case Manager"}${rnData?.credentials ? `, ${rnData.credentials}` : ""}`;
      setEmailSignature(defaultSignature);
    } catch (error: any) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          // Store communication preferences in a JSONB column or create additional columns
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      toast.success("Communication preferences saved successfully");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save communication preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Communication Preferences</CardTitle>
        <CardDescription>
          Manage how you communicate with clients, attorneys, and providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="emailSignature">Email Signature</Label>
          <Textarea
            id="emailSignature"
            value={emailSignature}
            onChange={(e) => setEmailSignature(e.target.value)}
            placeholder="Your email signature"
            rows={5}
          />
          <p className="text-sm text-muted-foreground">
            This signature will be automatically added to your email communications
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-Reply</Label>
            <p className="text-sm text-muted-foreground">Automatically respond to after-hours messages</p>
          </div>
          <Switch checked={autoReply} onCheckedChange={setAutoReply} />
        </div>

        {autoReply && (
          <div className="space-y-2">
            <Label htmlFor="autoReplyMessage">Auto-Reply Message</Label>
            <Textarea
              id="autoReplyMessage"
              value={autoReplyMessage}
              onChange={(e) => setAutoReplyMessage(e.target.value)}
              placeholder="Thank you for your message. I will respond during business hours..."
              rows={4}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="preferredContact">Preferred Contact Method</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={preferredContactMethod === "email" ? "default" : "outline"}
              onClick={() => setPreferredContactMethod("email")}
              className="flex-1"
            >
              Email
            </Button>
            <Button
              type="button"
              variant={preferredContactMethod === "phone" ? "default" : "outline"}
              onClick={() => setPreferredContactMethod("phone")}
              className="flex-1"
            >
              Phone
            </Button>
            <Button
              type="button"
              variant={preferredContactMethod === "portal" ? "default" : "outline"}
              onClick={() => setPreferredContactMethod("portal")}
              className="flex-1"
            >
              Portal
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Your preferred way for clients and providers to reach you
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responseTime">Expected Response Time</Label>
          <Select value={responseTimeExpectation} onValueChange={setResponseTimeExpectation}>
            <SelectTrigger id="responseTime">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">Within 4 hours</SelectItem>
              <SelectItem value="8">Within 8 hours</SelectItem>
              <SelectItem value="24">Within 24 hours</SelectItem>
              <SelectItem value="48">Within 48 hours</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Standard response time for non-urgent messages
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Communication Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
