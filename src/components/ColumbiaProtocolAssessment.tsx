import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ColumbiaProtocolAssessmentProps {
  caseId: string;
  clientId: string;
  onComplete?: (riskLevel: string, score: number) => void;
  onCancel?: () => void;
}

type RiskLevel = "none" | "low" | "moderate" | "high" | "critical";

interface Question {
  id: string;
  text: string;
  showIf?: (answers: Record<string, string>) => boolean;
  description?: string;
}

const questions: Question[] = [
  {
    id: "q1",
    text: "Have you wished you were dead or wished you could go to sleep and not wake up?",
  },
  {
    id: "q2",
    text: "Have you actually had any thoughts of killing yourself?",
    showIf: (answers) => answers.q1 === "yes",
  },
  {
    id: "q3",
    text: "Have you thought about how you might kill yourself?",
    showIf: (answers) => answers.q2 === "yes",
  },
  {
    id: "q4",
    text: "Have you had any intention of acting on these thoughts of killing yourself?",
    description: "Select 'No' if you have thoughts but no intention of acting on them",
    showIf: (answers) => answers.q3 === "yes",
  },
  {
    id: "q5",
    text: "Have you started to work out or worked out the details of how to kill yourself?",
    showIf: (answers) => answers.q4 === "yes",
  },
  {
    id: "q6",
    text: "Have you done anything, started to do anything, or prepared to do anything to end your life?",
    description: "Examples: Collected pills, obtained a weapon, cut wrists",
    showIf: (answers) => answers.q5 === "yes",
  },
];

