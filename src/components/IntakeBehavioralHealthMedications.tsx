import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Plus, X } from "lucide-react";

export interface BHMedicationEntry {
  id: string;
  name: string;
  dose: string;
  purpose: string;
  prescriber: string;
  startDate: string;
  timing: 'pre' | 'post';
}

interface IntakeBehavioralHealthMedicationsProps {
  preMedications: BHMedicationEntry[];
  postMedications: BHMedicationEntry[];
  onPreChange: (medications: BHMedicationEntry[]) => void;
  onPostChange: (medications: BHMedicationEntry[]) => void;
  showOnlyPre?: boolean;
  showOnlyPost?: boolean;
}

export function IntakeBehavioralHealthMedications({
  preMedications,
  postMedications,
  onPreChange,
  onPostChange,
  showOnlyPre = false,
  showOnlyPost = false,
}: IntakeBehavioralHealthMedicationsProps) {
  const addPreMedication = () => {
    onPreChange([...preMedications, { id: crypto.randomUUID(), name: '', dose: '', purpose: '', prescriber: '', startDate: '', timing: 'pre' }]);
  };

  const addPostMedication = () => {
    onPostChange([...postMedications, { id: crypto.randomUUID(), name: '', dose: '', purpose: '', prescriber: '', startDate: '', timing: 'post' }]);
  };

  const removePreMedication = (index: number) => {
    onPreChange(preMedications.filter((_, i) => i !== index));
  };

  const removePostMedication = (index: number) => {
    onPostChange(postMedications.filter((_, i) => i !== index));
  };

  const updatePreMedication = (index: number, field: keyof BHMedicationEntry, value: string) => {
    const updated = [...preMedications];
    updated[index] = { ...updated[index], [field]: value };
    onPreChange(updated);
  };

  const updatePostMedication = (index: number, field: keyof BHMedicationEntry, value: string) => {
    const updated = [...postMedications];
    updated[index] = { ...updated[index], [field]: value };
    onPostChange(updated);
  };

  return (
    <Card className="border-border">
      <CardContent className="p-6">
        {!showOnlyPre && !showOnlyPost && (
          <div className="flex items-start gap-3 mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Behavioral Health Medications</h4>
              <p className="text-sm text-black">
                List any medications for mental health conditions, both before and after the incident.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Pre-Injury Section */}
          {!showOnlyPost && (
            <div>
              {!showOnlyPre && (
                <h4 className="font-semibold text-base mb-4 text-black border-b pb-2">
                  Pre-Injury Mental Health Medications
                </h4>
              )}
            <div className="space-y-4">
              {preMedications.map((med, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-card relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removePreMedication(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`bh-pre-med-name-${index}`}>Medication Name*</Label>
                      <Input
                        id={`bh-pre-med-name-${index}`}
                        value={med.name}
                        onChange={(e) => updatePreMedication(index, 'name', e.target.value)}
                        placeholder="e.g., Sertraline"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bh-pre-med-dose-${index}`}>Dose/Strength</Label>
                      <Input
                        id={`bh-pre-med-dose-${index}`}
                        value={med.dose}
                        onChange={(e) => updatePreMedication(index, 'dose', e.target.value)}
                        placeholder="e.g., 50mg"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bh-pre-med-purpose-${index}`}>Purpose/Condition</Label>
                      <Input
                        id={`bh-pre-med-purpose-${index}`}
                        value={med.purpose}
                        onChange={(e) => updatePreMedication(index, 'purpose', e.target.value)}
                        placeholder="e.g., Anxiety"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bh-pre-med-prescriber-${index}`}>Prescriber</Label>
                      <Input
                        id={`bh-pre-med-prescriber-${index}`}
                        value={med.prescriber}
                        onChange={(e) => updatePreMedication(index, 'prescriber', e.target.value)}
                        placeholder="e.g., Dr. Anderson"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {preMedications.length === 0 && (
                <p className="text-sm text-black text-center py-4">
                  No pre-injury mental health medications added yet.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addPreMedication}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Pre-Injury Mental Health Medication
              </Button>
            </div>
          </div>
          )}

          {/* Post-Injury Section */}
          {!showOnlyPre && (
            <div>
              {!showOnlyPost && (
                <h4 className="font-semibold text-base mb-4 text-black border-b pb-2">
                  Post-Injury Mental Health Medications
                </h4>
              )}
            <div className="space-y-4">
              {postMedications.map((med, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3 bg-card relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removePostMedication(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`bh-post-med-name-${index}`}>Medication Name*</Label>
                      <Input
                        id={`bh-post-med-name-${index}`}
                        value={med.name}
                        onChange={(e) => updatePostMedication(index, 'name', e.target.value)}
                        placeholder="e.g., Alprazolam"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bh-post-med-dose-${index}`}>Dose/Strength</Label>
                      <Input
                        id={`bh-post-med-dose-${index}`}
                        value={med.dose}
                        onChange={(e) => updatePostMedication(index, 'dose', e.target.value)}
                        placeholder="e.g., 0.5mg"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bh-post-med-purpose-${index}`}>Purpose/Condition</Label>
                      <Input
                        id={`bh-post-med-purpose-${index}`}
                        value={med.purpose}
                        onChange={(e) => updatePostMedication(index, 'purpose', e.target.value)}
                        placeholder="e.g., Panic attacks"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`bh-post-med-prescriber-${index}`}>Prescriber</Label>
                      <Input
                        id={`bh-post-med-prescriber-${index}`}
                        value={med.prescriber}
                        onChange={(e) => updatePostMedication(index, 'prescriber', e.target.value)}
                        placeholder="e.g., Dr. Martinez"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {postMedications.length === 0 && (
                <p className="text-sm text-black text-center py-4">
                  No post-accident mental health medications added yet.
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                onClick={addPostMedication}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Post-Injury Mental Health Medication
              </Button>
            </div>
          </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
