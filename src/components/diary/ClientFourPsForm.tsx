// src/components/diary/ClientFourPsForm.tsx

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

// Import our new 4Ps sections
import { PhysicalSection } from "./PhysicalSection";
import { PsychologicalSection } from "./PsychologicalSection";
import { PsychosocialSection } from "./PsychosocialSection";
import { ProfessionalSection } from "./ProfessionalSection";

// Import scoring service
import { calculate4Ps, type DiaryEntry, type ScoringResult } from "../../services/scoring/Calculate4Ps";

export const ClientFourPsForm: React.FC = () => {
  const [submitting, setSubmitting] = React.useState(false);
  
  // State for each section (1-5 scores + notes)
  const [physical, setPhysical] = React.useState({
    score: 3, // Default neutral (3 = moderate)
    notes: ""
  });
  
  const [psychological, setPsychological] = React.useState({
    score: 3,
    notes: ""
  });
  
  const [psychosocial, setPsychosocial] = React.useState({
    score: 3,
    notes: ""
  });
  
  const [professional, setProfessional] = React.useState({
    score: 3,
    notes: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Create diary entry object
    const diaryEntry: DiaryEntry = {
      id: `diary-${Date.now()}`,
      date: new Date().toISOString(),
      scores: {
        physical: physical.score,
        psychological: psychological.score,
        psychosocial: psychosocial.score,
        professional: professional.score
      },
      notes: {
        physical: physical.notes,
        psychological: psychological.notes,
        psychosocial: psychosocial.notes,
        professional: professional.notes
      }
    };

    // Calculate scores
    const scoringResult: ScoringResult = calculate4Ps(diaryEntry);
    
    console.log("Diary Entry:", diaryEntry);
    console.log("Scoring Result:", scoringResult);
    
    // In production: Save to database
    // await saveToDatabase(diaryEntry, scoringResult);
    
    // Show success with scores
    alert(
      `Diary entry submitted!\n\nYour 4Ps Scores:\n` +
      `Physical: ${physical.score}/5\n` +
      `Psychological: ${psychological.score}/5\n` +
      `Psychosocial: ${psychosocial.score}/5\n` +
      `Professional: ${professional.score}/5\n` +
      `Overall Wellness: ${Math.round(scoringResult.overallScore)}%\n\n` +
      `Your attorney will review this information.`
    );
    
    // Reset form to neutral
    setPhysical({ score: 3, notes: "" });
    setPsychological({ score: 3, notes: "" });
    setPsychosocial({ score: 3, notes: "" });
    setProfessional({ score: 3, notes: "" });
    
    setSubmitting(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg">
          C.A.S.E. Diary - Daily Entry
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Document your recovery for your legal case. Be honest about both good and bad days.
          <br />
          <span className="text-xs">1 = Worst (severe limitations), 5 = Best (normal function)</span>
        </p>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              Today: {new Date().toLocaleDateString()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Client: John Doe {/* Will come from authentication */}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Case: PI-2024-001
            </Badge>
          </div>

          {/* 4Ps Sections */}
          <PhysicalSection
            score={physical.score}
            notes={physical.notes}
            onScoreChange={(score) => setPhysical({...physical, score})}
            onNotesChange={(notes) => setPhysical({...physical, notes})}
          />
          
          <PsychologicalSection
            score={psychological.score}
            notes={psychological.notes}
            onScoreChange={(score) => setPsychological({...psychological, score})}
            onNotesChange={(notes) => setPsychological({...psychological, notes})}
          />
          
          <PsychosocialSection
            score={psychosocial.score}
            notes={psychosocial.notes}
            onScoreChange={(score) => setPsychosocial({...psychosocial, score})}
            onNotesChange={(notes) => setPsychosocial({...psychosocial, notes})}
          />
          
          <ProfessionalSection
            score={professional.score}
            notes={professional.notes}
            onScoreChange={(score) => setProfessional({...professional, score})}
            onNotesChange={(notes) => setProfessional({...professional, notes})}
          />

          <div className="flex items-center justify-between pt-2 border-t">
            <p className="text-xs text-muted-foreground max-w-md">
              This entry becomes part of your legal case evidence. Submit daily for the most complete record.
              Your attorney will review your entries and use them to build your case.
            </p>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? "Submitting…" : "Save Diary Entry"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

// Mock function for now
async function saveToDatabase(entry: DiaryEntry, scoring: ScoringResult) {
  // Will connect to Supabase/real database
  return Promise.resolve();
}