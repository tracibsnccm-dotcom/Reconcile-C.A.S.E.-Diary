import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { BookOpen, Plus, Clock, Loader2, ChevronUp, ChevronDown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface JournalEntry {
  id: string;
  case_id: string;
  content: string | null;
  mood: string | null;
  p1_physical_text: string | null;
  p2_psychological_text: string | null;
  p3_psychosocial_text: string | null;
  p4_professional_text: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ClientJournalProps {
  caseId: string;
}

const MOOD_LABELS = {
  1: "Very Poor",
  2: "Poor",
  3: "Okay",
  4: "Good",
  5: "Excellent"
};

export function ClientJournal({ caseId }: ClientJournalProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [mood, setMood] = useState(3);
  const [p1Physical, setP1Physical] = useState("");
  const [p2Psychological, setP2Psychological] = useState("");
  const [p3Psychosocial, setP3Psychosocial] = useState("");
  const [p4Professional, setP4Professional] = useState("");
  const [generalEntry, setGeneralEntry] = useState("");
  const [showIntro, setShowIntro] = useState(true);
  const [p1Expanded, setP1Expanded] = useState(true);
  const [p2Expanded, setP2Expanded] = useState(true);
  const [p3Expanded, setP3Expanded] = useState(true);
  const [p4Expanded, setP4Expanded] = useState(true);
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [caseId]);

  async function fetchEntries() {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_journal?case_id=eq.${caseId}&order=created_at.desc`,
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load journal entries: ${response.status}`);
      }

      const data = await response.json();
      setEntries(data || []);
    } catch (err: any) {
      console.error("Error fetching journal entries:", err);
      toast.error("Failed to load journal entries");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    // Check if at least one field has content
    const hasContent = 
      p1Physical.trim() || 
      p2Psychological.trim() || 
      p3Psychosocial.trim() || 
      p4Professional.trim() || 
      generalEntry.trim();

    if (!hasContent) {
      toast.error("Please write something in at least one section");
      return;
    }

    try {
      setSubmitting(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Get client_id from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error("Could not identify user. Please log in again.");
      }
      const clientId = user.id;

      const entryData = {
        case_id: caseId,
        client_id: clientId,
        content: generalEntry.trim() || null,
        mood: mood,
        p1_physical_text: p1Physical.trim() || null,
        p2_psychological_text: p2Psychological.trim() || null,
        p3_psychosocial_text: p3Psychosocial.trim() || null,
        p4_professional_text: p4Professional.trim() || null,
        // Set boolean flags based on whether text exists
        p1_physical: !!p1Physical.trim(),
        p2_psychological: !!p2Psychological.trim(),
        p3_psychosocial: !!p3Psychosocial.trim(),
        p4_professional: !!p4Professional.trim()
      };

      const response = await fetch(
        `${supabaseUrl}/rest/v1/rc_journal`,
        {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(entryData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save entry');
      }

      toast.success("Journal entry saved");
      setP1Physical("");
      setP2Psychological("");
      setP3Psychosocial("");
      setP4Professional("");
      setGeneralEntry("");
      setMood(3);
      fetchEntries();
    } catch (err: any) {
      console.error("Error saving entry:", err);
      toast.error(err.message || "Failed to save entry");
    } finally {
      setSubmitting(false);
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'MMM d, yyyy') + " at " + format(date, 'h:mm a');
  };

  return (
    <div className="space-y-4">
      {/* Intro Card */}
      {showIntro && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-slate-800 text-xl mb-2">
                  Reconcile C.A.R.E. Journal
                </CardTitle>
                <p className="text-slate-600 font-medium">
                  Your space to document your experience, in your own words
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIntro(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="text-slate-700 space-y-4">
            <p>
              When you are injured or going through treatment, a lot happens between appointments. Pain levels change. Daily tasks feel harder. Emotions come and go. Questions, frustrations, and concerns don't always fit neatly into a medical visit or a legal form.
            </p>
            <p>
              The Reconcile C.A.R.E. Journal gives you a private, secure space to write about what you are experiencing—physically, emotionally, and practically—as you move through your injury and recovery journey.
            </p>
            <div>
              <p className="font-medium mb-2">Writing things down can help you:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Organize your thoughts when everything feels overwhelming</li>
                <li>Release some of the stress, frustration, or uncertainty you may be carrying</li>
                <li>Keep track of changes in pain, function, mood, or daily challenges</li>
                <li>Feel seen and validated—your experience is real, and it matters</li>
              </ul>
            </div>
            <p className="italic text-center">
              There is no "right" or "wrong" way to use this journal. What you feel is legitimate, and no one gets to tell you otherwise.
            </p>
            <p>
              With your permission, your journal can help others better understand your experience and the impact your injury has on your everyday life.
            </p>
            <div>
              <p className="font-medium mb-2">This may include:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>How your injury affects your daily routines</li>
                <li>What activities are harder than they used to be</li>
                <li>Emotional or mental strain related to pain, recovery, or uncertainty</li>
                <li>Concerns or questions you want remembered over time</li>
              </ul>
            </div>
            <div className="bg-amber-100 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-slate-800">
                Your journal entries remain private unless you choose to share them. You stay in control of what is visible, when it is shared, and with whom.
              </p>
            </div>
            <p>
              The Reconcile C.A.R.E. Journal is here to support you—not just your case or your care, but your voice throughout the process.
            </p>
          </CardContent>
        </Card>
      )}

      {!showIntro && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIntro(true)}
          className="w-full"
        >
          <ChevronDown className="w-4 h-4 mr-2" />
          Show Introduction
        </Button>
      )}

      {/* Main Journal Card */}
      <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            My Journal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mood Slider */}
          <div 
            className="space-y-3 p-4 border border-teal-300 rounded-lg"
            style={{ backgroundColor: '#4fb9af' }}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-white font-medium">How are you feeling today?</span>
                <p className="text-white/80 text-sm mt-1">Select your overall mood</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-white">{mood}</span>
                <p className="text-xs text-white/80">{MOOD_LABELS[mood as keyof typeof MOOD_LABELS]}</p>
              </div>
            </div>
            <Slider
              value={[mood]}
              onValueChange={(v) => setMood(v[0])}
              min={1}
              max={5}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-white/70">
              <span>1 - Very Poor</span>
              <span>5 - Excellent</span>
            </div>
          </div>

          {/* P1 Physical - Collapsible */}
          <div 
            className="border border-teal-300 rounded-lg overflow-hidden"
            style={{ backgroundColor: '#4fb9af' }}
          >
            <button
              type="button"
              onClick={() => setP1Expanded(!p1Expanded)}
              className="w-full flex justify-between items-center p-4 text-white hover:bg-teal-600/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">P1</span>
                <span className="font-medium">Physical</span>
                <span className="text-white/80 text-sm">Pain, mobility, energy, sleep</span>
              </div>
              {p1Expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {p1Expanded && (
              <div className="p-4 pt-0 space-y-2">
                <Textarea
                  value={p1Physical}
                  onChange={(e) => setP1Physical(e.target.value)}
                  placeholder="How is your body feeling? Pain levels, mobility, energy, sleep quality..."
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 min-h-[100px] resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-white/70 text-right">
                  {p1Physical.length} / 5,000
                </p>
              </div>
            )}
          </div>

          {/* P2 Psychological - Collapsible */}
          <div 
            className="border border-teal-300 rounded-lg overflow-hidden"
            style={{ backgroundColor: '#4fb9af' }}
          >
            <button
              type="button"
              onClick={() => setP2Expanded(!p2Expanded)}
              className="w-full flex justify-between items-center p-4 text-white hover:bg-teal-600/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">P2</span>
                <span className="font-medium">Psychological</span>
                <span className="text-white/80 text-sm">Mood, anxiety, stress, coping</span>
              </div>
              {p2Expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {p2Expanded && (
              <div className="p-4 pt-0 space-y-2">
                <Textarea
                  value={p2Psychological}
                  onChange={(e) => setP2Psychological(e.target.value)}
                  placeholder="How are you feeling emotionally? Mood, anxiety, stress, coping strategies..."
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 min-h-[100px] resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-white/70 text-right">
                  {p2Psychological.length} / 5,000
                </p>
              </div>
            )}
          </div>

          {/* P3 Psychosocial - Collapsible */}
          <div 
            className="border border-teal-300 rounded-lg overflow-hidden"
            style={{ backgroundColor: '#4fb9af' }}
          >
            <button
              type="button"
              onClick={() => setP3Expanded(!p3Expanded)}
              className="w-full flex justify-between items-center p-4 text-white hover:bg-teal-600/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">P3</span>
                <span className="font-medium">Psychosocial</span>
                <span className="text-white/80 text-sm">Family, friends, resources, barriers</span>
              </div>
              {p3Expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {p3Expanded && (
              <div className="p-4 pt-0 space-y-2">
                <Textarea
                  value={p3Psychosocial}
                  onChange={(e) => setP3Psychosocial(e.target.value)}
                  placeholder="How is your support system? Family, friends, resources, barriers..."
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 min-h-[100px] resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-white/70 text-right">
                  {p3Psychosocial.length} / 5,000
                </p>
              </div>
            )}
          </div>

          {/* P4 Professional - Collapsible */}
          <div 
            className="border border-teal-300 rounded-lg overflow-hidden"
            style={{ backgroundColor: '#4fb9af' }}
          >
            <button
              type="button"
              onClick={() => setP4Expanded(!p4Expanded)}
              className="w-full flex justify-between items-center p-4 text-white hover:bg-teal-600/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded">P4</span>
                <span className="font-medium">Professional</span>
                <span className="text-white/80 text-sm">Work, daily activities, productivity</span>
              </div>
              {p4Expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {p4Expanded && (
              <div className="p-4 pt-0 space-y-2">
                <Textarea
                  value={p4Professional}
                  onChange={(e) => setP4Professional(e.target.value)}
                  placeholder="How is your ability to work and function? Daily activities, productivity, goals..."
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 min-h-[100px] resize-none"
                  maxLength={5000}
                />
                <p className="text-xs text-white/70 text-right">
                  {p4Professional.length} / 5,000
                </p>
              </div>
            )}
          </div>

          {/* General Entry - Collapsible */}
          <div 
            className="border border-teal-300 rounded-lg overflow-hidden"
            style={{ backgroundColor: '#4fb9af' }}
          >
            <button
              type="button"
              onClick={() => setGeneralExpanded(!generalExpanded)}
              className="w-full flex justify-between items-center p-4 text-white hover:bg-teal-600/50 transition-colors"
            >
              <div>
                <span className="font-medium">General Entry</span>
                <p className="text-white/80 text-sm">Additional thoughts, reflections, or notes</p>
              </div>
              {generalExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {generalExpanded && (
              <div className="p-4 pt-0 space-y-2">
                <Textarea
                  value={generalEntry}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 10000) {
                      setGeneralEntry(value);
                    }
                  }}
                  placeholder="Any additional thoughts, reflections, or notes..."
                  className="bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 min-h-[120px] resize-none"
                  maxLength={10000}
                />
                <p className="text-xs text-white/70 text-right">
                  {generalEntry.length} / 10,000
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || (!p1Physical.trim() && !p2Psychological.trim() && !p3Psychosocial.trim() && !p4Professional.trim() && !generalEntry.trim())}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Save Entry
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Entries List */}
      {loading ? (
        <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-4" />
            <p className="text-white/80">Loading entries...</p>
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-white/60 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Your Journal is Empty
            </h3>
            <p className="text-sm text-white/80 max-w-md mx-auto">
              Start documenting your journey! Use the sections above to share your experiences with your care team.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-teal-300 shadow-sm" style={{ backgroundColor: '#81cdc6' }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-white/80 mb-4">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(entry.created_at)}
                  {entry.mood && (
                    <span className="ml-2 px-2 py-1 rounded bg-amber-600/20 text-white text-xs">
                      Mood: {entry.mood}
                    </span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {/* 4Ps Sections */}
                  {entry.p1_physical_text && (
                    <div className="bg-white/20 border border-white/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">Physical (P1)</span>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">P1</span>
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap">
                        {entry.p1_physical_text}
                      </p>
                    </div>
                  )}

                  {entry.p2_psychological_text && (
                    <div className="bg-white/20 border border-white/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">Psychological (P2)</span>
                        <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">P2</span>
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap">
                        {entry.p2_psychological_text}
                      </p>
                    </div>
                  )}

                  {entry.p3_psychosocial_text && (
                    <div className="bg-white/20 border border-white/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">Psychosocial (P3)</span>
                        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">P3</span>
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap">
                        {entry.p3_psychosocial_text}
                      </p>
                    </div>
                  )}

                  {entry.p4_professional_text && (
                    <div className="bg-white/20 border border-white/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-white">Professional (P4)</span>
                        <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-800">P4</span>
                      </div>
                      <p className="text-sm text-white/90 whitespace-pre-wrap">
                        {entry.p4_professional_text}
                      </p>
                    </div>
                  )}

                  {/* General Entry */}
                  {entry.content && (
                    <div className="bg-white/20 border border-white/30 rounded-lg p-3">
                      <span className="text-sm font-semibold text-white mb-2 block">General Entry</span>
                      <p className="text-sm text-white/90 whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
