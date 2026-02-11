import React from "react";

/** ─────────────────────────── Roles & Permissions (adjust if needed) ─────────────────────────── */
export type Role = "CLIENT" | "ATTORNEY" | "RN_CM" | "CLINICAL_STAFF_EXTERNAL" | "RCMS_CLINICAL_MGMT" | "RN_CM_DIRECTOR" | "COMPLIANCE" | "STAFF" | "RCMS_STAFF" | "SUPER_USER" | "SUPER_ADMIN";

const EXPORT_ALLOWED: Role[] = ["RN_CM", "RCMS_CLINICAL_MGMT", "RN_CM_DIRECTOR", "COMPLIANCE", "SUPER_USER", "SUPER_ADMIN"]; // keep attorneys out for clinical CSVs

export function exportAllowed(role: Role | undefined) {
  return !!role && EXPORT_ALLOWED.includes(role);
}

/** ─────────────────────────── Data Shapes (adapt to your app state) ─────────────────────────── */
// Minimal shape for the new intake/RN-notes block
export type MedsConditionsRecord = {
  caseId: string;
  clientLabel?: string;       // masked name or initials; ok to leave blank
  dateISO?: string;           // when captured
  // intake or RN notes fields
  conditions?: string;
  meds?: string;              // full list (Rx/OTC/vitamins/supplements/herbals)
  allergies?: string;
  attested?: boolean;
  // coordination
  shareWithPCP?: boolean | null; // null = not answered
  pcpName?: string;
};

// A dataset is just an array of case rows (e.g., from AppContext, mock, or filtered view)
export type Dataset = MedsConditionsRecord[];

/** ─────────────────────────── CSV Export (role-gated) ─────────────────────────── */
export function toCSV(rows: Dataset): string {
  const headers = [
    "case_id",
    "client_label",
    "date_iso",
    "conditions",
    "med_list_full",
    "allergies",
    "attested",
    "share_with_pcp",
    "pcp_name",
  ];
  const escape = (v: any) => {
    if (v == null) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.caseId ?? "",
        r.clientLabel ?? "",
        r.dateISO ?? "",
        r.conditions ?? "",
        r.meds ?? "",
        r.allergies ?? "",
        r.attested === true ? "YES" : r.attested === false ? "NO" : "",
        r.shareWithPCP === true ? "YES" : r.shareWithPCP === false ? "NO" : "",
        r.pcpName ?? "",
      ].map(escape).join(",")
    );
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

/** Small UI helper: a role-gated button you can drop anywhere */
export function ExportMedsCSVButton({
  role,
  data,
  filename = "rcms_meds_conditions_export.csv",
  className = "rounded-md bg-secondary text-secondary-foreground px-3 py-2 font-semibold hover:brightness-110",
}: {
  role?: Role;
  data: Dataset;
  filename?: string;
  className?: string;
}) {
  const disabled = !exportAllowed(role) || !data?.length;
  return (
    <button
      className={disabled ? "rounded-md bg-muted text-muted-foreground px-3 py-2 font-semibold cursor-not-allowed" : className}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        const csv = toCSV(data);
        downloadCSV(filename, csv);
      }}
      aria-disabled={disabled}
      title={
        !exportAllowed(role)
          ? "Exports allowed only for RN_CCM, SUPER_USER, SUPER_ADMIN"
          : !data?.length
          ? "No data to export"
          : "Download CSV"
      }
    >
      Export Meds/Conditions CSV
    </button>
  );
}

/** ─────────────────────────── RN Quality Metrics ─────────────────────────── */
/**
 * We'll treat "complete medication reconciliation" as:
 *  - meds present (not empty/"none") AND attested = true
 *  - allergies present (not empty/"none")
 * Adjust logic as you like.
 */
const isNone = (s?: string) => (s ?? "").trim().toLowerCase() === "none";
const hasText = (s?: string) => (s ?? "").trim().length > 0;

export function calcQualityMetrics(data: Dataset) {
  const total = data.length || 0;
  let medsComplete = 0;
  let allergiesDocumented = 0;
  let pcpOptIn = 0;

  for (const r of data) {
    const medsOk = hasText(r.meds) && !isNone(r.meds) && r.attested === true;
    const allergiesOk = hasText(r.allergies) && (r.allergies?.trim() !== "") && true; // allow "None" as explicit answer if you prefer
    const pcpOk = r.shareWithPCP === true;

    if (medsOk) medsComplete++;
    if (allergiesOk) allergiesDocumented++;
    if (pcpOk) pcpOptIn++;
  }

  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return {
    totalRows: total,
    medsReconciliationComplete: medsComplete,
    medsReconciliationCompletePct: pct(medsComplete),
    allergiesDocumented: allergiesDocumented,
    allergiesDocumentedPct: pct(allergiesDocumented),
    pcpShareOptIn: pcpOptIn,
    pcpShareOptInPct: pct(pcpOptIn),
  };
}

/** ─────────────────────────── Mini example component (optional) ─────────────────────────── */
export function RNQualitySummary({
  role,
  data,
}: {
  role?: Role;
  data: Dataset;
}) {
  const m = calcQualityMetrics(data);
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 text-foreground">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold">RN Quality Summary</h4>
        <ExportMedsCSVButton role={role} data={data} />
      </div>
      <ul className="text-sm space-y-1">
        <li>
          <span className="font-semibold">Total reviewed cases:</span> {m.totalRows}
        </li>
        <li>
          <span className="font-semibold">Med reconciliation complete:</span> {m.medsReconciliationComplete} ({m.medsReconciliationCompletePct}%)
        </li>
        <li>
          <span className="font-semibold">Allergies documented:</span> {m.allergiesDocumented} ({m.allergiesDocumentedPct}%)
        </li>
        <li>
          <span className="font-semibold">PCP share consent (opt-in):</span> {m.pcpShareOptIn} ({m.pcpShareOptInPct}%)
        </li>
      </ul>
    </div>
  );
}
