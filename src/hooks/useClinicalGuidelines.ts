import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ClinicalGuideline {
  id: string;
  guideline_source: string;
  diagnosis_code: string;
  diagnosis_name: string;
  treatment_category: string;
  evidence_level: string | null;
  guideline_summary: string | null;
  guideline_title: string;
  created_at: string | null;
}

export function useClinicalGuidelines() {
  const [guidelines, setGuidelines] = useState<ClinicalGuideline[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGuidelines();

    const channel = supabase
      .channel("clinical-guidelines")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clinical_guidelines",
        },
        () => {
          fetchGuidelines();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGuidelines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clinical_guidelines")
        .select("*")
        .order("created_at", { ascending: false});

      if (error) throw error;
      setGuidelines(data || []);
    } catch (error) {
      console.error("Error fetching guidelines:", error);
      toast.error("Failed to load guidelines");
    } finally {
      setLoading(false);
    }
  };

  return { guidelines, loading, refreshGuidelines: fetchGuidelines };
}
