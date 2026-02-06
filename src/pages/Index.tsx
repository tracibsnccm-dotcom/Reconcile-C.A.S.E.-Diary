import React from "react";
import { Link } from "react-router-dom";
import { CASE_BRAND } from "@/constants/brand";

export default function Index() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <h1 style={{
        fontSize: "48px",
        fontWeight: "bold",
        marginBottom: "8px",
      }}>
        <span style={{
          color: "white",
          textShadow: "2px 2px 4px rgba(0,0,0,0.15)",
        }}>Reconcile</span>{" "}
        <span style={{
          color: "#fbbf24",
          textShadow: "2px 2px 4px rgba(0,0,0,0.2)",
        }}>C.A.S.E.</span>
      </h1>
      <p style={{
        fontSize: "24px",
        color: "#1e3a8a",
        fontWeight: 300,
        marginBottom: "4px",
      }}>
        {CASE_BRAND.fullName}
      </p>
      <p style={{
        fontSize: "16px",
        color: "#1e40af",
        marginBottom: "60px",
      }}>
        {CASE_BRAND.tagline}
      </p>

      {/* PRIMARY SECTION - Client Intake */}
      <div className="bg-white/20 backdrop-blur rounded-xl p-8 max-w-md mx-auto mb-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 text-center">Client Intake</h2>

        <Link to="/intake-identity" style={{
          display: "block",
          padding: "20px 40px",
          backgroundColor: "#fb923c",
          color: "white",
          borderRadius: "12px",
          fontSize: "18px",
          fontWeight: "bold",
          textDecoration: "none",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          marginBottom: "16px"
        }}>
          Start Your Intake
        </Link>

        <div className="text-center">
          <p className="text-blue-800 text-sm mb-2">Already started but didn't finish?</p>
          <Link
            to="/resume-intake"
            className="text-blue-700 hover:text-blue-600 underline font-medium"
          >
            Resume Your Intake
          </Link>
        </div>
      </div>

      {/* SECONDARY SECTION - Portal Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        <Link to="/client-login" style={{
          padding: "16px 32px",
          backgroundColor: "#0d9488",
          color: "white",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
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
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
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
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          Provider Portal
        </Link>
      </div>

      <p style={{ marginTop: "60px", color: "#1e3a8a", opacity: 0.9, fontSize: "12px" }}>
        {CASE_BRAND.copyright} | {CASE_BRAND.company}
      </p>
    </div>
  );
}
