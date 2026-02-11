import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import type { Json } from "@/integrations/supabase/types";

interface WorkflowStep {
  step: number;
  name: string;
  duration_days: number;
}

interface CareWorkflow {
  id: string;
  template_name: string;
  workflow_type: string;
  estimated_duration_days: number | null;
  steps: Json;
  is_active: boolean | null;
  is_system_template: boolean | null;
  created_at: string | null;
}

export function useCareWorkflows() {
  const [workflows, setWorkflows] = useState<CareWorkflow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWorkflows();

    const channel = supabase
      .channel("care-workflows")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "care_workflow_templates",
        },
        () => {
          fetchWorkflows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("care_workflow_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  return { workflows, loading, refreshWorkflows: fetchWorkflows };
}
