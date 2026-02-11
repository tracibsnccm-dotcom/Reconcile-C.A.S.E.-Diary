// src/lib/exportHelpers.ts
import { AppState, Flag, Task } from "./models";
import { estimateAllRecoveryWindows } from "./odg";

/**
 * Build a concise, export-ready summary of a case.
 * Use for: Attorney/provider summaries, QMP/URAC audit packets, EHR integrations.
 */
export function buildCaseSummaryForExport(state: AppState) {
  const { client, flags, tasks } = state as any;

  const openFlags = (flags || []).filter((f: any) => f.status === "Open");
  const closedFlags = (flags || []).filter((f: any) => f.status === "Closed");

  const followUpTasks = (tasks || []).filter((t: any) =>
    String(t.type || "").toLowerCase().includes("followup")
  );

  const injuries = (state as any).injuries || [];
  const odgWindows = estimateAllRecoveryWindows(state);

  return {
    client: {
      id: client?.id,
      name: client?.name,
      viabilityScore: client?.viabilityScore,
      viabilityStatus: client?.viabilityStatus,
      cmDeclined: client?.cmDeclined ?? false,
      voiceView: client?.voiceView || null,
      fourPs: client?.fourPs || null,
      sdoh: client?.sdoh || null,
      lastFollowupDate: client?.lastFollowupDate || null,
      nextFollowupDue: client?.nextFollowupDue || null,
    },
    injuries: injuries.map((inj: any) => ({
      primary: !!inj.primary,
      form: inj.form || null,
      label: inj.label || null,
      icd10: Array.isArray(inj.icd10) ? inj.icd10 : inj.icd10 ? [inj.icd10] : [],
      side: inj.side || null,
      notes: inj.notes || null,
      surgeryOccurred: !!inj.surgeryOccurred,
      postOpTherapyWeeks: inj.postOpTherapyWeeks ?? null,
    })),
    odgWindows: odgWindows.map((w) => ({
      source: w.source,
      conditionKey: w.conditionKey,
      description: w.description,
      baselineDays: w.baselineDays,
      modifiers: w.modifiers,
      totalDays: w.totalDays,
      assumptions: w.assumptions,
      notes: w.notes || null,
    })),
    flags: {
      open: sanitizeFlags(openFlags),
      closed: sanitizeFlags(closedFlags),
    },
    tasks: {
      followUps: sanitizeTasks(followUpTasks),
      all: sanitizeTasks(tasks || []),
    },
    meta: {
      generatedAt: new Date().toISOString(),
      note:
        "This summary is derived from Reconcile C.A.R.E.™ structured data and curated ODG-style references. Adjust as clinical evidence evolves.",
    },
  };
}

function sanitizeFlags(flags: Flag[]) {
  return (flags || []).map((f: any) => ({
    id: f.id,
    type: f.type,
    label: f.label,
    severity: f.severity,
    status: f.status,
    createdAt: f.createdAt,
    resolvedAt: f.resolvedAt ?? null,
  }));
}

function sanitizeTasks(tasks: Task[]) {
  return (tasks || []).map((t: any) => ({
    id: t.task_id,
    type: t.type,
    title: t.title,
    due_date: t.due_date,
    status: t.status,
    created_at: t.created_at,
    assigned_to: t.assigned_to,
  }));
}
