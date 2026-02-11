// src/components/PriorityQueuePanel.tsx

import React, { useEffect, useState } from "react";
import { CaseSummary } from "../constants/reconcileFramework";
import {
  computePVPriorities,
  PriorityP,
} from "../utils/priorityEngine";

function loadCaseSummary(): CaseSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_case_summary");
    if (!raw) return null;
    return JSON.parse(raw) as CaseSummary;
  } catch (e) {
    console.error("Failed to load case summary for priorities", e);
    return null;
  }
}

const PriorityQueuePanel: React.FC = () => {
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [priorities, setPriorities] = useState<PriorityP[]>([]);
  const [dismissedPriorityPId, setDismissedPriorityPId] = useState<
    string | null
  >(null);

  const refresh = () => {
    const s = loadCaseSummary();
    setSummary(s);
    const list = computePVPriorities(s);
    setPriorities(list);
    // When we recompute, if the top priority changed, clear any prior dismissal
    if (list.length > 0 && dismissedPriorityPId && dismissedPriorityPId !== list[0].pId) {
      setDismissedPriorityPId(null);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    refresh();
  };

  if (!summary || priorities.length === 0) {
    return (
      <div
        style={{
          marginTop: "1rem",
          borderRadius: "8px",
          border: "1px dashed #cbd5e1",
          background: "#f8fafc",
          padding: "0.75rem",
          fontSize: "0.78rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <div style={{ color: "#64748b" }}>
          Priority queue will appear here once the RN saves 4Ps and 10-Vs
          scoring for this case.
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          style={{
            padding: "0.25rem 0.6rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  const topPriority = priorities[0];
  const showTopBanner =
    topPriority && dismissedPriorityPId !== topPriority.pId;

  return (
    <div
      style={{
        marginTop: "1rem",
      }}
    >
      {/* Strong guidance banner for Priority 1 */}
      {showTopBanner && (
        <div
          style={{
            marginBottom: "0.6rem",
            borderRadius: "8px",
            border: "1px solid #f97316",
            background: "#fff7ed",
            padding: "0.6rem 0.75rem",
            fontSize: "0.78rem",
            display: "flex",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "flex-start",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                color: "#9a3412",
                marginBottom: "0.2rem",
                fontWeight: 600,
              }}
            >
              Recommended first focus (Priority 1)
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#7c2d12",
                marginBottom: "0.2rem",
              }}
            >
              {topPriority.label} — {topPriority.score}/5
            </div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#9a3412",
                marginBottom: "0.25rem",
              }}
            >
              Based on the latest 4Ps scoring, this domain is the most unstable.
              It is recommended to address this P and its mapped Vs before
              shifting focus.
            </div>
            <div
              style={{
                fontSize: "0.74rem",
                color: "#9a3412",
              }}
            >
              Mapped Vs for this P:
              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: "1.1rem",
                  marginTop: "0.15rem",
                  marginBottom: 0,
                }}
              >
                {topPriority.mappedVs.map((v) => (
                  <li key={v.vId}>
                    <strong>{v.label}</strong>{" "}
                    {v.score != null ? `(${v.score}/5)` : "(not yet scored)"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.35rem",
              alignItems: "flex-end",
            }}
          >
            <button
              type="button"
              onClick={handleRefresh}
              style={{
                padding: "0.2rem 0.65rem",
                borderRadius: 999,
                border: "1px solid #fed7aa",
                background: "#fffbeb",
                fontSize: "0.72rem",
                cursor: "pointer",
              }}
            >
              Refresh priorities
            </button>
            <button
              type="button"
              onClick={() => setDismissedPriorityPId(topPriority.pId)}
              style={{
                padding: "0.25rem 0.7rem",
                borderRadius: 999,
                border: "1px solid #ea580c",
                background: "#fff7ed",
                fontSize: "0.72rem",
                cursor: "pointer",
                color: "#9a3412",
                fontWeight: 500,
              }}
            >
              Mark as addressed for now
            </button>
          </div>
        </div>
      )}

      {/* Main Priority Queue grid */}
      <div
        style={{
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.75rem",
            marginBottom: "0.4rem",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                marginBottom: "0.1rem",
              }}
            >
              Priority Queue (Ps → Vs)
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
              }}
            >
              Ordered by lowest P score first. After working Priority 1 and its
              mapped Vs, move to the next item in this list.
            </div>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            style={{
              padding: "0.25rem 0.6rem",
              borderRadius: "999px",
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "0.5rem",
          }}
        >
          {priorities.map((p, index) => (
            <div
              key={p.pId}
              style={{
                borderRadius: "8px",
                border:
                  index === 0 ? "1px solid #fb923c" : "1px solid #e2e8f0",
                padding: "0.55rem",
                fontSize: "0.75rem",
                background: index === 0 ? "#fff7ed" : "#f9fafb",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  marginBottom: "0.2rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      color: index === 0 ? "#c2410c" : "#64748b",
                    }}
                  >
                    Priority {index + 1}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {p.label} ({p.score}/5)
                  </div>
                </div>
              </div>

              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#64748b",
                  marginBottom: "0.25rem",
                }}
              >
                Focus mapped Vs for this P (lower scores need more attention):
              </div>

              <ul
                style={{
                  listStyle: "disc",
                  paddingLeft: "1.1rem",
                  margin: 0,
                }}
              >
                {p.mappedVs.map((v) => (
                  <li key={v.vId} style={{ marginBottom: "0.15rem" }}>
                    <span style={{ fontWeight: 600 }}>{v.label}</span>
                    {": "}
                    <span>
                      {v.score != null ? `${v.score}/5` : "not yet scored"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriorityQueuePanel;
