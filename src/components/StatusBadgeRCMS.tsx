import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type BadgeStatus =
  | "pending"
  | "approved"
  | "completed"
  | "resolved"
  | "filed"
  | "closed"
  | "urgent"
  | "escalated"
  | "awaiting_provider"
  | "follow_up_needed"
  | "in_progress"
  | "deferred"
  | "declined"
  | "open";

interface StatusBadgeRCMSProps {
  status: BadgeStatus;
  lastUpdate?: string;
  updatedBy?: string;
  className?: string;
}

// Reconcile C.A.R.E. brand colors
const COLORS = {
  gold: "#b09837",
  teal: "#128f8b",
  navy: "#0f2a6a",
  coral: "#ff7b7b",
  paleGold: "#faf4d6",
  white: "#ffffff",
  black: "#000000",
};

const STATUS_CONFIG: Record<
  BadgeStatus,
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: COLORS.gold,
    text: COLORS.white,
    label: "Pending Review",
  },
  approved: {
    bg: COLORS.teal,
    text: COLORS.white,
    label: "Approved",
  },
  completed: {
    bg: COLORS.teal,
    text: COLORS.white,
    label: "Completed",
  },
  resolved: {
    bg: COLORS.teal,
    text: COLORS.white,
    label: "Resolved",
  },
  filed: {
    bg: COLORS.navy,
    text: COLORS.white,
    label: "Filed",
  },
  closed: {
    bg: COLORS.navy,
    text: COLORS.white,
    label: "Closed",
  },
  urgent: {
    bg: COLORS.coral,
    text: COLORS.white,
    label: "Urgent",
  },
  escalated: {
    bg: COLORS.coral,
    text: COLORS.white,
    label: "Escalated",
  },
  awaiting_provider: {
    bg: COLORS.gold,
    text: COLORS.navy,
    label: "Awaiting Provider Response",
  },
  follow_up_needed: {
    bg: COLORS.gold,
    text: COLORS.white,
    label: "Follow-Up Needed",
  },
  in_progress: {
    bg: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.teal})`,
    text: COLORS.white,
    label: "In Progress",
  },
  deferred: {
    bg: COLORS.paleGold,
    text: COLORS.black,
    label: "Deferred / On Hold",
  },
  declined: {
    bg: COLORS.coral,
    text: COLORS.white,
    label: "Declined",
  },
  open: {
    bg: COLORS.gold,
    text: COLORS.white,
    label: "Open",
  },
};

export function StatusBadgeRCMS({
  status,
  lastUpdate,
  updatedBy,
  className,
}: StatusBadgeRCMSProps) {
  const config = STATUS_CONFIG[status];
  const isGradient = status === "in_progress";

  const tooltipText = [
    `Status: ${config.label}`,
    lastUpdate && `Updated ${lastUpdate}`,
    updatedBy && `by ${updatedBy}`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
            "shadow-sm hover:shadow-md hover:scale-105",
            "cursor-default select-none",
            className
          )}
          style={{
            background: isGradient ? config.bg : undefined,
            backgroundColor: !isGradient ? config.bg : undefined,
            color: config.text,
          }}
          role="status"
          aria-label={tooltipText}
        >
          {config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">{tooltipText}</p>
      </TooltipContent>
    </Tooltip>
  );
}
