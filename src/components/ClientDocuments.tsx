import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Document {
  id: string;
  file_name: string;
  file_path: string;
  document_type: string;
  file_size: number | null;
  created_at: string;
}

interface ClientDocumentsProps {
  caseId: string;
}

export function ClientDocuments({ caseId }: ClientDocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [caseId]);

  async function fetchDocuments() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const user = await supabase.auth.getUser();
      const filePath = `${caseId}/${Date.now()}_${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase.from("documents").insert({
        case_id: caseId,
        file_name: file.name,
        file_path: filePath,
        document_type: "client_upload",
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.data.user?.id,
      });

      if (dbError) throw dbError;

      toast.success("File uploaded successfully");
      fetchDocuments();
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDownload(doc: Document) {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Download error:", err);
      toast.error("Failed to download file");
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Card className="p-6 border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Documents & Files
        </h2>
        <label htmlFor="file-upload">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            className="border-primary/30 cursor-pointer"
            asChild
          >
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload File"}
            </span>
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)} • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(doc)}
                className="flex-shrink-0"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
