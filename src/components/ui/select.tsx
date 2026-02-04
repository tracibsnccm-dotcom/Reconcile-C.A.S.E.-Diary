import * as React from "react";

const Select = ({ children, ...props }: React.ComponentProps<"select">) => (
  <select className="flex h-10 w-full rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" {...props}>
    {children}
  </select>
);

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }>(
  ({ className = "", children, ...props }, ref) => (
    <button ref={ref} type="button" className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-white ${className}`} {...props}>
      {children}
    </button>
  )
);
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder ?? "Select..."}</span>;

const SelectContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-md border border-slate-600 bg-slate-800 shadow-lg ${className}`}>{children}</div>
);

const SelectItem = ({ value, children, className = "" }: { value: string; children: React.ReactNode; className?: string }) => (
  <div data-value={value} className={`cursor-pointer px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white ${className}`}>
    {children}
  </div>
);

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
