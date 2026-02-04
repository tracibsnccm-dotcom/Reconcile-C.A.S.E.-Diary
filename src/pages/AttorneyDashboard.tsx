import React from "react";
import { useAuth } from "@/auth/supabaseAuth";
import { useNavigate } from "react-router-dom";
import { CASE_BRAND } from "@/constants/brand";

export default function AttorneyDashboard() {
  const { user, signOut, role } = useAuth();
  const navigate = useNavigate();

  if (role !== "attorney" || !user) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>Please log in to access the attorney dashboard.</p>
        <button onClick={() => navigate("/attorney-login")} style={{
          marginTop: "16px", padding: "10px 24px", backgroundColor: "#fb923c",
          color: "white", border: "none", borderRadius: "8px", cursor: "pointer",
        }}>Go to Login</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "24px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#fb923c" }}>
              Attorney Dashboard
            </h1>
            <p style={{ color: "#6b7280", fontSize: "14px" }}>{user.email}</p>
          </div>
          <button
            onClick={async () => { await signOut(); navigate("/"); }}
            style={{
              padding: "8px 16px", backgroundColor: "#ef4444", color: "white",
              border: "none", borderRadius: "6px", cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <div style={{
          backgroundColor: "white", borderRadius: "12px", padding: "32px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)", textAlign: "center",
        }}>
          <h2 style={{ color: "#fb923c", marginBottom: "16px" }}>{CASE_BRAND.platformName}</h2>
          <p style={{ color: "#6b7280" }}>Your case management dashboard will appear here.</p>
          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "8px" }}>
            Phase 2 will add pending intakes, case list, and attestation.
          </p>
        </div>
      </div>
    </div>
  );
}
