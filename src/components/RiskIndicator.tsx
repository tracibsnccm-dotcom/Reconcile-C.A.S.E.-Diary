import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";

export type RiskLevel = "stable" | "at_risk" | "critical";

interface RiskIndicatorProps {
  level: RiskLevel;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RiskIndicator({ 
  level, 
  showLabel = false, 
  size = "md",
  className 
}: RiskIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const config = {
    stable: {
      color: "bg-green-500",
      icon: CheckCircle,
      label: "Stable",
      textColor: "text-green-600"
    },
    at_risk: {
      color: "bg-yellow-500",
      icon: AlertTriangle,
      label: "At Risk",
      textColor: "text-yellow-600"
    },
    critical: {
      color: "bg-red-500",
      icon: AlertCircle,
      label: "Critical",
      textColor: "text-red-600"
    }
  };

  const { color, icon: Icon, label, textColor } = config[level];

  if (showLabel) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className={cn("rounded-full", color, sizeClasses[size])} />
        <span className={cn("text-xs font-medium", textColor)}>{label}</span>
      </div>
    );
  }

  return (
    <span 
      className={cn(
        "rounded-full inline-block",
        color,
        sizeClasses[size],
        className
      )}
      title={label}
    />
  );
}
