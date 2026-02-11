import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Pill, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface MedicationEntry {
  id: string;
  brandName: string;
  genericName: string;
  dose: string;
  frequency: string;
  route: string;
  purpose: string;
  prescriber: string;
  startDate: string;
  endDate: string;
  pharmacy: string;
  notes: string;
  /** When frequency is PRN: PRN frequency (e.g. q4h PRN, daily PRN). */
  prnFrequency?: string;
  /** When frequency is PRN: reason for PRN use (patient-reported). */
  prnReason?: string;
  /** When purpose is Other: freeform "Please specify". */
  purposeOther?: string;
  /** When frequency is Other: freeform "Please specify". */
  frequencyOther?: string;
  /** When route is Other: freeform "Please specify". */
  routeOther?: string;
  /** When prnFrequency is Other: freeform "Please specify". */
  prnFrequencyOther?: string;
}

export interface AllergyEntry {
  id: string;
  medication: string;
  reaction: string;
  severity: string;
}

interface IntakeMedicationRecordProps {
  preInjuryMeds: MedicationEntry[];
  postInjuryMeds: MedicationEntry[];
  allergies: AllergyEntry[];
  onPreInjuryChange: (meds: MedicationEntry[]) => void;
  onPostInjuryChange: (meds: MedicationEntry[]) => void;
  onAllergiesChange: (allergies: AllergyEntry[]) => void;
}

