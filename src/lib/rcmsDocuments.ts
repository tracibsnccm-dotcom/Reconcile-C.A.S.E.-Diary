// src/lib/rcmsDocuments.ts
import { supabase } from "@/integrations/supabase/client";

function makeObjectPath(caseId: string, fileName: string) {
  const safeName = fileName.replace(/\s+/g, "_");
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `case/${caseId}/${id}-${safeName}`;
}

export async function uploadCaseDocument(
  caseId: string,
  uploadedByUserId: string,
  file: File
) {
  const objectPath = makeObjectPath(caseId, file.name);

  // 1) upload to storage
  const { error: uploadError } = await supabase.storage
    .from("rcms-documents")
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error("upload error", uploadError);
    throw uploadError;
  }

  // 2) insert metadata row
  const { data, error: insertError } = await supabase
    .from("rc_documents")
    .insert({
      case_id: caseId,
      uploaded_by: uploadedByUserId,
      storage_object_path: objectPath,
      file_name: file.name,
      mime_type: file.type || null,
      file_size_bytes: file.size,
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("insert error", insertError);
    throw insertError;
  }

  return data;
}
