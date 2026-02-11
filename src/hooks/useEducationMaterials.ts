import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EducationMaterial {
  id: string;
  title: string;
  description?: string | null;
  material_type: string;
  category: string;
  file_url?: string | null;
  diagnosis_tags?: string[] | null;
  duration_minutes?: number | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useEducationMaterials() {
  const [materials, setMaterials] = useState<EducationMaterial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMaterials();

    const channel = supabase
      .channel("education-materials")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "education_materials",
        },
        () => {
          fetchMaterials();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("education_materials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error("Error fetching materials:", error);
      toast.error("Failed to load education materials");
    } finally {
      setLoading(false);
    }
  };

  const createMaterial = async (material: { title: string; category: string; material_type: string; description?: string; file_url?: string; duration_minutes?: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("education_materials")
        .insert([{ ...material, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;
      toast.success("Material added successfully");
      return data;
    } catch (error) {
      console.error("Error creating material:", error);
      toast.error("Failed to add material");
      return null;
    }
  };

  const deleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from("education_materials")
        .delete()
        .eq("id", materialId);

      if (error) throw error;
      toast.success("Material deleted successfully");
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
    }
  };

  return { materials, loading, createMaterial, deleteMaterial, refreshMaterials: fetchMaterials };
}
