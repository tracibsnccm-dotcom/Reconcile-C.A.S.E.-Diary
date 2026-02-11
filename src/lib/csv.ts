// src/lib/csv.ts

export type CsvRow = (string | number | null | undefined)[];

function csvEscape(cell: string): string {
  // Escape quotes and wrap with quotes if needed
  const needsWrap = /[",\n]/.test(cell);
  const escaped = cell.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
}

export function toCsv(headers: string[], rows: CsvRow[]): string {
  const headLine = headers.map(h => csvEscape(String(h))).join(",");
  const lines = rows.map(r =>
    r.map(v => v == null ? "" : csvEscape(String(v))).join(",")
  );
  return [headLine, ...lines].join("\n");
}
