/**
 * Export Audit Trail Component
 * 
 * Displays a read-only table of attorney export audit records.
 * Shows only exports for the authenticated attorney user.
 */

import React, { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";

interface ExportAuditRecord {
  id: string;
  created_at: string;
  export_action: "PRINT_PDF" | "DOWNLOAD_TEXT";
  export_format: "PDF" | "TEXT";
  released_case_id: string;
  revision_chain_root_case_id: string;
}

export const ExportAuditTrail: React.FC = () => {
  const [auditRecords, setAuditRecords] = useState<ExportAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditRecords = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Authentication required");
          setLoading(false);
          return;
        }

        // Query audit records for this attorney
        const { data, error: queryError } = await supabase
          .from("rc_export_audit")
          .select("id, created_at, export_action, export_format, released_case_id, revision_chain_root_case_id")
          .eq("attorney_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (queryError) {
          throw queryError;
        }

        setAuditRecords(data || []);
      } catch (err: any) {
        console.error("Error fetching export audit records:", err);
        setError(err.message || "Failed to load export audit trail");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditRecords();
  }, []);

  const formatDateTime = (iso: string): string => {
    try {
      return new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const formatAction = (action: string): string => {
    return action === "PRINT_PDF" ? "Print PDF" : "Download Text";
  };

  const truncateId = (id: string, length: number = 8): string => {
    if (!id) return "—";
    // Extract last segment of UUID for brevity
    const segments = id.split("-");
    const lastSegment = segments[segments.length - 1];
    return lastSegment.substring(0, length);
  };

  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#64748b" }}>
        Loading export audit trail...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "1rem", color: "#dc2626" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Error</div>
        <div style={{ fontSize: "0.9rem" }}>{error}</div>
      </div>
    );
  }

  if (auditRecords.length === 0) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#64748b" }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.25rem" }}>
          No export records found
        </div>
        <div style={{ fontSize: "0.85rem" }}>
          Export audit records will appear here after you export released case snapshots.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "0.75rem", fontSize: "0.9rem", color: "#64748b" }}>
        Showing {auditRecords.length} most recent export{auditRecords.length !== 1 ? "s" : ""}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.85rem",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
              <th
                style={{
                  padding: "0.65rem 0.75rem",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Date/Time
              </th>
              <th
                style={{
                  padding: "0.65rem 0.75rem",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Action
              </th>
              <th
                style={{
                  padding: "0.65rem 0.75rem",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Format
              </th>
              <th
                style={{
                  padding: "0.65rem 0.75rem",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Released Snapshot ID
              </th>
              <th
                style={{
                  padding: "0.65rem 0.75rem",
                  textAlign: "left",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Case/Chain ID
              </th>
            </tr>
          </thead>
          <tbody>
            {auditRecords.map((record) => (
              <tr
                key={record.id}
                style={{
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                <td
                  style={{
                    padding: "0.65rem 0.75rem",
                    color: "#0f172a",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  }}
                >
                  {formatDateTime(record.created_at)}
                </td>
                <td style={{ padding: "0.65rem 0.75rem", color: "#0f172a" }}>
                  {formatAction(record.export_action)}
                </td>
                <td style={{ padding: "0.65rem 0.75rem", color: "#0f172a" }}>
                  {record.export_format}
                </td>
                <td
                  style={{
                    padding: "0.65rem 0.75rem",
                    color: "#0f172a",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  }}
                  title={record.released_case_id}
                >
                  {truncateId(record.released_case_id)}
                </td>
                <td
                  style={{
                    padding: "0.65rem 0.75rem",
                    color: "#0f172a",
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                  }}
                  title={record.revision_chain_root_case_id}
                >
                  {truncateId(record.revision_chain_root_case_id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
