import { Calendar, UserCheck, FileText, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function IntakeNextStepsTimeline() {
  const steps = [
    {
      day: "Day 1",
      title: "Intake Submitted",
      description: "Your information is securely received and begins review",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100",
      borderColor: "border-green-300"
    },
    {
      day: "Days 1-2",
      title: "RN Care Manager Review",
      description: "Your RN Care Manager reviews your assessment and case details",
      icon: UserCheck,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      borderColor: "border-blue-300"
    },
    {
      day: "Days 2-3",
      title: "Initial Contact",
      description: "Your RN Care Manager will reach out to introduce themselves",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-300"
    },
    {
      day: "Week 1",
      title: "Care Plan Created",
      description: "Preliminary care plan developed based on your needs",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      borderColor: "border-orange-300"
    }
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-foreground mb-1">What Happens Next</h3>
        <p className="text-sm text-muted-foreground">Your journey from submission to care plan</p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-green-300 via-blue-300 to-orange-300" />

        {/* Timeline steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div key={index} className="relative flex gap-4">
              {/* Icon circle */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${step.bgColor} border-2 ${step.borderColor} flex items-center justify-center z-10`}>
                <step.icon className={`w-5 h-5 ${step.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-primary">{step.day}</span>
                  <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
        <p className="text-sm text-muted-foreground text-center">
          <strong className="text-foreground">Remember:</strong> You can log into your Client Portal anytime to track progress and update information.
        </p>
      </div>
    </Card>
  );
}
