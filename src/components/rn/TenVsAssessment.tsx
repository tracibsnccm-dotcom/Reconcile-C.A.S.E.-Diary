// src/components/rn/TenVsAssessment.tsx
// Reconcile C.A.R.E.™ — RN 10 Vs of Care Management Panel
// Option 3: Short summary always visible + expandable full definition

import React, { useState } from "react";

export type TenVId =
  | "voice_view"
  | "viability"
  | "vision"
  | "veracity"
  | "versatility"
  | "vitality"
  | "vigilance"
  | "verification"
  | "value"
  | "validation";

type TenVsAssessmentProps = {
  values?: Partial<Record<TenVId, number>>;
  onChange?: (id: TenVId, value: number) => void;
};

type TenVConfig = {
  id: TenVId;
  label: string;
  shortSummary: string;
  definition: string;
  purpose: string;
  platformAnchor: string;
  relatedPs: string[];
};

const TEN_VS_CONFIG: TenVConfig[] = [
  {
    id: "voice_view",
    label: "V1 – Voice / View",
    shortSummary:
      "Client’s story and self-perception, in their own words, anchoring all other Vs.",
    definition:
      "Captures the client’s story in their own words — what has happened and what is happening — and how they see themselves within that story and want their treatment or recovery plan to progress.",
    purpose:
      "Ensures the care plan begins with the client’s lived experience and self-defined goals, never the RN CM’s interpretation. Voice / View represents the full client perspective and anchors all other Vs.",
    platformAnchor:
      "Single composite field with two prompts: (1) Voice – Client Narrative (free text / audio); (2) View – Self-Perception & Desired Outcome. Time-stamped at each reassessment to show evolution of perspective.",
    relatedPs: ["Physical", "Psychological", "Psychosocial", "Professional"],
  },
  {
    id: "viability",
    label: "V2 – Viability",
    shortSummary:
      "Readiness and capacity to engage in coordinated care across 4Ps + SDOH.",
    definition:
      "Assesses the client’s readiness and capacity — clinical, psychosocial, and engagement — to participate in coordinated care. It explores whether the client understands care management, wants intervention, and recognizes the RN CM’s role.",
    purpose:
      "Quantifies stability and engagement readiness through the 4 Ps of Wellness and SDOH to form the Viability Index.",
    platformAnchor:
      "Auto-scored from intake data; low scores flag domains needing intervention or re-education.",
    relatedPs: ["Physical", "Psychological", "Psychosocial", "Professional"],
  },
  {
    id: "vision",
    label: "V3 – Vision",
    shortSummary:
      "Shared goals and recovery trajectory uniting client, RN, providers, and attorney.",
    definition:
      "Defines the shared goals and desired trajectory for recovery, uniting client, RN CM, providers, and attorneys in a clear, measurable plan.",
    purpose:
      "Aligns expectations and gives everyone a common definition of success.",
    platformAnchor:
      "Goal-setting module with deadlines, owners, and progress tracking.",
    relatedPs: ["Physical", "Psychological", "Psychosocial", "Professional"],
  },
  {
    id: "veracity",
    label: "V4 – Veracity",
    shortSummary:
      "Integrity + advocacy — honest, complete documentation and barrier-removal.",
    definition:
      "Embodies integrity and vigorous advocacy. It identifies where the client needs professional guidance, negotiation, or support to move treatment and healing forward, ensuring documentation and communication remain truthful and complete.",
    purpose:
      "Protects ethical practice and advances the client’s interests through honest, assertive advocacy.",
    platformAnchor:
      "RN attestation field plus advocacy log capturing barrier removals and payer/provider negotiations.",
    relatedPs: ["Psychosocial", "Professional"],
  },
  {
    id: "versatility",
    label: "V5 – Versatility",
    shortSummary:
      "Adaptability of the plan — re-shaping care to fit each client’s reality.",
    definition:
      "Represents adaptability and individualized design. A plan that worked for Client A may not work for Client B — even with identical diagnoses — and must be reshaped to fit each person’s situation.",
    purpose:
      "Prevents “copy-and-paste” care planning and ensures responsiveness to change.",
    platformAnchor:
      "Change-log tracking rationale for each modification and alerting if plans remain static beyond defined intervals.",
    relatedPs: ["Physical", "Psychological", "Psychosocial", "Professional"],
  },
  {
    id: "vitality",
    label: "V6 – Vitality",
    shortSummary:
      "Energy and forward motion of both client and care plan; detects plateaus.",
    definition:
      "Measures the energy, engagement, and forward motion of both client and plan. When progress stalls or decline appears, Vitality signals the need to “spark life” into care through more proactive interventions.",
    purpose:
      "Monitors momentum and ensures timely escalation when recovery plateaus.",
    platformAnchor:
      "Auto-updated from PROMs, vitals, mood scales, and activity logs; red-flag alerts when trend declines more than defined thresholds.",
    relatedPs: ["Physical", "Psychological"],
  },
  {
    id: "vigilance",
    label: "V7 – Vigilance",
    shortSummary:
      "Continuous monitoring for risk, safety, and compliance gaps.",
    definition:
      "Continuous monitoring for risk, safety, and compliance gaps.",
    purpose:
      "Promotes proactive prevention — catching issues before escalation.",
    platformAnchor:
      "Central flag center tracking open alerts, response times, and resolution confirmations.",
    relatedPs: ["Physical", "Psychological", "Psychosocial", "Professional"],
  },
  {
    id: "verification",
    label: "V8 – Verification",
    shortSummary:
      "Confirms accuracy, completeness, and guideline-aligned care (MCG/ODG, etc.).",
    definition:
      "Confirms accuracy, completeness, and evidence-base of every action, aligning with MCG / ODG standards for parity — not restriction — of care.",
    purpose:
      "Builds defensible documentation and guideline consistency.",
    platformAnchor:
      "Embedded guideline checklists, reference links, and audit trail by reviewer/date.",
    relatedPs: ["Professional"],
  },
  {
    id: "value",
    label: "V9 – Value",
    shortSummary:
      "Measurable benefit of care management — outcomes, efficiency, satisfaction, cost.",
    definition:
      "Quantifies the measurable benefit of care management — improved outcomes, efficiency, satisfaction, and cost stewardship.",
    purpose:
      "Demonstrates return on investment for clients, attorneys, and payers.",
    platformAnchor:
      "Auto-calculated from baseline-to-current metrics; feeds monthly “Value Summary.”",
    relatedPs: ["Physical", "Psychological", "Psychosocial", "Professional"],
  },
  {
    id: "validation",
    label: "V10 – Validation",
    shortSummary:
      "Quality-assurance and equity loop — making sure the system itself is fair and sound.",
    definition:
      "The ongoing quality-assurance and equity loop ensuring every case, process, and outcome meets professional and regulatory standards.",
    purpose:
      "Transforms data into continuous improvement and competency growth.",
    platformAnchor:
      "Supervisor audit dashboard, quarterly compliance reports, and automatic QMP documentation.",
    relatedPs: ["Physical", "Psychological", "Psychosocial", "Professional"],
  },
];

