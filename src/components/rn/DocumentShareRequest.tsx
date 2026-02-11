import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Share2, Send, File } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  specialty: string;
}

interface Document {
  id: string;
  file_name: string;
  document_type: string;
  created_at: string;
}

interface DocumentShareRequestProps {
  caseId: string;
  clientId: string;
}

export function DocumentShareRequest({ caseId, clientId }: DocumentShareRequestProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProviders();
      fetchDocuments();
    }
  }, [open, caseId]);

  async function fetchProviders() {
    try {
      const { data, error } = await supabase
        .from("providers")
        .select("id, name, specialty")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setProviders(data || []);
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to load providers");
    }
  }

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, document_type, created_at")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
    }
  }

  function toggleDocument(docId: string) {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  }

  async function handleSubmit() {
    if (!selectedProvider) {
      toast.error("Please select a provider");
      return;
    }

    if (selectedDocs.length === 0) {
      toast.error("Please select at least one document");
      return;
    }

    try {
      setSubmitting(true);

      const { error } = await supabase.from("appointment_document_shares").insert([
        {
          case_id: caseId,
          client_id: clientId,
          provider_id: selectedProvider,
          document_ids: selectedDocs,
          notes: notes.trim() || null,
          status: "pending",
          auto_selected_docs: false,
        },
      ]);

      if (error) throw error;

      toast.success("Document share request submitted for approval");
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error("Error submitting share request:", error);
      toast.error("Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedProvider("");
    setSelectedDocs([]);
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-primary/10 hover:bg-primary/20 border-primary">
          <Share2 className="w-4 h-4 mr-2" />
          Share Documents with Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Request Document Share Approval
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Provider Selection */}
          <div>
            <Label htmlFor="provider">Select Provider *</Label>
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger id="provider">
                <SelectValue placeholder="Choose a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name} - {provider.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Selection */}
          <div>
            <Label>Select Documents to Share *</Label>
            <Card className="p-4 mt-2 max-h-64 overflow-y-auto">
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No documents available for this case
                </p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-3">
                      <Checkbox
                        id={doc.id}
                        checked={selectedDocs.includes(doc.id)}
                        onCheckedChange={() => toggleDocument(doc.id)}
                      />
                      <label
                        htmlFor={doc.id}
                        className="flex-1 cursor-pointer text-sm leading-tight"
                      >
                        <div className="flex items-center gap-2">
                          <File className="w-4 h-4 text-primary" />
                          <span className="font-medium">{doc.file_name}</span>
                        </div>
                        <div className="text-muted-foreground mt-1">
                          Type: {doc.document_type || "Unknown"} •{" "}
                          {new Date(doc.created_at).toLocaleDateString()}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedDocs.length} document(s) selected
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any relevant notes about this document share request..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Info */}
          <Card className="p-4 bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This request will be sent for approval before documents are
              shared with the provider. You'll be notified once it's reviewed.
            </p>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedProvider || selectedDocs.length === 0}
              className="bg-primary hover:bg-primary-dark"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
