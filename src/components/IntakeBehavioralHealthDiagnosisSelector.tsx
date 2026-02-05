import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";

interface IntakeBehavioralHealthDiagnosisSelectorProps {
  selectedPreDiagnoses: string[];
  selectedPostDiagnoses: string[];
  additionalNotes: string;
  onPreDiagnosesChange: (diagnoses: string[]) => void;
  onPostDiagnosesChange: (diagnoses: string[]) => void;
  onNotesChange: (notes: string) => void;
  showOnlyPre?: boolean;
  showOnlyPost?: boolean;
  preOtherText?: string;
  onPreOtherChange?: (value: string) => void;
  postOtherText?: string;
  onPostOtherChange?: (value: string) => void;
}

const BH_PRE_DIAGNOSES = [
  "Anxiety",
  "Depression",
  "Bipolar Disorder",
  "Obsessive-Compulsive Disorder (OCD)",
  "Panic Disorder",
  "Sleep Disturbance / Insomnia",
  "Attention, Memory, or Concentration Difficulties",
  "PTSD (prior to this incident)",
  "Eating Disorder / Disordered Eating",
  "Alcohol Use Disorder",
  "Prescription Misuse / Dependency",
  "Substance Use Disorder (Other)",
  "Grief or Loss Reaction (ongoing)",
  "Stress/Burnout (ongoing)",
  "Chronic Pain–Related Emotional Distress",
  "Other",
];

const BH_POST_DIAGNOSES = [
  "Acute Stress Reaction / Adjustment Disorder",
  "Anxiety (new or worsened)",
  "Depression (new or worsened)",
  "PTSD related to this incident",
  "Panic Attacks",
  "Sleep Disturbance / Insomnia (new or worsened)",
  "Memory or Concentration Difficulties (post-injury)",
  "Irritability / Anger Outbursts",
  "Emotional Numbing or Avoidance",
  "Social Withdrawal / Isolation",
  "Fear of Returning to Work / Activities",
  "Sexual Assault Trauma / Survivor Support",
  "Substance Use Increase (Alcohol or Drugs)",
  "Low Motivation / Fatigue (post-injury)",
  "Traumatic Stress–Related Cognitive Changes",
  "Other",
];

