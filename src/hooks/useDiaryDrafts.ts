import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DiaryDraft {
  id: string;
  rn_id: string;
  draft_data: any;
  created_at: string;
  updated_at: string;
}

export function useDiaryDrafts() {
  const [draft, setDraft] = useState<DiaryDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);

  useEffect(() => {
    const fetchDraft = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("rn_entry_drafts" as any)
          .select("*")
          .eq("rn_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setDraft(data as unknown as DiaryDraft | null);
      } catch (error) {
        console.error("Error fetching draft:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDraft();
  }, []);

  const saveDraft = async (draftData: any) => {
    setAutoSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("rn_entry_drafts" as any)
        .upsert({
          rn_id: user.id,
          draft_data: draftData,
        })
        .select()
        .single();

      if (error) throw error;
      setDraft(data as unknown as DiaryDraft);
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setAutoSaving(false);
    }
  };

  const clearDraft = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("rn_entry_drafts" as any)
        .delete()
        .eq("rn_id", user.id);

      if (error) throw error;
      setDraft(null);
    } catch (error) {
      console.error("Error clearing draft:", error);
      toast.error("Failed to clear draft");
    }
  };

  const restoreDraft = () => {
    if (draft) {
      toast.success("Draft restored");
      return draft.draft_data;
    }
    return null;
  };

  return { draft, loading, autoSaving, saveDraft, clearDraft, restoreDraft };
}
