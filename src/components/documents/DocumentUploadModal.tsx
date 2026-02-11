import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: Array<{ id: string }>;
  onUploadComplete: () => void;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  cases,
  onUploadComplete,
}: DocumentUploadModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCase, setSelectedCase] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [customDocumentType, setCustomDocumentType] = useState("");
  const [category, setCategory] = useState("Other");
  const [note, setNote] = useState("");
  const [requiresAttention, setRequiresAttention] = useState(false);
  const [mirrorToCase, setMirrorToCase] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Generate structured filename: CASE-{caseId}_{date}_{docType}
  const buildFileName = (caseId: string, docType: string, originalName: string) => {
    const date = new Date();
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const base = (docType || originalName.replace(/\.[^.]+$/, '')).replace(/\s+/g, '_').slice(0, 40);
    return `CASE-${caseId}_${dateStr}_${base}`.replace(/[^A-Za-z0-9_\-\.]/g, '');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedCase || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (documentType === "Other" && !customDocumentType.trim()) {
      toast({
        title: "Missing Information",
        description: "Please specify the document type",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const user = await supabase.auth.getUser();
      const finalDocType = documentType === "Other" ? customDocumentType : documentType;
      
      // Generate structured filename
      const fileExt = selectedFile.name.split('.').pop();
      const structuredName = buildFileName(selectedCase, finalDocType, selectedFile.name);
      const filePath = `${selectedCase}/${structuredName}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: dbError } = await supabase.from("documents").insert({
        case_id: selectedCase,
        file_name: selectedFile.name,
        file_path: filePath,
        document_type: finalDocType,
        category: category,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        uploaded_by: user.data.user?.id,
        requires_attention: requiresAttention,
        mirror_to_case_notes: mirrorToCase,
        note: note.trim() || null,
        status: 'pending',
      }).select().single();

      if (dbError) throw dbError;

      // Create case note if note text is provided and mirroring is enabled
      if (note.trim() && docData && mirrorToCase) {
        await supabase.from("case_notes").insert({
          case_id: selectedCase,
          note_text: `📎 Document added: ${selectedFile.name}\n${note}`,
          created_by: user.data.user?.id,
          visibility: 'private'
        });
      }
      
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded successfully`,
      });
      
      onUploadComplete();
      handleClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setSelectedCase("");
    setDocumentType("");
    setCustomDocumentType("");
    setCategory("Other");
    setNote("");
    setRequiresAttention(false);
    setMirrorToCase(true);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Upload New Document</span>
            <Button size="sm" variant="ghost" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="file-upload">Select File</Label>
            <div className="mt-2">
              <label
                htmlFor="file-upload"
                className="flex items-center justify-center w-full h-32 px-4 transition border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 border-border bg-muted/30"
              >
                <div className="space-y-2 text-center">
                  {selectedFile ? (
                    <>
                      <FileText className="w-8 h-8 mx-auto text-primary" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                    </>
                  )}
                </div>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="case-select">Select Case *</Label>
            <Select value={selectedCase} onValueChange={setSelectedCase}>
              <SelectTrigger id="case-select" className="mt-2">
                <SelectValue placeholder="Choose a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.slice(0, 20).map((caseItem) => (
                  <SelectItem key={caseItem.id} value={caseItem.id}>
                    {caseItem.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doc-type">Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="doc-type" className="mt-2">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Clinical Report">Clinical Report</SelectItem>
                <SelectItem value="Legal Filing">Legal Filing</SelectItem>
                <SelectItem value="Client Form">Client Form</SelectItem>
                <SelectItem value="Provider Note">Provider Note</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {documentType === "Other" && (
            <div>
              <Label htmlFor="custom-type">Specify Document Type *</Label>
              <Input
                id="custom-type"
                type="text"
                placeholder="Enter custom document type (e.g., Insurance Form, Medical Record)"
                value={customDocumentType}
                onChange={(e) => setCustomDocumentType(e.target.value)}
                maxLength={100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customDocumentType.length}/100 characters
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="doc-category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="doc-category" className="mt-2">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Medical">⚕️ Medical</SelectItem>
                <SelectItem value="Legal">⚖️ Legal</SelectItem>
                <SelectItem value="Financial">💰 Financial</SelectItem>
                <SelectItem value="Communication">💬 Communication</SelectItem>
                <SelectItem value="Other">📋 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="doc-note">Note (optional)</Label>
            <Textarea
              id="doc-note"
              placeholder="Add context for this document..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mirror-to-case"
                checked={mirrorToCase}
                onCheckedChange={(checked) => setMirrorToCase(checked as boolean)}
              />
              <Label
                htmlFor="mirror-to-case"
                className="text-sm font-normal cursor-pointer"
              >
                Mirror note to case notes (recommended)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires-attention"
                checked={requiresAttention}
                onCheckedChange={(checked) => setRequiresAttention(checked as boolean)}
              />
              <Label
                htmlFor="requires-attention"
                className="text-sm font-normal cursor-pointer"
              >
                Mark as requiring immediate attention
              </Label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={
              !selectedFile || 
              !selectedCase || 
              !documentType || 
              (documentType === "Other" && !customDocumentType.trim()) ||
              uploading
            }
            className="bg-[#b09837] text-black hover:bg-black hover:text-[#b09837]"
          >
            {uploading ? (
              "Uploading..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
