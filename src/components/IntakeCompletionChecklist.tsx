import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IntakeCompletionChecklistProps {
  hasPersonalInfo: boolean;
  hasIncidentDetails: boolean;
  hasAssessment: boolean;
  hasMedications: boolean;
  hasConsent: boolean;
}

export function IntakeCompletionChecklist({
  hasPersonalInfo,
  hasIncidentDetails,
  hasAssessment,
  hasMedications,
  hasConsent,
}: IntakeCompletionChecklistProps) {
  const items = [
    { label: "Personal Information", completed: hasPersonalInfo },
    { label: "Incident/Injury Overview", completed: hasIncidentDetails },
    { label: "Assessment Snapshot", completed: hasAssessment },
    { label: "Medications & Treatments", completed: hasMedications },
    { label: "Consent Signed", completed: hasConsent },
  ];

  const completedCount = items.filter(item => item.completed).length;
  const allComplete = completedCount === items.length;

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-black">Intake Completion Status</h3>
        <Badge 
          variant={allComplete ? "default" : "secondary"}
          className={allComplete ? "bg-green-600 text-white" : ""}
        >
          {completedCount} of {items.length} Complete
        </Badge>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-100"
          >
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
              item.completed 
                ? "bg-green-600 text-white" 
                : "bg-gray-200 text-black"
            }`}>
              {item.completed && <Check className="w-4 h-4" />}
            </div>
            <span className={`text-sm font-medium ${
              item.completed ? "text-black" : "text-black"
            }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {allComplete && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg">
          <p className="text-sm font-semibold text-green-800 text-center">
            ✓ All sections complete! You're ready to submit.
          </p>
        </div>
      )}
    </Card>
  );
}
