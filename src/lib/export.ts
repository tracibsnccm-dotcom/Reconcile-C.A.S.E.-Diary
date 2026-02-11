// src/lib/export.ts
import { AppState, Flag, Task } from "./models";
import { Case } from "@/config/rcms";

/** Safely wrap CSV fields (quotes, commas, newlines). */
function csvEscape(v: any): string {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function pseudoRandomFromId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash % 1000) / 1000;
}

function summarizeFlags(flags: Flag[]) {
  const open = flags.filter((f) => f.status === "Open");
  const bySeverity = {
    Critical: open.filter((f) => f.severity === "Critical").length,
    High: open.filter((f) => f.severity === "High").length,
    Moderate: open.filter((f) => f.severity === "Moderate").length,
    Low: open.filter((f) => f.severity === "Low").length,
  };
  const sdoh = open.filter((f) => (f.type || "").toLowerCase().includes("sdoh")).length;
  const support = open.filter((f) => (f.type || "").toLowerCase().includes("support")).length;
  return { openCount: open.length, bySeverity, sdoh, support, openFlags: open };
}

function summarizeTasks(tasks: Task[]) {
  const open = tasks.filter((t) => t.status === "Open");
  const today = todayISO();
  const overdue = open.filter((t) => t.due_date && t.due_date < today).length;
  return { openCount: open.length, overdue };
}

/** Compute Priority Review (same logic as panel) */
function isPriorityReview(state: AppState): boolean {
  const { client, flags, tasks } = state;
  const flagSummary = summarizeFlags(flags);
  const highOrCritical = flagSummary.bySeverity.High + flagSummary.bySeverity.Critical > 0;
  const hasRiskAndDeclined = Boolean(client.cmDeclined && (flagSummary.sdoh > 0 || flagSummary.support > 0));
  const followupOverdue = Boolean(client.nextFollowupDue && client.nextFollowupDue < todayISO());
  const taskSummary = summarizeTasks(tasks);
  const hasOverdueWork = followupOverdue || taskSummary.overdue > 0;
  const randomPick = !highOrCritical && !hasRiskAndDeclined && !hasOverdueWork && pseudoRandomFromId(client.id) < 0.15;
  return highOrCritical || hasRiskAndDeclined || hasOverdueWork || randomPick;
}

/** Build a single CSV row for the current case. */
export function buildAuditRow(state: AppState) {
  const { client, flags, tasks } = state;
  const flagSummary = summarizeFlags(flags);
  const taskSummary = summarizeTasks(tasks);

  return [
    todayISO(),
    client.id,
    client.name || "",
    client.viabilityScore ?? "",
    client.viabilityStatus || "",
    client.lastFollowupDate || "",
    client.nextFollowupDue || "",
    flagSummary.openCount,
    flagSummary.bySeverity.Critical,
    flagSummary.bySeverity.High,
    flagSummary.bySeverity.Moderate,
    flagSummary.bySeverity.Low,
    flagSummary.sdoh,
    flagSummary.support,
    taskSummary.openCount,
    taskSummary.overdue,
    client.cmDeclined ? "Yes" : "No",
    isPriorityReview(state) ? "Yes" : "No",
  ];
}

/** Trigger a CSV download for the current case’s audit summary. */
export function exportCurrentAuditCSV(state: AppState) {
  const header = [
    "ExportDate",
    "ClientID",
    "ClientName",
    "ViabilityScore",
    "ViabilityStatus",
    "LastFollowUp",
    "NextFollowUpDue",
    "OpenFlags_Total",
    "OpenFlags_Critical",
    "OpenFlags_High",
    "OpenFlags_Moderate",
    "OpenFlags_Low",
    "OpenFlags_SDOH",
    "OpenFlags_Support",
    "OpenTasks_Total",
    "OpenTasks_Overdue",
    "ClientDeclinedCM",
    "PriorityReview",
  ];

  const row = buildAuditRow(state);
  const csv = [header, row].map((r) => r.map(csvEscape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `rcms_audit_${todayISO()}_${(state.client.name || "client").replace(/\s+/g, "_")}.csv`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

/** Export a single case to CSV format. */
export function exportCSV(caseData: Case) {
  const header = [
    "CaseID",
    "Status",
    "ClientName",
    "OnsetOfService",
    "CreatedAt",
    "UpdatedAt",
    "RiskLevel",
    "Flags",
    "SDOHFlags",
    "CheckinsCount",
  ];

  const row = [
    caseData.id,
    caseData.status,
    caseData.client?.displayNameMasked || caseData.client?.fullName || "",
    caseData.onsetOfService || "",
    caseData.createdAt || "",
    caseData.updatedAt || "",
    caseData.riskLevel || "",
    (caseData.flags || []).join("; "),
    (caseData.sdohFlags || []).join("; "),
    (caseData.checkins || []).length.toString(),
  ];

  const csv = [header, row].map((r) => r.map(csvEscape).join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const clientName = (caseData.client?.displayNameMasked || caseData.client?.fullName || "case").replace(/\s+/g, "_");
  const filename = `rcms_case_${todayISO()}_${caseData.id}_${clientName}.csv`;
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}
