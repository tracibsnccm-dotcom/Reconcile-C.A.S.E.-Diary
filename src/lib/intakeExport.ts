/* ======================= RCMS C.A.R.E. — Intake Export Schema ======================= */
/* Purpose:
   - Define a stable export shape for Apps Script/Sheets.
   - Keep sensitive "Difficult Situations" answers separate + governed by consent.
   - Provide an attorney-safe projection that auto-redacts when share=no.
*/

export type ADLLevel = "Independent" | "Needs help" | "Unable" | "";

/** Raw intake form shape (mirrors the form you pasted) */
export interface IntakeForm {
  injuryDescription: string;
  meds: string;
  conditions: string;
  allergies: string;
  pharmacy: string;
  height_cm: string;   // height in centimeters
  weight_kg: string;   // weight in kilograms
  bmi: string;         // calculated BMI
  beforeADL: Record<string, ADLLevel>;
  afterADL: Record<string, ADLLevel>;
  pain: string;        // "0".."10"
  anxiety: string;     // "1".."5"
  depression: string;  // "1".."5"
  support: string;
  difficultAnswers: Record<string, string>; // each question → free text
  shareWithAttorney: "yes" | "no" | null;
  emergencyNotifyAttorney: "yes" | "no" | null;
  shareWithPCP: boolean;
  wantEducation: boolean;
  confirm: boolean;
  signature: string;
}

/** Envelope for transmission to database */
export interface IntakeExportEnvelope {
  meta: {
    timestamp: string;              // ISO
    case_id: string;                // tokenized case id (no PHI)
    client_label: string;           // masked display like "A.B."
    firm_name?: string;             // optional
    source: "intake_v1";
    version: string;                // schema version
  };
  /** Complete raw intake (for RCMS internal; may be encrypted at rest) */
  raw_intake: IntakeForm;

  /** Flattened clinical/social summary (minimum necessary; no PHI in URLs) */
  summary: {
    injury_description: string;
    meds: string;
    conditions: string;
    allergies: string;
    pharmacy: string;
    height_cm: number | null;
    weight_kg: number | null;
    bmi: number | null;
    adl_before: Record<string, ADLLevel>;
    adl_since: Record<string, ADLLevel>;
    pain_0_10: number | null;
    anxiety_1_5: number | null;
    depression_1_5: number | null;
    support_notes: string;
    emergency_notify_attorney: "yes" | "no" | null;
    share_with_pcp: boolean;
    wants_education: boolean;
  };

  /** Sensitive block — always segregated + governed by consent */
  difficult_block: {
    answers: Record<string, string>;
    share_with_attorney: "yes" | "no" | null;
    // denormalized convenience flags (true if any answer appears non-empty)
    flags: {
      substance_use: boolean;
      safety_at_home: boolean;
      bullying_or_discrimination: boolean;
      memory_loss_or_concussion: boolean;
      wants_community_resources: boolean;
    };
  };

  /** Attorney-safe projection — auto-redacts the difficult_block when share=no */
  attorney_view: {
    injury_description: string;
    meds: string;
    conditions: string;
    allergies: string;
    pharmacy: string;
    height_cm: number | null;
    weight_kg: number | null;
    bmi: number | null;
    adl_before: Record<string, ADLLevel>;
    adl_since: Record<string, ADLLevel>;
    pain_0_10: number | null;
    anxiety_1_5: number | null;
    depression_1_5: number | null;
    support_notes: string;
    emergency_notify_attorney: "yes" | "no" | null;
    share_with_pcp: boolean;
    wants_education: boolean;
    difficult_block_redacted: boolean;   // true when share_with_attorney === "no"
    difficult_notice?: string;           // "Client has opted to keep personal details private."
  };
}

