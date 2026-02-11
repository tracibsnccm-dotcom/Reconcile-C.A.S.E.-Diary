// src/attorney/AttorneyCaseView.tsx

import React from "react";
import { useMockDB } from "../lib/mockDB";

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
};

const AttorneyCaseView: React.FC = () => {
  const { activeCase } = useMockDB();

  if (!activeCase) {
    return (
      <div className="border rounded-xl bg-white p-4 text-[11px] text-slate-600">
        No active case selected. Go back to the Attorney Dashboard and choose a
        case from the list to view the full negotiation view.
      </div>
    );
  }

  const { client, flags = [], tasks = [] } = activeCase as any;
  const name = client.name || client.id || "Unknown client";
  const sev = client.severityLevel ?? 1;
  const rag = client.ragStatus || "—";
  const viab = client.viabilityScore ?? "—";
  const viabStatus = client.viabilityStatus || "—";
  const vital = client.vitalityScore ?? "—";

  const openFlags = flags.filter((f: any) => f.status === "Open");
  const highCritFlags = openFlags.filter(
    (f: any) => f.severity === "High" || f.severity === "Critical"
  );

  const sdohFlags = openFlags.filter((f: any) =>
    (f.type || "").toLowerCase().includes("sdoh")
  );
  const adherenceFlags = openFlags.filter((f: any) =>
    (f.type || "").toLowerCase().includes("adherence")
  );

  return (
    <div className="space-y-4 text-[11px]">
      {/* Case header */}
      <section className="border rounded-xl bg-white p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Attorney Case View – {name}
            </h2>
            <div className="text-[11px] text-slate-500">
              Case ID: <span className="font-mono">{client.id || "—"}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Status: {client.caseStatus || "Active"}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                Severity:
              </span>
              <span className="text-[11px] font-semibold">
                Level {sev}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                RAG:
              </span>
              <span
                className={[
                  "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                  rag === "Red"
                    ? "bg-red-100 text-red-700"
                    : rag === "Amber"
                    ? "bg-amber-100 text-amber-700"
                    : rag === "Green"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {rag}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                Viability:
              </span>
              <span className="text-[11px] font-semibold">
                {viab} ({viabStatus})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-500 mr-1">
                Vitality:
              </span>
              <span className="text-[11px] font-semibold">
                {vital}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* High-level story */}
      <section className="border rounded-xl bg-white p-4">
        <div className="text-[11px] font-semibold text-slate-800 mb-1">
          Case Story Snapshot (Negotiation Frame)
        </div>
        <p className="text-[11px] text-slate-700 mb-2">
          This section is where Reconcile C.A.R.E.™ translates clinical detail into
          a clear story for counsel: what happened, what is happening now, and
          what is most likely to happen next if the client does or does not
          receive needed care. In the mock, this is descriptive; in production,
          it will be driven by your 4Ps, SDOH, 10-Vs, and guideline engines.
        </p>
        <ul className="list-disc pl-4 text-[11px] text-slate-700 space-y-1">
          <li>
            <span className="font-semibold">Clinical risk level:</span> Severity
            Level {sev}, RAG {rag}.
          </li>
          <li>
            <span className="font-semibold">Barriers to recovery:</span>{" "}
            {sdohFlags.length} SDOH-related flags and{" "}
            {adherenceFlags.length} adherence-related flags currently open.
          </li>
          <li>
            <span className="font-semibold">Plan momentum:</span> Vitality score{" "}
            {vital}. Higher scores represent active, aligned care management;
            lower scores indicate stalled or fragmented care.
          </li>
          <li>
            <span className="font-semibold">Need for care management:</span>{" "}
            Viability {viab} ({viabStatus}) reflects why RN CM involvement is
            clinically and functionally justified.
          </li>
        </ul>
      </section>

      {/* Flags relevant to negotiation */}
      <section className="border rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Current Flags Impacting Negotiation
          </div>
          <div className="text-[10px] text-slate-500">
            {openFlags.length} open flag(s)
          </div>
        </div>

        {openFlags.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No open flags in the mock data. In production, this will surface
            pain, function, mental health, adherence, and SDOH items that matter
            most to value and risk.
          </div>
        ) : (
          <div className="space-y-2">
            {openFlags.map((f: any) => (
              <div
                key={f.id}
                className="border rounded-lg px-2 py-1 flex justify-between items-start bg-slate-50"
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">
                    {f.label || "Flag"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {f.type || "—"}
                  </div>
                  {f.description && (
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {f.description}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={[
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                      f.severity === "Critical"
                        ? "bg-red-100 text-red-700"
                        : f.severity === "High"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    {f.severity || "—"}
                  </div>
                  {f.odgCode && (
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      ODG/Guideline: {f.odgCode}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tasks / work in progress */}
      <section className="border rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Work in Progress (Care Management & Provider Actions)
          </div>
          <div className="text-[10px] text-slate-500">
            {tasks.length} task(s) in mock data
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No tasks are currently represented in this mock view. In production,
            this will show what has been done, what is scheduled, and where
            delays occurred.
          </div>
        ) : (
          <div className="space-y-1">
            {tasks.map((t: any) => (
              <div
                key={t.id}
                className="border rounded-lg px-2 py-1 bg-slate-50 flex justify-between"
              >
                <div>
                  <div className="text-[11px] font-semibold text-slate-800">
                    {t.title || "Task"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Type: {t.type || "—"}
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>Due: {formatDate(t.due_date)}</div>
                  <div>Status: {t.status || "Open"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer explanation */}
      <section className="border rounded-xl bg-slate-50 p-3">
        <div className="text-[11px] text-slate-700">
          This Attorney Case View is mock-first and read-only. As we finish
          wiring the 4Ps intake, 10-Vs engine, guideline/ODG logic, and case
          closure workflows, this screen becomes your &quot;courtroom-ready
          summary&quot;: the bridge between clinical documentation and legal
          negotiation.
        </div>
      </section>
    </div>
  );
};

export default AttorneyCaseView;
