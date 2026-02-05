import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LabeledSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  className?: string;
}

export function LabeledSelect({
  label,
  value,
  onChange,
  options,
  className,
}: LabeledSelectProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, "-")}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={label.toLowerCase().replace(/\s+/g, "-")} className="bg-white border-border text-black">
          <SelectValue className="text-black" />
        </SelectTrigger>
        <SelectContent className="z-[60] bg-white border-border text-black shadow-lg [&>*]:bg-white [&>*]:text-black">
          {options.map((option) => (
            <SelectItem key={option} value={option} className="bg-white text-black focus:bg-gray-100 focus:text-black">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
