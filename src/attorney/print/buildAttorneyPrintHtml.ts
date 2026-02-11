/**
 * Builds a print-friendly HTML document from a resolved case and summary.
 * Only includes data that attorneys already see in the console (no new PHI).
 *
 * Also exports buildAttorneyReportBody (sections + disclaimer) and ATTORNEY_PRINT_STYLES
 * for use with the printHtml helper (lib/print.ts).
 */

import { CaseSummary } from "../../constants/reconcileFramework";
import { CaseWithRevision } from "../../lib/resolveLatestReleasedCase";
import { FOUR_PS, TEN_VS, getSeverityLabel } from "../../constants/reconcileFramework";

/** Print CSS for attorney report sections. Use with printHtml when building body via buildAttorneyReportBody. */
export const ATTORNEY_PRINT_STYLES = `
  .print-section { margin-bottom: 1.5rem; page-break-inside: avoid; }
  .print-section h2 { font-size: 14pt; font-weight: 700; margin-bottom: 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #ccc; color: #000; page-break-after: avoid; }
  .print-section h2 + p { page-break-before: avoid; }
  .section { margin-bottom: 1.5rem; page-break-inside: avoid; }
  .section h2 { font-size: 14pt; font-weight: 700; margin-bottom: 0.75rem; padding-bottom: 0.25rem; border-bottom: 1px solid #ccc; color: #000; page-break-after: avoid; }
  .section p { margin-bottom: 0.75rem; color: #000; }
  .section ul { margin-left: 1.5rem; margin-bottom: 0.75rem; }
  .section li { margin-bottom: 0.5rem; }
  .score-badge { display: inline-block; padding: 0.15rem 0.5rem; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; font-weight: 600; font-size: 10pt; margin-left: 0.5rem; }
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
 * Does not include document wrapper, head, or header — printHtml adds case identifier + printed timestamp.
 */
export function buildAttorneyReportBody(summary: CaseSummary | null): string {
  const sectionsHtml = buildAttorneyPrintSections(summary);
  const disclaimer = `
  <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 9pt; color: #666;">
    <p>This report contains only information released to the attorney. Draft revisions are not included.</p>
  </div>`;
  return sectionsHtml + disclaimer;
}

function buildAttorneyPrintSections(summary: CaseSummary | null): string {
  const fourPs = summary?.fourPs;
  const tenVs = summary?.tenVs;
  const sdoh = summary?.sdoh;
  const crisis = summary?.crisis;

  const sections: string[] = [];

  sections.push(`
    <div class="print-section">
      <h2>Executive Summary / Care Narrative</h2>
      ${buildExecutiveSummary(fourPs, tenVs, sdoh, crisis)}
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
        <h2>10-Vs Clinical Logic Engine™</h2>
        ${buildTenVsSection(tenVs)}
      </div>
    `);
  }

  if (sdoh) {
    sections.push(`
      <div class="print-section">
        <h2>Social Determinants of Health (SDOH)</h2>
        ${buildSdohSection(sdoh)}
      </div>
    `);
  }

  sections.push(`
    <div class="print-section">
      <h2>Case Timeline</h2>
      ${buildTimelineSection()}
    </div>
  `);

  sections.push(`
    <div class="print-section">
      <h2>Provider Tools & Recommendations</h2>
      ${buildProviderToolsSection(fourPs, tenVs, sdoh)}
    </div>
  `);

  sections.push(`
    <div class="print-section">
      <h2>Attachments</h2>
      ${buildAttachmentsSection()}
    </div>
  `);

  return sections.join("\n");
}

/**
 * Builds a print-friendly HTML document from a resolved case and summary.
 * Only includes data that attorneys already see in the console (no new PHI).
 *
 * @param resolvedCase - The resolved case (latest released/closed revision)
 * @param summary - The CaseSummary with 4Ps, 10-Vs, SDOH, Crisis data
 * @param clientLabel - Optional client label/identifier (as shown in attorney console)
 * @returns HTML string ready for printing
 */
export function buildAttorneyPrintHtml(
  resolvedCase: CaseWithRevision,
  summary: CaseSummary | null,
  clientLabel?: string
): string {
  const caseId = resolvedCase.id;
  const caseStatus = resolvedCase.case_status || "released";
  const releasedAt = resolvedCase.released_at || resolvedCase.updated_at || resolvedCase.created_at;
  const releasedDate = releasedAt ? new Date(releasedAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }) : "Unknown";

  const sectionsHtml = buildAttorneyPrintSections(summary);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reconcile C.A.R.E. — RN Care Narrative (Released)</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #000; background: #fff; padding: 0.75in; max-width: 8.5in; margin: 0 auto; }
    .header { border-bottom: 2px solid #000; padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
    .header h1 { font-size: 18pt; font-weight: 700; margin-bottom: 0.25rem; color: #000; }
    .header-subtitle { font-size: 11pt; color: #333; margin-bottom: 0.75rem; font-weight: 500; }
    .header-meta { font-size: 10pt; color: #333; margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 1.5rem; }
    .header-meta div { margin-bottom: 0.25rem; }
    ${ATTORNEY_PRINT_STYLES}
    .print-footer { display: none; }
    @media print {
      body { padding: 0.5in; padding-bottom: 1in; }
      .print-footer { display: block; position: fixed; bottom: 0; left: 0; right: 0; text-align: right; font-size: 8pt; color: #666; padding: 0.25rem 0.75in; background: #fff; border-top: 1px solid #e0e0e0; }
      .header { page-break-after: avoid; }
      @page { margin: 0.75in; margin-bottom: 1in; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reconcile C.A.R.E. — RN Care Narrative (Released)</h1>
    <div class="header-subtitle">Released RN Case Snapshot</div>
    <div class="header-meta">
      ${caseId ? `<div><strong>Case ID:</strong> ${escapeHtml(caseId)}</div>` : ""}
      ${clientLabel ? `<div><strong>Client:</strong> ${escapeHtml(clientLabel)}</div>` : ""}
      ${releasedDate && releasedDate !== "Unknown" ? `<div><strong>Released:</strong> ${escapeHtml(releasedDate)}</div>` : ""}
      ${caseStatus ? `<div><strong>Status:</strong> ${escapeHtml(caseStatus)}</div>` : ""}
    </div>
  </div>
  ${sectionsHtml}
  <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 9pt; color: #666;">
    <p>This report contains only information released to the attorney. Draft revisions are not included.</p>
    <p>Generated: ${new Date().toLocaleString("en-US")}</p>
  </div>
  <div class="print-footer">Confidential — Attorney Work Product</div>
</body>
</html>`;
}

