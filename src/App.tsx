// src/App.tsx

import React, { useMemo, useState } from "react";

// Screens
import ClientIntakeScreen from "./screens/ClientIntakeScreen";
import AttorneyConsole from "./screens/AttorneyConsole";

// Demo Hub (code-gated)
import DemoHub from "./pages/DemoHub";

type AppTab = "clientDemo" | "attorneyDemo";

const App: React.FC = () => {
  const tabs = useMemo(
    () =>
      [
        { key: "clientDemo" as const, label: "Client Experience" },
        { key: "attorneyDemo" as const, label: "Attorney Console" },
      ] as const,
    []
  );

  const [activeTab, setActiveTab] = useState<AppTab>("clientDemo");

  // IMPORTANT:
  // Many marketing tools (including some GHL configurations) can strip the path
  // or land on the root. So we intentionally show the gated Demo Hub on BOTH
  // "/" and "/demo". You can tighten this later once your domains are finalized.
  const pathname =
    typeof window !== "undefined" ? window.location.pathname || "/" : "/";

  const shouldShowDemoHub =
    pathname === "/" || pathname === "/demo" || pathname.startsWith("/demo/");

  const renderTabbedDemo = () => {
    const renderTab = () => {
      switch (activeTab) {
        case "clientDemo":
          return <ClientIntakeScreen />;
        case "attorneyDemo":
          return <AttorneyConsole />;
        default:
          return <ClientIntakeScreen />;
      }
    };

    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        {/* Top bar */}
        <div
          style={{
            background: "#ffffff",
            borderBottom: "1px solid #e2e8f0",
            padding: "0.9rem 1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#0f172a" }}>
              Reconcile C.A.R.E.™ Demo
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Interactive navigation • Read-only demo • No PHI
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {tabs.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    padding: "0.45rem 0.95rem",
                    borderRadius: "999px",
                    border: active ? "1px solid #0f2a6a" : "1px solid #cbd5e1",
                    background: active ? "#0f2a6a" : "#ffffff",
                    color: active ? "#ffffff" : "#0f172a",
                    fontSize: "0.9rem",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "1.25rem" }}>{renderTab()}</div>
      </div>
    );
  };

  if (shouldShowDemoHub) {
    return (
      <DemoHub
        onEnterAttorneyDemo={() => setActiveTab("attorneyDemo")}
        onEnterClientDemo={() => setActiveTab("clientDemo")}
      />
    );
  }

  // If someone lands on a different route, we still show the demo (safe default).
  return renderTabbedDemo();
};

export default App;
