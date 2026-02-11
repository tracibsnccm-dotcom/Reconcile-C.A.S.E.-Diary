/**
 * RN-only: Last Active Case shortcut banner.
 * Renders on Dashboard and Work Queue when user has a stored last active case.
 * UUID-safe: navigates via last_route or /rn/case/:uuid/ten-vs only.
 */

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight } from "lucide-react";
import {
  useLastActiveCase,
  type LastActiveCase,
} from "@/lib/rnLastActiveCase";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const TOOLTIP =
  "Quickly return to the case you were most recently working in. This does not track your activity history.";

function getReturnRoute(last: LastActiveCase): string {
  if (last.last_route) return last.last_route;
  return `/rn/case/${last.case_id}/ten-vs`;
}

export interface LastActiveCaseBannerProps {
  rnUserId: string | null | undefined;
  className?: string;
  variant?: "dashboard" | "queue";
}

export function LastActiveCaseBanner({
  rnUserId,
  className = "",
  variant = "dashboard",
}: LastActiveCaseBannerProps) {
  const navigate = useNavigate();
  const { lastActive } = useLastActiveCase(rnUserId);

  if (!rnUserId || !lastActive) return null;

  const to = getReturnRoute(lastActive);

  return (
    <div
      className={`rounded-lg border border-border bg-card px-3 py-2 flex flex-wrap items-center justify-between gap-2 ${className}`}
      role="region"
      aria-label="Last active case shortcut"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          Last active case
        </span>
        <span className="text-sm font-medium text-foreground truncate">
          {lastActive.case_label}
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info
                className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-help"
                aria-label={TOOLTIP}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px]">
              {TOOLTIP}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1.5 h-8"
        onClick={() => navigate(to)}
      >
        Return to case
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
