// src/lib/pdf.ts
import { AppState } from "./models";
import { buildMedicalNarrative } from "./medicalNecessityNarrative";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Opens a print window with a branded, print-styled HTML doc.
 * Users can print or "Save as PDF".
 *
 * Put your logo at /public/rcms-logo.png (or change the path below).
 */
export function openNarrativePrintWindow(state: AppState) {
  const narrative = buildMedicalNarrative(state);
  const today = new Date().toISOString().slice(0, 10);
  const clientName = state.client?.name || "Client";

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>RCMS Medical Narrative — ${clientName}</title>
    <style>
      @page { size: Letter; margin: 0.75in; }
      body { font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; color: #0f172a; }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
      .header img { height: 40px; }
      .title { font-size: 18px; font-weight: 700; }
      .sub { font-size: 11px; color: #475569; }
      .hr { height: 1px; background: #e2e8f0; margin: 12px 0 16px; }
      .meta { font-size: 11px; color: #334155; margin-bottom: 12px; }
      .pre { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace; font-size: 12px; line-height: 1.45; }
      .footer { margin-top: 24px; font-size: 10px; color: #64748b; }
      @media print {
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="/rcms-logo.png" alt="RCMS Logo" />
      <div>
        <div class="title">Reconcile C.A.R.E. — Medical Necessity Narrative</div>
        <div class="sub">Integrating Clinical Precision with Compassionate Advocacy</div>
      </div>
    </div>
    <div class="hr"></div>
    <div class="meta">
      <div><strong>Client:</strong> ${escapeHtml(state.client?.name || "N/A")} &nbsp; <strong>ID:</strong> ${escapeHtml(state.client?.id || "N/A")}</div>
      <div><strong>Generated:</strong> ${today}</div>
    </div>
    <div class="pre">${escapeHtml(narrative)}</div>
    <div class="footer">
      Reconcile C.A.R.E.™ &mdash; Confidential and intended for authorized use (attorney/provider/audit).
    </div>
    <div class="no-print" style="margin-top:16px;">
      <button onclick="window.print()">Print / Save as PDF</button>
    </div>
    <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
  </body>
</html>`;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
