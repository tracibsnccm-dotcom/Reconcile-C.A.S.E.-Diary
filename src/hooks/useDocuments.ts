import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

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
  category: string;
  is_sensitive: boolean;
  note: string | null;
}

export function useDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchDocuments();

    // Set up realtime subscription
    const channel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function fetchDocuments() {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(documentId: string) {
    if (!user) return;

    try {
      // Get current document
      const doc = documents.find(d => d.id === documentId);
      if (!doc || doc.read_by.includes(user.id)) return;

      // Update read_by array
      const { error } = await supabase
        .from("documents")
        .update({
          read_by: [...doc.read_by, user.id],
          status: "reviewed",
        })
        .eq("id", documentId);

      if (error) throw error;

      // Optimistically update local state
      setDocuments(prev => prev.map(d => 
        d.id === documentId
          ? { ...d, read_by: [...d.read_by, user.id], status: "reviewed" }
          : d
      ));
    } catch (error) {
      console.error("Error marking document as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark document as read",
        variant: "destructive",
      });
    }
  }

  return {
    documents,
    loading,
    markAsRead,
    refetch: fetchDocuments,
  };
}
