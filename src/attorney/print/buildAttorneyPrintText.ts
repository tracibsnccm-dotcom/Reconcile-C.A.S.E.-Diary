/**
 * Builds a plaintext export from a resolved case and summary.
 * Same content and section order as the print HTML view.
 * 
 * @param resolvedCase - The resolved case (latest released/closed revision)
 * @param summary - The CaseSummary with 4Ps, 10-Vs, SDOH, Crisis data
 * @param clientLabel - Optional client label/identifier (as shown in attorney console)
 * @returns Plaintext string ready for download
 */

import { CaseSummary } from "../../constants/reconcileFramework";
import { CaseWithRevision } from "../../lib/resolveLatestReleasedCase";
import { FOUR_PS, TEN_VS, getSeverityLabel } from "../../constants/reconcileFramework";

export function buildAttorneyPrintText(
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

  const fourPs = summary?.fourPs;
  const tenVs = summary?.tenVs;
  const sdoh = summary?.sdoh;
  const crisis = summary?.crisis;

  const lines: string[] = [];

  // Header
  lines.push("=".repeat(70));
  lines.push("Reconcile C.A.R.E. — RN Care Narrative (Released)");
  lines.push("=".repeat(70));
  lines.push("");
  lines.push(`Case ID: ${caseId}`);
  if (clientLabel) {
    lines.push(`Client: ${clientLabel}`);
  }
  lines.push(`Released: ${releasedDate}`);
  lines.push(`Status: ${caseStatus} • Released to attorney`);
  lines.push("");
  lines.push("");

  // 1. Executive Summary / Care Narrative
  lines.push("-".repeat(70));
  lines.push("Executive Summary / Care Narrative");
  lines.push("-".repeat(70));
  lines.push("");
  lines.push(...buildExecutiveSummaryText(fourPs, tenVs, sdoh, crisis));
  lines.push("");
  lines.push("");

  // 2. 4Ps (Physical, Psychological, Psychosocial, Professional) - NO "Pain" P
  if (fourPs) {
    lines.push("-".repeat(70));
    lines.push("4Ps of Wellness");
    lines.push("-".repeat(70));
    lines.push("");
    lines.push(...buildFourPsSectionText(fourPs));
    lines.push("");
    lines.push("");
  }

  // 3. 10-V framework
  if (tenVs) {
    lines.push("-".repeat(70));
    lines.push("10-Vs Clinical Logic Engine™");
    lines.push("-".repeat(70));
    lines.push("");
    lines.push(...buildTenVsSectionText(tenVs));
    lines.push("");
    lines.push("");
  }

  // 4. SDOH
  if (sdoh) {
    lines.push("-".repeat(70));
    lines.push("Social Determinants of Health (SDOH)");
    lines.push("-".repeat(70));
    lines.push("");
    lines.push(...buildSdohSectionText(sdoh));
    lines.push("");
    lines.push("");
  }

  // 5. Timeline
  lines.push("-".repeat(70));
  lines.push("Case Timeline");
  lines.push("-".repeat(70));
  lines.push("");
  lines.push("Timeline data is available in the Attorney Console Timeline tab. Detailed event history remains in the RN Timeline & Notes module.");
  lines.push("");
  lines.push("");

  // 6. Provider tools / recommendations
  lines.push("-".repeat(70));
  lines.push("Provider Tools & Recommendations");
  lines.push("-".repeat(70));
  lines.push("");
  lines.push(...buildProviderToolsSectionText(fourPs, tenVs, sdoh));
  lines.push("");
  lines.push("");

  // 7. Attachments list (names only)
  lines.push("-".repeat(70));
  lines.push("Attachments");
  lines.push("-".repeat(70));
  lines.push("");
  lines.push("Attachment names and metadata are available in the Attorney Console Documents tab. Private storage objects are not accessible from this view.");
  lines.push("");
  lines.push("");

  // Footer
  lines.push("=".repeat(70));
  lines.push("This report contains only information released to the attorney. Draft revisions are not included.");
  lines.push(`Generated: ${new Date().toLocaleString("en-US")}`);
  lines.push("=".repeat(70));

  return lines.join("\n");
}

