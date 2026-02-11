/**
 * Attorney-only private case notes. Uses useCaseNotes (localStorage per-attorney-per-case).
 * No Message RN/Client, no Auto-Generated/RN Notes filters — only add/edit/delete notes.
 *
 * Case dropdown uses getAttorneyCasesForPrivateNotes so it includes pending/pre-RN
 * statuses (e.g. Pending RN Care Coordination / attorney_confirmed), not only
 * rc_case_assignments+active or released-only.
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Pencil, X, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { useCaseNotes } from "@/attorney/notes/useCaseNotes";
import type { AttorneyCaseNote } from "@/attorney/notes/caseNotesStorage";
import { getAttorneyCasesForPrivateNotes } from "@/lib/attorneyCaseQueries";

interface CaseOption {
  id: string;
  case_number: string | null;
  client_name: string;
}

export default function AttorneyPrivateCaseNotes() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  const caseId = selectedCaseId || null;
  const attorneyKey = user?.id ?? user?.email ?? "unknown-attorney";
  const { notes, addNote, updateNote, deleteNote } = useCaseNotes(caseId, attorneyKey);

  useEffect(() => {
    if (!user?.id) {
      setCases([]);
      setCasesLoading(false);
      return;
    }
    setCasesLoading(true);
    getAttorneyCasesForPrivateNotes()
      .then((data) => setCases(data))
      .catch((err) => {
        console.error("Error fetching cases for private notes:", err);
        setCases([]);
      })
      .finally(() => setCasesLoading(false));
  }, [user?.id]);

  function handleAdd() {
    if (!addNote(draft.trim())) return;
    setDraft("");
  }

  function startEdit(n: AttorneyCaseNote) {
    setEditingId(n.id);
    setEditingContent(n.content);
  }

  function saveEdit() {
    if (!editingId || !caseId) return;
    const n = notes.find((x) => x.id === editingId);
    if (n) {
      updateNote({ ...n, content: editingContent.trim() || n.content });
    }
    setEditingId(null);
    setEditingContent("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingContent("");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          value={selectedCaseId || "__none__"}
          onValueChange={(v) => setSelectedCaseId(v === "__none__" ? "" : v)}
          disabled={casesLoading}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={casesLoading ? "Loading…" : "Select a case"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select a case</SelectItem>
            {cases.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.case_number || c.id.slice(0, 8)} — {c.client_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!casesLoading && cases.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No cases available yet. Cases will appear here after a client intake is confirmed.
        </p>
      )}

      {!caseId ? (
        <Card className="p-8 flex flex-col items-center justify-center min-h-[200px] text-center">
          <p className="text-muted-foreground">Select a case to view/add notes</p>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-800">My local notes</div>
          <p className="text-xs text-gray-500 mt-0.5">Private scratch notes for this case. Stored locally on this device for this attorney. Not visible to RN or client.</p>
          <div className="flex gap-2 mt-3">
            <Textarea
              placeholder="Add a note..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[60px]"
              rows={2}
            />
            <Button size="sm" onClick={handleAdd} disabled={!draft.trim()}>
              Add Note
            </Button>
          </div>
          {notes.length > 0 && (
            <ul className="mt-4 space-y-2">
              {notes.map((n) => (
                <li key={n.id} className="flex items-start justify-between gap-2 text-sm bg-gray-50 rounded p-2">
                  {editingId === n.id ? (
                    <div className="flex-1 flex flex-col gap-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={2}
                        className="min-h-[60px]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={saveEdit}>
                          <Check className="h-3 w-3 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="h-3 w-3 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-gray-700 whitespace-pre-wrap flex-1">{n.content}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(n)}
                          className="text-gray-400 hover:text-blue-600 p-1"
                          aria-label="Edit note"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteNote(n.id)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          aria-label="Delete note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
