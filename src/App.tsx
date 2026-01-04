import React, { useState } from "react";
import { ClientFourPsForm } from "./components/diary/ClientFourPsForm";

function App() {
  return (
    <div style={{ 
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1e3a8a 0%, #0891b2 100%)",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ 
        maxWidth: "1000px", 
        margin: "0 auto"
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "40px",
          color: "white"
        }}>
          <h1 style={{ 
            fontSize: "48px", 
            fontWeight: "bold",
            marginBottom: "8px",
            letterSpacing: "0.5px"
          }}>
            Reconcile <span style={{ color: "#fb923c" }}>C.A.S.E.</span> Diary
          </h1>
          <p style={{ 
            fontSize: "24px",
            marginBottom: "4px",
            fontWeight: "300"
          }}>
            Client's Advocacy & Settlement Evidence
          </p>
          <p style={{ 
            fontSize: "16px",
            color: "rgba(255,255,255,0.9)",
            marginTop: "16px"
          }}>
            Document your recovery journey. Build evidence for your case.
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "24px",
          padding: "40px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.3)"
        }}>
          <ClientFourPsForm />
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          marginTop: "40px",
          color: "white",
          fontSize: "14px",
          opacity: 0.9
        }}>
          <p style={{ marginBottom: "8px" }}>
            © 2024 Reconcile Care Management Services
          </p>
          <p style={{ fontSize: "12px", opacity: 0.8 }}>
            Part of the Reconcile C.A.R.E. Platform - Comprehensive Nursing Care Management
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
