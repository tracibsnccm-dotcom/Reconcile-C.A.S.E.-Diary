import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, FileText, Clock, User, X } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  created_at: string;
  file_name: string;
  case_id: string;
  uploaded_by: string;
  document_type: string;
  status: string;
  read_by: string[];
  requires_attention: boolean;
  file_path: string;
  mime_type: string | null;
  category?: string;
  is_sensitive?: boolean;
  note?: string;
}

interface ActivityLog {
  id: string;
  action_type: string;
  performed_by_name: string;
  performed_by_role: string;
  created_at: string;
  metadata: any;
}

interface DocumentPreviewDrawerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function DocumentPreviewDrawer({
  document,
  isOpen,
  onClose,
  onUpdate,
}: DocumentPreviewDrawerProps) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [caseInfo, setCaseInfo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      setNote(document.note || "");
      fetchActivityLogs();
      fetchCaseInfo();
      generatePreviewUrl();
      logView();
    }
  }, [document]);

  const fetchActivityLogs = async () => {
    if (!document) return;
    
    try {
      const { data, error } = await supabase
        .from("document_activity_log")
        .select("*")
        .eq("document_id", document.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    }
  };

  const fetchCaseInfo = async () => {
    if (!document) return;
    
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("id, status, client_label")
        .eq("id", document.case_id)
        .single();

      if (error) throw error;
      setCaseInfo(data);
    } catch (error) {
      console.error("Error fetching case info:", error);
    }
  };

  const generatePreviewUrl = async () => {
    if (!document) return;
    
    try {
      const { data, error } = await supabase.rpc("rpc_get_document_signed_url", {
        document_id: document.id,
      });

      if (error) {
        console.error("Error getting signed URL:", error);
        return;
      }

      if (data?.signed_url) {
        setPreviewUrl(data.signed_url);
      }
    } catch (error) {
      console.error("Error generating preview URL:", error);
    }
  };

  const logView = async () => {
    if (!document) return;
    
    try {
      await supabase.rpc("log_document_activity", {
        p_document_id: document.id,
        p_action_type: "viewed",
      });
    } catch (error) {
      console.error("Error logging view:", error);
    }
  };

  const handleSaveNote = async () => {
    if (!document) return;

    setSaving(true);
    try {
      const user = await supabase.auth.getUser();
      
      // Update document note
      const { error: docError } = await supabase
        .from("documents")
        .update({ note })
        .eq("id", document.id);

      if (docError) throw docError;

      // Mirror to case notes if note changed
      if (note !== document.note && note.trim()) {
        await supabase.from("case_notes").insert({
          case_id: document.case_id,
          note_text: `📎 Document note updated: ${document.file_name}\n${note}`,
          created_by: user.data.user?.id,
          visibility: "private",
        });
      }

      toast({
        title: "Note Saved",
        description: "Document note updated and synced to case notes",
      });

      onUpdate();
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleView = async () => {
    if (!document) return;

    console.log("VIEW_CLICK", { 
      id: document.id, 
      path: document.file_path, 
      mime: document.mime_type 
    });

    try {
      const { data, error } = await supabase.rpc("rpc_get_document_signed_url", {
        p_document_id: document.id,
      });

      if (error) {
        console.error("Error getting signed URL for view:", error);
        toast({
          title: "Error",
          description: "Failed to get document URL",
          variant: "destructive",
        });
        return;
      }

      if (data?.signed_url) {
        window.open(data.signed_url, "_blank");
      }
    } catch (error) {
      console.error("Error viewing document:", error);
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    console.log("DOWNLOAD_CLICK", { 
      id: document.id, 
      path: document.file_path, 
      mime: document.mime_type 
    });

    try {
      const { data, error } = await supabase.rpc("rpc_get_document_signed_url", {
        p_document_id: document.id,
      });

      if (error) {
        console.error("Error getting signed URL for download:", error);
        toast({
          title: "Error",
          description: "Failed to get document URL",
          variant: "destructive",
        });
        return;
      }

      if (data?.signed_url) {
        // Create a temporary anchor element to trigger download
        const link = window.document.createElement("a");
        link.href = data.signed_url;
        link.download = document.file_name;
        link.target = "_blank";
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);

        // Log download activity
        await supabase.rpc("log_document_activity", {
          p_document_id: document.id,
          p_action_type: "downloaded",
        });
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const isPdf = document?.mime_type?.startsWith("application/pdf") || false;

  const handleOpenChange = (open: boolean) => {
    if (open === false) onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Preview
            </SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 cursor-pointer"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <SheetDescription>
            View and download document details
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {!document ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileText className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a document to view details</p>
            </div>
          ) : (
            <>
              {/* Document Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">File Name</h3>
                  <p className="text-base font-medium">{document.file_name}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">MIME Type</h3>
                  <p className="text-sm">{document.mime_type || "Unknown"}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Created At</h3>
                  <p className="text-sm">{format(new Date(document.created_at), "MMM dd, yyyy HH:mm")}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Status</h3>
                  <Badge variant={document.status === "reviewed" ? "default" : "secondary"}>
                    {document.status}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-3">
                {isPdf ? (
                  <>
                    <Button
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        handleView(); 
                      }}
                      disabled={!document}
                      className="w-full"
                      variant="default"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <Button
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        handleDownload(); 
                      }}
                      disabled={!document}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-3">
                      Preview not available for this file type.
                    </p>
                    <Button
                      onClick={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        handleDownload(); 
                      }}
                      disabled={!document}
                      className="w-full"
                      variant="default"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </>
                )}
              </div>

              <Separator />

              {/* Case Information */}
              {caseInfo && (
                <>
                  <div>
                    <h3 className="font-semibold mb-3">Case Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Case ID:</span>
                        <span className="font-mono">{caseInfo.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">{caseInfo.status}</Badge>
                      </div>
                      {caseInfo.client_label && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Client:</span>
                          <span>{caseInfo.client_label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="drawer-note" className="text-base font-semibold">
                  Notes
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Changes will sync to case notes automatically
                </p>
                <Textarea
                  id="drawer-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add notes about this document..."
                  rows={4}
                  className="mb-3"
                />
                <Button onClick={handleSaveNote} disabled={saving || note === document.note}>
                  {saving ? "Saving..." : "Save Note"}
                </Button>
              </div>

              <Separator />

              {/* Activity History */}
              <div>
                <h3 className="font-semibold mb-3">Activity History</h3>
                <ScrollArea className="h-64">
                  {activityLogs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity recorded</p>
                  ) : (
                    <div className="space-y-3">
                      {activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex gap-3 text-sm border-l-2 border-border pl-3"
                        >
                          <div className="flex-shrink-0 mt-1">
                            {log.action_type === "viewed" && <Eye className="w-4 h-4 text-blue-500" />}
                            {log.action_type === "downloaded" && <Download className="w-4 h-4 text-green-500" />}
                            {log.action_type === "marked_sensitive" && <FileText className="w-4 h-4 text-red-500" />}
                            {log.action_type === "shared" && <User className="w-4 h-4 text-purple-500" />}
                            {!["viewed", "downloaded", "marked_sensitive", "shared"].includes(log.action_type) && (
                              <Clock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {log.action_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                            </div>
                            <div className="text-muted-foreground">
                              {log.performed_by_name} ({log.performed_by_role})
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
