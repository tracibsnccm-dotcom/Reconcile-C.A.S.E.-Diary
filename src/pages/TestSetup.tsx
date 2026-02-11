import React, { useState } from "react";

type Creds = { email: string; password: string } | null;
const roles = ["CLIENT", "ATTORNEY", "RN_CM", "STAFF", "ADMIN"];

export default function TestSetup() {
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [creds, setCreds] = useState<Creds>(null);
  const [error, setError] = useState<string | null>(null);

  async function createTestUser(role: string) {
    setLoadingRole(role);
    setCreds(null);
    setError(null);

    try {
      const res = await fetch("/api/test-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const body = await res.json();

      if (!res.ok) {
        setError(body?.error || "Unknown error creating test user");
      } else {
        setCreds({ email: body.email, password: body.password });
      }
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoadingRole(null);
    }
  }

  function copy(text: string) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).catch(() => {
      /* ignore */
    });
  }

  return (
    <div style={{ padding: 24, maxWidth: 820, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Access Reconcile C.A.R.E.</h1>
      <p style={{ marginTop: 0, marginBottom: 16 }}>
        Create a temporary test user for each role. Click a button to create a user and show credentials.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => createTestUser(r)}
            disabled={!!loadingRole}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              cursor: "pointer",
              background: loadingRole === r ? "#aaa" : "#0b66ff",
              color: "#fff",
              border: "none",
            }}
          >
            {loadingRole === r ? `Creating ${r}…` : `Create ${r}`}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {creds && (
        <div style={{ background: "#fbfbfd", padding: 12, borderRadius: 8, border: "1px solid #e6e6ef" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Email</div>
              <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{creds.email}</div>
            </div>
            <div>
              <button
                onClick={() => copy(creds.email)}
                style={{ marginLeft: 12, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: "#666" }}>Password</div>
              <div style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{creds.password}</div>
            </div>
            <div>
              <button
                onClick={() => copy(creds.password)}
                style={{ marginLeft: 12, padding: "6px 10px", borderRadius: 6, cursor: "pointer" }}
              >
                Copy
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: "#444" }}>
            Note: These credentials are for testing. Accounts created are real auth users in your Supabase project.
            Delete test users when finished. The API is gated — see server logs if creation fails.
          </div>
        </div>
      )}
    </div>
  );
}
