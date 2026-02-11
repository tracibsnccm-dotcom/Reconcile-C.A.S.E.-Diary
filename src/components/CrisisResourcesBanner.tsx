import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Phone, AlertTriangle } from "lucide-react";

interface CrisisResourcesBannerProps {
  showAlert: boolean;
}

export function CrisisResourcesBanner({ showAlert }: CrisisResourcesBannerProps) {
  if (!showAlert) return null;

  return (
    <Alert className="border-red-500 bg-red-50">
      <AlertTriangle className="h-5 w-5 text-red-600" />
      <AlertDescription className="ml-2">
        <div className="space-y-3">
          <p className="font-semibold text-red-900">
            We noticed you're experiencing high distress levels. Help is available 24/7.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-100"
              onClick={() => window.open("tel:988", "_self")}
            >
              <Phone className="w-4 h-4 mr-2" />
              988 Suicide & Crisis Lifeline
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-100"
              onClick={() => window.open("sms:741741", "_self")}
            >
              <Phone className="w-4 h-4 mr-2" />
              Text HOME to 741741 (Crisis Text Line)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-600 text-red-600 hover:bg-red-100"
              onClick={() => window.open("tel:911", "_self")}
            >
              <Phone className="w-4 h-4 mr-2" />
              911 Emergency Services
            </Button>
          </div>
          <p className="text-xs text-red-800">
            Your well-being is our priority. These resources are completely confidential and free.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
