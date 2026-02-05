import React from "react";
import { Link } from "react-router-dom";
import { CASE_BRAND } from "@/constants/brand";

export default function Index() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    }}>
      <h1 style={{ fontSize: "48px", fontWeight: "bold", color: "white", marginBottom: "8px" }}>
        Reconcile <span style={{ color: "#fb923c" }}>C.A.S.E.</span>
      </h1>
      <p style={{ fontSize: "24px", color: "white", fontWeight: 300, marginBottom: "4px" }}>
        {CASE_BRAND.fullName}
      </p>
      <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", marginBottom: "60px" }}>
        {CASE_BRAND.tagline}
      </p>

      {/* PRIMARY SECTION - Client Intake */}
      <div className="bg-white/10 backdrop-blur rounded-xl p-8 max-w-md mx-auto mb-8">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Client Intake</h2>

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
          <p className="text-white/80 text-sm mb-2">Already started but didn't finish?</p>
          <Link
            to="/resume-intake"
            className="text-orange-300 hover:text-orange-200 underline font-medium"
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

      <p style={{ marginTop: "60px", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
        {CASE_BRAND.copyright} | {CASE_BRAND.company}
      </p>
    </div>
  );
}
