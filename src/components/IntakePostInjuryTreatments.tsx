import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Plus, X } from "lucide-react";

export interface TreatmentEntry {
  id: string;
  provider: string;
  type: string;
  frequency: string;
  startDate: string;
  notes: string;
}

interface IntakePostInjuryTreatmentsProps {
  treatments: TreatmentEntry[];
  onChange: (treatments: TreatmentEntry[]) => void;
}

export function IntakePostInjuryTreatments({
  treatments,
  onChange,
}: IntakePostInjuryTreatmentsProps) {
  const addTreatment = () => {
    onChange([...treatments, { id: crypto.randomUUID(), provider: '', type: '', frequency: '', startDate: '', notes: '' }]);
  };

  const removeTreatment = (index: number) => {
    onChange(treatments.filter((_, i) => i !== index));
  };

  const updateTreatment = (index: number, field: keyof TreatmentEntry, value: string) => {
    const updated = [...treatments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm mb-1">Post-Injury Treatment & Services</h4>
            <p className="text-sm text-muted-foreground">
              List treatments or services you've started receiving after the incident.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {treatments.map((treatment, index) => (
            <div key={treatment.id} className="p-4 border rounded-lg space-y-3 bg-card relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removeTreatment(index)}
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`post-treatment-provider-${index}`}>Provider/Facility</Label>
                  <Input
                    id={`post-treatment-provider-${index}`}
                    value={treatment.provider}
                    onChange={(e) => updateTreatment(index, 'provider', e.target.value)}
                    placeholder="e.g., City Hospital PT"
                  />
                </div>
                <div>
                  <Label htmlFor={`post-treatment-type-${index}`}>Type of Treatment</Label>
                  <Input
                    id={`post-treatment-type-${index}`}
                    value={treatment.type}
                    onChange={(e) => updateTreatment(index, 'type', e.target.value)}
                    placeholder="e.g., Chiropractic Care"
                  />
                </div>
                <div>
                  <Label htmlFor={`post-treatment-frequency-${index}`}>Frequency</Label>
                  <Input
                    id={`post-treatment-frequency-${index}`}
                    value={treatment.frequency}
                    onChange={(e) => updateTreatment(index, 'frequency', e.target.value)}
                    placeholder="e.g., 3x per week"
                  />
                </div>
                <div>
                  <Label htmlFor={`post-treatment-start-${index}`}>Start Date</Label>
                  <Input
                    id={`post-treatment-start-${index}`}
                    type="date"
                    value={treatment.startDate}
                    onChange={(e) => updateTreatment(index, 'startDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}

          {treatments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No post-injury treatments or services added yet.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addTreatment}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Post-Injury Treatment/Service
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
