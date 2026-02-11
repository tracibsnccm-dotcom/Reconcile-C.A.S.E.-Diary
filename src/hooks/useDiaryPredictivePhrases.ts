import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PredictivePhrase {
  id: string;
  phrase_text: string;
  context_category: string;
  usage_count: number;
  last_used_at: string;
}

export function useDiaryPredictivePhrases(contextCategory?: string) {
  const [phrases, setPhrases] = useState<PredictivePhrase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPhrases = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
          .from("rn_predictive_phrases" as any)
          .select("*")
          .eq("rn_id", user.id)
          .order("usage_count", { ascending: false })
          .limit(10);

        if (contextCategory) {
          query = query.eq("context_category", contextCategory);
        }

        const { data, error } = await query;

        if (error) throw error;
        setPhrases((data || []) as unknown as PredictivePhrase[]);
      } catch (error) {
        console.error("Error fetching predictive phrases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhrases();
  }, [contextCategory]);

  const recordPhraseUsage = async (phraseText: string, category: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.rpc("increment_phrase_usage" as any, {
        p_rn_id: user.id,
        p_phrase: phraseText,
        p_category: category,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error recording phrase usage:", error);
    }
  };

  return { phrases, loading, recordPhraseUsage };
}