export function IntakeMedicationRecord({
  preInjuryMeds,
  postInjuryMeds,
  allergies,
  onPreInjuryChange,
  onPostInjuryChange,
  onAllergiesChange,
}: IntakeMedicationRecordProps) {
  const createEmptyMed = (): MedicationEntry => ({
    id: `med-${Date.now()}-${Math.random()}`,
    brandName: "",
    genericName: "",
    dose: "",
    frequency: "",
    route: "",
    purpose: "",
    prescriber: "",
    startDate: "",
    endDate: "",
    pharmacy: "",
    notes: "",
  });

  const createEmptyAllergy = (): AllergyEntry => ({
    id: `allergy-${Date.now()}-${Math.random()}`,
    medication: "",
    reaction: "",
    severity: "",
  });

  const addPreInjuryMed = () => {
    onPreInjuryChange([...preInjuryMeds, createEmptyMed()]);
  };

  const addPostInjuryMed = () => {
    onPostInjuryChange([...postInjuryMeds, createEmptyMed()]);
  };

  const removePreInjuryMed = (id: string) => {
    onPreInjuryChange(preInjuryMeds.filter((m) => m.id !== id));
  };

  const removePostInjuryMed = (id: string) => {
    onPostInjuryChange(postInjuryMeds.filter((m) => m.id !== id));
  };

  const updatePreInjuryMed = (id: string, field: keyof MedicationEntry, value: string) => {
    onPreInjuryChange(
      preInjuryMeds.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const updatePostInjuryMed = (id: string, field: keyof MedicationEntry, value: string) => {
    onPostInjuryChange(
      postInjuryMeds.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const addAllergy = () => {
    onAllergiesChange([...allergies, createEmptyAllergy()]);
  };

  const removeAllergy = (id: string) => {
    onAllergiesChange(allergies.filter((a) => a.id !== id));
  };

  const updateAllergy = (id: string, field: keyof AllergyEntry, value: string) => {
    onAllergiesChange(
      allergies.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const MedicationForm = ({
    med,
    onUpdate,
    onRemove,
  }: {
    med: MedicationEntry;
    onUpdate: (field: keyof MedicationEntry, value: string) => void;
    onRemove: () => void;
  }) => (
    <div className="p-4 border border-border rounded-lg space-y-3 bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Medication Entry</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${med.id}-brandName`} className="text-xs">
            Brand Name *
          </Label>
          <Input
            id={`${med.id}-brandName`}
            value={med.brandName}
            onChange={(e) => onUpdate("brandName", e.target.value)}
            placeholder="e.g., Advil"
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-genericName`} className="text-xs">
            Generic Name
          </Label>
          <Input
            id={`${med.id}-genericName`}
            value={med.genericName}
            onChange={(e) => onUpdate("genericName", e.target.value)}
            placeholder="e.g., Ibuprofen"
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-prescriber`} className="text-xs">
            Prescribing Physician *
          </Label>
          <Input
            id={`${med.id}-prescriber`}
            value={med.prescriber}
            onChange={(e) => onUpdate("prescriber", e.target.value)}
            placeholder="e.g., Dr. Smith"
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-purpose`} className="text-xs">
            Purpose/Diagnosis *
          </Label>
          <Select
            value={med.purpose}
            onValueChange={(value) => onUpdate("purpose", value)}
          >
            <SelectTrigger id={`${med.id}-purpose`} className="h-9">
              <SelectValue placeholder="Select diagnosis" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="anxiety">Anxiety</SelectItem>
              <SelectItem value="back_pain">Back Pain</SelectItem>
              <SelectItem value="cardiac">Cardiac Condition</SelectItem>
              <SelectItem value="depression">Depression</SelectItem>
              <SelectItem value="diabetes">Diabetes</SelectItem>
              <SelectItem value="gastrointestinal">Gastrointestinal</SelectItem>
              <SelectItem value="headache">Headache/Migraine</SelectItem>
              <SelectItem value="hypertension">Hypertension</SelectItem>
              <SelectItem value="infection">Infection</SelectItem>
              <SelectItem value="inflammation">Inflammation</SelectItem>
              <SelectItem value="muscle_spasm">Muscle Spasm</SelectItem>
              <SelectItem value="neck_pain">Neck Pain</SelectItem>
              <SelectItem value="nerve_pain">Nerve Pain</SelectItem>
              <SelectItem value="ptsd">PTSD</SelectItem>
              <SelectItem value="respiratory">Respiratory Condition</SelectItem>
              <SelectItem value="sleep_disorder">Sleep Disorder</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-dose`} className="text-xs">
            Dosage *
          </Label>
          <Input
            id={`${med.id}-dose`}
            value={med.dose}
            onChange={(e) => onUpdate("dose", e.target.value)}
            placeholder="e.g., 50mg"
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-frequency`} className="text-xs">
            Frequency *
          </Label>
          <Select
            value={med.frequency}
            onValueChange={(value) => onUpdate("frequency", value)}
          >
            <SelectTrigger id={`${med.id}-frequency`} className="h-9">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="once_daily">Once daily</SelectItem>
              <SelectItem value="twice_daily">Twice daily</SelectItem>
              <SelectItem value="three_times_daily">Three times daily</SelectItem>
              <SelectItem value="four_times_daily">Four times daily</SelectItem>
              <SelectItem value="every_4_hours">Every 4 hours</SelectItem>
              <SelectItem value="every_6_hours">Every 6 hours</SelectItem>
              <SelectItem value="every_8_hours">Every 8 hours</SelectItem>
              <SelectItem value="every_12_hours">Every 12 hours</SelectItem>
              <SelectItem value="as_needed">As needed (PRN)</SelectItem>
              <SelectItem value="bedtime">At bedtime</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-route`} className="text-xs">
            Route *
          </Label>
          <Select
            value={med.route}
            onValueChange={(value) => onUpdate("route", value)}
          >
            <SelectTrigger id={`${med.id}-route`} className="h-9">
              <SelectValue placeholder="Select route" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="oral">Oral</SelectItem>
              <SelectItem value="topical">Topical</SelectItem>
              <SelectItem value="injectable_im">Injectable (IM)</SelectItem>
              <SelectItem value="injectable_iv">Injectable (IV)</SelectItem>
              <SelectItem value="injectable_subq">Injectable (SubQ)</SelectItem>
              <SelectItem value="sublingual">Sublingual</SelectItem>
              <SelectItem value="transdermal">Transdermal (Patch)</SelectItem>
              <SelectItem value="inhalation">Inhalation</SelectItem>
              <SelectItem value="rectal">Rectal</SelectItem>
              <SelectItem value="ophthalmic">Ophthalmic (Eye)</SelectItem>
              <SelectItem value="otic">Otic (Ear)</SelectItem>
              <SelectItem value="nasal">Nasal</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-startDate`} className="text-xs">
            Start Date *
          </Label>
          <Input
            id={`${med.id}-startDate`}
            type="date"
            value={med.startDate}
            onChange={(e) => onUpdate("startDate", e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-endDate`} className="text-xs">
            End Date (if discontinued)
          </Label>
          <Input
            id={`${med.id}-endDate`}
            type="date"
            value={med.endDate}
            onChange={(e) => onUpdate("endDate", e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`${med.id}-pharmacy`} className="text-xs">
            Pharmacy Used *
          </Label>
          <Input
            id={`${med.id}-pharmacy`}
            value={med.pharmacy}
            onChange={(e) => onUpdate("pharmacy", e.target.value)}
            placeholder="e.g., CVS Pharmacy - Main St"
            className="h-9"
          />
        </div>

        <div className="space-y-1 md:col-span-2">
          <Label htmlFor={`${med.id}-notes`} className="text-xs">
            Additional Notes
          </Label>
          <Textarea
            id={`${med.id}-notes`}
            value={med.notes}
            onChange={(e) => onUpdate("notes", e.target.value)}
            placeholder="Any additional information about this medication..."
            rows={2}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Alert>
        <AlertDescription className="text-base">
          <strong>Medication & Treatment History:</strong> Please provide details about medications
          you were taking <strong>BEFORE</strong> your injury/illness and any <strong>NEW</strong> medications started <strong>AFTER</strong>. This
          helps your care team understand your complete treatment picture and identify any medication
          interactions or changes.
        </AlertDescription>
      </Alert>

      {/* Allergies - MOVED TO TOP */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Medication Allergies & Sensitivities
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            List any known medication allergies or sensitivities (CRITICAL for safe care)
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {allergies.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No allergies added yet. Click "Add Allergy" to add one, or skip if none known.
            </p>
          )}
          {allergies.map((allergy) => (
            <div
              key={allergy.id}
              className="p-4 border border-border rounded-lg space-y-3 bg-card"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold">Allergy Entry</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAllergy(allergy.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor={`${allergy.id}-medication`} className="text-xs">
                    Medication/Substance *
                  </Label>
                  <Input
                    id={`${allergy.id}-medication`}
                    value={allergy.medication}
                    onChange={(e) => updateAllergy(allergy.id, "medication", e.target.value)}
                    placeholder="e.g., Penicillin"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`${allergy.id}-reaction`} className="text-xs">
                    Reaction
                  </Label>
                  <Input
                    id={`${allergy.id}-reaction`}
                    value={allergy.reaction}
                    onChange={(e) => updateAllergy(allergy.id, "reaction", e.target.value)}
                    placeholder="e.g., Rash, Nausea"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`${allergy.id}-severity`} className="text-xs">
                    Severity *
                  </Label>
                  <Select
                    value={allergy.severity}
                    onValueChange={(value) => updateAllergy(allergy.id, "severity", value)}
                  >
                    <SelectTrigger id={`${allergy.id}-severity`} className="h-9">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="mild">Mild (minor discomfort)</SelectItem>
                      <SelectItem value="moderate">Moderate (significant reaction)</SelectItem>
                      <SelectItem value="severe">Severe (life-threatening)</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addAllergy}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Allergy
          </Button>
        </CardContent>
      </Card>

      {/* Pre-Injury Medications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Pre-Injury Medications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            List all medications you were taking BEFORE your injury/illness occurred
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {preInjuryMeds.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No pre-injury medications added yet. Click "Add Medication" to add one.
            </p>
          )}
          {preInjuryMeds.map((med) => (
            <MedicationForm
              key={med.id}
              med={med}
              onUpdate={(field, value) => updatePreInjuryMed(med.id, field, value)}
              onRemove={() => removePreInjuryMed(med.id)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addPreInjuryMed}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pre-Injury Medication
          </Button>
        </CardContent>
      </Card>

      {/* Post-Injury Medications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pill className="w-5 h-5 text-primary" />
            Post-Injury Medications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            List all NEW medications started AFTER your injury/illness occurred
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {postInjuryMeds.length === 0 && (
            <p className="text-sm text-muted-foreground italic">
              No post-injury medications added yet. Click "Add Medication" to add one.
            </p>
          )}
          {postInjuryMeds.map((med) => (
            <MedicationForm
              key={med.id}
              med={med}
              onUpdate={(field, value) => updatePostInjuryMed(med.id, field, value)}
              onRemove={() => removePostInjuryMed(med.id)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addPostInjuryMed}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Post-Injury Medication
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