/** Serializer — converts your form state → envelope */
export function serializeIntakeForExport(
  form: IntakeForm,
  opts: { caseId: string; clientLabel: string; firmName?: string }
): IntakeExportEnvelope {
  const toNum = (v: string) => (v === "" || v == null ? null : Number(v));

  // Identify flags from question keys (robust to phrasing changes by keyword match)
  const Q = Object.keys(form.difficultAnswers || {});
  const A = form.difficultAnswers || {};
  const has = (keys: string[]) =>
    Q.some((k) => keys.some((kw) => k.toLowerCase().includes(kw)));

  const flags = {
    substance_use: has(["alcohol", "tobacco", "drug", "recreational"]),
    safety_at_home: has(["unsafe", "relationship", "home", "violence"]),
    bullying_or_discrimination: has(["bullying", "discrimination", "harassment"]),
    memory_loss_or_concussion: has(["memory", "confusion", "concussion", "head injury"]),
    wants_community_resources: has(["connect", "resources", "supportive"]),
  };

  const shareNo = form.shareWithAttorney === "no";

  const envelope: IntakeExportEnvelope = {
    meta: {
      timestamp: new Date().toISOString(),
      case_id: opts.caseId,
      client_label: opts.clientLabel,
      firm_name: opts.firmName,
      source: "intake_v1",
      version: "1.0.0",
    },
    raw_intake: form,
    summary: {
      injury_description: form.injuryDescription?.trim() || "",
      meds: form.meds?.trim() || "",
      conditions: form.conditions?.trim() || "",
      allergies: form.allergies?.trim() || "",
      pharmacy: form.pharmacy?.trim() || "",
      height_cm: toNum(form.height_cm),
      weight_kg: toNum(form.weight_kg),
      bmi: toNum(form.bmi),
      adl_before: form.beforeADL || {},
      adl_since: form.afterADL || {},
      pain_0_10: toNum(form.pain),
      anxiety_1_5: toNum(form.anxiety),
      depression_1_5: toNum(form.depression),
      support_notes: form.support?.trim() || "",
      emergency_notify_attorney: form.emergencyNotifyAttorney,
      share_with_pcp: !!form.shareWithPCP,
      wants_education: !!form.wantEducation,
    },
    difficult_block: {
      answers: A,
      share_with_attorney: form.shareWithAttorney,
      flags,
    },
    attorney_view: {
      injury_description: form.injuryDescription?.trim() || "",
      meds: form.meds?.trim() || "",
      conditions: form.conditions?.trim() || "",
      allergies: form.allergies?.trim() || "",
      pharmacy: form.pharmacy?.trim() || "",
      height_cm: toNum(form.height_cm),
      weight_kg: toNum(form.weight_kg),
      bmi: toNum(form.bmi),
      adl_before: form.beforeADL || {},
      adl_since: form.afterADL || {},
      pain_0_10: toNum(form.pain),
      anxiety_1_5: toNum(form.anxiety),
      depression_1_5: toNum(form.depression),
      support_notes: form.support?.trim() || "",
      emergency_notify_attorney: form.emergencyNotifyAttorney,
      share_with_pcp: !!form.shareWithPCP,
      wants_education: !!form.wantEducation,
      difficult_block_redacted: shareNo,
      difficult_notice: shareNo
        ? "Client has opted to keep personal details private."
        : undefined,
    },
  };

  return envelope;
}

/** CSV/Sheet row flattener for spreadsheet export */
export function toSheetRow(envelope: IntakeExportEnvelope) {
  const {
    meta,
    summary,
    difficult_block: db,
    attorney_view: av,
  } = envelope;

  return {
    // Metadata
    timestamp: meta.timestamp,
    case_id: meta.case_id,
    client_label: meta.client_label,
    firm_name: meta.firm_name || "",

    // Summary (non-sensitive)
    injury_description: summary.injury_description,
    meds: summary.meds,
    conditions: summary.conditions,
    allergies: summary.allergies,
    pharmacy: summary.pharmacy,
    height_cm: summary.height_cm ?? "",
    weight_kg: summary.weight_kg ?? "",
    bmi: summary.bmi ?? "",
    pain_0_10: summary.pain_0_10 ?? "",
    anxiety_1_5: summary.anxiety_1_5 ?? "",
    depression_1_5: summary.depression_1_5 ?? "",
    adl_before_json: JSON.stringify(summary.adl_before || {}),
    adl_since_json: JSON.stringify(summary.adl_since || {}),
    support_notes: summary.support_notes,
    emergency_notify_attorney: summary.emergency_notify_attorney ?? "",
    share_with_pcp: summary.share_with_pcp ? "yes" : "no",
    wants_education: summary.wants_education ? "yes" : "no",

    // Difficult block (kept separate; never merge into attorney view)
    difficult_answers_json: JSON.stringify(db.answers || {}),
    difficult_flags_json: JSON.stringify(db.flags || {}),
    difficult_share_with_attorney: db.share_with_attorney ?? "",

    // Attorney-safe projection (for dashboards/exports)
    attorney_difficult_redacted: av.difficult_block_redacted ? "yes" : "no",
    attorney_difficult_notice: av.difficult_notice || "",
  };
}

/** Suggested Google Sheet headers (create columns in this order) */
export const SHEET_HEADERS = [
  "timestamp",
  "case_id",
  "client_label",
  "firm_name",

  "injury_description",
  "meds",
  "conditions",
  "allergies",
  "pharmacy",
  "height_cm",
  "weight_kg",
  "bmi",
  "pain_0_10",
  "anxiety_1_5",
  "depression_1_5",
  "adl_before_json",
  "adl_since_json",
  "support_notes",
  "emergency_notify_attorney",
  "share_with_pcp",
  "wants_education",

  // Sensitive kept separate
  "difficult_answers_json",
  "difficult_flags_json",
  "difficult_share_with_attorney",

  // Attorney-safe fields
  "attorney_difficult_redacted",
  "attorney_difficult_notice",
];
