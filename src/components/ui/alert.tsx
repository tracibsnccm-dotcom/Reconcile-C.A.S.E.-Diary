import * as React from "react";

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }
>(({ className = "", variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={`rounded-lg border p-4 text-sm ${
      variant === "destructive"
        ? "border-red-700 bg-red-900/20 text-red-400"
        : "border-slate-600 bg-slate-800/50 text-slate-300"
    } ${className}`}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className = "", ...props }, ref) => <p ref={ref} className={`${className}`} {...props} />
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
