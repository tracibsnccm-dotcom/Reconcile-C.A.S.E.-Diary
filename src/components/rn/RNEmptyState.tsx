/**
 * RN-only empty, error, and loading state component.
 * Use for: no case selected, case not found, fetch errors, loading, timeout.
 * Do not use from Attorney or Client code.
 */

import { type ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Inbox, AlertCircle } from "lucide-react";

export type RNEmptyStateVariant = "empty" | "error" | "loading";

export interface RNEmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface RNEmptyStateProps {
  title: string;
  message: string | ReactNode;
  actions?: RNEmptyStateAction[] | ReactNode;
  variant?: RNEmptyStateVariant;
}

const ICONS = {
  empty: Inbox,
  error: AlertCircle,
  loading: Loader2,
};

const WRAPPER_CLASS = {
  empty: "border-slate-200 bg-slate-50/50",
  error: "border-red-200 bg-red-50/50",
  loading: "border-slate-200 bg-slate-50/50",
};

export function RNEmptyState({
  title,
  message,
  actions,
  variant = "empty",
}: RNEmptyStateProps) {
  const Icon = ICONS[variant];
  const wrapperClass = WRAPPER_CLASS[variant];

  return (
    <Card className={`max-w-md mx-auto ${wrapperClass}`}>
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col items-center text-center gap-3">
          <div
            className={
              variant === "error"
                ? "text-red-600"
                : variant === "loading"
                  ? "text-slate-500"
                  : "text-slate-500"
            }
          >
            {variant === "loading" ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              <Icon className="h-10 w-10" />
            )}
          </div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <div
            className={
              "text-sm " +
              (variant === "error" ? "text-red-800" : "text-slate-600")
            }
          >
            {message}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {Array.isArray(actions)
                ? actions.map((a, i) => (
                    <Button
                      key={i}
                      variant={variant === "error" && i === 0 ? "default" : "outline"}
                      size="sm"
                      onClick={a.onClick}
                    >
                      {a.label}
                    </Button>
                  ))
                : actions}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
