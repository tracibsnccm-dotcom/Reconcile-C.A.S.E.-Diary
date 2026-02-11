import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Circle, Clock, AlertTriangle, CheckCircle2, Archive } from "lucide-react";

export type StatusType = 
  | "New" 
  | "Acknowledged" 
  | "Assigned" 
  | "Follow-Up Logged" 
  | "Resolved" 
  | "Overdue" 
  | "Archived"
  | "new"
  | "under_investigation"
  | "resolved";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, className, showIcon = true }: StatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status);
  const config = getStatusConfig(normalizedStatus);

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium",
        config.className,
        className
      )}
    >
      {showIcon && <config.icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  );
}

function normalizeStatus(status: string): StatusType {
  const statusMap: Record<string, StatusType> = {
    'Open': 'New',
    'new': 'New',
    'Under Review': 'Acknowledged',
    'under_investigation': 'Acknowledged',
    'acknowledged': 'Acknowledged',
    'Assigned': 'Assigned',
    'assigned': 'Assigned',
    'Follow-Up Logged': 'Follow-Up Logged',
    'follow_up_logged': 'Follow-Up Logged',
    'Resolved': 'Resolved',
    'resolved': 'Resolved',
    'Overdue': 'Overdue',
    'overdue': 'Overdue',
    'Archived': 'Archived',
    'archived': 'Archived',
  };

  return statusMap[status] || 'New';
}

function getStatusConfig(status: StatusType) {
  const configs = {
    'New': {
      label: 'New',
      icon: Circle,
      className: 'bg-[hsl(var(--chart-1))]/10 text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1))]/20'
    },
    'Acknowledged': {
      label: 'Acknowledged',
      icon: CheckCircle2,
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20'
    },
    'Assigned': {
      label: 'Assigned',
      icon: Clock,
      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20'
    },
    'Follow-Up Logged': {
      label: 'Follow-Up Logged',
      icon: CheckCircle2,
      className: 'bg-teal-500/10 text-teal-600 border-teal-500/20'
    },
    'Resolved': {
      label: 'Resolved',
      icon: CheckCircle2,
      className: 'bg-success/10 text-success border-success/20'
    },
    'Overdue': {
      label: 'Overdue',
      icon: AlertTriangle,
      className: 'bg-destructive/10 text-destructive border-destructive/20'
    },
    'Archived': {
      label: 'Archived',
      icon: Archive,
      className: 'bg-muted text-muted-foreground border-muted'
    },
  };

  return configs[status] || configs['New'];
}

export function getStatusProgress(status: string): number {
  const progressMap: Record<string, number> = {
    'New': 20,
    'Acknowledged': 40,
    'Assigned': 60,
    'Follow-Up Logged': 80,
    'Resolved': 100,
    'Overdue': 0,
    'Archived': 100,
  };

  const normalized = normalizeStatus(status);
  return progressMap[normalized] || 0;
}
