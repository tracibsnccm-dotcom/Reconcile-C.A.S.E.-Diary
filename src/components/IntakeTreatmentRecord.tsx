import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface TreatmentEntry {
  name: string;
  frequency: string;
  startDate?: string;
  notes: string;
}

interface IntakeTreatmentRecordProps {
  preInjuryTreatments: TreatmentEntry[];
  postInjuryTreatments: TreatmentEntry[];
  onPreInjuryChange: (treatments: TreatmentEntry[]) => void;
  onPostInjuryChange: (treatments: TreatmentEntry[]) => void;
}

const TREATMENT_OPTIONS = [
  "Physical Therapy (PT)",
  "Occupational Therapy (OT)",
  "Dialysis",
  "Chemotherapy/Radiation",
  "Wound Care",
  "Home Health",
  "Pain Management",
  "Injections (epidural, joint, trigger point)",
  "Chiropractic Care",
  "Acupuncture",
  "Mental Health Counseling/Therapy",
  "Speech Therapy",
  "Cognitive Therapy",
  "Massage Therapy",
  "Medical Equipment (CPAP, oxygen, wheelchair, etc.)",
  "Specialist Follow-ups",
  "Other",
];

const FREQUENCY_OPTIONS = [
  "Daily",
  "Twice Daily",
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "As Needed",
  "Other",
];

export function IntakeTreatmentRecord({
  preInjuryTreatments,
  postInjuryTreatments,
  onPreInjuryChange,
  onPostInjuryChange,
}: IntakeTreatmentRecordProps) {
  const addPreInjuryTreatment = () => {
    onPreInjuryChange([
      ...preInjuryTreatments,
      { name: "", frequency: "", notes: "" },
    ]);
  };

  const removePreInjuryTreatment = (index: number) => {
    onPreInjuryChange(preInjuryTreatments.filter((_, i) => i !== index));
  };

  const updatePreInjuryTreatment = (index: number, field: keyof TreatmentEntry, value: string) => {
    const updated = [...preInjuryTreatments];
    updated[index] = { ...updated[index], [field]: value };
    onPreInjuryChange(updated);
  };

  const addPostInjuryTreatment = () => {
    onPostInjuryChange([
      ...postInjuryTreatments,
      { name: "", frequency: "", notes: "" },
    ]);
  };

  const removePostInjuryTreatment = (index: number) => {
    onPostInjuryChange(postInjuryTreatments.filter((_, i) => i !== index));
  };

  const updatePostInjuryTreatment = (index: number, field: keyof TreatmentEntry, value: string) => {
    const updated = [...postInjuryTreatments];
    updated[index] = { ...updated[index], [field]: value };
    onPostInjuryChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* Pre-Injury Treatments */}
      <Card className="p-6 border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pre-Injury Treatments/Services</h3>
            <p className="text-sm text-muted-foreground mt-1">
              List any ongoing treatments or medical services you were receiving before your injury
            </p>
          </div>
          <Button
            type="button"
            onClick={addPreInjuryTreatment}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Treatment
          </Button>
        </div>

        {preInjuryTreatments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No pre-injury treatments added. Click "Add Treatment" to begin.
          </p>
        ) : (
          <div className="space-y-4">
            {preInjuryTreatments.map((treatment, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg bg-muted/30 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-foreground">Treatment {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removePreInjuryTreatment(index)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`pre-treatment-name-${index}`}>Treatment/Service *</Label>
                    <Select
                      value={treatment.name}
                      onValueChange={(value) => updatePreInjuryTreatment(index, "name", value)}
                    >
                      <SelectTrigger id={`pre-treatment-name-${index}`}>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {TREATMENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`pre-frequency-${index}`}>Frequency</Label>
                    <Select
                      value={treatment.frequency}
                      onValueChange={(value) => updatePreInjuryTreatment(index, "frequency", value)}
                    >
                      <SelectTrigger id={`pre-frequency-${index}`}>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`pre-start-date-${index}`}>Start Date (optional)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id={`pre-start-date-${index}`}
                      type="date"
                      value={treatment.startDate || ""}
                      onChange={(e) => updatePreInjuryTreatment(index, "startDate", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`pre-notes-${index}`}>
                    Notes (max 1000 characters)
                  </Label>
                  <Textarea
                    id={`pre-notes-${index}`}
                    value={treatment.notes}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 1000);
                      updatePreInjuryTreatment(index, "notes", value);
                    }}
                    placeholder="Add any relevant notes about this treatment..."
                    className="min-h-[80px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {treatment.notes.length}/1000 characters
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Post-Injury Treatments */}
      <Card className="p-6 border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Post-Injury Treatments/Services</h3>
            <p className="text-sm text-muted-foreground mt-1">
              List any treatments or medical services you've started since your injury
            </p>
          </div>
          <Button
            type="button"
            onClick={addPostInjuryTreatment}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Treatment
          </Button>
        </div>

        {postInjuryTreatments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No post-injury treatments added. Click "Add Treatment" to begin.
          </p>
        ) : (
          <div className="space-y-4">
            {postInjuryTreatments.map((treatment, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg bg-muted/30 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-foreground">Treatment {index + 1}</h4>
                  <Button
                    type="button"
                    onClick={() => removePostInjuryTreatment(index)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`post-treatment-name-${index}`}>Treatment/Service *</Label>
                    <Select
                      value={treatment.name}
                      onValueChange={(value) => updatePostInjuryTreatment(index, "name", value)}
                    >
                      <SelectTrigger id={`post-treatment-name-${index}`}>
                        <SelectValue placeholder="Select treatment" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {TREATMENT_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`post-frequency-${index}`}>Frequency</Label>
                    <Select
                      value={treatment.frequency}
                      onValueChange={(value) => updatePostInjuryTreatment(index, "frequency", value)}
                    >
                      <SelectTrigger id={`post-frequency-${index}`}>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`post-start-date-${index}`}>Start Date (optional)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id={`post-start-date-${index}`}
                      type="date"
                      value={treatment.startDate || ""}
                      onChange={(e) => updatePostInjuryTreatment(index, "startDate", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`post-notes-${index}`}>
                    Notes (max 1000 characters)
                  </Label>
                  <Textarea
                    id={`post-notes-${index}`}
                    value={treatment.notes}
                    onChange={(e) => {
                      const value = e.target.value.slice(0, 1000);
                      updatePostInjuryTreatment(index, "notes", value);
                    }}
                    placeholder="Add any relevant notes about this treatment..."
                    className="min-h-[80px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {treatment.notes.length}/1000 characters
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}