/**
 * React Error Boundary Component
 * 
 * Catches render errors and prevents blank screens by showing a fallback UI.
 * Logs errors to console for debugging.
 */

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            background: "#f8fafc",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              textAlign: "center",
              padding: "2rem",
              background: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: "0.5rem",
              }}
            >
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#64748b",
                marginBottom: "0.5rem",
              }}
            >
              Check console for details.
            </p>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#dc2626",
                marginBottom: "1rem",
                wordBreak: "break-word",
              }}
            >
              Error: {this.state.error?.name ? `${this.state.error.name}: ` : ""}
              {this.state.error?.message || "Unknown error"}
            </p>
            {import.meta.env.DEV && this.state.error?.stack && (
              <pre
                style={{
                  fontSize: "0.7rem",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: "12rem",
                  padding: "0.75rem",
                  background: "#f1f5f9",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                }}
              >
                {this.state.error.stack}
              </pre>
            )}
            {import.meta.env.DEV && this.state.errorInfo?.componentStack && (
              <pre
                style={{
                  fontSize: "0.7rem",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: "8rem",
                  padding: "0.75rem",
                  background: "#f1f5f9",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                }}
              >
                Component stack:
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#0f2a6a",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
