import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmergencyAlertBlockerProps {
  open: boolean;
  onClose: () => void;
  attemptCount: number;
}

export function EmergencyAlertBlocker({ open, onClose, attemptCount }: EmergencyAlertBlockerProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          {/* Large Red Circle with Line Through It */}
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 rounded-full border-8 border-red-600 bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>
            {/* Diagonal line through circle */}
            <div 
              className="absolute top-0 left-1/2 h-full w-2 bg-red-600 origin-center"
              style={{
                transform: "translateX(-50%) rotate(45deg)"
              }}
            />
          </div>

          {/* Warning Message */}
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-600 uppercase tracking-tight">
              Access Restricted
            </h2>
            <p className="text-lg font-semibold text-foreground px-4 leading-tight">
              YOU MUST COMPLETE ANY AND ALL EMERGENCY ALERTS BEFORE PROCEEDING!
            </p>

            {attemptCount > 0 && (
              <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-3 mt-4">
                <p className="text-sm font-medium text-amber-800">
                  Attempt {attemptCount} of 3
                </p>
                {attemptCount === 2 && (
                  <p className="text-xs text-amber-700 mt-1">
                    One more attempt will notify your supervisor
                  </p>
                )}
              </div>
            )}

            {attemptCount >= 3 && (
              <div className="bg-red-50 border-2 border-red-500 rounded-lg p-3 mt-4">
                <p className="text-sm font-bold text-red-800">
                  Your supervisor has been notified
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Please complete all emergency alerts immediately
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button 
            onClick={onClose}
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8"
          >
            Return to Emergency Alerts
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
