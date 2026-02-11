import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LabeledTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
}

export function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
  className,
  maxLength = 1000,
  rows = 4,
}: LabeledTextareaProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={label.toLowerCase().replace(/\s+/g, "-")}>{label}</Label>
        {maxLength && (
          <span className="text-xs text-muted-foreground">
            {value.length} / {maxLength}
          </span>
        )}
      </div>
      <Textarea
        id={label.toLowerCase().replace(/\s+/g, "-")}
        value={value}
        onChange={(e) => {
          const newValue = e.target.value;
          if (!maxLength || newValue.length <= maxLength) {
            onChange(newValue);
          }
        }}
        placeholder={placeholder}
        rows={rows}
        className="resize-none"
      />
    </div>
  );
}
