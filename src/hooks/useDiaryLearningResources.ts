import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LearningResource {
  id: string;
  title: string;
  description?: string;
  resource_type: string;
  resource_url?: string;
  category: string;
  tags?: string[];
  created_by: string;
  is_favorite: boolean;
  created_at: string;
}

export function useDiaryLearningResources() {
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rn_learning_resources" as any)
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setResources((data || []) as unknown as LearningResource[]);
      } catch (error) {
        console.error("Error fetching learning resources:", error);
        toast.error("Failed to load learning resources");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();

    const channel = supabase
      .channel("learning-resources")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rn_learning_resources",
        },
        () => {
          fetchResources();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const createResource = async (resource: Partial<LearningResource>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rn_learning_resources" as any)
        .insert({ ...resource, created_by: user.id })
        .select()
        .single();

      if (error) throw error;

      toast.success("Resource added successfully");
      return data;
    } catch (error) {
      console.error("Error creating resource:", error);
      toast.error("Failed to add resource");
      return null;
    }
  };

  const toggleFavorite = async (resourceId: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from("rn_learning_resources" as any)
        .update({ is_favorite: !isFavorite })
        .eq("id", resourceId);

      if (error) throw error;
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite");
    }
  };

  const deleteResource = async (resourceId: string) => {
    try {
      const { error } = await supabase
        .from("rn_learning_resources" as any)
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      toast.success("Resource deleted successfully");
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast.error("Failed to delete resource");
    }
  };

  return { resources, loading, createResource, toggleFavorite, deleteResource };
}
