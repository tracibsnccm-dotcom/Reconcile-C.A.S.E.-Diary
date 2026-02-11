/**
 * Client-only: Builds print-friendly HTML body for the released care plan/report.
 * Client-safe: calm section titles, no RN/attorney/internal wording.
 * Used by ClientCarePlanPrintButton with printHtml.
 */

import type { CaseSummary } from "@/constants/reconcileFramework";
import { FOUR_PS, TEN_VS, getSeverityLabel } from "@/constants/reconcileFramework";

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Renders "—" for null/undefined/empty; otherwise HTML-escaped. Use for user-provided fields. */
function orEmDash(s: string | null | undefined): string {
  if (s == null || String(s).trim() === "") return "—";
  return escapeHtml(String(s));
}

/** Print CSS for client report. Mirrors RN print structure; printHtml adds header. */
export const CLIENT_PRINT_STYLES = `
  .print-section { margin-bottom: 1.5rem; page-break-inside: avoid; }
  .print-section h2 { font-size: 14pt; font-weight: 700; margin-bottom: 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #ccc; color: #000; page-break-after: avoid; }
  .print-section h2 + p { page-break-before: avoid; }
  .section { margin-bottom: 1.5rem; page-break-inside: avoid; }
  .section h2 { font-size: 14pt; font-weight: 700; margin-bottom: 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #ccc; color: #000; page-break-after: avoid; }
  .section p { margin-bottom: 0.75rem; color: #000; }
  .section ul { margin-left: 1.5rem; margin-bottom: 0.75rem; }
  .section li { margin-bottom: 0.5rem; }
  .dimension-item { margin-bottom: 0.75rem; padding-left: 0.5rem; }
  .dimension-item strong { color: #000; }
  .narrative { margin-top: 0.75rem; padding: 0.75rem; background: #f9f9f9; border-left: 3px solid #ccc; white-space: pre-wrap; }
  @media print {
    .print-section { page-break-inside: avoid; margin-bottom: 0; }
    .print-section + .print-section { page-break-before: auto; }
    .print-section h2 { page-break-after: avoid; page-break-inside: avoid; }
    .section { page-break-inside: avoid; margin-bottom: 1rem; }
    .section h2 { page-break-after: avoid; page-break-inside: avoid; }
  }
`;

/**
 * Builds the report body HTML (sections + disclaimer) for use with printHtml.
 * printHtml adds the document wrapper, case identifier, and printed timestamp.
 * Client-friendly: no attorney/RN/internal phrasing.
 */
export function buildClientReleasedReportBody(summary: CaseSummary | null): string {
  const sectionsHtml = buildSections(summary);
  const disclaimer = `
  <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 9pt; color: #666;">
    <p>This is your released care plan/report. Draft revisions are not included.</p>
  </div>`;
  return sectionsHtml + disclaimer;
}

function buildSections(summary: CaseSummary | null): string {
  const fourPs = summary?.fourPs;
  const tenVs = summary?.tenVs;
  const sdoh = summary?.sdoh;

  const sections: string[] = [];

  sections.push(`
    <div class="print-section">
      <h2>Your Care Plan Summary</h2>
      ${buildSummary(fourPs, tenVs, sdoh)}
    </div>
  `);

  if (fourPs) {
    sections.push(`
      <div class="print-section">
        <h2>4Ps of Wellness</h2>
        ${buildFourPsSection(fourPs)}
      </div>
    `);
  }

  if (tenVs) {
    sections.push(`
      <div class="print-section">
        <h2>Care Dimensions</h2>
        ${buildCareDimensionsSection(tenVs)}
      </div>
    `);
  }

  if (sdoh) {
    sections.push(`
      <div class="print-section">
        <h2>Social & Community Factors</h2>
        ${buildSdohSection(sdoh)}
      </div>
    `);
  }

  sections.push(`
    <div class="print-section">
      <h2>More in Your Portal</h2>
      <p>Activity timeline and related documents are available in your portal.</p>
    </div>
  `);

  return sections.join("\n");
}

