// src/components/intake/OverlayQuestionsSection.tsx
// Client Block 3: render overlay question inputs. No branching, no scoring.

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import type { OverlayQuestion } from "@/config/overlayQuestions";

// ——— Normalization helpers (bulletproof against invalid answers) ———
function normalizeString(val: unknown): string {
  return typeof val === "string" ? val : "";
}

function normalizeBoolean(val: unknown): boolean {
  return val === true;
}

function normalizeNumber(val: unknown): number | "" {
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  if (typeof val === "string" && val !== "") {
    const n = Number(val);
    if (!Number.isNaN(n)) return n;
  }
  return "";
}

function normalizeDate(val: unknown): string {
  return typeof val === "string" ? val : "";
}

function ensureOptions(q: { options?: { value: string; label: string }[] }): { value: string; label: string }[] {
  return q?.options && Array.isArray(q.options) ? q.options : [];
}

export type OverlayQuestionsSectionProps = {
  questions: OverlayQuestion[];
  answers: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
};

export function OverlayQuestionsSection({
  questions,
  answers,
  onChange,
}: OverlayQuestionsSectionProps) {
  if (questions == null) return null;

  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-foreground">Additional Questions</h4>
      <p className="text-sm text-black">
        Optional. These help us tailor outreach and resources.
      </p>
      {questions.map((q) => {
        if (!q || typeof q.key !== "string") return null;
        const id = `overlay-${q.key.replace(/\./g, "-")}`;

        if (q.type === "text") {
          const value = normalizeString(answers[q.key]);
          return (
            <div key={q.key} className="space-y-2">
              <Label htmlFor={id}>{q.label}</Label>
              {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
              <Input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(q.key, e.target.value)}
              />
            </div>
          );
        }
        if (q.type === "textarea") {
          const value = normalizeString(answers[q.key]);
          return (
            <div key={q.key} className="space-y-2">
              <Label htmlFor={id}>{q.label}</Label>
              {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
              <Textarea
                id={id}
                value={value}
                onChange={(e) => onChange(q.key, e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          );
        }
        if (q.type === "select") {
          const value = normalizeString(answers[q.key]);
          const options = ensureOptions(q);
          const validOpts = options.filter((o) => o && typeof o.value === "string" && o.value !== "");

          if (validOpts.length === 0) {
            return (
              <div key={q.key} className="space-y-2">
                <Label htmlFor={id}>{q.label}</Label>
                {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
                <Input id={id} disabled placeholder="Options not available" className="bg-muted" />
              </div>
            );
          }
          const allowed = new Set(validOpts.map((o) => o.value));
          const safeValue = allowed.has(value) ? value : "";
          return (
            <div key={q.key} className="space-y-2">
              <Label htmlFor={id}>{q.label}</Label>
              {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
              <Select value={safeValue} onValueChange={(v) => onChange(q.key, v)}>
                <SelectTrigger id={id} className="bg-background border-border">
                  <SelectValue placeholder="Select (optional)" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  {validOpts.map((opt) => (
                    <SelectItem key={`${q.key}-${opt.value}-${opt.label}`} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        if (q.type === "radio") {
          const value = normalizeString(answers[q.key]);
          const options = ensureOptions(q);
          const validOpts = options.filter((o) => o && typeof o.value === "string");

          if (validOpts.length === 0) {
            return (
              <div key={q.key} className="space-y-2">
                <Label>{q.label}</Label>
                {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
                <Input disabled placeholder="Options not available" className="bg-muted" />
              </div>
            );
          }
          const allowed = new Set(validOpts.map((o) => o.value));
          const safeValue = allowed.has(value) ? value : "";
          return (
            <div key={q.key} className="space-y-2">
              <Label>{q.label}</Label>
              {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
              <RadioGroup
                value={safeValue}
                onValueChange={(v) => onChange(q.key, v)}
                className="flex flex-col gap-2"
              >
                {validOpts.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`${id}-${opt.value}`} />
                    <Label htmlFor={`${id}-${opt.value}`} className="font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        }
        if (q.type === "checkbox") {
          const checked = normalizeBoolean(answers[q.key]);
          return (
            <div key={q.key} className="flex items-center gap-2">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={(c) => onChange(q.key, c === true)}
              />
              <Label htmlFor={id} className="font-normal cursor-pointer">
                {q.label}
                {q.helpText && <span className="text-black font-normal"> — {q.helpText}</span>}
              </Label>
            </div>
          );
        }
        if (q.type === "number") {
          const num = normalizeNumber(answers[q.key]);
          return (
            <div key={q.key} className="space-y-2">
              <Label htmlFor={id}>{q.label}</Label>
              {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
              <Input
                id={id}
                type="number"
                value={typeof num === "number" ? String(num) : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  onChange(q.key, v === "" ? undefined : Number(v));
                }}
              />
            </div>
          );
        }
        if (q.type === "date") {
          const value = normalizeDate(answers[q.key]);
          return (
            <div key={q.key} className="space-y-2">
              <Label htmlFor={id}>{q.label}</Label>
              {q.helpText && <p className="text-xs text-black">{q.helpText}</p>}
              <Input
                id={id}
                type="date"
                value={value}
                onChange={(e) => onChange(q.key, e.target.value)}
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
