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
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link to="/client-login" style={{
          padding: "20px 40px",
          backgroundColor: "white",
          color: "#1e3a8a",
          borderRadius: "12px",
          fontSize: "18px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          Client Login
        </Link>
        <Link to="/attorney-login" style={{
          padding: "20px 40px",
          backgroundColor: "#fb923c",
          color: "white",
          borderRadius: "12px",
          fontSize: "18px",
          fontWeight: "bold",
          textDecoration: "none",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          Attorney Login
        </Link>
      </div>
      <p style={{ marginTop: "60px", color: "rgba(255,255,255,0.7)", fontSize: "12px" }}>
        {CASE_BRAND.copyright} | {CASE_BRAND.company}
      </p>
    </div>
  );
}