function buildExecutiveSummaryText(
  fourPs: CaseSummary["fourPs"],
  tenVs: CaseSummary["tenVs"],
  sdoh: CaseSummary["sdoh"],
  crisis: CaseSummary["crisis"]
): string[] {
  const lines: string[] = [];

  if (!fourPs && !tenVs && !sdoh && !crisis) {
    lines.push("No released RN assessment data available at this time.");
    return lines;
  }

  if (fourPs?.overallScore) {
    const label = getSeverityLabel(fourPs.overallScore);
    lines.push(
      `Across the 4Ps of Wellness, the RN has scored overall wellness at ${fourPs.overallScore}/5${label ? ` (${label})` : ""}.`
    );
  }

  if (tenVs?.overallScore) {
    const label = getSeverityLabel(tenVs.overallScore);
    lines.push(
      `Using the 10-Vs Clinical Logic Engine™, the RN has scored the overall 10-Vs level at ${tenVs.overallScore}/5${label ? ` (${label})` : ""}, reflecting how the clinical story supports or challenges the case.`
    );
  }

  if (sdoh?.overallScore) {
    const label = getSeverityLabel(sdoh.overallScore);
    lines.push(
      `Social determinants of health are scored at ${sdoh.overallScore}/5${label ? ` (${label})` : ""} in terms of how supportive or disruptive the environment is for care and adherence.`
    );
  }

  if (crisis?.severityScore) {
    const label = getSeverityLabel(crisis.severityScore);
    lines.push(
      `Crisis Mode severity has reached ${crisis.severityScore}/5${label ? ` (${label})` : ""} at least once, reflecting the highest level of acute concern seen in this case.`
    );
  }

  if (fourPs?.narrative) {
    lines.push("");
    lines.push("4Ps Narrative:");
    lines.push(fourPs.narrative);
  }

  if (tenVs?.narrative) {
    lines.push("");
    lines.push("10-Vs Narrative:");
    lines.push(tenVs.narrative);
  }

  return lines;
}

function buildFourPsSectionText(fourPs: NonNullable<CaseSummary["fourPs"]>): string[] {
  const lines: string[] = [];

  const label = getSeverityLabel(fourPs.overallScore);
  lines.push(`Overall Score: ${fourPs.overallScore}/5${label ? ` (${label})` : ""}`);
  lines.push("");

  if (fourPs.dimensions && fourPs.dimensions.length > 0) {
    fourPs.dimensions.forEach((dim) => {
      // Ensure NO "Pain" P exists - filter it out if somehow present
      if (dim.id === "pain") return;

      const def = FOUR_PS.find((p) => p.id === dim.id);
      const label = def ? def.label : dim.id;
      const note = dim.note ? ` — ${dim.note}` : "";
      lines.push(`  • ${label}: ${dim.score}/5${note}`);
    });
  }

  if (fourPs.narrative) {
    lines.push("");
    lines.push(fourPs.narrative);
  }

  return lines;
}

function buildTenVsSectionText(tenVs: NonNullable<CaseSummary["tenVs"]>): string[] {
  const lines: string[] = [];

  const label = getSeverityLabel(tenVs.overallScore);
  lines.push(`Overall Score: ${tenVs.overallScore}/5${label ? ` (${label})` : ""}`);
  lines.push("");

  if (tenVs.dimensions && tenVs.dimensions.length > 0) {
    tenVs.dimensions.forEach((dim) => {
      const def = TEN_VS.find((v) => v.id === dim.id);
      const label = def ? def.label : dim.id;
      const note = dim.note ? ` — ${dim.note}` : "";
      lines.push(`  • ${label}: ${dim.score}/5${note}`);
    });
  }

  if (tenVs.narrative) {
    lines.push("");
    lines.push(tenVs.narrative);
  }

  return lines;
}

function buildSdohSectionText(sdoh: NonNullable<CaseSummary["sdoh"]>): string[] {
  const lines: string[] = [];

  const label = getSeverityLabel(sdoh.overallScore);
  lines.push(`Overall Score: ${sdoh.overallScore}/5${label ? ` (${label})` : ""}`);

  if (sdoh.narrative) {
    lines.push("");
    lines.push(sdoh.narrative);
  }

  return lines;
}

function buildProviderToolsSectionText(
  fourPs: CaseSummary["fourPs"],
  tenVs: CaseSummary["tenVs"],
  sdoh: CaseSummary["sdoh"]
): string[] {
  const lines: string[] = [];

  lines.push("Provider tools and recommendations are derived from the RN assessment data above.");
  lines.push("");

  if (fourPs || tenVs || sdoh) {
    if (fourPs) {
      lines.push("  • 4Ps of Wellness assessment provides physical, psychological, psychosocial, and professional domain insights.");
    }
    if (tenVs) {
      lines.push("  • 10-Vs Clinical Logic Engine™ assessment provides care management and clinical story evaluation.");
    }
    if (sdoh) {
      lines.push("  • SDOH assessment identifies social and environmental factors affecting care adherence.");
    }
  }

  return lines;
}
