// src/components/CaseSummaryCard.tsx
// Reconcile C.A.R.E. — Case Summary Snapshot (demo-only)
//
// Read-only shell that:
//  - Uses canonical 4Ps (Physical, Psychological, Psychosocial, Professional)
//  - Uses official 10-Vs from tenVs.ts
//  - Shows crisis status pill + RN/Attorney placeholders
//
// Later we'll wire this to real case data.

import React from "react";
import { FOUR_PS } from "../domain/reconcileDomain";
import {
  TEN_VS_ORDERED,
  TEN_VS_DICTIONARY,
} from "../domain/tenVs";

export interface CaseSummaryCardProps {
  caseId?: string;
  clientName?: string;
  crisisActive?: boolean;
}

const CaseSummaryCard: React.FC<CaseSummaryCardProps> = ({
  caseId = "case-001",
  clientName = "Demo Client",
  crisisActive = false,
}) => {
  return (
    <div className="border rounded-xl bg-white p-3 space-y-3 text-[11px] text-slate-800">
      {/* Header */}
      <header className="flex items-start justify-between gap-2 border-b pb-2 mb-2">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">
            Case Summary Snapshot
          </div>
          <div className="text-[10px] text-slate-500">
            Case: <span className="font-mono">{caseId}</span>{" "}
            · Client: <span className="font-semibold">{clientName}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-medium">
            <span
              className={
                crisisActive
                  ? "mr-1 h-2 w-2 rounded-full bg-red-500"
                  : "mr-1 h-2 w-2 rounded-full bg-emerald-500"
              }
            />
            {crisisActive ? "CRISIS ACTIVE" : "Stable / No Active Crisis"}
          </span>
          <span className="text-[9px] text-slate-400">
            RN + Attorney view (demo – not wired to live data yet)
          </span>
        </div>
      </header>

      {/* 4Ps Overview */}
      <section className="space-y-2 border rounded-md p-2 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            4Ps Overview
          </div>
          <div className="text-[9px] text-slate-500">
            Physical · Psychological · Psychosocial · Professional
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FOUR_PS.map((pLabel) => (
            <div className="space-y-0.5" key={pLabel}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-700">
                  {pLabel}
                </span>
                <span className="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] text-slate-600 bg-white">
                  {/* Placeholder status until wired to data */}
                  Status: <span className="ml-1 font-medium">TBD</span>
                </span>
              </div>
              <p className="text-[9px] text-slate-500">
                RN summary for this P will appear here once wired to case data.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 10-Vs Lenses */}
      <section className="space-y-2 border rounded-md p-2 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            10-Vs Lenses
          </div>
          <div className="text-[9px] text-slate-500">
            Official NAE / RCMS 10-Vs framework (read-only shell).
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {TEN_VS_ORDERED.map((vKey) => {
            const v = TEN_VS_DICTIONARY[vKey];
            return (
              <div
                key={vKey}
                className="border rounded-md px-1.5 py-1 bg-slate-50 space-y-0.5"
              >
                <div className="text-[10px] font-semibold text-slate-700">
                  {v.label}
                </div>
                <p className="text-[9px] text-slate-500">
                  {v.definition}
                </p>
                <p className="text-[9px] text-slate-400 italic">
                  {v.purpose}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  RN case note for this V will be displayed here in a later phase.
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* RN Note / Attorney Note placeholders */}
      <section className="grid grid-cols-2 gap-2 border-t pt-2">
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            RN Case Summary (Draft)
          </div>
          <p className="text-[9px] text-slate-500">
            In the future, this section will auto-generate a brief RN summary
            using the 4Ps + 10-Vs, suitable for handoff to attorneys and
            providers. For now, this is a static placeholder.
          </p>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase text-slate-600">
            Attorney-Facing Highlights
          </div>
          <p className="text-[9px] text-slate-500">
            This section will eventually show negotiation-relevant points
            (stability, risk, value, documentation strength) based on the same
            4Ps and 10-Vs data. For demo, this is a read-only shell.
          </p>
        </div>
      </section>
    </div>
  );
};

export default CaseSummaryCard;
