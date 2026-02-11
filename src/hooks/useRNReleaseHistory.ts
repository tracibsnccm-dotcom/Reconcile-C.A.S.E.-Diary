/**
 * useRNReleaseHistory
 *
 * RN-only: Fetches release history (released/closed snapshots in chain) for the current case.
 * Uses getReleasedHistoryForChain from rnCaseHelpers. No DB schema changes.
 */

import { useState, useEffect, useCallback } from "react";
import { getReleasedHistoryForChain, type ReleaseHistoryItem } from "@/lib/rnCaseHelpers";

export interface UseRNReleaseHistoryResult {
  items: ReleaseHistoryItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRNReleaseHistory(caseId: string | null | undefined): UseRNReleaseHistoryResult {
  const [items, setItems] = useState<ReleaseHistoryItem[]>([]);
  const [loading, setLoading] = useState(!!caseId);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!caseId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await getReleasedHistoryForChain(caseId);
      setItems(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { items, loading, error, refetch: fetchHistory };
}
