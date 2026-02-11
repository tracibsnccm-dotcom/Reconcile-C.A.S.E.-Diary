/**
 * Hook for attorney local case notes (per-attorney-per-case localStorage).
 * Pass attorneyKey from auth: user?.id ?? user?.email ?? "unknown-attorney".
 */

import { useState, useEffect, useCallback } from "react";
import {
  loadNotes,
  saveNotes,
  upsertNote,
  deleteNote as storageDeleteNote,
  type AttorneyCaseNote,
} from "./caseNotesStorage";

export function useCaseNotes(caseId: string | null, attorneyKey?: string | null) {
  const key = attorneyKey ?? "unknown-attorney";
  const [notes, setNotes] = useState<AttorneyCaseNote[]>([]);

  useEffect(() => {
    if (!caseId) {
      setNotes([]);
      return;
    }
    setNotes(loadNotes(caseId, key));
  }, [caseId, key]);

  const addNote = useCallback(
    (content: string): AttorneyCaseNote | null => {
      if (!caseId || !content.trim()) return null;
      const note: AttorneyCaseNote = {
        id: typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      const next = upsertNote(caseId, key, note);
      setNotes(next);
      return note;
    },
    [caseId, key]
  );

  const updateNote = useCallback(
    (note: AttorneyCaseNote): void => {
      if (!caseId) return;
      const next = upsertNote(caseId, key, note);
      setNotes(next);
    },
    [caseId, key]
  );

  const removeNote = useCallback(
    (noteId: string): void => {
      if (!caseId) return;
      const next = storageDeleteNote(caseId, key, noteId);
      setNotes(next);
    },
    [caseId, key]
  );

  const persistNotes = useCallback(
    (next: AttorneyCaseNote[]): void => {
      if (!caseId) return;
      saveNotes(caseId, key, next);
      setNotes(next);
    },
    [caseId, key]
  );

  return {
    notes,
    addNote,
    updateNote,
    deleteNote: removeNote,
    saveNotes: persistNotes,
  };
}
