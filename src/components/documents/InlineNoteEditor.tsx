import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface InlineNoteEditorProps {
  documentId: string;
  caseId: string;
  initialNote: string;
  onSave: (newNote: string) => void;
  onCancel: () => void;
}

export function InlineNoteEditor({
  documentId,
  caseId,
  initialNote,
  onSave,
  onCancel,
}: InlineNoteEditorProps) {
  const [note, setNote] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update document note
      const { error: docError } = await supabase
        .from("documents")
        .update({ note: note.trim() })
        .eq("id", documentId);

      if (docError) throw docError;

      // Mirror to case notes if note exists
      if (note.trim()) {
        const { data: docData } = await supabase
          .from("documents")
          .select("file_name")
          .eq("id", documentId)
          .single();

        await supabase.from("case_notes").insert({
          case_id: caseId,
          created_by: user?.id,
          note_text: `📎 Document note updated: ${docData?.file_name}\n\n${note.trim()}`,
          visibility: "private",
        });
      }

      // Log activity
      await supabase.from("document_activity_log").insert({
        document_id: documentId,
        action_type: "note_updated",
        performed_by: user?.id,
        performed_by_role: "ATTORNEY",
        metadata: { note_length: note.trim().length }
      });

      toast({
        title: "Success",
        description: "Note saved and mirrored to case notes",
      });

      onSave(note.trim());
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 p-2 bg-muted/30 rounded-md" onClick={(e) => e.stopPropagation()}>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (will mirror to case notes)..."
        rows={2}
        className="resize-none"
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Note"}
        </Button>
      </div>
    </div>
  );
}
