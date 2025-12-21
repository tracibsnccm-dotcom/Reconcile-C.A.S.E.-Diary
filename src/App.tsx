import React from "react";
import { ClientFourPsForm } from "./components/diary/ClientFourPsForm";

function App() {
  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "800px", 
      margin: "0 auto",
      fontFamily: "Arial, sans-serif"
    }}>
      <header style={{ 
        marginBottom: "30px",
        borderBottom: "2px solid #2563eb",
        paddingBottom: "20px"
      }}>
        <h1 style={{ 
          fontSize: "32px", 
          color: "#1e40af",
          marginBottom: "8px"
        }}>
          Reconcile C.A.S.E. Diary
        </h1>
        <p style={{ 
          color: "#4b5563",
          fontSize: "16px",
          marginBottom: "4px"
        }}>
          Client's Advocacy & Settlement Evidence Diary
        </p>
        <p style={{ 
          color: "#6b7280",
          fontSize: "14px"
        }}>
          Document your recovery journey. Build evidence for your case.
        </p>
      </header>

      <ClientFourPsForm />

      <footer style={{ 
        marginTop: "40px",
        paddingTop: "20px",
        borderTop: "1px solid #e5e7eb",
        textAlign: "center",
        color: "#6b7280",
        fontSize: "14px"
      }}>
        <p>© 2024 Reconcile Care Management Services</p>
        <p style={{ fontSize: "12px", marginTop: "8px" }}>
          This tool creates legal evidence. Submit entries honestly and consistently.
        </p>
      </footer>
    </div>
  );
}

export default App;
