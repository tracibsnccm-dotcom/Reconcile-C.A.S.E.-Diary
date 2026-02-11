// src/components/SupervisorAuditPanel.tsx

import React from "react";
import { AppState } from "../lib/models";
import { calculate10VsSummary } from "../lib/vEngine";
import {
  assessCaseSeverity,
  recommendCaseClosure,
} from "../lib/caseClosure";
import { exportCurrentAuditCSV } from "../lib/export";
import { evaluateLegalLockdown } from "../lib/legalLockdown";

/**
 * Reconcile C.A.R.E.™
 * Supervisor / QMP Quick Audit Panel
 *
 * Read-only view that:
 *  - Summarizes 10-Vs (viability, vitality, vigilance/RAG).
 *  - Shows auto-assessed case severity (Levels 1–4).
 *  - Shows RN CM case-closure recommendation and blocking items.
 *  - Shows Legal & Compliance Lock-Down readiness before external reports.
 *  - Allows CSV export for QMP / legal audits.
 *
 * No status changes are made here yet. This is a safe, display-only layer
 * to support review and QMP documentation.
 */

interface SupervisorAuditPanelProps {
  state: AppState;
}

const badgeClass = (tone: "green" | "amber" | "red" | "slate" | "blue") => {
  switch (tone) {
    case "green":
      return "inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold";
    case "amber":
      return "inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold";
    case "red":
      return "inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-semibold";
    case "blue":
      return "inline-flex items-center px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-semibold";
    default:
      return "inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-semibold";
  }
};

