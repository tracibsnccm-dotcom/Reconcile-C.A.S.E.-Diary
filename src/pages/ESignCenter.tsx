import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileSignature, Send, Eye, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";

const templates = [
  { id: "hipaa-release", name: "HIPAA Release Form", type: "hipaa" },
  { id: "provider-request", name: "Provider Record Request", type: "records" },
  { id: "consent-form", name: "Treatment Consent Form", type: "consent" },
];

const statusIcons = {
  sent: <Send className="w-4 h-4" />,
  viewed: <Eye className="w-4 h-4" />,
  signed: <CheckCircle2 className="w-4 h-4" />,
  declined: <XCircle className="w-4 h-4" />,
  expired: <AlertCircle className="w-4 h-4" />,
};

const statusColors = {
  sent: "bg-blue-500",
  viewed: "bg-purple-500",
  signed: "bg-green-500",
  declined: "bg-destructive",
  expired: "bg-muted",
};

export default function ESignCenter() {
  const { user } = useAuth();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedCase, setSelectedCase] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [requests, setRequests] = useState<any[]>([]);

  const handleSendRequest = async () => {
    if (!selectedTemplate || !selectedCase || !signerEmail) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      // In a real implementation, this would:
      // 1. Create e_sign_request record
      // 2. Send email to signer
      // 3. Log audit trail
      toast.success("E-signature request sent successfully");
      setShowNewRequest(false);
      setSelectedTemplate("");
      setSelectedCase("");
      setSignerEmail("");
    } catch (error) {
      toast.error("Failed to send e-signature request");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">E-Sign Center</h1>
            <p className="text-muted-foreground mt-1">Manage electronic signature requests</p>
          </div>
          <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
            <DialogTrigger asChild>
              <Button>
                <FileSignature className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create E-Signature Request</DialogTitle>
                <DialogDescription>
                  Select a template and specify the signer
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="template">Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger id="template">
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="case">Case</Label>
                  <Input
                    id="case"
                    placeholder="Enter case ID"
                    value={selectedCase}
                    onChange={(e) => setSelectedCase(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signer-email">Signer Email</Label>
                  <Input
                    id="signer-email"
                    type="email"
                    placeholder="signer@example.com"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    placeholder="Add a personal message..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewRequest(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendRequest}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Requests</CardTitle>
              <CardDescription>Track signature status and audit trail</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock data for demonstration */}
                {[
                  { id: 1, template: "HIPAA Release Form", case: "Case #ABC123", signer: "john@example.com", status: "signed", date: "2024-01-15" },
                  { id: 2, template: "Provider Record Request", case: "Case #DEF456", signer: "jane@example.com", status: "viewed", date: "2024-01-14" },
                  { id: 3, template: "Treatment Consent Form", case: "Case #GHI789", signer: "bob@example.com", status: "sent", date: "2024-01-13" },
                ].map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${statusColors[req.status as keyof typeof statusColors]}`} />
                        <div>
                          <p className="font-medium">{req.template}</p>
                          <p className="text-sm text-muted-foreground">
                            {req.case} • {req.signer}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        {statusIcons[req.status as keyof typeof statusIcons]}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{req.date}</span>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Available e-signature templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <FileSignature className="w-8 h-8 text-primary mb-2" />
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{template.type}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
