// src/lib/medicalNecessityNarrative.ts
import { AppState } from "./models";
import { estimateAllRecoveryWindows } from "./odg";

function line(s = ""): string {
  return s.replace(/\r?\n/g, "\n");
}

function fmtWindow(d: { min: number; max: number }) {
  return d.min === d.max ? `${d.min} days` : `${d.min}–${d.max} days`;
}

export function buildMedicalNarrative(state: AppState): string {
  const c = (state as any).client || {};
  const injuries = (state as any).injuries || [];
  const windows = estimateAllRecoveryWindows(state);

  const header = line(
    `RECONCILE C.A.R.E. — Medical Narrative\n` +
      `Client: ${c.name || "N/A"}   ID: ${c.id || ""}\n` +
      `Viability: ${c.viabilityScore ?? "N/A"} ${c.viabilityStatus ? `(${c.viabilityStatus})` : ""}\n`
  );

  const voiceView =
    c.voiceView && (c.voiceView.voice || c.voiceView.view)
      ? line(
          `\nVOICE/VIEW\n` +
            `Voice (client words): ${c.voiceView.voice || ""}\n` +
            `View (client perspective): ${c.voiceView.view || ""}\n`
        )
      : "";

  const injuryBlock = injuries.length
    ? `\nINJURIES & ICD-10\n${injuries
        .map((inj: any, idx: number) => {
          const codes = Array.isArray(inj.icd10) ? inj.icd10.join(", ") : inj.icd10 || "";
          return (
            `• Injury ${idx + 1}: ${inj.label || inj.form || "Unspecified"}\n` +
            (inj.side ? `  Side: ${inj.side}\n` : "") +
            (codes ? `  ICD-10: ${codes}\n` : "") +
            (inj.notes ? `  Notes: ${inj.notes}\n` : "")
          );
        })
        .join("")}`
    : `\nINJURIES & ICD-10\n• No injuries recorded\n`;

  const recoveryBlock =
    windows.length > 0
      ? `\nEXPECTED RECOVERY WINDOW (ODG/MCG-style)\n` +
        windows
          .map((w, i) => {
            const mods =
              w.modifiers.length > 0
                ? w.modifiers
                    .map((m) => `    - ${m.name}: ${m.effectDays >= 0 ? "+" : ""}${m.effectDays}d — ${m.rationale}`)
                    .join("\n")
                : "    (No risk/comorbidity adjustments)";
            const assumptions =
              w.assumptions.length > 0 ? `  Assumptions: ${w.assumptions.join("; ")}` : "";
            return (
              `• Injury ${i + 1}: ${w.description}\n` +
              `  Baseline: ${fmtWindow(w.baselineDays)}\n` +
              `  Adjusted: ${fmtWindow(w.totalDays)}\n` +
              `  Adjustments:\n${mods}\n` +
              (assumptions ? `${assumptions}\n` : "")
            );
          })
          .join("\n")
      : `\nEXPECTED RECOVERY WINDOW (ODG/MCG-style)\n• Not enough data to estimate\n`;

  const fourPsBlock = c.fourPs
    ? `\n4Ps SNAPSHOT (Selected)\n` + `• ${JSON.stringify(c.fourPs)}\n`
    : "";

  const sdohBlock = c.sdoh ? `\nSDOH SNAPSHOT (Selected)\n` + `• ${JSON.stringify(c.sdoh)}\n` : "";

  const closing = `\nCLINICAL RATIONALE\n` +
    `Plan aligns with evidence-based timelines; adjustments reflect comorbidities and real-world barriers (e.g., SDOH). ` +
    `Where surgery occurs, added time is appended *after* the event to prevent pre-emptive inflation. ` +
    `This narrative is regenerated as the case evolves and should be read in conjunction with progress notes and provider reports.\n`;

  return [header, voiceView, injuryBlock, recoveryBlock, fourPsBlock, sdohBlock, closing]
    .filter(Boolean)
    .join("");
}
