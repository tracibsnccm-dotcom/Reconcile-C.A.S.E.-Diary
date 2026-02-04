import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/supabaseAuth";
import { CASE_BRAND } from "@/constants/brand";
import { toast } from "sonner";

export default function AttorneyLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);
    if (error) {
      toast.error(error.message || "Login failed");
    } else {
      navigate("/attorney");
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
        <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#fb923c", marginBottom: "8px", textAlign: "center" }}>
          Attorney Portal
        </h2>
        <p style={{ color: "#6b7280", fontSize: "14px", textAlign: "center", marginBottom: "32px" }}>
          {CASE_BRAND.platformName} — Case Management Dashboard
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="attorney@lawfirm.com"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: "32px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "16px",
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
              backgroundColor: "#fb923c",
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
