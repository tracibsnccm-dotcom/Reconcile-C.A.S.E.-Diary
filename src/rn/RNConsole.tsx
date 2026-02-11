// src/rn/RNConsole.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useMockDB } from "../lib/mockDB";
import { AppState } from "../lib/models";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeCaseId(raw: string | null): string | null {
  if (!raw) return null;
  const v = String(raw).trim().replace(/^"+|"+$/g, "");
  if (!v) return null;
  return UUID_RE.test(v) ? v : null;
}

const RN_ID = "RN-01"; // 👈 current RN; later this will come from auth / login

interface RNConsoleProps {
  onOpenCase?: (index: number) => void;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
};

const todayISO = () => new Date().toISOString().slice(0, 10);

interface RCCaseOption {
  id: string;
  case_status: string | null;
  created_at: string;
}

const RNConsole: React.FC<RNConsoleProps> = ({ onOpenCase }) => {
  const { cases } = useMockDB();
  const today = todayISO();
  const [rcCases, setRcCases] = useState<RCCaseOption[]>([]);
  const [caseError, setCaseError] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");

  // Load cases from Supabase on mount
  useEffect(() => {
    const loadCases = async () => {
      try {
        const { data, error } = await supabase
          .from("rc_cases")
          .select("id, case_status, created_at")
          .eq("is_superseded", false)
          .order("created_at", { ascending: false })
          .limit(25);

        if (error) throw error;
        setRcCases(data || []);
        setCaseError(null);
      } catch (e: any) {
        console.error("Failed to load cases", e);
        setCaseError(e?.message || "Failed to load cases");
      }
    };

    loadCases();

    // Preselect if localStorage already has a case ID
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("rcms_active_case_id");
      const normalized = normalizeCaseId(stored);
      if (normalized) {
        setSelectedCaseId(normalized);
      }
    }
  }, []);

  const handleCaseSelect = async (caseId: string) => {
    if (typeof window !== "undefined") {
      const normalized = normalizeCaseId(caseId);
      if (!normalized) return;

      // Check case status before setting as active
      try {
        const { data, error } = await supabase
          .from("rc_cases")
          .select("id, case_status")
          .eq("id", normalized)
          .eq("is_superseded", false)
          .single();

        if (error) throw error;

        const selectedStatus = data?.case_status;

        // If released or closed, log and set it (will be handled as snapshot view)
        if (selectedStatus === "released" || selectedStatus === "closed") {
          console.log("[RN] selected immutable case → snapshot mode", normalized);
          // Still set it in localStorage so it loads, but RNPublishPanel will detect it's immutable
          // and set viewingReleasedId automatically
          window.localStorage.setItem("rcms_active_case_id", normalized);
          setSelectedCaseId(normalized);
          // Refresh the page to reload RNCaseEngine with the new case
          window.location.reload();
        } else {
          // Editable case - set normally
          window.localStorage.setItem("rcms_active_case_id", normalized);
          setSelectedCaseId(normalized);
          // Refresh the page to reload RNCaseEngine with the new case
          window.location.reload();
        }
      } catch (e) {
        console.error("[RN] Error checking case status:", e);
        // Fallback: set anyway and let components handle it
        window.localStorage.setItem("rcms_active_case_id", normalized);
        setSelectedCaseId(normalized);
        window.location.reload();
      }
    }
  };

  const formatCaseLabel = (caseOption: RCCaseOption) => {
    return `${caseOption.id.slice(0, 8)}… — ${caseOption.case_status ?? "unknown"} — ${formatDate(caseOption.created_at)}`;
  };

  // 🔎 Filter: only ACTIVE cases assigned to this RN
  const myCases: AppState[] = useMemo(() => {
    return cases.filter((c) => {
      const client: any = c.client || {};
      const status = client.caseStatus ?? "Active"; // default to Active if missing
      const assignedRnId = client.assignedRnId ?? RN_ID;
      return status === "Active" && assignedRnId === RN_ID;
    });
  }, [cases]);

  // 🟥 Urgent / High-Risk strip
  const urgentItems = useMemo(() => {
    const items: {
      label: string;
      clientName: string;
      severity: string;
      type?: string;
    }[] = [];

    myCases.forEach((c) => {
      const client: any = c.client || {};
      const clientName = client.name || client.id || "Unknown client";

      // High/Critical flags
      (c.flags || []).forEach((f: any) => {
        if (
          f.status === "Open" &&
          (f.severity === "High" || f.severity === "Critical")
        ) {
          items.push({
            label: f.label || "Flag",
            clientName,
            severity: f.severity || "High",
            type: f.type,
          });
        }
      });

      // Overdue follow-ups
      const nextDue = client.nextFollowupDue as string | undefined;
      if (nextDue && nextDue < today) {
        items.push({
          label: "Overdue subsequent care plan",
          clientName,
          severity: "High",
          type: "FollowUp",
        });
      }
    });

    return items;
  }, [myCases, today]);

  // 📞 Calls / follow-ups due today or soon
  const dueSoon = useMemo(() => {
    const items: {
      clientName: string;
      nextFollowupDue?: string;
    }[] = [];

    myCases.forEach((c) => {
      const client: any = c.client || {};
      const clientName = client.name || client.id || "Unknown client";
      const nextDue = client.nextFollowupDue as string | undefined;
      if (!nextDue) return;

      // Show items due today or in the next 7 days
      if (nextDue >= today && nextDue <= addDaysISO(today, 7)) {
        items.push({
          clientName,
          nextFollowupDue: nextDue,
        });
      }
    });

    return items;
  }, [myCases, today]);

  // 📊 RN Stats across caseload
  const stats = useMemo(() => {
    const total = myCases.length;
    let complex = 0;
    let severelyComplex = 0;
    let highRiskFlags = 0;
    let criticalFlags = 0;
    let redRag = 0;
    let amberRag = 0;
    let greenRag = 0;

    myCases.forEach((c) => {
      const client: any = c.client || {};
      const sev = client.severityLevel ?? 1;
      const rag = client.ragStatus || "";

      if (sev >= 3 && sev < 4) complex += 1;
      if (sev >= 4) severelyComplex += 1;

      (c.flags || []).forEach((f: any) => {
        if (f.status === "Open") {
          if (f.severity === "High") highRiskFlags += 1;
          if (f.severity === "Critical") criticalFlags += 1;
        }
      });

      if (rag === "Red") redRag += 1;
      else if (rag === "Amber") amberRag += 1;
      else if (rag === "Green") greenRag += 1;
    });

    return {
      total,
      complex,
      severelyComplex,
      highRiskFlags,
      criticalFlags,
      redRag,
      amberRag,
      greenRag,
    };
  }, [myCases]);

  return (
    <div className="space-y-4">
      {/* Case Picker */}
      <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #e2e8f0", borderRadius: 12, background: "#ffffff" }}>
        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>
          Select a case
        </div>

        <select
          value={selectedCaseId}
          onChange={(e) => {
            const id = e.target.value;
            if (id) {
              handleCaseSelect(id);
            }
          }}
          style={{
            width: "100%",
            borderRadius: 10,
            border: "1px solid #cbd5e1",
            padding: "0.55rem 0.75rem",
            fontSize: "0.9rem",
            background: "#ffffff",
            color: "#0f172a",
          }}
        >
          <option value="">Select a case...</option>
          {rcCases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.id.slice(0, 8)}… — {c.case_status ?? "unknown"} — {formatDate(c.created_at)}
            </option>
          ))}
        </select>

        {caseError && (
          <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#b91c1c" }}>
            {caseError}
          </div>
        )}

        {!caseError && rcCases.length === 0 && (
          <div style={{ marginTop: 8, fontSize: "0.82rem", color: "#64748b" }}>
            No cases found.
          </div>
        )}
      </div>

      {/* RN Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">
            RN Care Manager Dashboard
          </h2>
          <p className="text-[11px] text-slate-600">
            Active cases assigned to <span className="font-semibold">{RN_ID}</span> only.
            This will later be tied to the logged-in RN's profile.
          </p>
        </div>
        <div className="text-right text-[11px] text-slate-500">
          <div>Today: {formatDate(today)}</div>
          <div>View: Active assigned caseload</div>
        </div>
      </div>

      {/* Urgent strip */}
      <section className="border rounded-xl bg-red-50/70 border-red-200 px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] font-semibold text-red-800 uppercase tracking-wide">
            Urgent / High-Risk Items
          </div>
          <div className="text-[10px] text-red-700">
            {urgentItems.length === 0
              ? "No high-risk items open"
              : `${urgentItems.length} item(s) need attention`}
          </div>
        </div>
        {urgentItems.length === 0 ? (
          <div className="text-[11px] text-red-700">
            All High/Critical flags and overdue subsequent care plans are currently clear.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {urgentItems.map((u, idx) => (
              <div
                key={idx}
                className="px-2 py-1 rounded-full bg-red-600 text-white text-[10px] flex items-center gap-1"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="font-semibold">{u.clientName}:</span>
                <span>{u.label}</span>
                <span className="opacity-80">
                  ({u.severity}
                  {u.type ? ` · ${u.type}` : ""})
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Calls / subsequent care plans due */}
      <section className="border rounded-xl bg-white px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Calls & Subsequent Care Plans Due
          </div>
          <div className="text-[10px] text-slate-500">
            {dueSoon.length === 0
              ? "No subsequent care plans due in the next 7 days"
              : `${dueSoon.length} client(s) due within 7 days`}
          </div>
        </div>
        {dueSoon.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            You can use this time for deeper chart review, QMP tasks, or outreach
            to clients with open SDOH or adherence concerns.
          </div>
        ) : (
          <ul className="text-[11px] text-slate-700 space-y-1">
            {dueSoon.map((d, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{d.clientName}</span>
                <span className="text-slate-500">
                  Next subsequent care plan: {formatDate(d.nextFollowupDue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Stats cards */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="border rounded-xl bg-white px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">
            Active Cases
          </div>
          <div className="text-xl font-semibold">{stats.total}</div>
          <div className="text-[11px] text-slate-500">
            {stats.complex + stats.severelyComplex} complex / severely complex
          </div>
        </div>

        <div className="border rounded-xl bg-white px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">
            High-Risk Flags
          </div>
          <div className="text-xl font-semibold">
            {stats.highRiskFlags + stats.criticalFlags}
          </div>
          <div className="text-[11px] text-slate-500">
            {stats.criticalFlags} critical, {stats.highRiskFlags} high
          </div>
        </div>

        <div className="border rounded-xl bg-white px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">
            RAG Status Mix
          </div>
          <div className="text-sm font-semibold">
            {stats.redRag} Red · {stats.amberRag} Amber · {stats.greenRag} Green
          </div>
          <div className="text-[11px] text-slate-500">
            Vitality & Vigilance snapshot across your panel.
          </div>
        </div>

        <div className="border rounded-xl bg-white px-3 py-2">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide">
            Snapshot
          </div>
          <div className="text-[11px] text-slate-600">
            This card can later show your workload points, quality score, or
            QMP metrics once we wire the workload and audit engines here.
          </div>
        </div>
      </section>

      {/* Case list table */}
      <section className="border rounded-xl bg-white px-3 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
            Active Case List (Assigned to {RN_ID})
          </div>
          <div className="text-[10px] text-slate-500">
            Click a row to open the detailed RN case view.
          </div>
        </div>

        {myCases.length === 0 ? (
          <div className="text-[11px] text-slate-600">
            No active cases are currently assigned to you. Once intake creates
            new cases with {RN_ID} as the assigned RN, they will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-[11px]">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-1 pr-2">Client</th>
                  <th className="py-1 pr-2">Severity</th>
                  <th className="py-1 pr-2">RAG</th>
                  <th className="py-1 pr-2">Open Flags</th>
                  <th className="py-1 pr-2">Next Subsequent Care Plan</th>
                </tr>
              </thead>
              <tbody>
                {myCases.map((c, idx) => {
                  const client: any = c.client || {};
                  const sev = client.severityLevel ?? 1;
                  const rag = client.ragStatus || "—";
                  const name = client.name || client.id || "Unknown client";

                  const openFlags = (c.flags || []).filter(
                    (f: any) => f.status === "Open"
                  );
                  const openCount = openFlags.length;
                  const highCritCount = openFlags.filter(
                    (f: any) =>
                      f.severity === "High" || f.severity === "Critical"
                  ).length;

                  // Find index of this case in the global cases array for navigation
                  const globalIndex = cases.indexOf(c);

                  return (
                    <tr
                      key={client.id || idx}
                      className="border-b last:border-0 hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        onOpenCase && globalIndex >= 0
                          ? onOpenCase(globalIndex)
                          : undefined
                      }
                    >
                      <td className="py-1 pr-2">
                        <div className="font-semibold text-slate-800">
                          {name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Case ID: {client.id || "—"}
                        </div>
                      </td>
                      <td className="py-1 pr-2">
                        <div className="text-[11px]">
                          Level {sev ?? "—"}
                        </div>
                      </td>
                      <td className="py-1 pr-2">
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
                          {rag || "—"}
                        </span>
                      </td>
                      <td className="py-1 pr-2">
                        <div>{openCount} open</div>
                        {highCritCount > 0 && (
                          <div className="text-[10px] text-red-600">
                            {highCritCount} High/Critical
                          </div>
                        )}
                      </td>
                      <td className="py-1 pr-2">
                        {formatDate(client.nextFollowupDue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

// Simple helper to add days to an ISO date string
function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default RNConsole;