const scoreOptions = [1, 2, 3, 4, 5];

const TenVsAssessment: React.FC<TenVsAssessmentProps> = ({
  values,
  onChange,
}) => {
  const [localScores, setLocalScores] =
    useState<Partial<Record<TenVId, number>>>({});
  const [expanded, setExpanded] =
    useState<Partial<Record<TenVId, boolean>>>({});

  const getScore = (id: TenVId): number | undefined => {
    if (values && values[id] != null) return values[id]!;
    return localScores[id];
  };

  const handleScoreChange = (id: TenVId, value: number) => {
    setLocalScores((prev) => ({ ...prev, [id]: value }));
    if (onChange) {
      onChange(id, value);
    }
  };

  const toggleExpanded = (id: TenVId) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
      <h2 className="text-base font-semibold mb-1">
        RN 10 Vs of Care Management
      </h2>
      <p className="text-[11px] text-slate-600 mb-2">
        Score each V from 1 (very poor / not present) to 5 (optimal / fully
        present). Click “Show full definition” if you need the detailed
        framework text while you work.
      </p>

      <div className="space-y-3">
        {TEN_VS_CONFIG.map((v) => {
          const score = getScore(v.id) ?? 0;
          const isExpanded = !!expanded[v.id];

          return (
            <div
              key={v.id}
              className="border border-slate-200 rounded-md p-2 bg-slate-50"
            >
              {/* Header row: label + score selector + Ps tags */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-[12px] font-semibold">{v.label}</div>
                  <div className="text-[11px] text-slate-700">
                    {v.shortSummary}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {v.relatedPs.map((pTag) => (
                      <span
                        key={pTag}
                        className="inline-flex items-center rounded-full border border-slate-300 px-2 py-[1px] text-[10px] text-slate-700 bg-white"
                      >
                        {pTag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600">Score</span>
                  <div className="flex gap-1">
                    {scoreOptions.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleScoreChange(v.id, n)}
                        className={
                          "w-6 h-6 rounded text-[11px] border flex items-center justify-center " +
                          (score === n
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-800 border-slate-300")
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Expand / collapse details */}
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => toggleExpanded(v.id)}
                  className="text-[11px] text-slate-700 underline underline-offset-2"
                >
                  {isExpanded ? "Hide full definition" : "Show full definition"}
                </button>

                {isExpanded && (
                  <div className="mt-2 border-t border-slate-200 pt-2 space-y-1 text-[11px] text-slate-700">
                    <div>
                      <span className="font-semibold">Definition: </span>
                      {v.definition}
                    </div>
                    <div>
                      <span className="font-semibold">Purpose: </span>
                      {v.purpose}
                    </div>
                    <div>
                      <span className="font-semibold">Platform Anchor: </span>
                      {v.platformAnchor}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TenVsAssessment;
