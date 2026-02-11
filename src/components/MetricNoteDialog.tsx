import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface MetricNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metricName: string;
  metricLabel: string;
  currentValue: number;
  targetValue: number;
}

type MetricNote = Database['public']['Tables']['rn_metric_notes']['Row'];

export function MetricNoteDialog({
  open,
  onOpenChange,
  metricName,
  metricLabel,
  currentValue,
  targetValue,
}: MetricNoteDialogProps) {
  const [note, setNote] = useState("");
  const [previousNotes, setPreviousNotes] = useState<MetricNote[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadPreviousNotes();
    }
  }, [open, metricName]);

  const loadPreviousNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('rn_metric_notes')
        .select('*')
        .eq('rn_user_id', user.id)
        .eq('metric_name', metricName)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      if (data) {
        setPreviousNotes(data);
      }
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load previous notes");
    }
  };

  const handleSave = async () => {
    if (!note.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to save notes");
        return;
      }

      const noteData: Database['public']['Tables']['rn_metric_notes']['Insert'] = {
        rn_user_id: user.id,
        metric_name: metricName,
        metric_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        metric_value: currentValue,
        target_value: targetValue,
        note: note.trim(),
      };

      const { error } = await supabase
        .from('rn_metric_notes')
        .insert(noteData);

      if (error) throw error;
      
      toast.success("Note saved successfully");
      setNote("");
      await loadPreviousNotes();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setLoading(false);
    }
  };

  const isBelowTarget = currentValue < targetValue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add Note: {metricLabel}
          </DialogTitle>
          <DialogDescription>
            Current: <span className="font-bold">{currentValue}%</span> | Target: <span className="font-bold">{targetValue}%</span>
            {isBelowTarget && (
              <Badge variant="destructive" className="ml-2">Below Target</Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Add Note or Explanation
            </label>
            <Textarea
              placeholder="Document reasons for performance, outliers, special circumstances, or action plans..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {isBelowTarget 
                ? "Explain why this metric is below target and your plan to improve."
                : "Document any special circumstances or context for this period."}
            </p>
          </div>

          {previousNotes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Previous Notes</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {previousNotes.map((prevNote) => (
                  <div key={prevNote.id} className="p-3 rounded-lg bg-muted text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">
                        {new Date(prevNote.created_at).toLocaleDateString()} - Value: {prevNote.metric_value}%
                      </span>
                    </div>
                    <p className="text-foreground">{prevNote.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !note.trim()}>
            {loading ? "Saving..." : "Save Note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
