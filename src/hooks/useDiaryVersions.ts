import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EntryVersion {
  id: string;
  entry_id: string;
  version_number: number;
  changed_fields: Record<string, any>;
  changed_by: string;
  created_at: string;
}

export function useDiaryVersions(entryId: string | undefined) {
  const [versions, setVersions] = useState<EntryVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entryId) return;

    const fetchVersions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rn_entry_versions" as any)
          .select("*")
          .eq("entry_id", entryId)
          .order("version_number", { ascending: false });

        if (error) throw error;
        setVersions((data || []) as unknown as EntryVersion[]);
      } catch (error) {
        console.error("Error fetching versions:", error);
        toast.error("Failed to load version history");
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [entryId]);

  const restoreVersion = async (versionId: string, changedFields: Record<string, any>) => {
    if (!entryId) return;

    try {
      const { error } = await supabase
        .from("rn_diary_entries")
        .update(changedFields)
        .eq("id", entryId);

      if (error) throw error;
      toast.success("Version restored successfully");
      return true;
    } catch (error) {
      console.error("Error restoring version:", error);
      toast.error("Failed to restore version");
      return false;
    }
  };

  return { versions, loading, restoreVersion };
}
