import { AlertTriangle } from "lucide-react";
import { CONSENT_BLOCKED_TITLE } from "@/config/clientMessaging";

interface ConsentBlockedBannerProps {
  reason: string;
}

export function ConsentBlockedBanner({ reason }: ConsentBlockedBannerProps) {
  return (
    <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <div className="font-semibold text-destructive text-sm">
          {CONSENT_BLOCKED_TITLE}
        </div>
        <div className="text-sm text-destructive/90 mt-1">
          {reason}
        </div>
      </div>
    </div>
  );
}
