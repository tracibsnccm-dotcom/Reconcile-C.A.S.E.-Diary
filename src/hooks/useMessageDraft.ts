import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { toast } from "@/hooks/use-toast";

export function useMessageDraft(context: string, caseId?: string) {
  const [draft, setDraft] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const saveTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    const fetchDraft = async () => {
      const { data, error } = await supabase
        .from("message_drafts")
        .select("draft_content")
        .eq("user_id", user.id)
        .eq("context", context)
        .eq("case_id", caseId || null)
        .single();

      if (data && !error) {
        setDraft(data.draft_content);
        setHasDraft(true);
        toast({
          title: "Draft restored",
          description: "Your previous message draft has been restored",
        });
      }
      setLoading(false);
    };

    fetchDraft();
  }, [user, context, caseId]);

  const saveDraft = useCallback(
    async (content: string) => {
      if (!user || !content.trim()) return;

      const { error } = await supabase.from("message_drafts").upsert(
        {
          user_id: user.id,
          case_id: caseId || null,
          context,
          draft_content: content,
        },
        { onConflict: "user_id,case_id,context" }
      );

      if (error) {
        console.error("Error saving draft:", error);
      }
    },
    [user, context, caseId]
  );

  const updateDraft = useCallback(
    (content: string) => {
      setDraft(content);
      setHasDraft(true);

      // Auto-save after 3 seconds of inactivity
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        saveDraft(content);
      }, 3000);
    },
    [saveDraft]
  );

  const clearDraft = useCallback(async () => {
    if (!user) return;

    setDraft("");
    setHasDraft(false);

    const { error } = await supabase
      .from("message_drafts")
      .delete()
      .eq("user_id", user.id)
      .eq("context", context)
      .eq("case_id", caseId || null);

    if (error) {
      console.error("Error clearing draft:", error);
    }
  }, [user, context, caseId]);

  const saveNow = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    if (draft.trim()) {
      saveDraft(draft);
    }
  }, [draft, saveDraft]);

  return {
    draft,
    hasDraft,
    loading,
    updateDraft,
    clearDraft,
    saveNow,
  };
}