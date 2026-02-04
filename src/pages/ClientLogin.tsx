import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { CASE_BRAND } from "@/constants/brand";
import { toast } from "sonner";

export default function ClientLogin() {
  const [caseNumber, setCaseNumber] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { clientLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim() || !pin.trim()) {
      toast.error("Please enter both case number and PIN");
      return;
    }
    setIsLoading(true);
    const { error } = await clientLogin(caseNumber, pin);
    setIsLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/client");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "48px",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      }}>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#1e3a8a", marginBottom: "8px", textAlign: "center" }}>
          Client Login
        </h2>
        <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "24px" }}>
          Enter your case number and PIN to access your {CASE_BRAND.diaryName}
        </p>
        <p style={{ textAlign: "center", marginBottom: "12px" }}>
          <Link
            to="/intake"
            style={{
              fontSize: "14px",
              color: "#f97316",
              textDecoration: "underline",
              fontWeight: 500,
            }}
          >
            New client? Start intake
          </Link>
        </p>
        <p style={{ textAlign: "center", marginBottom: "24px" }}>
          <Link
            to="/intake/resume"
            style={{
              fontSize: "14px",
              color: "#f97316",
              textDecoration: "underline",
              fontWeight: 500,
            }}
          >
            Resume saved intake
          </Link>
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              Case Number
            </label>
            <input
              type="text"
              value={caseNumber}
              onChange={e => setCaseNumber(e.target.value.toUpperCase())}
              placeholder="e.g. BG04-260115-01M"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px",
                fontFamily: "monospace",
                letterSpacing: "1px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "32px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="4-digit PIN"
              maxLength={4}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "24px",
                fontFamily: "monospace",
                letterSpacing: "8px",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "14px",
              backgroundColor: "#1e3a8a",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: isLoading ? "wait" : "pointer",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
