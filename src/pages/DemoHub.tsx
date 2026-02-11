// src/pages/DemoHub.tsx

import React, { useEffect, useMemo, useState } from "react";
import AttorneyConsole from "../screens/AttorneyConsole";
import ClientIntakeScreen from "../screens/ClientIntakeScreen";

type DemoView = "hub" | "attorney" | "client";

const ACCESS_CODE = "RCMS-CARE-2026";
const STORAGE_KEY = "rcms_demo_unlocked_v1";

const DemoHub: React.FC = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<DemoView>("hub");

  useEffect(() => {
    try {
      const v = window.localStorage.getItem(STORAGE_KEY);
      if (v === "true") setUnlocked(true);
    } catch {
      // ignore
    }
  }, []);

  const setUnlockedPersist = (next: boolean) => {
    setUnlocked(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const lock = () => {
    setUnlockedPersist(false);
    setView("hub");
    setCode("");
    setError(null);
  };

  const tryUnlock = () => {
    setError(null);
    const normalized = code.trim();
    if (!normalized) {
      setError("Enter your access code.");
      return;
    }
    if (normalized !== ACCESS_CODE) {
      setError("Invalid access code. Please check your email and try again.");
      return;
    }
    setUnlockedPersist(true);
    setView("hub");
    setCode("");
    setError(null);
  };

  const ui = useMemo(() => {
    const navy = "#0f2a6a";
    const gold = "#b09837";
    const bg = "#f8fafc";
    const ink = "#0f172a";
    const slate = "#475569";
    const muted = "#64748b";
    const border = "#e2e8f0";

    const page: React.CSSProperties = {
      minHeight: "100vh",
      background: bg,
      // quiet luxury lighting
      backgroundImage:
        "radial-gradient(900px 380px at 20% 0%, rgba(15,42,106,0.12), transparent 60%), radial-gradient(700px 420px at 85% 15%, rgba(176,152,55,0.14), transparent 55%)",
    };

    const shell: React.CSSProperties = {
      maxWidth: "1040px",
      margin: "0 auto",
      padding: "1.35rem 1.25rem 2.25rem",
    };

    const topBar: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
      padding: "0.95rem 1.05rem",
      borderRadius: "16px",
      border: `1px solid ${border}`,
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(8px)",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
    };

    const brandLockup: React.CSSProperties = {
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      lineHeight: 1.1,
    };

    const mark: React.CSSProperties = {
      width: "38px",
      height: "38px",
      borderRadius: "12px",
      border: `1px solid rgba(176,152,55,0.35)`,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))",
      boxShadow: "0 10px 20px rgba(15, 23, 42, 0.10)",
      display: "grid",
      placeItems: "center",
      fontWeight: 950,
      color: navy,
      letterSpacing: "-0.02em",
      fontSize: "0.92rem",
    };

    const title: React.CSSProperties = {
      fontSize: "1.02rem",
      fontWeight: 950,
      color: ink,
      letterSpacing: "-0.02em",
      marginBottom: "0.14rem",
    };

    const sub: React.CSSProperties = {
      fontSize: "0.86rem",
      color: muted,
      fontWeight: 650,
      lineHeight: 1.4,
    };

    const pillRow: React.CSSProperties = {
      display: "flex",
      gap: "0.4rem",
      flexWrap: "wrap",
      justifyContent: "flex-end",
      alignItems: "center",
    };

    const pill: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.22rem 0.65rem",
      borderRadius: "999px",
      border: `1px solid ${border}`,
      background: "rgba(248,250,252,0.85)",
      color: slate,
      fontSize: "0.78rem",
      fontWeight: 850,
      whiteSpace: "nowrap",
    };

    const statusPill = (on: boolean): React.CSSProperties => ({
      ...pill,
      border: on ? "1px solid rgba(34,197,94,0.45)" : `1px solid ${border}`,
      background: on ? "rgba(220,252,231,0.85)" : "rgba(248,250,252,0.85)",
      color: on ? "#166534" : slate,
    });

    const hero: React.CSSProperties = {
      marginTop: "0.95rem",
      borderRadius: "18px",
      border: `1px solid ${border}`,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.86))",
      backdropFilter: "blur(10px)",
      boxShadow: "0 18px 60px rgba(15, 23, 42, 0.10)",
      overflow: "hidden",
    };

    const heroInner: React.CSSProperties = {
      display: "grid",
      gridTemplateColumns: "1.2fr 0.8fr",
      gap: "0.95rem",
      padding: "1.2rem 1.2rem 1.1rem",
    };

    const eyebrow: React.CSSProperties = {
      fontSize: "0.76rem",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: muted,
      fontWeight: 900,
    };

    const heroTitle: React.CSSProperties = {
      fontSize: "1.55rem",
      fontWeight: 950,
      color: ink,
      letterSpacing: "-0.03em",
      marginTop: "0.35rem",
      marginBottom: "0.35rem",
      lineHeight: 1.1,
    };

    const heroBody: React.CSSProperties = {
      fontSize: "0.95rem",
      color: slate,
      lineHeight: 1.65,
      fontWeight: 560,
      maxWidth: "54ch",
    };

    const goldRule: React.CSSProperties = {
      height: "1px",
      width: "54px",
      background: gold,
      opacity: 0.95,
      marginTop: "0.75rem",
      marginBottom: "0.85rem",
    };

    const trustRow: React.CSSProperties = {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      marginTop: "0.75rem",
    };

    const trustChip: React.CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      padding: "0.28rem 0.7rem",
      borderRadius: "999px",
      border: `1px solid ${border}`,
      background: "rgba(248,250,252,0.9)",
      color: slate,
      fontSize: "0.78rem",
      fontWeight: 850,
      whiteSpace: "nowrap",
    };

    const rightCard: React.CSSProperties = {
      borderRadius: "16px",
      border: `1px solid ${border}`,
      background: "#ffffff",
      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
      padding: "1rem",
    };

    const cardTitle: React.CSSProperties = {
      fontSize: "0.92rem",
      fontWeight: 950,
      color: ink,
      letterSpacing: "-0.02em",
      marginBottom: "0.25rem",
    };

    const cardSub: React.CSSProperties = {
      fontSize: "0.84rem",
      color: muted,
      lineHeight: 1.5,
      fontWeight: 600,
      marginBottom: "0.8rem",
    };

    const input: React.CSSProperties = {
      width: "100%",
      border: `1px solid ${border}`,
      borderRadius: "14px",
      padding: "0.72rem 0.78rem",
      fontSize: "0.98rem",
      outline: "none",
      color: ink,
      background: "#ffffff",
      fontWeight: 650,
    };

    const btnPrimary: React.CSSProperties = {
      width: "100%",
      padding: "0.72rem 0.9rem",
      borderRadius: "999px",
      border: `1px solid ${navy}`,
      background: navy,
      color: "#ffffff",
      fontSize: "0.92rem",
      fontWeight: 900,
      cursor: "pointer",
    };

    const btnSecondary: React.CSSProperties = {
      width: "100%",
      padding: "0.72rem 0.9rem",
      borderRadius: "999px",
      border: `1px solid ${border}`,
      background: "#ffffff",
      color: ink,
      fontSize: "0.92rem",
      fontWeight: 900,
      cursor: "pointer",
    };

    const subtleLink: React.CSSProperties = {
      fontSize: "0.82rem",
      color: muted,
      lineHeight: 1.5,
      fontWeight: 650,
      marginTop: "0.75rem",
    };

    const errorBox: React.CSSProperties = {
      marginTop: "0.65rem",
      borderRadius: "14px",
      border: "1px solid #fecaca",
      background: "#fef2f2",
      color: "#991b1b",
      padding: "0.7rem 0.75rem",
      fontSize: "0.88rem",
      fontWeight: 750,
      lineHeight: 1.45,
    };

    const bottomGrid: React.CSSProperties = {
      marginTop: "0.9rem",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.85rem",
    };

    const actionCard: React.CSSProperties = {
      borderRadius: "18px",
      border: `1px solid ${border}`,
      background: "#ffffff",
      boxShadow: "0 16px 50px rgba(15, 23, 42, 0.08)",
      padding: "1.05rem",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      minHeight: "166px",
    };

    const actionLabel: React.CSSProperties = {
      fontSize: "0.76rem",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: muted,
      fontWeight: 900,
      marginBottom: "0.35rem",
    };

    const actionTitle: React.CSSProperties = {
      fontSize: "1.05rem",
      fontWeight: 950,
      color: ink,
      letterSpacing: "-0.02em",
      marginBottom: "0.35rem",
    };

    const actionBody: React.CSSProperties = {
      fontSize: "0.9rem",
      color: slate,
      lineHeight: 1.6,
      fontWeight: 560,
      marginBottom: "0.9rem",
    };

    const actionRow: React.CSSProperties = {
      display: "flex",
      gap: "0.5rem",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
    };

    const btnInlinePrimary: React.CSSProperties = {
      padding: "0.6rem 0.95rem",
      borderRadius: "999px",
      border: `1px solid ${navy}`,
      background: navy,
      color: "#ffffff",
      fontSize: "0.9rem",
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
    };

    const btnInlineGhost: React.CSSProperties = {
      padding: "0.6rem 0.95rem",
      borderRadius: "999px",
      border: `1px solid ${border}`,
      background: "#ffffff",
      color: ink,
      fontSize: "0.9rem",
      fontWeight: 900,
      cursor: "pointer",
      whiteSpace: "nowrap",
    };

    const foot: React.CSSProperties = {
      marginTop: "1.1rem",
      paddingTop: "0.95rem",
      borderTop: `1px solid ${border}`,
      fontSize: "0.83rem",
      color: muted,
      lineHeight: 1.55,
      fontWeight: 650,
    };

    const footStrong: React.CSSProperties = {
      color: ink,
      fontWeight: 950,
    };

    return {
      navy,
      gold,
      ink,
      muted,
      slate,
      border,
      page,
      shell,
      topBar,
      brandLockup,
      mark,
      title,
      sub,
      pillRow,
      pill,
      statusPill,
      hero,
      heroInner,
      eyebrow,
      heroTitle,
      heroBody,
      goldRule,
      trustRow,
      trustChip,
      rightCard,
      cardTitle,
      cardSub,
      input,
      btnPrimary,
      btnSecondary,
      subtleLink,
      errorBox,
      bottomGrid,
      actionCard,
      actionLabel,
      actionTitle,
      actionBody,
      actionRow,
      btnInlinePrimary,
      btnInlineGhost,
      foot,
      footStrong,
    };
  }, []);

  // --- Fullscreen views (keep polished wrapper) ---
  if (unlocked && view === "attorney") {
    return (
      <div style={ui.page}>
        <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "1rem 1rem 1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "0.85rem",
              padding: "0.85rem 1rem",
              borderRadius: "16px",
              border: `1px solid ${ui.border}`,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={ui.mark}>RC</div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 950, color: ui.ink, letterSpacing: "-0.02em" }}>
                  Attorney Console (Demo)
                </div>
                <div style={{ fontSize: "0.82rem", color: ui.muted, fontWeight: 650 }}>
                  Interactive navigation • Read-only • No PHI
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setView("hub")} style={ui.btnInlineGhost}>
                Back to Demo Hub
              </button>
              <button type="button" onClick={lock} style={ui.btnInlineGhost}>
                Lock demo
              </button>
            </div>
          </div>

          <AttorneyConsole />
        </div>
      </div>
    );
  }

  if (unlocked && view === "client") {
    return (
      <div style={ui.page}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "1rem 1rem 1.5rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
              marginBottom: "0.85rem",
              padding: "0.85rem 1rem",
              borderRadius: "16px",
              border: `1px solid ${ui.border}`,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 12px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={ui.mark}>RC</div>
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 950, color: ui.ink, letterSpacing: "-0.02em" }}>
                  Client Experience (Demo)
                </div>
                <div style={{ fontSize: "0.82rem", color: ui.muted, fontWeight: 650 }}>
                  Representative flow • Demo-only • No PHI
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setView("hub")} style={ui.btnInlineGhost}>
                Back to Demo Hub
              </button>
              <button type="button" onClick={lock} style={ui.btnInlineGhost}>
                Lock demo
              </button>
            </div>
          </div>

          <ClientIntakeScreen />
        </div>
      </div>
    );
  }

  // --- Hub view ---
  return (
    <div style={ui.page}>
      <div style={ui.shell}>
        <div style={ui.topBar}>
          <div style={ui.brandLockup}>
            <div style={ui.mark}>RC</div>
            <div>
              <div style={ui.title}>Reconcile C.A.R.E.™</div>
              <div style={ui.sub}>Secure, read-only attorney evaluation environment</div>
            </div>
          </div>

          <div style={ui.pillRow}>
            <span style={ui.pill}>Read-only</span>
            <span style={ui.pill}>No PHI</span>
            <span style={ui.pill}>Representative data</span>
            <span style={ui.statusPill(unlocked)}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "999px",
                  background: unlocked ? "#22c55e" : "#cbd5e1",
                }}
              />
              Access: {unlocked ? "Unlocked" : "Locked"}
            </span>
          </div>
        </div>

        <div style={ui.hero}>
          <div style={ui.heroInner}>
            <div>
              <div style={ui.eyebrow}>Attorney Demo Preview</div>
              <div style={ui.heroTitle}>Clinically informed care signals—built for defensibility.</div>
              <div style={ui.heroBody}>
                Reconcile C.A.R.E.™ is designed to strengthen the clinical record while care is happening—so your
                strategy is supported by real-time documentation logic, not retrospective reconstruction.
              </div>

              <div style={ui.goldRule} />

              <div style={ui.trustRow}>
                <span style={ui.trustChip}>Payer-logic aligned</span>
                <span style={ui.trustChip}>RN assessment-based (no diagnosis)</span>
                <span style={ui.trustChip}>Designed for attorney review</span>
              </div>

              {unlocked && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setView("attorney")} style={ui.btnInlinePrimary}>
                    Open Attorney Console
                  </button>
                  <button type="button" onClick={() => setView("client")} style={ui.btnInlineGhost}>
                    Open Client Experience
                  </button>
                  <button type="button" onClick={lock} style={ui.btnInlineGhost}>
                    Lock demo
                  </button>
                </div>
              )}
            </div>

            <div style={ui.rightCard}>
              {!unlocked ? (
                <>
                  <div style={ui.cardTitle}>Enter access code</div>
                  <div style={ui.cardSub}>
                    Access is provided via your professional email after requesting demo access.
                  </div>

                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Access code"
                    style={ui.input}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") tryUnlock();
                    }}
                  />

                  <div style={{ marginTop: "0.65rem" }}>
                    <button type="button" onClick={tryUnlock} style={ui.btnPrimary}>
                      Unlock demo
                    </button>
                  </div>

                  {error && <div style={ui.errorBox}>{error}</div>}

                  <div style={ui.subtleLink}>
                    If you don’t have a code, request access through the firm outreach link you received.
                  </div>
                </>
              ) : (
                <>
                  <div style={ui.cardTitle}>Access confirmed</div>
                  <div style={ui.cardSub}>
                    Choose a module below. Navigation is interactive; all content is read-only and representative.
                  </div>

                  <button type="button" onClick={() => setView("attorney")} style={ui.btnPrimary}>
                    Open Attorney Console
                  </button>

                  <div style={{ height: "0.5rem" }} />

                  <button type="button" onClick={() => setView("client")} style={ui.btnSecondary}>
                    Open Client Experience
                  </button>

                  <div style={ui.subtleLink}>
                    Recommended path: Attorney Console → Reports preview → Client flow overview.
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ padding: "0 1.2rem 1.1rem" }}>
            <div style={ui.bottomGrid}>
              <div style={ui.actionCard}>
                <div>
                  <div style={ui.actionLabel}>Module</div>
                  <div style={ui.actionTitle}>Attorney Console</div>
                  <div style={ui.actionBody}>
                    Read-only view of clinically informed care narrative, risk signals, and report previews designed to
                    support strategy and negotiations.
                  </div>
                </div>
                <div style={ui.actionRow}>
                  <span style={{ fontSize: "0.82rem", color: ui.muted, fontWeight: 750 }}>
                    Best starting point
                  </span>
                  <button
                    type="button"
                    onClick={() => (unlocked ? setView("attorney") : null)}
                    style={{
                      ...ui.btnInlinePrimary,
                      opacity: unlocked ? 1 : 0.55,
                      cursor: unlocked ? "pointer" : "not-allowed",
                    }}
                    title={unlocked ? "Open Attorney Console" : "Unlock demo first"}
                  >
                    Open
                  </button>
                </div>
              </div>

              <div style={ui.actionCard}>
                <div>
                  <div style={ui.actionLabel}>Module</div>
                  <div style={ui.actionTitle}>Client Experience</div>
                  <div style={ui.actionBody}>
                    Preview the client-side intake flow and how information is captured in a structured, defensible way
                    (demo-only).
                  </div>
                </div>
                <div style={ui.actionRow}>
                  <span style={{ fontSize: "0.82rem", color: ui.muted, fontWeight: 750 }}>
                    Context + capture
                  </span>
                  <button
                    type="button"
                    onClick={() => (unlocked ? setView("client") : null)}
                    style={{
                      ...ui.btnInlineGhost,
                      opacity: unlocked ? 1 : 0.55,
                      cursor: unlocked ? "pointer" : "not-allowed",
                    }}
                    title={unlocked ? "Open Client Experience" : "Unlock demo first"}
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>

            <div style={ui.foot}>
              <span style={ui.footStrong}>Demo access provided for evaluation purposes.</span>
              <br />
              This preview is read-only and contains representative data only. For firm-specific walkthroughs,
              implementation details, or next steps, please contact us.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoHub;
