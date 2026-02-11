/**
 * useRNCaseEditMode
 *
 * RN-only: Computes draft vs released vs closed mode from existing case state.
 * No DB schema changes. Uses: rc_cases.case_status, getCurrentDraftInChain.
 *
 * mode = "draft"   -> current editable draft
 * mode = "released" -> viewing a released snapshot (view-only)
 * mode = "closed"   -> closed case (view-only, same guardrails as released)
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentDraftInChain } from "@/lib/rnCaseHelpers";

export type RNCaseEditMode = "draft" | "released" | "closed";

export interface UseRNCaseEditModeResult {
  mode: RNCaseEditMode;
  isViewOnly: boolean;
  caseStatus: string | null;
  backToDraftId: string | null;
  loading: boolean;
  error: string | null;
}

export function useRNCaseEditMode(caseId: string | null): UseRNCaseEditModeResult {
  const [mode, setMode] = useState<RNCaseEditMode>("draft");
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const [backToDraftId, setBackToDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!caseId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setMode("draft");
      setCaseStatus(null);
      setBackToDraftId(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from("rc_cases")
          .select("id, case_status")
          .eq("id", caseId)
          .eq("is_superseded", false)
          .maybeSingle();

        if (cancelled) return;
        if (fetchErr) {
          setError(fetchErr.message);
          setMode("draft");
          setCaseStatus(null);
          setBackToDraftId(null);
          setLoading(false);
          return;
        }

        const status = (data?.case_status ?? "").toLowerCase();
        setCaseStatus(data?.case_status ?? null);

        if (status === "closed") {
          setMode("closed");
          const draftId = await getCurrentDraftInChain(caseId);
          if (!cancelled) setBackToDraftId(draftId);
        } else if (status === "released") {
          setMode("released");
          const draftId = await getCurrentDraftInChain(caseId);
          if (!cancelled) setBackToDraftId(draftId);
        } else {
          setMode("draft");
          setBackToDraftId(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
          setMode("draft");
          setCaseStatus(null);
          setBackToDraftId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const isViewOnly = mode !== "draft";

  return {
    mode,
    isViewOnly,
    caseStatus,
    backToDraftId,
    loading,
    error,
  };
}
