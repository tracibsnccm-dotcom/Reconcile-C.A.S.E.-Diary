/**
 * RN-only: Builds print-friendly HTML body for the released RN snapshot.
 * Used by RN Case Requests (and any RN view that prints released content).
 * Section structure aligned with attorney report; styles are RN-specific (no attorney import).
 */

import type { CaseSummary, SeverityScore } from "@/constants/reconcileFramework";
import { FOUR_PS, TEN_VS, getSeverityLabel } from "@/constants/reconcileFramework";

/** V_number (1–10) to TEN_VS id. */
const V_NUM_TO_ID: Record<number, string> = {
  1: "voiceView", 2: "viability", 3: "vision", 4: "veracity", 5: "versatility",
  6: "vitality", 7: "vigilance", 8: "verification", 9: "value", 10: "validation",
};

/** Print CSS for RN report sections. Kept separate from attorney print to avoid cross-import. */
export const RN_PRINT_STYLES = `
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

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Renders "—" for null/undefined/empty; otherwise HTML-escaped string. Use for user-provided fields. */
function orEmDash(s: string | null | undefined): string {
  if (s == null || String(s).trim() === "") return "—";
  return escapeHtml(String(s));
}

function toScore(v: number | null | undefined): SeverityScore | undefined {
  if (v == null || v < 1 || v > 5) return undefined;
  return v as SeverityScore;
}

/**
 * Maps released care plan rows (rc_fourps_assessments, rc_care_plan_vs, rc_sdoh_assessments)
 * into CaseSummary for the report body. Used on Print click after fetching by care_plan_id.
 */
export function buildCaseSummaryFromReleasedData(
  fourPsRow: { p1_physical?: number | null; p2_psychological?: number | null; p3_psychosocial?: number | null; p4_professional?: number | null; p1_notes?: string | null; p2_notes?: string | null; p3_notes?: string | null; p4_notes?: string | null } | null,
  careVsRows: Array<{ v_number: number; status?: string | null; findings?: string | null; recommendations?: string | null }>,
  sdohRow: { economic_score?: number | null; education_score?: number | null; healthcare_score?: number | null; neighborhood_score?: number | null; social_score?: number | null } | null
): CaseSummary {
  const summary: CaseSummary = {};

  if (fourPsRow) {
    const s1 = toScore(fourPsRow.p1_physical);
    const s2 = toScore(fourPsRow.p2_psychological);
    const s3 = toScore(fourPsRow.p3_psychosocial);
    const s4 = toScore(fourPsRow.p4_professional);
    const arr = [s1, s2, s3, s4].filter((x): x is SeverityScore => x != null);
    const overall = arr.length ? (Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) as SeverityScore) : undefined;
    summary.fourPs = {
      overallScore: overall ?? (1 as SeverityScore),
      dimensions: [
        { id: "physical", score: s1 ?? (1 as SeverityScore), note: fourPsRow.p1_notes ?? undefined },
        { id: "psychological", score: s2 ?? (1 as SeverityScore), note: fourPsRow.p2_notes ?? undefined },
        { id: "psychosocial", score: s3 ?? (1 as SeverityScore), note: fourPsRow.p3_notes ?? undefined },
        { id: "professional", score: s4 ?? (1 as SeverityScore), note: fourPsRow.p4_notes ?? undefined },
      ],
    };
  }

  if (careVsRows && careVsRows.length > 0) {
    const dims = careVsRows.map((v) => {
      const id = V_NUM_TO_ID[v.v_number] ?? `v${v.v_number}`;
      const note = [v.findings, v.recommendations].filter(Boolean).join("; ") || undefined;
      const s = v.status === "completed" ? 5 : v.status === "in_progress" ? 3 : 1;
      return { id, score: s as SeverityScore, note };
    });
    const arr = dims.map((d) => d.score);
    const overall = arr.length ? (Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) as SeverityScore) : (1 as SeverityScore);
    summary.tenVs = { overallScore: overall, dimensions: dims };
  }

  if (sdohRow) {
    const arr = [
      toScore(sdohRow.economic_score),
      toScore(sdohRow.education_score),
      toScore(sdohRow.healthcare_score),
      toScore(sdohRow.neighborhood_score),
      toScore(sdohRow.social_score),
    ].filter((x): x is SeverityScore => x != null);
    const overall = arr.length ? (Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) as SeverityScore) : undefined;
    if (overall) summary.sdoh = { overallScore: overall };
  }

  return summary;
}

/**
 * Builds the report body HTML (sections + disclaimer) for use with printHtml.
 * printHtml adds the document wrapper, case identifier, and printed timestamp.
 */
export function buildRnReleasedReportBody(summary: CaseSummary | null): string {
  const sectionsHtml = buildSections(summary);
  const disclaimer = `
  <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ccc; font-size: 9pt; color: #666;">
    <p>This report contains only the released RN snapshot. Draft revisions are not included.</p>
  </div>`;
  return sectionsHtml + disclaimer;
}

function buildSections(summary: CaseSummary | null): string {
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
    lines.push(`<p>Across the 4Ps of Wellness, the RN has scored overall wellness at <strong>${fourPs.overallScore}/5</strong>${label ? ` (${label})` : ""}.</p>`);
  }
  if (tenVs?.overallScore) {
    const label = getSeverityLabel(tenVs.overallScore);
    lines.push(`<p>Using the 10-Vs Clinical Logic Engine™, the RN has scored the overall 10-Vs level at <strong>${tenVs.overallScore}/5</strong>${label ? ` (${label})` : ""}, reflecting how the clinical story supports or challenges the case.</p>`);
  }
  if (sdoh?.overallScore) {
    const label = getSeverityLabel(sdoh.overallScore);
    lines.push(`<p>Social determinants of health are scored at <strong>${sdoh.overallScore}/5</strong>${label ? ` (${label})` : ""} in terms of how supportive or disruptive the environment is for care and adherence.</p>`);
  }
  if (crisis?.severityScore) {
    const label = getSeverityLabel(crisis.severityScore);
    lines.push(`<p>Crisis Mode severity has reached <strong>${crisis.severityScore}/5</strong>${label ? ` (${label})` : ""} at least once, reflecting the highest level of acute concern seen in this case.</p>`);
  }
  if (fourPs?.narrative) {
    lines.push(`<div class="narrative"><strong>4Ps Narrative:</strong><br>${orEmDash(fourPs.narrative)}</div>`);
  }
  if (tenVs?.narrative) {
    lines.push(`<div class="narrative"><strong>10-Vs Narrative:</strong><br>${orEmDash(tenVs.narrative)}</div>`);
  }
  return lines.join("\n");
}

function buildFourPsSection(fourPs: NonNullable<CaseSummary["fourPs"]>): string {
  const lines: string[] = [];
  lines.push(`<p><strong>Overall Score:</strong> ${fourPs.overallScore}/5${getSeverityLabel(fourPs.overallScore) ? ` (${getSeverityLabel(fourPs.overallScore)})` : ""}</p>`);
  if (fourPs.dimensions && fourPs.dimensions.length > 0) {
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

function buildTenVsSection(tenVs: NonNullable<CaseSummary["tenVs"]>): string {
  const lines: string[] = [];
  lines.push(`<p><strong>Overall Score:</strong> ${tenVs.overallScore}/5${getSeverityLabel(tenVs.overallScore) ? ` (${getSeverityLabel(tenVs.overallScore)})` : ""}</p>`);
  if (tenVs.dimensions && tenVs.dimensions.length > 0) {
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

function buildTimelineSection(): string {
  return `<p>Timeline data is available in the RN Timeline & Notes module. Detailed event history remains in the care record.</p>`;
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
    if (fourPs) lines.push("<li>4Ps of Wellness assessment provides physical, psychological, psychosocial, and professional domain insights.</li>");
    if (tenVs) lines.push("<li>10-Vs Clinical Logic Engine™ assessment provides care management and clinical story evaluation.</li>");
    if (sdoh) lines.push("<li>SDOH assessment identifies social and environmental factors affecting care adherence.</li>");
    lines.push("</ul>");
  }
  return lines.join("\n");
}

function buildAttachmentsSection(): string {
  return `<p>Attachment names and metadata are available in the case Documents. Private storage objects are not accessible from this view.</p>`;
}
