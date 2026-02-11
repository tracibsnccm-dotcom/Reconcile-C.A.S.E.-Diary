// src/lib/exportHelpers.ts

import { AppState, Flag, Task } from "./models";

/**
 * Build a concise, export-ready summary of a case.
 * This can be used for:
 * - Attorney / provider summaries
 * - QMP / URAC audit packets
 * - EHR / platform integrations (e.g., Epic, case management tools)
 */
export function buildCaseSummaryForExport(state: AppState) {
  const { client, flags, tasks, injuries } = state;

  const openFlags = flags.filter((f) => f.status === "Open");
  const closedFlags = flags.filter((f) => f.status === "Closed");

  const followUpTasks = tasks.filter((t) =>
    t.type.toLowerCase().includes("followup")
  );

  return {
    client: {
      id: client.id,
      name: client.name,
      viabilityScore: client.viabilityScore,
      viabilityStatus: client.viabilityStatus,
      cmDeclined: client.cmDeclined ?? false,
      voiceView: client.voiceView,
      fourPs: client.fourPs,
      sdoh: client.sdoh,
      lastFollowupDate: client.lastFollowupDate,
      nextFollowupDue: client.nextFollowupDue,
    },

    // 👇 All captured injuries / templates for Medical Necessity Driver
    injuries: injuries || [],

    flags: {
      open: sanitizeFlags(openFlags),
      closed: sanitizeFlags(closedFlags),
    },
    tasks: {
      followUps: sanitizeTasks(followUpTasks),
      all: sanitizeTasks(tasks),
    },
    meta: {
      generatedAt: new Date().toISOString(),
      note:
        "This summary is derived from Reconcile C.A.R.E.™ structured data. Safe to use for reporting, audit, or downstream systems.",
    },
  };
}

function sanitizeFlags(flags: Flag[]) {
  return flags.map((f) => ({
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
  return tasks.map((t) => ({
    id: t.task_id,
    type: t.type,
    title: t.title,
    due_date: t.due_date,
    status: t.status,
    created_at: t.created_at,
    assigned_to: t.assigned_to,
  }));
}
