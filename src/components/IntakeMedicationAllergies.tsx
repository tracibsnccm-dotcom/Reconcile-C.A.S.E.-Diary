import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Plus, X, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AllergyEntry {
  id: string;
  medication: string;
  reaction: string;
  severity: string;
}

interface IntakeMedicationAllergiesProps {
  allergies: AllergyEntry[];
  onChange: (allergies: AllergyEntry[]) => void;
}

export function IntakeMedicationAllergies({
  allergies,
  onChange,
}: IntakeMedicationAllergiesProps) {
  const addAllergy = () => {
    onChange([...allergies, { id: crypto.randomUUID(), medication: '', reaction: '', severity: 'mild' }]);
  };

  const removeAllergy = (index: number) => {
    onChange(allergies.filter((_, i) => i !== index));
  };

  const updateAllergy = (index: number, field: keyof AllergyEntry, value: string) => {
    const updated = [...allergies];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-destructive/10 rounded-lg border border-destructive/30">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">Medication Allergies & Sensitivities</h4>
            <p className="text-sm text-muted-foreground">
              List any medications you are allergic to or have had negative reactions with. This is critical for your safety.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {allergies.map((allergy, index) => (
            <div key={allergy.id} className="p-4 border border-destructive/20 rounded-lg space-y-3 bg-card relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeAllergy(index)}
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor={`allergy-med-${index}`}>Medication/Substance*</Label>
                  <Input
                    id={`allergy-med-${index}`}
                    value={allergy.medication}
                    onChange={(e) => updateAllergy(index, 'medication', e.target.value)}
                    placeholder="e.g., Penicillin"
                  />
                </div>
                <div>
                  <Label htmlFor={`allergy-reaction-${index}`}>Reaction</Label>
                  <Input
                    id={`allergy-reaction-${index}`}
                    value={allergy.reaction}
                    onChange={(e) => updateAllergy(index, 'reaction', e.target.value)}
                    placeholder="e.g., Hives, swelling"
                  />
                </div>
                <div>
                  <Label htmlFor={`allergy-severity-${index}`}>Severity</Label>
                  <Select
                    value={allergy.severity}
                    onValueChange={(value) => updateAllergy(index, 'severity', value)}
                  >
                    <SelectTrigger id={`allergy-severity-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mild">Mild</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                      <SelectItem value="anaphylaxis">Anaphylaxis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          {allergies.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No known medication allergies or sensitivities.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addAllergy}
            className="w-full border-destructive/30 hover:bg-destructive/5"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Medication Allergy/Sensitivity
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