function buildExecutiveSummary(
  fourPs: CaseSummary["fourPs"],
  tenVs: CaseSummary["tenVs"],
  sdoh: CaseSummary["sdoh"],
  crisis: CaseSummary["crisis"]
): string {
  const lines: string[] = [];

  if (!fourPs && !tenVs && !sdoh && !crisis) {
    return "<p>No released RN assessment data available at this time.</p>";
  }

  if (fourPs?.overallScore) {
    const label = getSeverityLabel(fourPs.overallScore);
    lines.push(
      `<p>Across the 4Ps of Wellness, the RN has scored overall wellness at <strong>${fourPs.overallScore}/5</strong>${label ? ` (${label})` : ""}.</p>`
    );
  }

  if (tenVs?.overallScore) {
    const label = getSeverityLabel(tenVs.overallScore);
    lines.push(
      `<p>Using the 10-Vs Clinical Logic Engine™, the RN has scored the overall 10-Vs level at <strong>${tenVs.overallScore}/5</strong>${label ? ` (${label})` : ""}, reflecting how the clinical story supports or challenges the case.</p>`
    );
  }

  if (sdoh?.overallScore) {
    const label = getSeverityLabel(sdoh.overallScore);
    lines.push(
      `<p>Social determinants of health are scored at <strong>${sdoh.overallScore}/5</strong>${label ? ` (${label})` : ""} in terms of how supportive or disruptive the environment is for care and adherence.</p>`
    );
  }

  if (crisis?.severityScore) {
    const label = getSeverityLabel(crisis.severityScore);
    lines.push(
      `<p>Crisis Mode severity has reached <strong>${crisis.severityScore}/5</strong>${label ? ` (${label})` : ""} at least once, reflecting the highest level of acute concern seen in this case.</p>`
    );
  }

  if (fourPs?.narrative) {
    lines.push(`<div class="narrative"><strong>4Ps Narrative:</strong><br>${escapeHtml(fourPs.narrative)}</div>`);
  }

  if (tenVs?.narrative) {
    lines.push(`<div class="narrative"><strong>10-Vs Narrative:</strong><br>${escapeHtml(tenVs.narrative)}</div>`);
  }

  return lines.join("\n");
}

