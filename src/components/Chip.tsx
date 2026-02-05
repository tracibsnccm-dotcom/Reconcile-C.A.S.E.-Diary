import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary-dark"
          : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
      )}
      aria-pressed={active}
    >
      {label}
      {active && <X className="w-3 h-3" />}
    </button>
  );
}
