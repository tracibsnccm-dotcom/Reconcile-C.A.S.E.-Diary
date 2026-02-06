import React from "react";
import { Link } from "react-router-dom";
import { CASE_BRAND } from "@/constants/brand";

export default function Index() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #bae6fd 0%, #7dd3fc 50%, #60a5fa 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "60px 32px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <h1 style={{
        fontWeight: "bold",
        marginBottom: "16px",
      }}>
        <span style={{
          fontSize: "2rem",
          color: "white",
          textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
        }}>Reconcile</span>{" "}
        <span style={{
          fontSize: "3.5rem",
          color: "#fbbf24",
          textShadow: "3px 3px 6px rgba(0,0,0,0.3)",
        }}>C.A.S.E.</span>
      </h1>
      <p style={{
        fontSize: "24px",
        color: "#1e3a8a",
        fontWeight: 300,
        marginBottom: "8px",
      }}>
        {CASE_BRAND.fullName}
      </p>
      <p style={{
        fontSize: "16px",
        color: "#1e40af",
        marginBottom: "48px",
      }}>
        {CASE_BRAND.tagline}
      </p>

      {/* PRIMARY SECTION - Client Intake */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "20px",
        padding: "48px 40px",
        maxWidth: "480px",
        margin: "0 auto 48px auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          color: "#1e3a8a",
          marginBottom: "24px",
          textAlign: "center",
        }}>Client Intake</h2>

        <Link to="/intake-identity" style={{
          display: "block",
          padding: "24px 48px",
          backgroundColor: "#fb923c",
          color: "white",
          borderRadius: "14px",
          fontSize: "20px",
          fontWeight: "bold",
          textDecoration: "none",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(251, 146, 60, 0.4)",
          marginBottom: "20px",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 32px rgba(251, 146, 60, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(251, 146, 60, 0.4)";
          }}
        >
          Start Your Intake
        </Link>

        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#1e40af", fontSize: "14px", marginBottom: "8px" }}>Already started but didn't finish?</p>
          <Link
            to="/resume-intake"
            style={{ color: "#1d4ed8", textDecoration: "underline", fontWeight: 500 }}
          >
            Resume Your Intake
          </Link>
        </div>
      </div>

      {/* SECONDARY SECTION - Portal Buttons */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/client-login" style={{
          padding: "16px 32px",
          backgroundColor: "#0d9488",
          color: "white",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 6px 20px rgba(13, 148, 136, 0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(13, 148, 136, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(13, 148, 136, 0.4)";
          }}
        >
          Client Portal
        </Link>

        <Link to="/attorney-login" style={{
          padding: "16px 32px",
          backgroundColor: "#fb923c",
          color: "white",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 6px 20px rgba(251, 146, 60, 0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(251, 146, 60, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(251, 146, 60, 0.4)";
          }}
        >
          Attorney Portal
        </Link>

        <Link to="/provider-login" style={{
          padding: "16px 32px",
          backgroundColor: "#7c3aed",
          color: "white",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 6px 20px rgba(124, 58, 237, 0.4)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 28px rgba(124, 58, 237, 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(124, 58, 237, 0.4)";
          }}
        >
          Provider Portal
        </Link>
      </div>

      <p style={{ marginTop: "72px", color: "#1e3a8a", opacity: 0.9, fontSize: "12px" }}>
        {CASE_BRAND.copyright} | {CASE_BRAND.company}
      </p>
    </div>
  );
}
