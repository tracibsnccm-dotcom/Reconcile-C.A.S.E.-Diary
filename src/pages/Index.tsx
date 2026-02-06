import React from "react";
import { Link } from "react-router-dom";
import { CASE_BRAND } from "@/constants/brand";

export default function Index() {
  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      background: "linear-gradient(145deg, #1e3a5f 0%, #2d4a6f 40%, #3d5a7f 70%, #4a6a8f 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 32px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      {/* Subtle inner glow at top */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "40%",
        background: "radial-gradient(ellipse at top center, rgba(255,255,255,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <h1 style={{
        position: "relative",
        fontWeight: "bold",
        marginBottom: "16px",
      }}>
        <span style={{
          color: "#ffffff",
          textShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontSize: "2rem",
        }}>Reconcile</span>{" "}
        <span style={{
          color: "#fbbf24",
          textShadow: "0 0 20px rgba(251, 191, 36, 0.4), 0 2px 8px rgba(0,0,0,0.3)",
          fontSize: "3.5rem",
          fontWeight: "bold",
        }}>
          C.A.S.E.
        </span>
      </h1>
      <p style={{
        position: "relative",
        fontSize: "24px",
        color: "rgba(254, 253, 251, 0.95)",
        fontWeight: 300,
        marginBottom: "8px",
      }}>
        {CASE_BRAND.fullName}
      </p>
      <p style={{
        position: "relative",
        fontSize: "16px",
        color: "rgba(254, 253, 251, 0.85)",
        marginBottom: "48px",
      }}>
        {CASE_BRAND.tagline}
      </p>

      {/* PRIMARY SECTION - Client Intake */}
      <div style={{
        position: "relative",
        backgroundColor: "#fefdfb",
        borderRadius: "24px",
        padding: "56px 48px",
        maxWidth: "500px",
        margin: "0 auto 40px auto",
        boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 12px 32px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)",
        border: "1px solid rgba(255,255,255,0.1)",
        transform: "translateY(0)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#1e3a5f",
          marginBottom: "24px",
          textAlign: "center",
        }}>Client Intake</h2>

        <Link to="/intake-identity" style={{
          display: "block",
          padding: "24px 48px",
          background: "linear-gradient(180deg, #ff9f4a 0%, #fb923c 50%, #ea580c 100%)",
          color: "white",
          borderRadius: "16px",
          fontSize: "20px",
          fontWeight: "bold",
          textDecoration: "none",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(251, 146, 60, 0.5), 0 4px 12px rgba(234, 88, 12, 0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          marginBottom: "20px",
          border: "none",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 16px 48px rgba(251, 146, 60, 0.55), 0 6px 16px rgba(234, 88, 12, 0.35), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 12px 40px rgba(251, 146, 60, 0.5), 0 4px 12px rgba(234, 88, 12, 0.3), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
        >
          Start Your Intake
        </Link>

        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#2d4a6f", fontSize: "14px", marginBottom: "8px" }}>Already started but didn't finish?</p>
          <Link
            to="/resume-intake"
            style={{ color: "#1e3a5f", textDecoration: "underline", fontWeight: 600 }}
          >
            Resume Your Intake
          </Link>
        </div>
      </div>

      {/* SECONDARY SECTION - Portal Buttons */}
      <div style={{ position: "relative", display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/client-login" style={{
          padding: "20px 40px",
          fontSize: "18px",
          fontWeight: "bold",
          borderRadius: "14px",
          background: "linear-gradient(180deg, #2dd4bf 0%, #14b8a6 50%, #0d9488 100%)",
          color: "white",
          border: "none",
          textDecoration: "none",
          boxShadow: "0 8px 28px rgba(13, 148, 136, 0.45), inset 0 2px 0 rgba(255,255,255,0.2)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(13, 148, 136, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(13, 148, 136, 0.45), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
        >
          Client Portal
        </Link>

        <Link to="/attorney-login" style={{
          padding: "20px 40px",
          fontSize: "18px",
          fontWeight: "bold",
          borderRadius: "14px",
          background: "linear-gradient(180deg, #fdba74 0%, #fb923c 50%, #ea580c 100%)",
          color: "white",
          border: "none",
          textDecoration: "none",
          boxShadow: "0 8px 28px rgba(251, 146, 60, 0.45), inset 0 2px 0 rgba(255,255,255,0.2)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(251, 146, 60, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(251, 146, 60, 0.45), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
        >
          Attorney Portal
        </Link>

        <Link to="/provider-login" style={{
          padding: "20px 40px",
          fontSize: "18px",
          fontWeight: "bold",
          borderRadius: "14px",
          background: "linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)",
          color: "white",
          border: "none",
          textDecoration: "none",
          boxShadow: "0 8px 28px rgba(124, 58, 237, 0.45), inset 0 2px 0 rgba(255,255,255,0.2)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(124, 58, 237, 0.5), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(124, 58, 237, 0.45), inset 0 2px 0 rgba(255,255,255,0.2)";
          }}
        >
          Provider Portal
        </Link>
      </div>

      <div style={{ position: "relative", marginTop: "72px", textAlign: "center" }}>
        <p style={{
          color: "rgba(255,255,255,0.8)",
          fontSize: "14px",
        }}>
          © 2026 Reconcile Care Management Services. All rights reserved.
        </p>
        <p style={{
          color: "rgba(255,255,255,0.8)",
          fontSize: "13px",
          marginTop: "4px",
        }}>
          Traci Johnson, BSN RN, CCM
        </p>
      </div>
    </div>
  );
}