function buildSummary(
  fourPs: CaseSummary["fourPs"],
  tenVs: CaseSummary["tenVs"],
  sdoh: CaseSummary["sdoh"]
): string {
  const lines: string[] = [];
  if (!fourPs && !tenVs && !sdoh) {
    return "<p>No released care plan data available at this time.</p>";
  }
  if (fourPs?.overallScore) {
    const label = getSeverityLabel(fourPs.overallScore);
    lines.push(`<p>Across the 4Ps of Wellness, overall wellness is <strong>${fourPs.overallScore}/5</strong>${label ? ` (${label})` : ""}.</p>`);
  }
  if (tenVs?.overallScore) {
    const label = getSeverityLabel(tenVs.overallScore);
    lines.push(`<p>Care dimensions are scored at <strong>${tenVs.overallScore}/5</strong>${label ? ` (${label})` : ""}.</p>`);
  }
  if (sdoh?.overallScore) {
    const label = getSeverityLabel(sdoh.overallScore);
    lines.push(`<p>Social and community factors are at <strong>${sdoh.overallScore}/5</strong>${label ? ` (${label})` : ""}.</p>`);
  }
  if (fourPs?.narrative) {
    lines.push(`<div class="narrative"><strong>4Ps notes:</strong><br>${orEmDash(fourPs.narrative)}</div>`);
  }
  if (tenVs?.narrative) {
    lines.push(`<div class="narrative"><strong>Care dimensions notes:</strong><br>${orEmDash(tenVs.narrative)}</div>`);
  }
  return lines.length ? lines.join("\n") : "<p>Recommendations from your care team are based on these assessments.</p>";
}

function buildFourPsSection(fourPs: NonNullable<CaseSummary["fourPs"]>): string {
  const lines: string[] = [];
  lines.push(`<p><strong>Overall Score:</strong> ${fourPs.overallScore}/5${getSeverityLabel(fourPs.overallScore) ? ` (${getSeverityLabel(fourPs.overallScore)})` : ""}</p>`);
  if (fourPs.dimensions?.length) {
    lines.push("<ul>");
    fourPs.dimensions.forEach((dim) => {
      if (dim.id === "pain") return;
      const def = FOUR_PS.find((p) => p.id === dim.id);
      const label = def ? def.label : dim.id;
      const note = dim.note ? ` — ${orEmDash(dim.note)}` : "";
      lines.push(`<li class="dimension-item"><strong>${escapeHtml(label)}:</strong> ${dim.score}/5${note}</li>`);
    });
    lines.push("</ul>");
  }
  if (fourPs.narrative) {
    lines.push(`<div class="narrative">${orEmDash(fourPs.narrative)}</div>`);
  }
  return lines.join("\n");
}

function buildCareDimensionsSection(tenVs: NonNullable<CaseSummary["tenVs"]>): string {
  const lines: string[] = [];
  lines.push(`<p><strong>Overall Score:</strong> ${tenVs.overallScore}/5${getSeverityLabel(tenVs.overallScore) ? ` (${getSeverityLabel(tenVs.overallScore)})` : ""}</p>`);
  if (tenVs.dimensions?.length) {
    lines.push("<ul>");
    tenVs.dimensions.forEach((dim) => {
      const def = TEN_VS.find((v) => v.id === dim.id);
      const label = def ? def.label : dim.id;
      const note = dim.note ? ` — ${orEmDash(dim.note)}` : "";
      lines.push(`<li class="dimension-item"><strong>${escapeHtml(label)}:</strong> ${dim.score}/5${note}</li>`);
    });
    lines.push("</ul>");
  }
  if (tenVs.narrative) {
    lines.push(`<div class="narrative">${orEmDash(tenVs.narrative)}</div>`);
  }
  return lines.join("\n");
}

function buildSdohSection(sdoh: NonNullable<CaseSummary["sdoh"]>): string {
  const lines: string[] = [];
  lines.push(`<p><strong>Overall Score:</strong> ${sdoh.overallScore}/5${getSeverityLabel(sdoh.overallScore) ? ` (${getSeverityLabel(sdoh.overallScore)})` : ""}</p>`);
  if (sdoh.narrative) {
    lines.push(`<div class="narrative">${orEmDash(sdoh.narrative)}</div>`);
  }
  return lines.join("\n");
}
