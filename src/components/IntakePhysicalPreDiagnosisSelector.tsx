import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Info } from "lucide-react";

interface IntakePhysicalPreDiagnosisSelectorProps {
  selectedDiagnoses: string[];
  additionalNotes: string;
  otherText: string;
  onDiagnosesChange: (diagnoses: string[]) => void;
  onNotesChange: (notes: string) => void;
  onOtherChange: (value: string) => void;
}

const PHYSICAL_PRE_DIAGNOSES = [
  "Hypertension (High Blood Pressure)",
  "Congestive Heart Failure (CHF)",
  "Diabetes (Type 1 or Type 2)",
  "High Cholesterol / Hyperlipidemia",
  "Heart Disease / Coronary Artery Disease",
  "Asthma or COPD",
  "Thyroid Disorder",
  "Kidney Disease",
  "Liver Disease",
  "Cancer (Active or in Remission)",
  "Obesity",
  "Autoimmune Disease (e.g., Lupus, RA, MS)",
  "Seizure Disorder / Epilepsy",
  "Chronic Migraine or Headache Disorder",
  "Neuropathy / Radiculopathy",
  "Fibromyalgia",
  "Chronic Pain Syndrome",
  "Gastrointestinal Disorder (e.g., GERD, IBS)",
  "Chronic Fatigue Syndrome",
  "Other",
  "Pregnancy — First Trimester",
  "Pregnancy — Second Trimester",
  "Pregnancy — Third Trimester",
];

export function IntakePhysicalPreDiagnosisSelector({
  selectedDiagnoses,
  additionalNotes,
  otherText,
  onDiagnosesChange,
  onNotesChange,
  onOtherChange,
}: IntakePhysicalPreDiagnosisSelectorProps) {
  const toggleDiagnosis = (diagnosis: string) => {
    if (selectedDiagnoses.includes(diagnosis)) {
      onDiagnosesChange(selectedDiagnoses.filter(d => d !== diagnosis));
    } else {
      onDiagnosesChange([...selectedDiagnoses, diagnosis]);
    }
  };

  const sorted = useMemo(() => [...PHYSICAL_PRE_DIAGNOSES].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })), []);
  const half = useMemo(() => Math.ceil(sorted.length / 2), [sorted]);
  const left = useMemo(() => sorted.slice(0, half), [sorted, half]);
  const right = useMemo(() => sorted.slice(half), [sorted, half]);

  const hasOther = selectedDiagnoses.includes("Other");
  const otherError = hasOther && !(otherText || "").trim();

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">Chronic / Pre-Accident Conditions</h4>
            <p className="text-sm text-black">
              Select all chronic or pre-existing physical conditions that you had before the incident.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          <div className="space-y-1">
            {left.map((option) => (
              <div key={option} className="flex items-start space-x-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
                <Checkbox
                  id={option}
                  checked={selectedDiagnoses.includes(option)}
                  onCheckedChange={() => toggleDiagnosis(option)}
                  className="mt-0.5"
                />
                <Label htmlFor={option} className="text-sm font-normal cursor-pointer leading-snug flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {right.map((option) => (
              <div key={option} className="flex items-start space-x-3 p-2 hover:bg-accent/50 rounded-md transition-colors">
                <Checkbox
                  id={option}
                  checked={selectedDiagnoses.includes(option)}
                  onCheckedChange={() => toggleDiagnosis(option)}
                  className="mt-0.5"
                />
                <Label htmlFor={option} className="text-sm font-normal cursor-pointer leading-snug flex-1">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {hasOther && (
          <div className="space-y-2 mb-6">
            <Label htmlFor="pre-physical-other" className="font-semibold">
              Other (please describe)
            </Label>
            <Input
              id="pre-physical-other"
              value={otherText}
              onChange={(e) => onOtherChange(e.target.value)}
              placeholder="Describe other conditions…"
              className={otherError ? "border-destructive" : ""}
            />
            {otherError && (
              <p className="text-sm text-destructive">Please describe the &apos;Other&apos; condition.</p>
            )}
          </div>
        )}

        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label htmlFor="pre-physical-additional-conditions" className="font-semibold">
              Additional Pre-Injury Physical Conditions or Notes
            </Label>
            <span className="text-xs text-black">
              {additionalNotes.length} / 1000
            </span>
          </div>
          <Textarea
            id="pre-physical-additional-conditions"
            value={additionalNotes}
            onChange={(e) => {
              if (e.target.value.length <= 1000) {
                onNotesChange(e.target.value);
              }
            }}
            placeholder="Please describe any additional pre-injury physical conditions, diagnoses, or relevant health information not listed above..."
            rows={4}
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