const SupervisorAuditPanel: React.FC<SupervisorAuditPanelProps> = ({
  state,
}) => {
  const { client, flags, tasks } = state;

  const vsSummary = calculate10VsSummary(state);
  const severity = assessCaseSeverity(state);
  const closure = recommendCaseClosure(state);
  const lockdown = evaluateLegalLockdown(state);

  const vitality = vsSummary.vitalityScore ?? null;
  const rag = vsSummary.ragStatus || null;
  const vigilanceRisk = vsSummary.vigilanceRiskCategory || null;
  const viabilityScore = vsSummary.viabilityScore ?? client.viabilityScore;

  const vitalityTone =
    vitality === null
      ? "slate"
      : vitality < 4
      ? ("red" as const)
      : vitality < 8
      ? ("amber" as const)
      : ("green" as const);

  const ragTone =
    rag === "Red"
      ? ("red" as const)
      : rag === "Amber"
      ? ("amber" as const)
      : rag === "Green"
      ? ("green" as const)
      : ("slate" as const);

  const closureTone =
    closure.canClose && closure.suggestedType
      ? ("green" as const)
      : ("amber" as const);

  const lockdownTone =
    lockdown.riskLevel === "HIGH"
      ? ("red" as const)
      : lockdown.riskLevel === "MODERATE"
      ? ("amber" as const)
      : ("green" as const);

  const handleExport = () => {
    exportCurrentAuditCSV(state);
  };

  return (
    <section className="bg-white border rounded-xl p-4 shadow-sm mt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide mb-1">
            Quick Audit View (Supervisor / QMP)
          </div>
          <div className="text-[11px] text-slate-500">
            Snapshot for RN CM quality review, 10-Vs alignment, case closure
            readiness, and legal/URAC defensibility. This panel is read-only
            at this stage.
          </div>
        </div>

        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-1 border rounded text-[11px] hover:bg-slate-50"
        >
          Download Audit CSV
        </button>
      </div>

      {/* Top row: client + severity + 10-Vs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Client / Case ID */}
        <div className="border rounded-lg p-3 text-xs">
          <div className="font-semibold mb-1">Client / Case</div>
          <div className="space-y-0.5">
            <div>
              <span className="font-semibold">Name:</span>{" "}
              {client.name || "Unknown"}
            </div>
            <div className="text-slate-600">
              <span className="font-semibold">Client ID:</span>{" "}
              {client.id || "n/a"}
            </div>
            {client.attorneyName && (
              <div className="text-slate-600">
                <span className="font-semibold">Attorney:</span>{" "}
                {client.attorneyName}
              </div>
            )}
            {client.caseType && (
              <div className="text-slate-600">
                <span className="font-semibold">Case Type:</span>{" "}
                {client.caseType}
              </div>
            )}
          </div>
        </div>

        {/* 10-Vs / RAG Summary */}
        <div className="border rounded-lg p-3 text-xs">
          <div className="font-semibold mb-1">10-Vs Clinical Summary</div>
          <div className="space-y-1">
            <div>
              <span className="font-semibold">Viability Score:</span>{" "}
              {viabilityScore !== undefined && viabilityScore !== null
                ? viabilityScore
                : "n/a"}
              {client.viabilityStatus && (
                <span className="text-slate-500">
                  {" "}
                  ({client.viabilityStatus})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Vitality:</span>
              <span className={badgeClass(vitalityTone)}>
                {vitality === null ? "n/a" : vitality.toFixed(1)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">RAG Status:</span>
              <span className={badgeClass(ragTone)}>
                {rag || "Not Calculated"}
              </span>
            </div>

            {vigilanceRisk && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Vigilance Risk:</span>
                <span
                  className={badgeClass(
                    vigilanceRisk === "High"
                      ? "red"
                      : vigilanceRisk === "Moderate"
                      ? "amber"
                      : "green"
                  )}
                >
                  {vigilanceRisk}
                </span>
              </div>
            )}

            {vsSummary?.notes && vsSummary.notes.length > 0 && (
              <ul className="list-disc pl-4 text-[11px] text-slate-600 mt-1">
                {vsSummary.notes.map((n: string, idx: number) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Case Severity */}
        <div className="border rounded-lg p-3 text-xs">
          <div className="font-semibold mb-1">Case Severity (Auto)</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={badgeClass("amber")}>{severity.label}</span>
            </div>
            <ul className="list-disc pl-4 text-[11px] text-slate-600 mt-1">
              {severity.rationale.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Case Closure Recommendation */}
      <div className="border rounded-lg p-3 text-xs mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Case Closure Readiness (RN CM)</div>
          <span className={badgeClass(closureTone)}>
            {closure.canClose && closure.suggestedType
              ? "Clinically Ready (RN CM Perspective)"
              : "Keep Case Open"}
          </span>
        </div>

        <div className="space-y-1 text-slate-700">
          {closure.suggestedType && (
            <div>
              <span className="font-semibold">Suggested Closure Type:</span>{" "}
              {closure.suggestedType ===
              "RN_CM_TASKS_COMPLETE_PENDING_SETTLEMENT"
                ? "RN CM Tasks Complete – Pending Settlement"
                : closure.suggestedType === "FINALIZED_SETTLEMENT"
                ? "Finalized Settlement"
                : closure.suggestedType === "ADMINISTRATIVE_CLOSURE"
                ? "Administrative Closure"
                : closure.suggestedType}
            </div>
          )}

          {closure.reasons && closure.reasons.length > 0 && (
            <div className="mt-1">
              <div className="font-semibold text-[11px]">
                Rationale / Guidance:
              </div>
              <ul className="list-disc pl-4 text-[11px] text-slate-600 mt-0.5">
                {closure.reasons.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Blocking Items */}
        {(closure.blockingFlags.length > 0 ||
          closure.blockingTasks.length > 0) && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {closure.blockingFlags.length > 0 && (
              <div>
                <div className="font-semibold text-[11px] mb-1">
                  Blocking Flags (Must Be Addressed)
                </div>
                <ul className="list-disc pl-4 text-[11px] text-slate-600">
                  {closure.blockingFlags.map((f) => (
                    <li key={f.id}>
                      <span className="font-semibold">{f.label}</span>{" "}
                      {f.severity && (
                        <span className="text-slate-500">
                          ({f.severity} · {f.status})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {closure.blockingTasks.length > 0 && (
              <div>
                <div className="font-semibold text-[11px] mb-1">
                  Blocking Tasks (Open / Overdue)
                </div>
                <ul className="list-disc pl-4 text-[11px] text-slate-600">
                  {closure.blockingTasks.map((t) => (
                    <li key={t.id}>
                      <span className="font-semibold">{t.title}</span>{" "}
                      {t.due_date && (
                        <span className="text-slate-500">
                          (Due: {t.due_date})
                        </span>
                      )}
                      {t.assigned_to && (
                        <span className="text-slate-500">
                          {" "}
                          · Assigned to: {t.assigned_to}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-500 mt-3">
          Supervisor Guidance: This recommendation is generated from the 10-Vs
          engine, open flags, and tasks. Supervisors must still apply clinical
          judgment, review documentation, and follow organizational policy
          before approving closure or escalation.
        </p>
      </div>

      {/* Legal & Compliance Lock-Down Check */}
      <div className="border rounded-lg p-3 text-xs mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">
            Legal & Compliance Lock-Down (External Reports)
          </div>
          <span className={badgeClass(lockdownTone)}>
            {lockdown.canRelease
              ? "Reports Eligible for Release"
              : "Lock-Down Active (Do Not Release)"}
          </span>
        </div>

        <div className="text-[11px] text-slate-700 mb-2">
          This section summarizes whether it is safe to generate and release
          external reports (attorney/provider/payer) based on clinical
          stability, safety flags, overdue tasks, and 10-Vs indicators.
        </div>

        {lockdown.issues && lockdown.issues.length > 0 ? (
          <ul className="space-y-1">
            {lockdown.issues.map((issue, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-[11px] text-slate-700"
              >
                <span
                  className={badgeClass(
                    issue.severity === "BLOCK"
                      ? "red"
                      : issue.severity === "WARN"
                      ? "amber"
                      : "blue"
                  )}
                >
                  {issue.severity}
                </span>
                <span>{issue.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[11px] text-emerald-700">
            No legal/compliance concerns detected by the lock-down engine.
          </div>
        )}

        <p className="text-[10px] text-slate-500 mt-3">
          QMP / Supervisor Guidance: Use this as a structured checklist before
          approving external report release. If BLOCK-level issues are present,
          either delay release until resolved or document an explicit exception
          according to organizational policy.
        </p>
      </div>

      {/* RN CM & QMP Notes guidance */}
      <div className="border rounded-lg p-3 text-xs">
        <div className="font-semibold mb-1">
          QMP / Supervisor Review Considerations
        </div>
        <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-0.5">
          <li>
            Confirm that RN CM documentation aligns with the 10-Vs triggers
            (Voice/View, Viability, Vision, Veracity, Versatility, Vitality,
            Vigilance, Verification, Value, Validation).
          </li>
          <li>
            Ensure any guideline variances, payer denials, or SDOH barriers are
            clearly documented and, when applicable, categorized for V8
            (Verification) learning.
          </li>
          <li>
            Use this panel during random audits, focused reviews, and case
            conferences to support URAC/CMSA/CCMC standard alignment.
          </li>
        </ul>
      </div>
    </section>
  );
};

export default SupervisorAuditPanel;