function buildFourPsSection(fourPs: NonNullable<CaseSummary["fourPs"]>): string {
  const lines: string[] = [];

  lines.push(`<p><strong>Overall Score:</strong> ${fourPs.overallScore}/5${getSeverityLabel(fourPs.overallScore) ? ` (${getSeverityLabel(fourPs.overallScore)})` : ""}</p>`);

  if (fourPs.dimensions && fourPs.dimensions.length > 0) {
    lines.push("<ul>");
    fourPs.dimensions.forEach((dim) => {
      // Ensure NO "Pain" P exists - filter it out if somehow present
      if (dim.id === "pain") return;
      
      const def = FOUR_PS.find((p) => p.id === dim.id);
      const label = def ? def.label : dim.id;
      const note = dim.note ? ` — ${escapeHtml(dim.note)}` : "";
      lines.push(
        `<li class="dimension-item"><strong>${escapeHtml(label)}:</strong> ${dim.score}/5${note}</li>`
      );
    });
    lines.push("</ul>");
  }

  if (fourPs.narrative) {
    lines.push(`<div class="narrative">${escapeHtml(fourPs.narrative)}</div>`);
  }

  return lines.join("\n");
}

function buildTenVsSection(tenVs: NonNullable<CaseSummary["tenVs"]>): string {
  const lines: string[] = [];

  lines.push(`<p><strong>Overall Score:</strong> ${tenVs.overallScore}/5${getSeverityLabel(tenVs.overallScore) ? ` (${getSeverityLabel(tenVs.overallScore)})` : ""}</p>`);

  if (tenVs.dimensions && tenVs.dimensions.length > 0) {
    lines.push("<ul>");
    tenVs.dimensions.forEach((dim) => {
      const def = TEN_VS.find((v) => v.id === dim.id);
      const label = def ? def.label : dim.id;
      const note = dim.note ? ` — ${escapeHtml(dim.note)}` : "";
      lines.push(
        `<li class="dimension-item"><strong>${escapeHtml(label)}:</strong> ${dim.score}/5${note}</li>`
      );
    });
    lines.push("</ul>");
  }

  if (tenVs.narrative) {
    lines.push(`<div class="narrative">${escapeHtml(tenVs.narrative)}</div>`);
  }

  return lines.join("\n");
}

function buildSdohSection(sdoh: NonNullable<CaseSummary["sdoh"]>): string {
  const lines: string[] = [];

  lines.push(`<p><strong>Overall Score:</strong> ${sdoh.overallScore}/5${getSeverityLabel(sdoh.overallScore) ? ` (${getSeverityLabel(sdoh.overallScore)})` : ""}</p>`);

  if (sdoh.narrative) {
    lines.push(`<div class="narrative">${escapeHtml(sdoh.narrative)}</div>`);
  }

  return lines.join("\n");
}

function buildTimelineSection(): string {
  return `<p>Timeline data is available in the Attorney Console Timeline tab. Detailed event history remains in the RN Timeline & Notes module.</p>`;
}

function buildProviderToolsSection(
  fourPs: CaseSummary["fourPs"],
  tenVs: CaseSummary["tenVs"],
  sdoh: CaseSummary["sdoh"]
): string {
  const lines: string[] = [];

  lines.push("<p>Provider tools and recommendations are derived from the RN assessment data above.</p>");

  if (fourPs || tenVs || sdoh) {
    lines.push("<ul>");
    if (fourPs) {
      lines.push("<li>4Ps of Wellness assessment provides physical, psychological, psychosocial, and professional domain insights.</li>");
    }
    if (tenVs) {
      lines.push("<li>10-Vs Clinical Logic Engine™ assessment provides care management and clinical story evaluation.</li>");
    }
    if (sdoh) {
      lines.push("<li>SDOH assessment identifies social and environmental factors affecting care adherence.</li>");
    }
    lines.push("</ul>");
  }

  return lines.join("\n");
}

function buildAttachmentsSection(): string {
  return `<p>Attachment names and metadata are available in the Attorney Console Documents tab. Private storage objects are not accessible from this view.</p>`;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
