interface KPIProps {
  label: string;
  value: string;
  note?: string;
}

export function KPI({ label, value, note }: KPIProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-foreground flex items-center gap-2">
        <span className="text-[hsl(var(--rcms-teal))]">●</span>
        {value}
      </p>
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}
