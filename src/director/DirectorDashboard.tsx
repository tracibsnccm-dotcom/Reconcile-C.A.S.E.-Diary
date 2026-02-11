// src/director/DirectorDashboard.tsx

import * as React from "react";
import { useMockDB } from "../lib/mockDB";
import { useCaseEvents } from "../lib/caseEventsContext";
import type { CaseTimelineEvent } from "../domain/caseTimeline";
import {
  computeTenVsFromEvents,
  describeBand,
} from "../domain/tenVsEngine";

interface DirectorCaseSummary {
  index: number;
  caseId: string;
  clientName: string;
  rnName: string;
  providerInvolved: boolean;
  legalLocked: boolean;
  safetyEvents: number;
  highFlags: number;
  ragLabel: "Green" | "Amber" | "Red";
  vitalityLabel: string;
  trajectoryLabel: string;
  events: CaseTimelineEvent[];
}

const DirectorDashboard: React.FC = () => {
  const { cases = [], activeIndex, setActiveIndex } = useMockDB() as any;
  const { events } = useCaseEvents();

  const caseArray: any[] = Array.isArray(cases) ? cases : [];

  const directorCases: DirectorCaseSummary[] = React.useMemo(() => {
    return caseArray.map((c, idx) => {
      const caseId: string =
        c.id || c.caseId || c.client?.id || `case-${idx + 1}`;
      const clientName: string =
        c.client?.name ||
        c.client?.displayName ||
        c.clientName ||
        `Client ${idx + 1}`;
      const rnName: string =
        c.rnName || c.assignedRN || "RN not assigned";

      const caseEvents: CaseTimelineEvent[] = events.filter(
        (e) => e.caseId === caseId
      );

      const tenVs = computeTenVsFromEvents(caseEvents);

      const riskScore =
        tenVs.v1PainSignal +
        tenVs.v2FunctionalLoss +
        tenVs.v4VigilanceRisk +
        tenVs.v6VelocityOfChange +
        (3 - tenVs.v3VitalityReserve) +
        (3 - tenVs.v10ViabilityTrajectory);

      let ragLabel: "Green" | "Amber" | "Red" = "Green";
      if (riskScore >= 9) {
        ragLabel = "Red";
      } else if (riskScore >= 5) {
        ragLabel = "Amber";
      }

      const vitalityLabel = describeBand(tenVs.v3VitalityReserve).label;
      const trajectoryLabel = describeBand(
        tenVs.v10ViabilityTrajectory
      ).label;

      const safetyEvents = caseEvents.filter(
        (e) => e.abuseRisk || e.suicideRisk || e.tags?.includes("safety-critical")
      ).length;

      const flags = Array.isArray(c.flags) ? c.flags : [];
      const highFlags = flags.filter(
        (f: any) =>
          f.severity === "High" || f.severity === "Critical"
      ).length;

      const legalLocked = Boolean(
        c.legalLock || c.legalLocked || c.isLegalLocked
      );

      const providerInvolved = caseEvents.some(
        (e) => e.actorRole === "PROVIDER"
      );

      return {
        index: idx,
        caseId,
        clientName,
        rnName,
        providerInvolved,
        legalLocked,
        safetyEvents,
        highFlags,
        ragLabel,
        vitalityLabel,
        trajectoryLabel,
        events: caseEvents,
      };
    });
  }, [caseArray, events]);

  const totalCases = directorCases.length;
  const casesWithSafety = directorCases.filter(
    (c) => c.safetyEvents > 0
  ).length;
  const redCases = directorCases.filter(
    (c) => c.ragLabel === "Red"
  ).length;
  const amberCases = directorCases.filter(
    (c) => c.ragLabel === "Amber"
  ).length;
  const legalLockedCases = directorCases.filter(
    (c) => c.legalLocked
  ).length;

  const rnWorkloadMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of directorCases) {
      const key = c.rnName || "RN not assigned";
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [directorCases]);

  const safetyEventsQueue: CaseTimelineEvent[] = React.useMemo(() => {
    const allEvents: CaseTimelineEvent[] = [];
    for (const c of directorCases) {
      for (const e of c.events) {
        if (e.abuseRisk || e.suicideRisk || e.tags?.includes("safety-critical")) {
          allEvents.push(e);
        }
      }
    }
    return allEvents.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [directorCases]);

  const formatShortDateTime = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const ragPill = (label: "Green" | "Amber" | "Red") => {
    let cls =
      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border ";
    if (label === "Red") {
      cls +=
        "bg-red-50 text-red-800 border-red-200";
    } else if (label === "Amber") {
      cls +=
        "bg-amber-50 text-amber-800 border-amber-200";
    } else {
      cls +=
        "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    return (
      <span className={cls}>
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-4 text-[11px]">
      {/* Header */}
      <section className="border rounded-xl bg-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
              Director Oversight Panel
            </div>
            <p className="text-[10px] text-slate-600 max-w-xl">
              This panel gives the Director a balanced clinical and legal view
              across all cases: stability (10-Vs), safety and red-flag events,
              RN workload, and legal lock-down status. The goal is not to
              punish, but to ensure high-risk cases are visible, supported, and
              defensible.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <div className="px-3 py-1 rounded-lg border bg-slate-50 text-[10px] text-slate-700">
              Active cases:{" "}
              <span className="font-semibold">{totalCases}</span>
            </div>
            <div className="px-3 py-1 rounded-lg border bg-amber-50 text-[10px] text-amber-900">
              Safety-marked cases:{" "}
              <span className="font-semibold">
                {casesWithSafety}
              </span>
            </div>
            <div className="px-3 py-1 rounded-lg border bg-red-50 text-[10px] text-red-800">
              Red posture:{" "}
              <span className="font-semibold">{redCases}</span>
            </div>
            <div className="px-3 py-1 rounded-lg border bg-amber-50 text-[10px] text-amber-900">
              Amber posture:{" "}
              <span className="font-semibold">{amberCases}</span>
            </div>
            <div className="px-3 py-1 rounded-lg border bg-slate-900 text-[10px] text-white">
              Legal lock-down:{" "}
              <span className="font-semibold">
                {legalLockedCases}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Case stability overview */}
      <section className="border rounded-xl bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Case Stability &amp; Risk Snapshot
          </div>
          <div className="text-[10px] text-slate-500">
            Director view across all active cases (10-Vs + safety + legal).
          </div>
        </div>

        {directorCases.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No cases in the mock database yet. Once cases exist, this table will
            summarize stability, risk, and lock-down status for the Director.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-[10px]">
              <thead className="bg-slate-50">
                <tr className="border-b">
                  <th className="px-2 py-1 text-left font-semibold">
                    Case / Client
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    RN
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    Provider
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    RAG
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    Vitality (V3)
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    Trajectory (V10)
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    Safety events
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    High/Critical flags
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    Legal lock-down
                  </th>
                  <th className="px-2 py-1 text-left font-semibold">
                    Actions (Mock)
                  </th>
                </tr>
              </thead>
              <tbody>
                {directorCases.map((c) => (
                  <tr key={c.caseId} className="border-b last:border-0">
                    <td className="px-2 py-1 align-top">
                      <div className="font-semibold text-slate-800">
                        {c.clientName}
                      </div>
                      <div className="font-mono text-slate-500">
                        {c.caseId}
                      </div>
                    </td>
                    <td className="px-2 py-1 align-top">
                      {c.rnName}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {c.providerInvolved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                          Involved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500">
                          Not yet
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {ragPill(c.ragLabel)}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {c.vitalityLabel}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {c.trajectoryLabel}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {c.safetyEvents}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {c.highFlags}
                    </td>
                    <td className="px-2 py-1 align-top">
                      {c.legalLocked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-900 text-white text-[9px]">
                          Lock-down active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 text-[9px]">
                          Not locked
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1 align-top">
                      <button
                        type="button"
                        onClick={() => setActiveIndex(c.index)}
                        className="px-2 py-0.5 rounded-full border bg-white text-slate-700 hover:bg-slate-50 text-[9px]"
                      >
                        Set as active case
                      </button>
                      <div className="mt-1 text-[9px] text-slate-400">
                        In this mock, actions update the active case for RN /
                        Attorney views. In production, this would record
                        Director decisions and justifications.
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* RN workload snapshot */}
      <section className="border rounded-xl bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            RN Workload Snapshot
          </div>
          <div className="text-[10px] text-slate-500">
            Mock-only caseload view; in production this would be tied to your
            workload engine and formal caps.
          </div>
        </div>
        {Object.keys(rnWorkloadMap).length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No RN assignments found in the mock data. Once cases are mapped to
            RNs, this section will summarize caseload per RN for Director
            review.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 text-[10px]">
            {Object.entries(rnWorkloadMap).map(([rnName, count]) => (
              <div
                key={rnName}
                className="px-3 py-1 rounded-lg border bg-slate-50 text-slate-700"
              >
                <span className="font-semibold">{rnName}</span>:{" "}
                <span>{count} case(s)</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-slate-600">
          In the live RCMS platform, this panel will tie into your workload
          engine: caps, exceptions, and reassignment tools. Here it simply
          visualizes how cases are distributed across RNs.
        </p>
      </section>

      {/* Safety & high-risk event queue */}
      <section className="border rounded-xl bg-white p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Safety &amp; High-Risk Audit Queue
          </div>
          <div className="text-[10px] text-slate-500">
            Events marked for Director awareness due to safety, abuse risk, or
            clinical red flags.
          </div>
        </div>
        {safetyEventsQueue.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No safety-marked events in the mock data. When RN or Provider notes
            flag abuse risk, suicide risk, or safety-critical tags, they will
            appear here for Director review.
          </div>
        ) : (
          <div className="space-y-2">
            {safetyEventsQueue.map((evt) => {
              const caseSummary = directorCases.find(
                (c) => c.caseId === evt.caseId
              );
              const clientName =
                caseSummary?.clientName || evt.caseId || "Client";

              return (
                <div
                  key={evt.id}
                  className="border rounded-lg p-2 bg-amber-50/60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-amber-900">
                        {evt.summary || "Safety-marked event"}
                      </div>
                      <div className="text-[10px] text-amber-900">
                        Case:{" "}
                        <span className="font-mono">
                          {evt.caseId}
                        </span>{" "}
                        · Client:{" "}
                        <span className="font-semibold">
                          {clientName}
                        </span>
                      </div>
                      <div className="text-[10px] text-amber-900">
                        By:{" "}
                        <span className="font-semibold">
                          {evt.actorName || evt.actorRole}
                        </span>{" "}
                        on {formatShortDateTime(evt.createdAt)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] border border-amber-300">
                        Director review recommended
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded-full border border-emerald-600 bg-emerald-600 text-white text-[9px] cursor-not-allowed opacity-60"
                          title="Mock-only; in production this would record a Director approval decision."
                        >
                          Approve (mock)
                        </button>
                        <button
                          type="button"
                          className="px-2 py-0.5 rounded-full border border-amber-700 bg-white text-amber-900 text-[9px] cursor-not-allowed opacity-60"
                          title="Mock-only; in production this would route back to RN/Provider for revision."
                        >
                          Return for clarification (mock)
                        </button>
                      </div>
                    </div>
                  </div>
                  {evt.details && (
                    <div className="mt-1 text-[10px] text-amber-900 whitespace-pre-wrap">
                      {evt.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-slate-600">
          In the full platform, each action here will write to an audit log
          (who reviewed, what decision was made, and why) to support legal and
          accreditation requirements while still backing your RN and Provider
          teams.
        </p>
      </section>
    </div>
  );
};

export default DirectorDashboard;
