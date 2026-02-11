import React, { useState, useEffect } from "react";
import {
  CaseSummary,
  SeverityScore,
  FOUR_PS,
  TEN_VS,
  getSeverityLabel,
} from "../constants/reconcileFramework";
import { RoleGuard } from "../components/RoleGuard";
import { useAuth } from "../auth/supabaseAuth";

type AttorneyTab =
  | "overview"
  | "clinicalStory"
  | "sdohRisk"
  | "timeline"
  | "documents";

// Simple internal type for attorney timeline cards
type AttorneyTimelineEvent = {
  id: string;
  date?: string;
  title: string;
  bullets?: string[];
  rnNote?: string;
};

function loadCaseSummary(): CaseSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_case_summary");
    if (!raw) return null;
    return JSON.parse(raw) as CaseSummary;
  } catch (e) {
    console.error("Failed to load case summary", e);
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

// Simple internal card renderer for attorney timeline
const AttorneyTimelineCard: React.FC<{ event: AttorneyTimelineEvent }> = ({
  event,
}) => {
  return (
    <div
      style={{
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        background: "#ffffff",
        padding: "0.75rem",
        marginBottom: "0.6rem",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "0.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "18px",
              height: "18px",
              borderRadius: "999px",
              border: "1px solid #0f2a6a",
              fontSize: "0.75rem",
            }}
          >
            ●
          </span>
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            {event.title}
          </span>
        </div>
        {event.date && (
          <span
            style={{
              fontSize: "0.72rem",
              color: "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            {event.date}
          </span>
        )}
      </div>

      {event.bullets && event.bullets.length > 0 && (
        <ul
          style={{
            fontSize: "0.76rem",
            color: "#475569",
            paddingLeft: "1.1rem",
            marginBottom: event.rnNote ? "0.4rem" : 0,
          }}
        >
          {event.bullets.map((b, idx) => (
            <li key={idx}>{b}</li>
          ))}
        </ul>
      )}

      {event.rnNote && (
        <div
          style={{
            marginTop: "0.25rem",
            paddingTop: "0.25rem",
            borderTop: "1px dashed #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#0f172a",
              marginBottom: "0.1rem",
            }}
          >
            RN Note (Attorney-Facing)
          </div>
          <p
            style={{
              fontSize: "0.74rem",
              color: "#475569",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {event.rnNote}
          </p>
        </div>
      )}
    </div>
  );
};

const AttorneyConsole: React.FC = () => {
  console.log('=== AttorneyConsole: Component function called ===');
  console.log('AttorneyConsole RENDER - starting');
  console.log('AttorneyConsole: Component mounted');
  
  const { user, roles, primaryRole } = useAuth();
  console.log('AttorneyConsole: User:', user);
  console.log('AttorneyConsole: User roles:', roles);
  console.log('AttorneyConsole: User primaryRole:', primaryRole);
  
  const [activeTab, setActiveTab] = useState<AttorneyTab>("overview");
  const [summary, setSummary] = useState<CaseSummary | null>(null);

  useEffect(() => {
    console.log('AttorneyConsole: About to load case summary from localStorage');
    const loadedSummary = loadCaseSummary();
    console.log('AttorneyConsole: Loaded summary:', loadedSummary);
    setSummary(loadedSummary);
  }, []);

  const handleRefresh = () => {
    setSummary(loadCaseSummary());
  };

  const fourPs = summary?.fourPs;
  const tenVs = summary?.tenVs;
  const sdoh = summary?.sdoh;
  const crisis = summary?.crisis;

  const fourPsOverall = fourPs?.overallScore;
  const tenVsOverall = tenVs?.overallScore;
  const sdohOverall = sdoh?.overallScore;
  const crisisSeverity = crisis?.severityScore;

  const hasFourPs = !!fourPs;
  const hasTenVs = !!tenVs;
  const hasSdoh = !!sdoh;
  const hasCrisis = !!crisis;

  const clinicalWorst = worstScore([
    fourPsOverall,
    tenVsOverall,
    crisisSeverity,
  ]);

  const combinedClinicalLabel = (() => {
    if (!clinicalWorst)
      return "Awaiting RN 4Ps / 10-Vs / Crisis scoring";
    const label = getSeverityLabel(clinicalWorst);
    if (!label) return `Clinical concern score: ${clinicalWorst}/5`;
    return `${label} (worst clinical score ${clinicalWorst}/5)`;
  })();

  const engagementLabel = (() => {
    if (!sdohOverall) return "Pending RN SDOH scoring (1–5).";
    if (sdohOverall === 1)
      return "SDOH: 1/5 – Critical barriers that can severely disrupt care and case performance.";
    if (sdohOverall === 2)
      return "SDOH: 2/5 – High concern; major barriers likely impact adherence and stability.";
    if (sdohOverall === 3)
      return "SDOH: 3/5 – Moderate barriers; both risks and supports present.";
    if (sdohOverall === 4)
      return "SDOH: 4/5 – Mild issues; generally stable environment.";
    return "SDOH: 5/5 – Strongly supportive environment for care and follow-through.";
  })();

  const updatedAtDisplay = summary?.updatedAt
    ? new Date(summary.updatedAt).toLocaleString()
    : null;

  const buildClinicalNarrative = () => {
    const lines: string[] = [];

    if (!fourPs && !tenVs && !sdoh && !crisis) {
      lines.push(
        "The RN has not yet saved 4Ps, 10-Vs, SDOH, or Crisis Mode drafts for this case. Once those are completed, this section will show a live summary."
      );
      return lines;
    }

    if (fourPsOverall) {
      lines.push(
        `Across the 4Ps of Wellness, the RN has scored overall wellness at ${fourPsOverall}/5.`
      );
    } else {
      lines.push(
        "4Ps of Wellness has not yet been fully scored; clinical domain risks are still pending."
      );
    }

    if (tenVsOverall) {
      lines.push(
        `Using the 10-Vs Clinical Logic Engine™, the RN has scored the overall 10-Vs level at ${tenVsOverall}/5, reflecting how the clinical story supports or challenges the case.`
      );
    } else {
      lines.push(
        "The 10-Vs Clinical Logic Engine™ has not yet been scored; global clinical strengths and vulnerabilities are still being summarized."
      );
    }

    if (sdohOverall) {
      lines.push(
        `Social determinants of health are scored at ${sdohOverall}/5 in terms of how supportive or disruptive the environment is for care and adherence.`
      );
    } else {
      lines.push(
        "The SDOH tool has not yet been saved; social and environmental risk is still being documented."
      );
    }

    if (crisisSeverity) {
      lines.push(
        `Crisis Mode severity has reached ${crisisSeverity}/5 at least once, reflecting the highest level of acute concern seen in this case.`
      );
    } else {
      lines.push(
        "No Crisis Mode draft has been saved; acute safety risk has not yet been documented in this module."
      );
    }

    return lines;
  };

  const renderTenVsMiniList = () => {
    if (!tenVs || !tenVs.dimensions || tenVs.dimensions.length === 0) return null;
    return (
      <ul
        style={{
          fontSize: "0.73rem",
          color: "#64748b",
          paddingLeft: "1.1rem",
          marginTop: "0.3rem",
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

  const renderFourPsMiniList = () => {
    if (!fourPs || !fourPs.dimensions || fourPs.dimensions.length === 0)
      return null;
    return (
      <ul
        style={{
          fontSize: "0.73rem",
          color: "#64748b",
          paddingLeft: "1.1rem",
          marginTop: "0.3rem",
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

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div>
            <div
              style={{
                marginBottom: "0.75rem",
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "0.75rem",
              }}
            >
              {/* Card 1: Clinical risk snapshot */}
              <div
                style={{
                  borderRadius: "10px",
                  border: "1px solid "#e2e8f0",
                  background: "#ffffff",
                  padding: "0.75rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Clinical Snapshot (Ps, Vs, Crisis)
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    marginBottom: "0.15rem",
                  }}
                >
                  {combinedClinicalLabel}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                  }}
                >
                  {fourPsOverall && (
                    <div>4Ps overall: {fourPsOverall}/5</div>
                  )}
                  {tenVsOverall && (
                    <div>10-Vs overall: {tenVsOverall}/5</div>
                  )}
                  {crisisSeverity && (
                    <div>Crisis severity (max): {crisisSeverity}/5</div>
                  )}
                  {!fourPsOverall && !tenVsOverall && !crisisSeverity && (
                    <div>
                      RN has not yet saved 4Ps, 10-Vs, or Crisis Mode scoring
                      for this case.
                    </div>
                  )}
                </div>
                {renderFourPsMiniList()}
              </div>

              {/* Card 2: 10-Vs / clinical signal */}
              <div
                style={{
                  borderRadius: "10px",
                  border: "1px solid "#e2e8f0",
                  background: "#ffffff",
                  padding: "0.75rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  10-Vs Clinical Logic Engine™
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    marginBottom: "0.1rem",
                  }}
                >
                  {tenVsOverall
                    ? `10-Vs overall: ${tenVsOverall}/5`
                    : "Awaiting 10-Vs scoring"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                  }}
                >
                  {tenVsOverall ? (
                    <span>
                      RN has scored each of the 10 Vs on a 1–5 scale to reflect
                      how the clinical story helps or hurts the case.
                    </span>
                  ) : (
                    <span>
                      Once the RN saves the 10-Vs Clinical Logic Engine™, you
                      will see a concise snapshot of how the 10-Vs affect the
                      case.
                    </span>
                  )}
                </div>
                {renderTenVsMiniList()}
              </div>

              {/* Card 3: SDOH / Engagement */}
              <div
                style={{
                  borderRadius: "10px",
                  border: "1px solid "#e2e8f0",
                  background: "#ffffff",
                  padding: "0.75rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  SDOH & Engagement
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    marginBottom: "0.1rem",
                  }}
                >
                  {sdohOverall
                    ? `SDOH overall: ${sdohOverall}/5`
                    : "SDOH Pending"}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#64748b",
                  }}
                >
                  {engagementLabel}
                </div>
              </div>
            </div>

            <div
              style={{
                borderRadius: "10px",
                border: "1px solid "#e2e8f0",
                background: "#ffffff",
                padding: "0.85rem",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  marginBottom: "0.35rem",
                }}
              >
                RN Case Overview (Attorney-Facing)
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#0f172a",
                  marginBottom: "0.35rem",
                }}
              >
                This panel will ultimately be auto-generated by the Clinical
                Intelligence Engine using the RN&apos;s 4Ps, 10-Vs, SDOH, and
                Crisis scoring. For this prototype, use the cards above as a
                quick view of clinical strength, vulnerability, and context.
              </p>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                }}
              >
                As the Engine matures, this section will evolve into a concise,
                attorney-ready summary you can use directly in strategy and
                negotiation discussions.
              </p>
            </div>
          </div>
        );

      case "clinicalStory": {
        const narrativeLines = buildClinicalNarrative();
        const tenVsNarrative = tenVs?.narrative;
        const fourPsNarrative = fourPs?.narrative;

        return (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid "#e2e8f0",
              background: "#ffffff",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.35rem",
              }}
            >
              Clinically Informed Care Narrative – Snapshot
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#0f172a",
                marginBottom: "0.3rem",
              }}
            >
              This translates the RN tools (4Ps, 10-Vs, SDOH, and Crisis Mode)
              into a quick, attorney-facing summary of how the clinical picture
              supports or challenges the case.
            </p>
            <ul
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                paddingLeft: "1.1rem",
                marginBottom: "0.4rem",
              }}
            >
              {narrativeLines.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>

            {fourPsNarrative && (
              <div
                style={{
                  marginTop: "0.4rem",
                  paddingTop: "0.4rem",
                  borderTop: "1px solid "#e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  RN 4Ps Narrative
                </div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "#0f172a",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {fourPsNarrative}
                </p>
              </div>
            )}

            {tenVsNarrative && (
              <div
                style={{
                  marginTop: "0.4rem",
                  paddingTop: "0.4rem",
                  borderTop: "1px solid "#e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  RN 10-Vs Narrative
                </div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "#0f172a",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {tenVsNarrative}
                </p>
              </div>
            )}
          </div>
        );
      }

      case "sdohRisk":
        return (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid "#e2e8f0",
              background: "#ffffff",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.35rem",
              }}
            >
              SDOH & Risk Signals
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#0f172a",
                marginBottom: "0.35rem",
              }}
            >
              This view summarizes how social determinants, safety issues, and
              adherence risks may help or hurt the case, using the same 1–5
              severity scale as the Ps and Vs.
            </p>
            <ul
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                paddingLeft: "1.1rem",
                marginBottom: "0.35rem",
              }}
            >
              <li>
                SDOH overall:{" "}
                <strong>
                  {sdohOverall ? `${sdohOverall}/5` : "Not yet scored"}
                </strong>
              </li>
              <li>
                4Ps overall:{" "}
                <strong>
                  {fourPsOverall ? `${fourPsOverall}/5` : "Not yet scored"}
                </strong>
              </li>
              <li>
                10-Vs overall:{" "}
                <strong>
                  {tenVsOverall ? `${tenVsOverall}/5` : "Not yet scored"}
                </strong>
              </li>
              <li>
                Crisis severity (max):{" "}
                <strong>
                  {crisisSeverity ? `${crisisSeverity}/5` : "Not yet scored"}
                </strong>
              </li>
            </ul>

            {sdoh?.narrative && (
              <div
                style={{
                  marginTop: "0.4rem",
                  paddingTop: "0.4rem",
                  borderTop: "1px solid "#e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  RN SDOH Narrative
                </div>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "#0f172a",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {sdoh.narrative}
                </p>
              </div>
            )}

            {!sdoh?.narrative && (
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "#64748b",
                  marginTop: "0.35rem",
                }}
              >
                Once the RN completes the SDOH summary paragraph and saves the
                draft, the attorney-facing narrative will appear here.
              </p>
            )}
          </div>
        );

      case "timeline":
        return (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid "#e2e8f0",
              background: "#ffffff",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.35rem",
              }}
            >
              High-Level Case Timeline (Attorney View)
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                marginBottom: "0.35rem",
              }}
            >
              This timeline is a <strong>simplified, attorney-friendly view</strong> of key
              clinical and case events. Each card highlights what matters most
              for strategy: what happened, why it matters clinically, and how
              the RN is interpreting its impact on the case.
            </p>

            <p
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
              }}
            >
              No timeline events have been recorded for this case yet. Once
              the RN begins logging visits, crises, and milestones, they will
              appear here as concise, attorney-ready cards.
            </p>
          </div>
        );

      case "documents":
        return (
          <div
            style={{
              borderRadius: "10px",
              border: "1px solid "#e2e8f0",
              background: "#ffffff",
              padding: "0.85rem",
            }}
          >
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                marginBottom: "0.35rem",
              }}
            >
              Reports & Attachments
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#0f172a",
                marginBottom: "0.35rem",
              }}
            >
              This tab will serve as the attorney’s hub for RN deliverables:
              structured reports, summaries, and any uploaded documents relevant
              to the case.
            </p>
            <ul
              style={{
                fontSize: "0.78rem",
                color: "#64748b",
                paddingLeft: "1.1rem",
              }}
            >
              <li>RN case summary reports (generated from the Engine).</li>
              <li>Pain diary / functional snapshots, if shared.</li>
              <li>
                Crisis documentation summaries when they are material to the
                case.
              </li>
              <li>
                Future: links to the firm’s DMS, portals, or evidence folders.
              </li>
            </ul>
          </div>
        );

      default:
        return null;
    }
  };

  console.log('=== AttorneyConsole: Returning main content ===');
  console.log('AttorneyConsole RENDER - about to return JSX');

  return (
    <RoleGuard requiredRole="attorney" redirectTo="/attorney-login">
      <div style={{ padding: "1.5rem" }}>
        {/* DEBUG: Test div to confirm component is mounting */}
        <div style={{ 
          color: 'red', 
          backgroundColor: 'yellow', 
          padding: '20px', 
          fontSize: '24px', 
          fontWeight: 'bold',
          border: '3px solid black',
          marginBottom: '20px',
          zIndex: 9999
        }}>
          ✅ ATTORNEY CONSOLE LOADED - Component is rendering!
        </div>
        {/* Header */}
        <div
          style={{
            marginBottom: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.2rem",
                fontWeight: 600,
                marginBottom: "0.15rem",
              }}
            >
              Attorney Console
            </h1>
            <p style={{ fontSize: "0.8rem", color: "#64748b" }}>
              Read-only, clinically informed view of the case to support
              strategy, negotiations, and decision-making.
            </p>
          </div>

        <div
          style={{
            textAlign: "right",
            fontSize: "0.75rem",
            color: "#64748b",
          }}
        >
          {updatedAtDisplay ? (
            <div style={{ marginBottom: "0.2rem" }}>
              Last RN update: <strong>{updatedAtDisplay}</strong>
            </div>
          ) : (
            <div style={{ marginBottom: "0.2rem" }}>
              No RN summary saved yet.
            </div>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            style={{
              padding: "0.25rem 0.7rem",
              borderRadius: "999px",
              border: "1px solid "#cbd5e1",
              background: "#ffffff",
              fontSize: "0.75rem",
              cursor: "pointer",
            }}
          >
            Refresh from RN
          </button>
        </div>
      </div>

      {/* RN module completion badges */}
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.4rem",
          fontSize: "0.73rem",
        }}
      >
        {[
          { label: "4Ps Draft", done: hasFourPs },
          { label: "10-Vs Draft", done: hasTenVs },
          { label: "SDOH Draft", done: hasSdoh },
          { label: "Crisis Draft", done: hasCrisis },
        ].map((item) => (
          <span
            key={item.label}
            style={{
              padding: "0.18rem 0.6rem",
              borderRadius: "999px",
              border: "1px solid "#cbd5e1",
              background: item.done ? "#e0f2fe" : "#f8fafc",
              color: item.done ? "#0369a1" : "#64748b",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "999px",
                background: item.done ? "#22c55e" : "#cbd5e1",
              }}
            />
            {item.label}
            {item.done ? "✓" : ""}
          </span>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            { key: "overview", label: "Overview" },
            { key: "clinicalStory", label: "Clinical Story" },
            { key: "sdohRisk", label: "SDOH & Risk" },
            { key: "timeline", label: "Timeline" },
            { key: "documents", label: "Reports & Docs" },
          ] as { key: AttorneyTab; label: string }[]
        ).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: active ? "1px solid "#0f2a6a" : "1px solid "#cbd5e1",
                background: active ? "#0f2a6a" : "#ffffff",
                color: active ? "#ffffff" : "#0f172a",
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "10px",
          padding: "1rem",
          border: "1px solid "#e2e8f0",
          minHeight: "320px",
        }}
      >
        {renderTab()}
      </div>
    </div>
    </RoleGuard>
  );
};

export default AttorneyConsole;
