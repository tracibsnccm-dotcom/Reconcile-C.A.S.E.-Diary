/**
 * Attorney Case Notes — localStorage storage layer
 * Key pattern: rcms:attorneyCaseNotes:v1:${attorneyKey}:${caseId}
 * Legacy (migrated): rcms:attorneyCaseNotes:v1:${caseId}
 *
 * All storage access guarded for SSR (typeof window !== "undefined").
 */

export interface AttorneyCaseNote {
  id: string;
  content: string;
  createdAt: string;
}

const PREFIX = "rcms:attorneyCaseNotes:v1";

export function getNotesKey(caseId: string, attorneyKey: string): string {
  return `${PREFIX}:${attorneyKey}:${caseId}`;
}

export function getLegacyNotesKey(caseId: string): string {
  return `${PREFIX}:${caseId}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (raw == null || raw === "") return fallback;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as { notes?: unknown }).notes)) {
      return (parsed as { notes: T }).notes;
    }
    if (Array.isArray(parsed)) return parsed as T;
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Load notes for a case. Performs one-time migration from legacy per-case key
 * if the new per-attorney key is empty and legacy has data. Legacy key is left intact.
 */
export function loadNotes(caseId: string, attorneyKey: string): AttorneyCaseNote[] {
  if (typeof window === "undefined") return [];
  const key = getNotesKey(caseId, attorneyKey);
  const legacyKey = getLegacyNotesKey(caseId);

  const raw = localStorage.getItem(key);
  const parsed = safeParse<AttorneyCaseNote[]>(raw, []);
  if (parsed.length > 0) return parsed;

  const legacyRaw = localStorage.getItem(legacyKey);
  const legacyParsed = safeParse<AttorneyCaseNote[]>(legacyRaw, []);
  if (legacyParsed.length > 0) {
    const payload = JSON.stringify({ notes: legacyParsed });
    try {
      localStorage.setItem(key, payload);
    } catch (e) {
      console.warn("[caseNotesStorage] Migration copy failed:", e);
    }
    return legacyParsed;
  }
  return [];
}

/**
 * Persist notes. SSR-safe.
 */
export function saveNotes(
  caseId: string,
  attorneyKey: string,
  notes: AttorneyCaseNote[]
): void {
  if (typeof window === "undefined") return;
  const key = getNotesKey(caseId, attorneyKey);
  try {
    localStorage.setItem(key, JSON.stringify({ notes }));
  } catch (e) {
    console.warn("[caseNotesStorage] saveNotes failed:", e);
  }
}

/**
 * Upsert a note by id; if id not found, append. SSR-safe.
 */
export function upsertNote(
  caseId: string,
  attorneyKey: string,
  note: AttorneyCaseNote
): AttorneyCaseNote[] {
  if (typeof window === "undefined") return [];
  const current = loadNotes(caseId, attorneyKey);
  const idx = current.findIndex((n) => n.id === note.id);
  const next =
    idx >= 0
      ? current.map((n, i) => (i === idx ? note : n))
      : [...current, note];
  saveNotes(caseId, attorneyKey, next);
  return next;
}

/**
 * Remove a note by id. SSR-safe.
 */
export function deleteNote(
  caseId: string,
  attorneyKey: string,
  noteId: string
): AttorneyCaseNote[] {
  if (typeof window === "undefined") return [];
  const current = loadNotes(caseId, attorneyKey);
  const next = current.filter((n) => n.id !== noteId);
  saveNotes(caseId, attorneyKey, next);
  return next;
}
