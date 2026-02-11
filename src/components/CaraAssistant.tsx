import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles, FileAudio, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CaraAssistantProps {
  journalText: string;
  onApply: (text: string, tag: boolean) => void;
}

type CaraMode = "rewrite" | "expressive" | "translate";

export function CaraAssistant({ journalText, onApply }: CaraAssistantProps) {
  const [mode, setMode] = useState<CaraMode>("rewrite");
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("neutral");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [appendMode, setAppendMode] = useState(true);
  const [flagAI, setFlagAI] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const handleGetSuggestion = async () => {
    if (!journalText.trim()) {
      toast.error("Type something in your journal first");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("cara-suggest", {
        body: { mode, text: journalText, lang: language, tone }
      });

      if (error) throw error;

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
        setIsModalOpen(true);
      } else {
        toast.error("CARA could not generate a suggestion");
      }
    } catch (error: any) {
      console.error("Error getting suggestion:", error);
      toast.error("Could not contact CARA");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data, error } = await supabase.functions.invoke("cara-transcribe", {
        body: formData
      });

      if (error) throw error;

      if (data?.text) {
        const transcript = `\n[Voice transcript]\n${data.text}\n`;
        onApply(transcript, false);
        toast.success("Voice transcribed successfully");
      } else {
        toast.error("Could not transcribe audio");
      }
    } catch (error: any) {
      console.error("Error transcribing:", error);
      toast.error("Upload failed");
    } finally {
      setIsTranscribing(false);
      event.target.value = "";
    }
  };

  const handleApply = () => {
    const tag = flagAI ? "\n[Entry tagged: AI-Assisted by CARA]\n" : "\n";
    const finalText = appendMode
      ? `${journalText}\n\n——\nCARA suggestion:\n${suggestion}${tag}`
      : `${suggestion}${tag}`;
    
    onApply(finalText, flagAI);
    setIsModalOpen(false);
    toast.success("CARA suggestion applied");
  };

  return (
    <>
      <div className="border-2 border-[hsl(var(--primary))] rounded-xl p-4 bg-card shadow-sm mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2 relative">
            <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
            <strong className="text-foreground font-extrabold">CARA</strong>
            <span className="text-muted-foreground font-semibold">— Your Care Reflection Assistant</span>
            <span 
              className="inline-flex justify-center items-center w-[18px] h-[18px] rounded-full bg-[hsl(var(--accent))] text-accent-foreground font-extrabold text-[0.75rem] cursor-help ml-1.5 relative group"
              tabIndex={0}
              aria-label="Privacy Info"
            >
              ?
              <div 
                className="absolute left-0 top-[140%] bg-card border border-[hsl(var(--accent))] rounded-lg shadow-lg p-3 max-w-[270px] z-20 hidden group-hover:block group-focus:block"
                role="tooltip"
              >
                <p className="text-sm text-foreground mb-2 leading-snug">
                  <strong>Privacy Notice:</strong><br />
                  CARA is HIPAA-aligned and keeps your writing private and encrypted. Entries you edit or create stay only in your case file — never used for AI training. You can change or delete any suggestion before saving.
                </p>
                <a 
                  href="/hipaa-notice" 
                  target="_blank" 
                  rel="noopener"
                  className="text-[hsl(var(--primary))] font-bold text-sm underline hover:opacity-80"
                >
                  View full HIPAA policy
                </a>
              </div>
            </span>
          </div>
          <small className="text-muted-foreground text-xs">
            You're always in control. Review edits before saving.
          </small>
        </div>

        {/* Mode Controls */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            variant={mode === "rewrite" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("rewrite")}
            className={mode === "rewrite" ? "bg-[hsl(var(--primary))] text-primary-foreground" : ""}
          >
            Rewrite (clear & simple)
          </Button>
          <Button
            variant={mode === "expressive" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("expressive")}
            className={mode === "expressive" ? "bg-[hsl(var(--primary))] text-primary-foreground" : ""}
          >
            Expressive support
          </Button>
          <Button
            variant={mode === "translate" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("translate")}
            className={mode === "translate" ? "bg-[hsl(var(--primary))] text-primary-foreground" : ""}
          >
            Translate → English
          </Button>
          <Label
            htmlFor="cara-voice"
            className="inline-flex items-center gap-2 px-3 py-1.5 border-2 border-dashed border-[hsl(var(--accent))] rounded-full text-sm font-semibold cursor-pointer hover:bg-accent/10 transition-colors"
          >
            <input
              id="cara-voice"
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleVoiceUpload}
              disabled={isTranscribing}
            />
            {isTranscribing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <FileAudio className="w-4 h-4" />
                Voice → Journal
              </>
            )}
          </Label>
        </div>

        {/* Preferences */}
        <div className="flex flex-wrap gap-4 items-center mb-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="ht">Kreyòl Ayisyen</SelectItem>
                <SelectItem value="vi">Tiếng Việt</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="encouraging">Encouraging</SelectItem>
                <SelectItem value="therapeutic">Therapeutic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Button
            onClick={handleGetSuggestion}
            disabled={isGenerating || !journalText.trim()}
            className="bg-[hsl(var(--primary))] text-primary-foreground hover:bg-[hsl(var(--primary))]/90"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Suggestion
              </>
            )}
          </Button>
          <div className="flex items-center gap-2">
            <Switch
              id="cara-flag"
              checked={flagAI}
              onCheckedChange={setFlagAI}
            />
            <Label htmlFor="cara-flag" className="text-sm cursor-pointer">
              Tag as AI-Assisted
            </Label>
          </div>
        </div>

        {/* Privacy Notice */}
        <p className="text-xs text-muted-foreground mt-3">
          Private & encrypted. CARA never diagnoses. You can edit or discard suggestions.
        </p>
      </div>

      {/* Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview CARA's Suggestion</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4 my-4">
            <div>
              <div className="font-bold text-sm text-[hsl(var(--primary))] mb-2">
                Your original
              </div>
              <pre className="bg-muted border border-border rounded-lg p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {journalText}
              </pre>
            </div>
            <div>
              <div className="font-bold text-sm text-[hsl(var(--primary))] mb-2">
                CARA's suggestion
              </div>
              <pre className="bg-muted border border-border rounded-lg p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {suggestion}
              </pre>
            </div>
          </div>

          <div className="flex items-center gap-2 my-4">
            <Switch
              id="cara-append"
              checked={appendMode}
              onCheckedChange={setAppendMode}
            />
            <Label htmlFor="cara-append" className="text-sm cursor-pointer">
              Insert suggestion below my original (keep both)
            </Label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Discard
            </Button>
            <Button
              onClick={handleApply}
              className="bg-[hsl(var(--primary))] text-primary-foreground"
            >
              Apply to Journal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
