import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Attachment {
  id: string;
  entry_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

export function useDiaryAttachments(entryId: string | undefined) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!entryId) return;

    const fetchAttachments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rn_entry_attachments" as any)
          .select("*")
          .eq("entry_id", entryId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAttachments((data || []) as unknown as Attachment[]);
      } catch (error) {
        console.error("Error fetching attachments:", error);
        toast.error("Failed to load attachments");
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();

    const channel = supabase
      .channel(`attachments:${entryId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rn_entry_attachments",
          filter: `entry_id=eq.${entryId}`,
        },
        () => {
          fetchAttachments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entryId]);

  const uploadAttachment = async (file: File) => {
    if (!entryId) return null;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${entryId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("diary-attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("rn_entry_attachments" as any)
        .insert({
          entry_id: entryId,
          file_name: file.name,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("File uploaded successfully");
      return data;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from("diary-attachments")
        .download(attachment.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.file_name;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("File downloaded");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const deleteAttachment = async (attachmentId: string, filePath: string) => {
    try {
      await supabase.storage.from("diary-attachments").remove([filePath]);

      const { error } = await supabase
        .from("rn_entry_attachments" as any)
        .delete()
        .eq("id", attachmentId);

      if (error) throw error;

      toast.success("Attachment deleted");
    } catch (error) {
      console.error("Error deleting attachment:", error);
      toast.error("Failed to delete attachment");
    }
  };

  return {
    attachments,
    loading,
    uploading,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment,
  };
}
