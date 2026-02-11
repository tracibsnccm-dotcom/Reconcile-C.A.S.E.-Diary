// src/constants/timelineTemplates.ts

export interface TimelineTemplate {
  id: string;
  label: string;            // How RN chooses it in the UI
  description: string;      // Short helper text for RN
  titleFormat: string;      // Attorney-facing title format (DATE is always prefixed in code)
  bulletFields: string[];   // Structured prompts -> bullets
  includeRnNote: boolean;   // Always true for your use case
  category: string;         // Grouping for RN selector (Clinical, SDOH, etc.)
}

// Library of RN → Attorney timeline templates.
// Every template expects an RN free-text note at the end.
export const TIMELINE_TEMPLATES: TimelineTemplate[] = [
  {
    id: "edVisit",
    label: "ED Visit / Hospitalization",
    category: "Clinical Events",
    description: "Use when the client has an ED visit or inpatient stay.",
    titleFormat: "ED visit for {{chiefComplaint}}",
    bulletFields: [
      "Key clinical finding (e.g., CT/MRI/X-ray result, diagnosis)",
      "Immediate treatment or change (meds, procedures, discharge plan)",
      "Functional impact (what changed in ADLs, mobility, pain, work)",
      "Next step / follow-up date (consults, imaging, labs, etc.)"
    ],
    includeRnNote: true
  },
  {
    id: "imaging",
    label: "Imaging / Diagnostics",
    category: "Diagnostics",
    description: "Use for MRI, CT, X-ray, EMG, or other key diagnostics.",
    titleFormat: "Imaging shows {{headlineFinding}}",
    bulletFields: [
      "Key imaging/diagnostic finding in plain language",
      "Functional significance (how this explains or supports symptoms)",
      "Comparison to prior status (new, progression, or stable)",
      "Next action (referral, repeat imaging, surgery consult, etc.)"
    ],
    includeRnNote: true
  },
  {
    id: "surgery",
    label: "Surgery / Procedure",
    category: "Clinical Events",
    description: "Use for surgeries or major procedures.",
    titleFormat: "{{procedureName}} completed",
    bulletFields: [
      "Procedure performed (name and level/body part, if relevant)",
      "Immediate course (complications vs. uncomplicated recovery)",
      "Early functional impact (mobility, pain, self-care, work status)",
      "Planned follow-up (PT, surgeon recheck, restrictions, key dates)"
    ],
    includeRnNote: true
  },
  {
    id: "crisis",
    label: "Crisis / Safety Event",
    category: "Crisis & Safety",
    description: "Use for any safety, suicidal, abuse, or critical event.",
    titleFormat: "Crisis escalation: {{headlineRisk}}",
    bulletFields: [
      "Trigger/event (what happened in brief)",
      "Peak crisis severity (1–5) and short description",
      "Actions taken (RN steps, buddy/supervisor, EMS, safety plan)",
      "Current status and follow-up plan (monitoring, check-in cadence, referrals)"
    ],
    includeRnNote: true
  },
  {
    id: "functionalChange",
    label: "Functional Status Change",
    category: "Function & Work",
    description: "Use when function/ADLs/mobility change, even without ED.",
    titleFormat: "Change in function: {{headlineChange}}",
    bulletFields: [
      "What changed (walking/standing tolerance, lifting, self-care, sleep, etc.)",
      "Measurable shift (before vs. after in concrete terms)",
      "4Ps impact (which P is most affected and updated score 1–5)",
      "RN plan (monitoring, referrals, exercises, education, etc.)"
    ],
    includeRnNote: true
  },
  {
    id: "workStatus",
    label: "Work / Role Status Change",
    category: "Function & Work",
    description: "Use for any change in work status or major role.",
    titleFormat: "Work status updated: {{newStatusLabel}}",
    bulletFields: [
      "Prior vs. new status (e.g., FT → light duty, working → off work)",
      "Clinical reasons supporting this change",
      "Employer/insurer involvement (if known and relevant)",
      "Expected duration or review date for this status"
    ],
    includeRnNote: true
  },
  {
    id: "sdohBarrier",
    label: "SDOH Barrier Affecting Care",
    category: "SDOH & Adherence",
    description: "Use when a social determinant materially affects care.",
    titleFormat: "SDOH barrier affecting care: {{barrierType}}",
    bulletFields: [
      "Barrier type (transport, housing, food, childcare, safety, etc.)",
      "How it affects treatment (missed care, unsafe environment, nonadherence)",
      "SDOH score (1–5) with brief label (critical, high concern, moderate, etc.)",
      "RN mitigation plan/resources offered (referrals, education, supports)"
    ],
    includeRnNote: true
  },
  {
    id: "adherence",
    label: "Treatment Adherence (Missed/Completed Care)",
    category: "SDOH & Adherence",
    description: "Use when adherence changes in a way that matters to the case.",
    titleFormat: "Treatment adherence: {{headlineStatus}}",
    bulletFields: [
      "What was missed or completed (visits, meds, home program, etc.)",
      "Reason(s) for adherence pattern, if known (cost, fear, work, transport)",
      "Impact on clinical status or function",
      "RN counseling/plan (education, reminders, adjustments, referrals)"
    ],
    includeRnNote: true
  },
  {
    id: "providerPlanShift",
    label: "Provider Plan / Opinion Shift",
    category: "Clinical Events",
    description: "Use when a provider significantly changes the plan or opinion.",
    titleFormat: "Provider plan changed: {{headlineShift}}",
    bulletFields: [
      "Provider and specialty",
      "Old plan vs. new plan in brief",
      "Rationale documented by provider (if available)",
      "Key follow-up (tests, treatments, second opinion, etc.)"
    ],
    includeRnNote: true
  },
  {
    id: "adminLegal",
    label: "Administrative / Legal-Relevant Clinical Event",
    category: "Case & Legal",
    description: "Use for IMEs, major gaps in care explained, or similar events.",
    titleFormat: "Case-relevant event: {{headlineEvent}}",
    bulletFields: [
      "Event and why it matters to the case (IME, gap explanation, surveillance-related limitation, etc.)",
      "Clinical context that supports or questions this event",
      "Consistency with prior records and client reporting",
      "Pending documentation or follow-up related to this event"
    ],
    includeRnNote: true
  },
  {
    id: "generic",
    label: "Generic Clinical Event (Other)",
    category: "Other",
    description: "Use when none of the other templates fit well.",
    titleFormat: "Key event: {{headline}}",
    bulletFields: [
      "Clinical fact(s) in brief",
      "Functional or work impact",
      "Risk/severity signal (P/V/SDOH/Crisis score, if relevant)",
      "Next action or key date"
    ],
    includeRnNote: true
  }
];
