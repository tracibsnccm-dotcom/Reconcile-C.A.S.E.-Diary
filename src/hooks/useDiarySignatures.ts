import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Signature {
  id: string;
  entry_id: string;
  signature_data: string;
  signer_role: string;
  signed_at: string;
  signed_by: string;
}

export function useDiarySignatures(entryId: string | undefined) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entryId) return;

    const fetchSignatures = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("rn_entry_signatures" as any)
          .select("*")
          .eq("entry_id", entryId)
          .order("signed_at", { ascending: false });

        if (error) throw error;
        setSignatures((data || []) as unknown as Signature[]);
      } catch (error) {
        console.error("Error fetching signatures:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSignatures();
  }, [entryId]);

  const saveSignature = async (signatureData: string, signerRole: string) => {
    if (!entryId) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("rn_entry_signatures" as any)
        .insert({
          entry_id: entryId,
          signature_data: signatureData,
          signer_role: signerRole,
          signed_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setSignatures([data as unknown as Signature, ...signatures]);
      toast.success("Signature saved successfully");
      return data;
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Failed to save signature");
      return null;
    }
  };

  return { signatures, loading, saveSignature };
}
