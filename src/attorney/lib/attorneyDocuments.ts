/**
 * Attorney case documents helper.
 * Lists documents for a case from rc_documents; falls back to storage if table
 * is missing. Missing table/bucket are treated as empty—no throws, no console spam.
 */

import { supabase } from "@/integrations/supabase/client";
import { isOptionalTableError } from "@/lib/optionalTableUtils";

export interface CaseDocument {
  id: string;
  name: string;
  url: string | null;
  created_at: string | null;
  source: "rc_documents" | "storage";
  file_type?: string | null;
  storage_path?: string | null;
}

const BUCKET_RCMS = "rcms-documents";
const BUCKET_CASE = "case-documents";

/**
 * List documents for a case. Uses rc_documents first; if that table is missing
 * or unavailable, tries case-documents storage with prefix {caseId}/.
 * Missing table or bucket → empty array. Auth/network errors → empty (friendly;
 * caller shows empty state, not red error).
 */
export async function listCaseDocuments(caseId: string): Promise<CaseDocument[]> {
  if (!caseId || typeof caseId !== "string") return [];

  // 1) Try rc_documents
  try {
    const { data, error } = await supabase
      .from("rc_documents")
      .select("id, case_id, file_name, file_type, storage_path, created_at, uploaded_by")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false });

    if (error) {
      if (isOptionalTableError(error)) {
        return await tryStorageFallback(caseId);
      }
      return [];
    }

    const rows = (data ?? []) as Array<{
      id: string;
      file_name: string | null;
      file_type?: string | null;
      storage_path?: string | null;
      created_at: string | null;
    }>;

    return rows.map((r) => ({
      id: r.id,
      name: r.file_name || "Unnamed file",
      url: null,
      created_at: r.created_at ?? null,
      source: "rc_documents" as const,
      file_type: r.file_type ?? null,
      storage_path: r.storage_path ?? null,
    }));
  } catch {
    return await tryStorageFallback(caseId);
  }
}

async function tryStorageFallback(caseId: string): Promise<CaseDocument[]> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_CASE)
      .list(caseId, { limit: 200 });

    if (error) return [];
    const items = (data ?? []) as Array<{ name: string; id?: string; created_at?: string }>;
    return items
      .filter((o) => o.name && !o.name.endsWith("/"))
      .map((o) => ({
        id: o.id || `storage-${o.name}`,
        name: o.name,
        url: null,
        created_at: o.created_at ?? null,
        source: "storage" as const,
        file_type: null,
        storage_path: `${caseId}/${o.name}`,
      }));
  } catch {
    return [];
  }
}

/**
 * Get a signed URL for viewing/downloading. Prefer rcms-documents if
 * storage_path looks like a key; otherwise try case-documents with
 * prefix {caseId}/. Returns null on any error (no throw, no spam).
 */
export async function getDocumentUrl(
  doc: CaseDocument,
  caseId: string,
  expiresSeconds = 60 * 15
): Promise<string | null> {
  const path = doc.storage_path;
  const bucket = doc.source === "storage" ? BUCKET_CASE : BUCKET_RCMS;
  const p = path || (doc.source === "storage" ? `${caseId}/${doc.name}` : null);
  if (!p) return null;

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(p, expiresSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
