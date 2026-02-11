// src/lib/rcmsDownload.ts
import { supabase } from "@/integrations/supabase/client";

export async function getSignedDocumentUrl(docId: string) {
  const { data, error } = await supabase.rpc("rc_get_document_signed_url", {
    doc_id: docId,
  });

  if (error) {
    console.error("signed URL error", error);
    throw error;
  }

  return data; // should be a string URL
}

