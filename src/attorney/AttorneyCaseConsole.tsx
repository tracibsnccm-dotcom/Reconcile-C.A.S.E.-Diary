// src/attorney/AttorneyCaseConsole.tsx
// Reconcile C.A.R.E. — Attorney Case Console
//
// Uses:
//  - CaseSummaryCard (4Ps + 10-Vs snapshot)
//  - RN Case Timeline (high-level event stream)
//  - Shared crisisState so RN and attorney see same crisis flag.

import React from "react";
import { useMockDB } from "../lib/mockDB";
import CaseSummaryCard from "../components/CaseSummaryCard";
import { RNCaseTimeline } from "../components/RNCaseTimeline";
import { useCrisisState } from "../domain/crisisState";

const AttorneyCaseConsole: React.FC = () => {
  const { activeCase } = useMockDB() as any;
  const { isInCrisis } = useCrisisState();

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case is selected. From the main platform shell, select a case
        before opening the Attorney Case Console.
      </div>
    );
  }

  const client = activeCase.client ?? activeCase.clientProfile ?? {};
  const clientName: string =
    client.name ?? activeCase.clientName ?? "Client";
  const caseId: string =
    activeCase.id ?? activeCase.caseId ?? client.id ?? "case-001";

  const crisisActive = !!isInCrisis;

  return (
    <div className="space-y-3 text-[11px] text-slate-800">
      {/* Header */}
      <section className="border rounded-xl bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
              Attorney Case Console – Trial View
            </div>
            <p className="text-[10px] text-slate-500">
              Case: <span className="font-mono">{caseId}</span> · Client:{" "}
              <span className="font-semibold">{clientName}</span>
            </p>
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
          </div>
        </div>
      </section>

      {/* Layout: Summary + Timeline + Attorney Notes */}
      <section className="grid md:grid-cols-[1.7fr,1.3fr] gap-3">
        {/* Left column: Case Summary + Attorney Highlights */}
        <div className="space-y-3">
          <CaseSummaryCard
            caseId={caseId}
            clientName={clientName}
            crisisActive={crisisActive}
          />

          <section className="border rounded-xl bg-white p-3 space-y-2">
            <div className="text-[10px] font-semibold uppercase text-slate-600">
              Attorney Highlights & Strategy Notes
            </div>
            <p className="text-[9px] text-slate-500 mb-1">
              In the future, this section will pull key points from the RN&apos;s
              4Ps + 10-Vs data and present them in negotiation-ready language.
              For now, it is a free-text placeholder.
            </p>
            <textarea
              className="border rounded px-1 py-0.5 text-[10px] w-full min-h-[80px]"
              placeholder="Attorney can jot down key leverage points, documentation strengths/weaknesses, valuation thoughts, and next steps."
            />
          </section>
        </div>

        {/* Right column: Timeline + Tasks/Docs placeholder */}
        <div className="space-y-3">
          <section className="border rounded-xl bg-white p-3">
            <div className="text-[10px] font-semibold uppercase text-slate-600 mb-1">
              High-Level Case Timeline
            </div>
            <p className="text-[9px] text-slate-500 mb-2">
              Same event stream the RN sees, but read-only. In a future phase,
              events will be filtered and annotated for attorney relevance.
            </p>
            <RNCaseTimeline />
          </section>

          <section className="border rounded-xl bg-white p-3 space-y-1">
            <div className="text-[10px] font-semibold uppercase text-slate-600">
              Documents & Tasks (Placeholder)
            </div>
            <p className="text-[9px] text-slate-500">
              Eventually this panel will list key documents (IMEs, FCEs,
              surgical reports, high-impact notes) and tasks (records to
              request, expert reviews, settlement prep). For now, this is a
              placeholder to show where that work will live.
            </p>
          </section>
        </div>
      </section>
    </div>
  );
};

export default AttorneyCaseConsole;
