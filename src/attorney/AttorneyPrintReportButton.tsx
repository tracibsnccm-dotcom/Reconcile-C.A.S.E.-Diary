/**
 * Attorney Print Report Button
 *
 * Allows attorneys to print/export released RN reports only.
 * Button appears only when the viewed report is RELEASED or CLOSED.
 */

import React from "react";
import { CaseSummary } from "../constants/reconcileFramework";
import { CaseWithRevision } from "../lib/resolveLatestReleasedCase";
import { printHtml } from "../lib/print";
import { buildAttorneyReportBody, ATTORNEY_PRINT_STYLES } from "./print/buildAttorneyPrintHtml";
import { logExportAudit, getExportFileName } from "../lib/exportAudit";

interface AttorneyPrintReportButtonProps {
  resolvedCase: CaseWithRevision | null;
  summary: CaseSummary | null;
  clientLabel?: string;
}

export const AttorneyPrintReportButton: React.FC<AttorneyPrintReportButtonProps> = ({
  resolvedCase,
  summary,
  clientLabel,
}) => {
  const status = resolvedCase ? (resolvedCase.case_status || "").toLowerCase() : "";
  const isReleased = status === "released" || status === "closed";

  const handlePrint = () => {
    if (!resolvedCase) return;
    const s = (resolvedCase.case_status || "").toLowerCase();
    if (s !== "released" && s !== "closed") return;

    logExportAudit({
      attorneyId: null,
      clientId: null,
      revisionChainRootCaseId: resolvedCase.id,
      releasedCaseId: resolvedCase.id,
      exportAction: "PRINT_PDF",
      exportFormat: "PDF",
      exportLabel: "Export Released RN Case Snapshot",
      fileName: getExportFileName(
        {
          case_id: resolvedCase.id,
          released_at: resolvedCase.released_at || resolvedCase.updated_at || resolvedCase.created_at || undefined,
        },
        "PDF"
      ),
    }).catch((err) => {
      console.warn("[AttorneyPrintReportButton] Audit logging failed, continuing with export:", err);
    });

    const caseIdentifier = clientLabel || resolvedCase.id || "";
    const body = `<style>${ATTORNEY_PRINT_STYLES}</style>\n` + buildAttorneyReportBody(summary);
    printHtml("Reconcile C.A.R.E. — RN Care Narrative (Released)", body, caseIdentifier);
  };

  if (!resolvedCase || !isReleased) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      style={{
        padding: "0.4rem 0.9rem",
        borderRadius: "999px",
        border: "1px solid #0f2a6a",
        background: "#0f2a6a",
        color: "#ffffff",
        fontSize: "0.85rem",
        fontWeight: 600,
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
      title="Print or save as PDF"
    >
      <span>🖨️</span>
      <span>Print / Export</span>
    </button>
  );
};
