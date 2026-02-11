import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Calendar, User } from "lucide-react";
import { format } from "date-fns";

interface ProviderNote {
  id: string;
  note_content: string;
  note_title: string;
  created_at: string;
  provider_name?: string;
  provider_specialty?: string;
}

interface ProviderNotesDisplayProps {
  caseId: string;
}

export function ProviderNotesDisplay({ caseId }: ProviderNotesDisplayProps) {
  const [notes, setNotes] = useState<ProviderNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      fetchProviderNotes();
    }
  }, [caseId]);

  async function fetchProviderNotes() {
    try {
      setLoading(true);

      const { data: notesData, error: notesError } = await supabase
        .from("provider_notes")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (notesError) throw notesError;

      // Fetch provider details for each note
      const notesWithProviderInfo = await Promise.all(
        (notesData || []).map(async (note) => {
          const { data: provider } = await supabase
            .from("providers")
            .select("name, specialty")
            .eq("id", note.provider_id)
            .maybeSingle();

          return {
            ...note,
            provider_name: provider?.name,
            provider_specialty: provider?.specialty,
          };
        })
      );

      setNotes(notesWithProviderInfo);
    } catch (error) {
      console.error("Error fetching provider notes:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">Loading provider notes...</p>
      </Card>
    );
  }

  if (notes.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Stethoscope className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Provider Notes & Comments</h3>
        </div>
        <div className="text-center py-8">
          <Stethoscope className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No provider notes for this case</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Stethoscope className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Provider Notes & Comments</h3>
        <Badge variant="secondary" className="ml-auto">
          {notes.length} {notes.length === 1 ? "Note" : "Notes"}
        </Badge>
      </div>

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id} className="p-4 border-l-4 border-l-primary">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{note.note_title}</h4>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {note.provider_name || "Unknown Provider"}
                    </div>
                    {note.provider_specialty && (
                      <div className="flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        {note.provider_specialty}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(note.created_at), "MMM dd, yyyy 'at' h:mm a")}
                </div>
              </div>

              <div className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {note.note_content}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
