// src/pages/ClientIntakeForm.tsx
// MVP Client Intake page with case selection and rc_client_intakes insert

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { useCases } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function ClientIntakeForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cases, loading: casesLoading } = useCases();
  
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields - simplified intake form
  const [voice, setVoice] = useState("");
  const [view, setView] = useState("");
  const [physicalStage, setPhysicalStage] = useState(3);
  const [psychStage, setPsychStage] = useState(3);
  const [psychosocialStage, setPsychosocialStage] = useState(3);
  const [professionalStage, setProfessionalStage] = useState(3);
  const [shortTermGoal, setShortTermGoal] = useState("");
  const [mediumTermGoal, setMediumTermGoal] = useState("");
  const [longTermGoal, setLongTermGoal] = useState("");

  // Set default case when cases load
  useEffect(() => {
    if (!casesLoading && cases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(cases[0].id);
    }
  }, [cases, casesLoading, selectedCaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to complete your intake.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCaseId) {
      toast({
        title: "Case selection required",
        description: "Please select a case to complete your intake.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Build intake_json payload
      const intakeJson = {
        voice,
        view,
        physical_stage: physicalStage,
        psych_stage: psychStage,
        psychosocial_stage: psychosocialStage,
        professional_stage: professionalStage,
        short_term_goal: shortTermGoal,
        medium_term_goal: mediumTermGoal,
        long_term_goal: longTermGoal,
        submitted_at: new Date().toISOString(),
      };

      // Insert into rc_client_intakes
      const { data, error: insertError } = await supabase
        .from("rc_client_intakes")
        .insert({
          case_id: selectedCaseId,
          intake_json: intakeJson,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting intake:", insertError);
        throw new Error(insertError.message || "Failed to submit intake");
      }

      // Success
      setSubmitted(true);
      toast({
        title: "Intake submitted successfully",
        description: "Your intake has been received and will be reviewed by your care team.",
      });
    } catch (err: any) {
      console.error("Error submitting intake:", err);
      setError(err.message || "Failed to submit intake. Please try again.");
      toast({
        title: "Submission failed",
        description: err.message || "Failed to submit intake. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="p-8 max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to be signed in to complete your intake. Please sign in and try again.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (submitted) {
    return (
      <AppLayout>
        <div className="p-8 max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Intake Submitted Successfully</h2>
                  <p className="text-muted-foreground">
                    Your intake has been received and will be reviewed by your care team.
                  </p>
                </div>
              </div>
              
              <Alert>
                <AlertDescription>
                  You can now access the Client Portal. Your RN Care Manager will review your intake and may contact you with follow-up questions.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={() => navigate("/client-portal")} className="flex-1">
                  Go to Client Portal
                </Button>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit Another Intake
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Client Intake</h1>
          <p className="text-muted-foreground">
            Complete your intake to access the Client Portal. This information helps your RN Care Manager understand your situation and support your recovery.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Case Selector */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <Label htmlFor="case-select">Select Case</Label>
                {casesLoading ? (
                  <p className="text-sm text-muted-foreground">Loading cases...</p>
                ) : cases.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No cases found. Please contact your attorney or care team to set up your case.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
                    <SelectTrigger id="case-select">
                      <SelectValue placeholder="Select a case" />
                    </SelectTrigger>
                    <SelectContent>
                      {cases.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.client_label || `Case ${c.id.slice(0, 8)}`} - {c.status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Voice & View */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Your Voice & View</h3>
              <p className="text-sm text-muted-foreground">
                Tell us your story in your own words and how you see your recovery.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="voice">Your Voice (what happened, in your own words)</Label>
                <Textarea
                  id="voice"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  rows={4}
                  placeholder="Tell us what brought you here, what changed, and how this is affecting your daily life."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="view">Your View (how you see yourself and your recovery)</Label>
                <Textarea
                  id="view"
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                  rows={3}
                  placeholder="How do you see yourself right now, and what would you like your health, function, or life to look like 3–6 months from now?"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4Ps of Wellness */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">4Ps of Wellness Snapshot</h3>
              <p className="text-sm text-muted-foreground">
                Rate how you're doing in each area (1 = most limited, 5 = doing well).
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="physical">Physical Wellness (1–5)</Label>
                  <Select value={physicalStage.toString()} onValueChange={(v) => setPhysicalStage(Number(v))}>
                    <SelectTrigger id="physical">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Most limited / struggling</SelectItem>
                      <SelectItem value="2">2 - Significant difficulties</SelectItem>
                      <SelectItem value="3">3 - Mixed / some good days</SelectItem>
                      <SelectItem value="4">4 - Mostly stable</SelectItem>
                      <SelectItem value="5">5 - Doing well / stable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="psych">Psychological Wellness (1–5)</Label>
                  <Select value={psychStage.toString()} onValueChange={(v) => setPsychStage(Number(v))}>
                    <SelectTrigger id="psych">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Most limited / struggling</SelectItem>
                      <SelectItem value="2">2 - Significant difficulties</SelectItem>
                      <SelectItem value="3">3 - Mixed / some good days</SelectItem>
                      <SelectItem value="4">4 - Mostly stable</SelectItem>
                      <SelectItem value="5">5 - Doing well / stable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="psychosocial">Psychosocial Wellness (1–5)</Label>
                  <Select value={psychosocialStage.toString()} onValueChange={(v) => setPsychosocialStage(Number(v))}>
                    <SelectTrigger id="psychosocial">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Most limited / struggling</SelectItem>
                      <SelectItem value="2">2 - Significant difficulties</SelectItem>
                      <SelectItem value="3">3 - Mixed / some good days</SelectItem>
                      <SelectItem value="4">4 - Mostly stable</SelectItem>
                      <SelectItem value="5">5 - Doing well / stable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professional">Professional Wellness (1–5)</Label>
                  <Select value={professionalStage.toString()} onValueChange={(v) => setProfessionalStage(Number(v))}>
                    <SelectTrigger id="professional">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Most limited / struggling</SelectItem>
                      <SelectItem value="2">2 - Significant difficulties</SelectItem>
                      <SelectItem value="3">3 - Mixed / some good days</SelectItem>
                      <SelectItem value="4">4 - Mostly stable</SelectItem>
                      <SelectItem value="5">5 - Doing well / stable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Vision & Goals</h3>
              <p className="text-sm text-muted-foreground">
                Share your goals to help your care plan match what matters most to you.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="short-term">Short-Term Goal (next 30 days)</Label>
                <Textarea
                  id="short-term"
                  value={shortTermGoal}
                  onChange={(e) => setShortTermGoal(e.target.value)}
                  rows={2}
                  placeholder="Example: Sleep at least 5–6 hours most nights, make it to all my therapy appointments this month."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medium-term">Medium-Term Goal (next 60–90 days)</Label>
                <Textarea
                  id="medium-term"
                  value={mediumTermGoal}
                  onChange={(e) => setMediumTermGoal(e.target.value)}
                  rows={2}
                  placeholder="Example: Walk for 15–20 minutes without stopping, reduce pain flares so I can do light housework."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="long-term">Longer-Term Goal (beyond 90 days)</Label>
                <Textarea
                  id="long-term"
                  value={longTermGoal}
                  onChange={(e) => setLongTermGoal(e.target.value)}
                  rows={2}
                  placeholder="Example: Return to work (full or part time), resume caring for family, or resume activities I enjoy."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={submitting || !selectedCaseId || cases.length === 0}
              className="min-w-[120px]"
            >
              {submitting ? "Submitting..." : "Submit Intake"}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
