/**
 * RN-only: Local acknowledgement store (sessionStorage). NO DB.
 * Key: rc_rn_case_ack:<rnUserId>
 * Value: JSON object mapping caseId -> ISO timestamp
 * Not authoritative; UX "receipt acknowledged" indicator only.
 */

const ACK_KEY_PREFIX = "rc_rn_case_ack:";

function ackKey(rnUserId: string): string {
  return `${ACK_KEY_PREFIX}${rnUserId}`;
}

/**
 * Check if a case has been acknowledged by this RN (locally).
 */
export function isAcknowledged(rnUserId: string, caseId: string): boolean {
  if (!rnUserId || !caseId) return false;
  try {
    const raw = sessionStorage.getItem(ackKey(rnUserId));
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, string>;
    return typeof map[caseId] === "string";
  } catch {
    return false;
  }
}

/**
 * Get acknowledgement timestamp for a case, or null.
 */
export function getAcknowledgedAt(rnUserId: string, caseId: string): string | null {
  if (!rnUserId || !caseId) return null;
  try {
    const raw = sessionStorage.getItem(ackKey(rnUserId));
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    const ts = map[caseId];
    return typeof ts === "string" ? ts : null;
  } catch {
    return null;
  }
}

/**
 * Store acknowledgement for a case. Overwrites if already set.
 */
export function acknowledgeCase(rnUserId: string, caseId: string): void {
  if (!rnUserId || !caseId) return;
  try {
    const key = ackKey(rnUserId);
    const raw = sessionStorage.getItem(key);
    const map: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[caseId] = new Date().toISOString();
    sessionStorage.setItem(key, JSON.stringify(map));
  } catch {
    // ignore (e.g. private mode, quota)
  }
}
