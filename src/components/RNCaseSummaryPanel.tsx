// src/components/RNCaseSummaryPanel.tsx

import React, { useEffect, useState } from "react";
import {
  CaseSummary,
  SeverityScore,
  FOUR_PS,
  TEN_VS,
  getSeverityLabel,
} from "../constants/reconcileFramework";

function loadCaseSummary(): CaseSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_case_summary");
    if (!raw) return null;
    return JSON.parse(raw) as CaseSummary;
  } catch (e) {
    console.error("Failed to load RN case summary", e);
    return null;
  }
}

function worstScore(scores: (SeverityScore | undefined)[]): SeverityScore | null {
  const filtered = scores.filter(
    (s): s is SeverityScore => typeof s === "number"
  );
  if (filtered.length === 0) return null;
  return filtered.reduce((min, s) => (s < min ? s : min), filtered[0]);
}

const RNCaseSummaryPanel: React.FC = () => {
  const [summary, setSummary] = useState<CaseSummary | null>(null);

  useEffect(() => {
    setSummary(loadCaseSummary());
  }, []);

  const fourPs = summary?.fourPs;
  const tenVs = summary?.tenVs;
  const sdoh = summary?.sdoh;
  const crisis = summary?.crisis;

  const fourPsOverall = fourPs?.overallScore;
  const tenVsOverall = tenVs?.overallScore;
  const sdohOverall = sdoh?.overallScore;
  const crisisSeverity = crisis?.severityScore;

  const clinicalWorst = worstScore([fourPsOverall, tenVsOverall, crisisSeverity]);

  const clinicalHeadline = (() => {
    if (!clinicalWorst) return "No clinical scoring saved yet.";
    const label = getSeverityLabel(clinicalWorst);
    if (!label) return `Clinical concern score: ${clinicalWorst}/5`;
    return `${label} (worst clinical score ${clinicalWorst}/5)`;
  })();

  const updatedAtDisplay = summary?.updatedAt
    ? new Date(summary.updatedAt).toLocaleString()
    : null;

  const renderFourPsMini = () => {
    if (!fourPs || !fourPs.dimensions || fourPs.dimensions.length === 0) return null;
    return (
      <ul
        style={{
          fontSize: "0.72rem",
          color: "#475569",
          paddingLeft: "1.05rem",
          margin: 0,
        }}
      >
        {fourPs.dimensions.map((dim) => {
          const def = FOUR_PS.find((p) => p.id === dim.id);
          const label = def ? def.label : dim.id;
          return (
            <li key={dim.id}>
              <strong>{label}:</strong> {dim.score}/5
            </li>
          );
        })}
      </ul>
    );
  };

  const renderTenVsMini = () => {
    if (!tenVs || !tenVs.dimensions || tenVs.dimensions.length === 0) return null;
    return (
      <ul
        style={{
          fontSize: "0.72rem",
          color: "#475569",
          paddingLeft: "1.05rem",
          margin: 0,
        }}
      >
        {tenVs.dimensions.map((dim) => {
          const def = TEN_VS.find((v) => v.id === dim.id);
          const label = def ? def.label : dim.id;
          return (
            <li key={dim.id}>
              <strong>{label}:</strong> {dim.score}/5
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div
      style={{
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
        padding: "0.9rem 1.05rem",
      }}
    >
      {/* Top row: title + updated time */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.75rem",
          alignItems: "flex-start",
          marginBottom: "0.5rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "#64748b",
              marginBottom: "0.15rem",
            }}
          >
            RN Case Summary
          </div>
          <div
            style={{
              fontSize: "0.88rem",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {clinicalHeadline}
          </div>
        </div>

        <div
          style={{
            fontSize: "0.72rem",
            color: "#64748b",
            textAlign: "right",
            minWidth: "140px",
          }}
        >
          {updatedAtDisplay ? (
            <>
              <div>Last saved to summary:</div>
              <div style={{ fontWeight: 500 }}>{updatedAtDisplay}</div>
            </>
          ) : (
            <div>No RN summary saved yet.</div>
          )}
        </div>
      </div>

      {/* Middle row: small metric chips */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          marginBottom: "0.6rem",
          fontSize: "0.72rem",
        }}
      >
        <span
          style={{
            padding: "0.16rem 0.6rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: fourPsOverall ? "#e0f2fe" : "#f8fafc",
            color: fourPsOverall ? "#0f2a6a" : "#64748b",
          }}
        >
          4Ps: {fourPsOverall ? `${fourPsOverall}/5` : "not scored"}
        </span>
        <span
          style={{
            padding: "0.16rem 0.6rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: tenVsOverall ? "#e0f2fe" : "#f8fafc",
            color: tenVsOverall ? "#0f2a6a" : "#64748b",
          }}
        >
          10-Vs: {tenVsOverall ? `${tenVsOverall}/5` : "not scored"}
        </span>
        <span
          style={{
            padding: "0.16rem 0.6rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: sdohOverall ? "#e0fdf4" : "#f8fafc",
            color: sdohOverall ? "#047857" : "#64748b",
          }}
        >
          SDOH: {sdohOverall ? `${sdohOverall}/5` : "not scored"}
        </span>
        <span
          style={{
            padding: "0.16rem 0.6rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: crisisSeverity ? "#fee2e2" : "#f8fafc",
            color: crisisSeverity ? "#b91c1c" : "#64748b",
          }}
        >
          Crisis max: {crisisSeverity ? `${crisisSeverity}/5` : "none logged"}
        </span>
      </div>

      {/* Bottom: Ps & Vs mini-lists */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "0.75rem",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "0.25rem",
            }}
          >
            4Ps of Wellness
          </div>
          {fourPs ? (
            <>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#64748b",
                  marginBottom: "0.25rem",
                }}
              >
                Overall score:{" "}
                <strong>{fourPsOverall ? `${fourPsOverall}/5` : "not set"}</strong>
              </div>
              {renderFourPsMini()}
            </>
          ) : (
            <div
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
              }}
            >
              No 4Ps summary saved yet.
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "0.25rem",
            }}
          >
            10-Vs Clinical Logic Engine™
          </div>
          {tenVs ? (
            <>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#64748b",
                  marginBottom: "0.25rem",
                }}
              >
                Overall score:{" "}
                <strong>{tenVsOverall ? `${tenVsOverall}/5` : "not set"}</strong>
              </div>
              {renderTenVsMini()}
            </>
          ) : (
            <div
              style={{
                fontSize: "0.72rem",
                color: "#94a3b8",
              }}
            >
              No 10-Vs summary saved yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RNCaseSummaryPanel;
