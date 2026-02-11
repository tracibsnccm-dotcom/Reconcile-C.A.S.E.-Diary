/**
 * RN-only: Last Active Case shortcut (sessionStorage, UUID-safe).
 * Assistive UX only; not tracking/audit. No DB. No "unknown" key.
 */

import { useState, useCallback, useEffect } from "react";

export type LastActiveCase = {
  case_id: string;
  case_label: string;
  last_route?: string;
  updated_at: string;
};

export const lastActiveKey = (rnUserId: string) =>
  `rc_rn_last_active_case:${rnUserId}`;

/**
 * Write last active case. No-op if rnUserId is missing, "unknown", or falsy.
 * Storage can fail (private mode, etc.); errors are swallowed.
 */
export function setLastActiveCase(
  rnUserId: string,
  data: { case_id: string; case_label: string; last_route?: string }
): void {
  if (!rnUserId || rnUserId === "unknown") return;
  try {
    const payload: LastActiveCase = {
      ...data,
      updated_at: new Date().toISOString(),
    };
    sessionStorage.setItem(lastActiveKey(rnUserId), JSON.stringify(payload));
  } catch {
    // ignore (e.g. private mode, quota)
  }
}

/**
 * Read last active case. Returns null if missing or invalid.
 */
export function getLastActiveCase(rnUserId: string): LastActiveCase | null {
  if (!rnUserId || rnUserId === "unknown") return null;
  try {
    const raw = sessionStorage.getItem(lastActiveKey(rnUserId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as LastActiveCase).case_id === "string" &&
      typeof (parsed as LastActiveCase).case_label === "string" &&
      typeof (parsed as LastActiveCase).updated_at === "string"
    ) {
      return parsed as LastActiveCase;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clear last active case. No-op if rnUserId missing or "unknown".
 */
export function clearLastActiveCase(rnUserId: string): void {
  if (!rnUserId || rnUserId === "unknown") return;
  try {
    sessionStorage.removeItem(lastActiveKey(rnUserId));
  } catch {
    // ignore
  }
}

/**
 * Hook: { lastActive, refresh, clear }.
 * Re-checks on mount and when rnUserId changes. Does not listen to storage events (sessionStorage is per-tab).
 */
export function useLastActiveCase(rnUserId?: string | null): {
  lastActive: LastActiveCase | null;
  refresh: () => void;
  clear: () => void;
} {
  const read = useCallback((): LastActiveCase | null => {
    return rnUserId ? getLastActiveCase(rnUserId) : null;
  }, [rnUserId]);

  const [lastActive, setLastActive] = useState<LastActiveCase | null>(read);

  const refresh = useCallback(() => {
    setLastActive(read);
  }, [read]);

  const clear = useCallback(() => {
    if (rnUserId) clearLastActiveCase(rnUserId);
    setLastActive(null);
  }, [rnUserId]);

  useEffect(() => {
    setLastActive(read());
  }, [read]);

  return { lastActive, refresh, clear };
}