export function IntakeBehavioralHealthDiagnosisSelector({
  selectedPreDiagnoses,
  selectedPostDiagnoses,
  additionalNotes,
  onPreDiagnosesChange,
  onPostDiagnosesChange,
  onNotesChange,
  showOnlyPre = false,
  showOnlyPost = false,
  preOtherText = "",
  onPreOtherChange,
  postOtherText = "",
  onPostOtherChange,
}: IntakeBehavioralHealthDiagnosisSelectorProps) {
  const togglePreDiagnosis = (diagnosis: string) => {
    if (selectedPreDiagnoses.includes(diagnosis)) {
      onPreDiagnosesChange(selectedPreDiagnoses.filter(d => d !== diagnosis));
    } else {
      onPreDiagnosesChange([...selectedPreDiagnoses, diagnosis]);
    }
  };

  const togglePostDiagnosis = (diagnosis: string) => {
    if (selectedPostDiagnoses.includes(diagnosis)) {
      onPostDiagnosesChange(selectedPostDiagnoses.filter(d => d !== diagnosis));
    } else {
      onPostDiagnosesChange([...selectedPostDiagnoses, diagnosis]);
    }
  };

  const sortedPre = useMemo(
    () =>
      [...BH_PRE_DIAGNOSES].sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      }),
    []
  );
  const halfPre = useMemo(() => Math.ceil(sortedPre.length / 2), [sortedPre]);
  const leftPre = useMemo(() => sortedPre.slice(0, halfPre), [sortedPre, halfPre]);
  const rightPre = useMemo(() => sortedPre.slice(halfPre), [sortedPre, halfPre]);
  const sortedPost = useMemo(
    () =>
      [...BH_POST_DIAGNOSES].sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      }),
    []
  );
  const halfPost = useMemo(() => Math.ceil(sortedPost.length / 2), [sortedPost]);
  const leftPost = useMemo(() => sortedPost.slice(0, halfPost), [sortedPost, halfPost]);
  const rightPost = useMemo(() => sortedPost.slice(halfPost), [sortedPost, halfPost]);

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        {!showOnlyPre && !showOnlyPost && (
          <div className="flex items-start gap-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Behavioral Health History</h4>
              <p className="text-sm text-black">
                Select all behavioral health conditions that apply. This helps your care team provide appropriate mental health support.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {!showOnlyPost && (
            <div>
              {!showOnlyPre && (
                <h4 className="font-semibold text-base mb-4 text-black border-b pb-2">
                  Chronic / Pre-Accident
                </h4>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  {leftPre.map((option) => (
                    <div key={option} className="flex items-start space-x-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
                      <Checkbox
                        id={`pre-${option}`}
                        checked={selectedPreDiagnoses.includes(option)}
                        onCheckedChange={() => togglePreDiagnosis(option)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`pre-${option}`} className="text-sm font-normal cursor-pointer leading-snug flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {rightPre.map((option) => (
                    <div key={option} className="flex items-start space-x-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
                      <Checkbox
                        id={`pre-${option}`}
                        checked={selectedPreDiagnoses.includes(option)}
                        onCheckedChange={() => togglePreDiagnosis(option)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`pre-${option}`} className="text-sm font-normal cursor-pointer leading-snug flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedPreDiagnoses.includes("Other") && onPreOtherChange !== undefined && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="bh-pre-other" className="font-semibold">
                    Other (please describe)
                  </Label>
                  <Input
                    id="bh-pre-other"
                    value={preOtherText}
                    onChange={(e) => onPreOtherChange(e.target.value)}
                    placeholder="Describe other conditions…"
                    className={selectedPreDiagnoses.includes("Other") && !(preOtherText || "").trim() ? "border-destructive" : ""}
                  />
                  {selectedPreDiagnoses.includes("Other") && !(preOtherText || "").trim() && (
                    <p className="text-sm text-destructive">Please describe the &apos;Other&apos; condition.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {!showOnlyPre && (
            <div>
              {!showOnlyPost && (
                <h4 className="font-semibold text-base mb-4 text-black border-b pb-2">
                  Post-Accident / New or Worsened
                </h4>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  {leftPost.map((option) => (
                    <div key={option} className="flex items-start space-x-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
                      <Checkbox
                        id={`post-${option}`}
                        checked={selectedPostDiagnoses.includes(option)}
                        onCheckedChange={() => togglePostDiagnosis(option)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`post-${option}`} className="text-sm font-normal cursor-pointer leading-snug flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  {rightPost.map((option) => (
                    <div key={option} className="flex items-start space-x-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
                      <Checkbox
                        id={`post-${option}`}
                        checked={selectedPostDiagnoses.includes(option)}
                        onCheckedChange={() => togglePostDiagnosis(option)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={`post-${option}`} className="text-sm font-normal cursor-pointer leading-snug flex-1">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              {selectedPostDiagnoses.includes("Other") && onPostOtherChange !== undefined && (
                <div className="space-y-2 mt-4">
                  <Label htmlFor="bh-post-other" className="font-semibold">
                    Other (please describe)
                  </Label>
                  <Input
                    id="bh-post-other"
                    value={postOtherText}
                    onChange={(e) => onPostOtherChange(e.target.value)}
                    placeholder="Describe other conditions…"
                    className={selectedPostDiagnoses.includes("Other") && !(postOtherText || "").trim() ? "border-destructive" : ""}
                  />
                  {selectedPostDiagnoses.includes("Other") && !(postOtherText || "").trim() && (
                    <p className="text-sm text-destructive">Please describe the &apos;Other&apos; condition.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {showOnlyPost && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label htmlFor="bh-additional-conditions" className="font-semibold">
                  Additional Behavioral Health Conditions or Notes
                </Label>
                <span className="text-xs text-black">
                  {additionalNotes.length} / 1000
                </span>
              </div>
              <Textarea
                id="bh-additional-conditions"
                value={additionalNotes}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    onNotesChange(e.target.value);
                  }
                }}
                placeholder="Please describe any additional behavioral health conditions or relevant mental health information not listed above..."
                rows={4}
                className="resize-none"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
