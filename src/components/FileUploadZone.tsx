import { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';

interface FileUpload {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  progress: number;
  path?: string;
}

interface FileUploadZoneProps {
  onFilesUploaded?: (files: { id: string; path: string; name: string }[]) => void;
  draftId?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function FileUploadZone({ 
  onFilesUploaded,
  draftId,
  maxSizeMB = 15,
  allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png']
}: FileUploadZoneProps) {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (upload: FileUpload) => {
    const { file } = upload;
    const filePath = `intake-docs/${Date.now()}-${file.name}`;

    try {
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'uploading' as const, progress: 0 } : u
      ));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Track upload in database
      const { error: dbError } = await supabase
        .from('intake_uploads')
        .insert({
          intake_draft_id: draftId || null,
          uploaded_by: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'complete',
        });

      if (dbError) throw dbError;

      setUploads(prev => prev.map(u => 
        u.id === upload.id 
          ? { ...u, status: 'complete' as const, progress: 100, path: filePath } 
          : u
      ));

      return { id: upload.id, path: filePath, name: file.name };
    } catch (error) {
      console.error('Upload failed:', error);
      setUploads(prev => prev.map(u => 
        u.id === upload.id ? { ...u, status: 'error' as const } : u
      ));
      throw error;
    }
  };

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const maxBytes = maxSizeMB * 1024 * 1024;
    
    const validFiles = fileArray.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(extension)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (file.size > maxBytes) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizeMB}MB limit.`,
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) return;

    const newUploads: FileUpload[] = validFiles.map(file => ({
      id: Date.now().toString() + Math.random(),
      file,
      status: 'pending',
      progress: 0,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files sequentially
    const uploadedFiles = [];
    for (const upload of newUploads) {
      try {
        const result = await uploadFile(upload);
        uploadedFiles.push(result);
      } catch (error) {
        // Error already handled in uploadFile
      }
    }

    if (uploadedFiles.length > 0 && onFilesUploaded) {
      onFilesUploaded(uploadedFiles);
    }
  }, [maxSizeMB, allowedTypes, onFilesUploaded, draftId, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-3 block">Upload Documents (Optional)</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-primary bg-accent' 
                : 'border-border hover:border-primary'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="mb-2 font-medium">Drag & drop files here, or</p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept={allowedTypes.join(',')}
              onChange={handleFileInput}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Choose Files
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              Allowed: {allowedTypes.join(', ')} • Max {maxSizeMB}MB each
            </p>
          </div>
        </CardContent>
      </Card>

      {uploads.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <File className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{upload.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(upload.file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {upload.status === 'complete' && (
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    )}
                    {upload.status === 'uploading' && (
                      <div className="text-sm text-muted-foreground flex-shrink-0">
                        Uploading...
                      </div>
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUpload(upload.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
