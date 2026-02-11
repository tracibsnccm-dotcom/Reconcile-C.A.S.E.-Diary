import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Bus, 
  DollarSign, 
  Baby, 
  Briefcase, 
  Heart, 
  Home, 
  Languages, 
  Laptop, 
  Shield,
  MoreHorizontal 
} from "lucide-react";

export type SDOHFlag = 
  | "Transportation"
  | "Money/Cost"
  | "Child/Elder Care"
  | "Work Schedule"
  | "Illness"
  | "Housing Instability"
  | "Language/Interpreter"
  | "Technology/Access"
  | "Safety/Violence"
  | "Other";

interface SDOHChipProps {
  flag: SDOHFlag;
  className?: string;
}

const SDOH_CONFIG: Record<SDOHFlag, { 
  icon: typeof Bus; 
  className: string;
}> = {
  "Transportation": {
    icon: Bus,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "Money/Cost": {
    icon: DollarSign,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "Child/Elder Care": {
    icon: Baby,
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  "Work Schedule": {
    icon: Briefcase,
    className: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  "Illness": {
    icon: Heart,
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  "Housing Instability": {
    icon: Home,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  "Language/Interpreter": {
    icon: Languages,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  "Technology/Access": {
    icon: Laptop,
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  "Safety/Violence": {
    icon: Shield,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  "Other": {
    icon: MoreHorizontal,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
};

export function SDOHChip({ flag, className }: SDOHChipProps) {
  const config = SDOH_CONFIG[flag];
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium gap-1 px-2 py-1",
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {flag}
    </Badge>
  );
}