export function ColumbiaProtocolAssessment({
  caseId,
  clientId,
  onComplete,
  onCancel,
}: ColumbiaProtocolAssessmentProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [riskAssessment, setRiskAssessment] = useState<{
    level: RiskLevel;
    score: number;
    actions: string[];
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    assessRisk();
  }, [answers]);

  const visibleQuestions = questions.filter(
    (q) => !q.showIf || q.showIf(answers)
  );

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    
    // Clear downstream answers if user changes response to "no"
    if (value === "no") {
      const questionIndex = questions.findIndex((q) => q.id === questionId);
      questions.slice(questionIndex + 1).forEach((q) => {
        delete newAnswers[q.id];
      });
    }
    
    setAnswers(newAnswers);
  };

  const assessRisk = () => {
    const q1 = answers.q1;
    const q2 = answers.q2;
    const q3 = answers.q3;
    const q4 = answers.q4;
    const q5 = answers.q5;
    const q6 = answers.q6;

    let level: RiskLevel = "none";
    let score = 0;
    let actions: string[] = [];

    if (q6 === "yes") {
      level = "critical";
      score = 6;
      actions = [
        "Do not leave person alone",
        "Contact emergency services (911)",
        "Notify supervisor immediately",
        "Initiate crisis protocol",
      ];
    } else if (q5 === "yes") {
      level = "high";
      score = 5;
      actions = [
        "Immediate supervisor notification",
        "Safety planning required",
        "Consider emergency evaluation",
        "Frequent monitoring",
      ];
    } else if (q4 === "yes") {
      level = "high";
      score = 4;
      actions = [
        "Immediate supervisor notification",
        "Complete safety plan",
        "Emergency evaluation recommended",
        "Continuous monitoring",
      ];
    } else if (q3 === "yes") {
      level = "moderate";
      score = 3;
      actions = [
        "Notify supervisor within 2 hours",
        "Complete safety plan",
        "Schedule follow-up within 24 hours",
        "Provide crisis resources",
      ];
    } else if (q2 === "yes") {
      level = "moderate";
      score = 2;
      actions = [
        "Clinical assessment required",
        "Safety planning",
        "Regular monitoring",
        "Document thoroughly",
      ];
    } else if (q1 === "yes") {
      level = "low";
      score = 1;
      actions = [
        "Monitor mood and thoughts",
        "Provide support resources",
        "Document assessment",
        "Schedule follow-up",
      ];
    } else if (q1 === "no") {
      level = "none";
      score = 0;
      actions = ["No current suicidal ideation detected", "Continue routine monitoring"];
    }

    if (q1) {
      setRiskAssessment({ level, score, actions });
    } else {
      setRiskAssessment(null);
    }
  };

  const handleSubmit = async () => {
    if (!answers.q1) {
      toast.error("Please answer the first question to complete the assessment");
      return;
    }

    if (!riskAssessment) return;

    setIsSubmitting(true);

    try {
      // Save the assessment
      const { error: assessmentError } = await supabase
        .from("client_sensitive_disclosures")
        .insert({
          case_id: caseId,
          category: "mental_health_screening",
          item_code: "columbia_protocol",
          selected: true,
          free_text: JSON.stringify({
            answers,
            risk_level: riskAssessment.level,
            score: riskAssessment.score,
            timestamp: new Date().toISOString(),
          }),
          risk_level: riskAssessment.level === "critical" || riskAssessment.level === "high" ? "RED" : 
                      riskAssessment.level === "moderate" ? "ORANGE" : null,
        });

      if (assessmentError) throw assessmentError;

      // Create emergency alert for high-risk cases
      if (riskAssessment.level === "critical" || riskAssessment.level === "high") {
        const { error: alertError } = await supabase
          .from("rn_emergency_alerts")
          .insert({
            case_id: caseId,
            client_id: clientId,
            alert_type: "suicidal_ideation",
            severity: "critical",
            alert_details: `Columbia Protocol Score: ${riskAssessment.score}/6 - Risk Level: ${riskAssessment.level.toUpperCase()}`,
          });

        if (alertError) throw alertError;
      }

      toast.success("Assessment completed successfully");
      onComplete?.(riskAssessment.level, riskAssessment.score);
    } catch (error) {
      console.error("Error saving assessment:", error);
      toast.error("Failed to save assessment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (level: RiskLevel): "default" | "destructive" => {
    switch (level) {
      case "critical":
      case "high":
        return "destructive";
      default:
        return "default";
    }
  };

  const getRiskIcon = (level: RiskLevel) => {
    switch (level) {
      case "critical":
      case "high":
        return <XCircle className="h-5 w-5" />;
      case "moderate":
        return <AlertTriangle className="h-5 w-5" />;
      case "low":
      case "none":
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardTitle>Columbia Protocol (C-SSRS)</CardTitle>
        <CardDescription>Suicide Risk Assessment</CardDescription>
        <Alert className="mt-4">
          <AlertDescription>
            <strong>Purpose:</strong> This assessment helps us understand your current situation and provide appropriate support.
            <br />
            <strong>Confidentiality:</strong> Your responses are protected health information.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {visibleQuestions.map((question) => (
          <div key={question.id} className="space-y-3">
            <Label className="text-base font-semibold">
              {question.text}
            </Label>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`} className="font-normal cursor-pointer">
                  No
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`} className="font-normal cursor-pointer">
                  Yes
                </Label>
              </div>
            </RadioGroup>
          </div>
        ))}

        {riskAssessment && (
          <Alert variant={getRiskColor(riskAssessment.level)} className="mt-6">
            <div className="flex items-start gap-3">
              {getRiskIcon(riskAssessment.level)}
              <div className="space-y-2 flex-1">
                <h4 className="font-semibold">
                  Risk Level: {riskAssessment.level.toUpperCase()} (Score: {riskAssessment.score}/6)
                </h4>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Recommended Actions:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {riskAssessment.actions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Alert>
        )}

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel Assessment
          </Button>
          <Button onClick={handleSubmit} disabled={!answers.q1 || isSubmitting}>
            {isSubmitting ? "Saving..." : "Complete Assessment"}
          </Button>
        </div>

        <Alert variant="default" className="mt-4 border-muted">
          <AlertDescription className="text-xs">
            <strong>Columbia-Suicide Severity Rating Scale (C-SSRS)</strong> - Used with permission.
            <br />
            If you are experiencing a mental health emergency, please call 988 or go to your nearest emergency room.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
