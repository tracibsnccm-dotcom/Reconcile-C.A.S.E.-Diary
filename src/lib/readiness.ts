/* =========================
   FILE: src/lib/readiness.ts
   ========================= */
export type CaseStatus = "NEW"|"AWAITING_CONSENT"|"ROUTED"|"IN_PROGRESS"|"HOLD_SENSITIVE"|"READY_FOR_MEDIATION";
export type FourPs = { physical?: number; psychological?: number; psychosocial?: number; professional?: number; };
export type Intake = {
  incidentType?: "MVA"|"WorkComp"|"Other";
  incidentDate?: string; // ISO
  initialTreatment?: "ED"|"UrgentCare"|"PCP"|"Chiro"|"None";
  injuries?: string[];
  severitySelfScore?: number; // 0-10
};
export type Consent = { signed: boolean; scope?: { shareWithAttorney: boolean; shareWithProviders: boolean } };
export type CaseLite = {
  id: string;
  clientRef?: string; // non-PHI display token
  status: CaseStatus;
  intake?: Intake;
  fourPs?: FourPs;
  sdoh?: { housing?: boolean; food?: boolean; transport?: boolean; insuranceGap?: boolean };
  sdohResolved?: { housing?: boolean; food?: boolean; transport?: boolean; insuranceGap?: boolean };
  consent: Consent;
  flags?: string[]; // e.g. ["HEAD_TRAUMA"]
  providerRouted?: boolean;
  specialistReportUploaded?: boolean;
  lastPainDiaryAt?: string;        // ISO
  painDiaryCount30d?: number;      // #
  documentation?: {
    fourPsComplete?: boolean;
    intakeComplete?: boolean;
    incidentNarrativeCaptured?: boolean;
    mdInitialReport?: boolean;
    specialistNeurology?: boolean;
    diary4wks?: boolean;
    sdohAddressed?: boolean;
  };
  odgBenchmarks?: {
    initialAssessment?: boolean;
    imagingAsIndicated?: boolean;
    conservativeCareTrial?: boolean;
    specialistEvaluation?: boolean;
    returnToFunctionPlan?: boolean;
  };
};

const clamp = (v: number, min=0, max=100) => Math.max(min, Math.min(max, v));
const daysSince = (iso?: string) => {
  if (!iso) return 999;
  const t = new Date(iso).getTime();
  return isNaN(t) ? 999 : Math.floor((Date.now() - t) / 86400000);
};

export function computeSettlementReadinessScore(kase: CaseLite) {
  // Medical milestones (35)
  const m = kase.odgBenchmarks || {};
  const medN = [m.initialAssessment, m.imagingAsIndicated, m.conservativeCareTrial, m.specialistEvaluation, m.returnToFunctionPlan].filter(Boolean).length;
  const medScore = (medN/5)*35;

  // Documentation (30)
  const doc = kase.documentation || {};
  const diaryFreshDays = daysSince(kase.lastPainDiaryAt);
  const diaryFactor = kase.painDiaryCount30d && kase.painDiaryCount30d>0
    ? (diaryFreshDays<=7?1:diaryFreshDays<=14?0.7:diaryFreshDays<=30?0.4:0.1) : 0;
  const fourPsOk = doc.fourPsComplete ? 1 : scoreFourPsCompleteness(kase.fourPs);
  const intakeOk = doc.intakeComplete ? 1 : 0;
  const narrativeOk = doc.incidentNarrativeCaptured ? 1 : 0;
  const docScore = (diaryFactor*0.4 + fourPsOk*0.3 + intakeOk*0.2 + narrativeOk*0.1)*30;

  // Routing/Flow (20)
  const consentOk = kase.consent?.signed && kase.consent?.scope?.shareWithAttorney ? 1 : 0;
  const routedOk = kase.providerRouted ? 1 : 0;
  const specialistOk = kase.specialistReportUploaded ? 1 : 0;
  const flowScore = (consentOk*0.45 + routedOk*0.3 + specialistOk*0.25)*20;

  // SDOH stability (15, penalty model)
  const sd = kase.sdoh || {}, res = kase.sdohResolved || {};
  const unresolved = (sd.housing&&!res.housing?1:0)+(sd.food&&!res.food?1:0)+(sd.transport&&!res.transport?1:0)+(sd.insuranceGap&&!res.insuranceGap?1:0);
  const sdohScore = clamp(15 - unresolved*3.75, 0, 15);

  const total = clamp(Math.round(medScore+docScore+flowScore+sdohScore), 0, 100);

  const blockers: string[] = [];
  if (!consentOk) blockers.push("Consent not attorney-shareable");
  if (!routedOk) blockers.push("Not routed to provider");
  if (!specialistOk) blockers.push("Specialist report missing");
  if (diaryFactor===0) blockers.push("Pain diary inactive");
  if (fourPsOk<1) blockers.push("4Ps incomplete");
  if (!intakeOk) blockers.push("Intake incomplete");
  if (!narrativeOk) blockers.push("Incident narrative missing");
  if (unresolved>0) blockers.push("Unresolved SDOH risk");

  return {
    score: total,
    buckets: { medical: Math.round(medScore), documentation: Math.round(docScore), routing: Math.round(flowScore), sdoh: Math.round(sdohScore) },
    blockers
  };
}

function scoreFourPsCompleteness(p?: FourPs) {
  if (!p) return 0;
  const keys: (keyof FourPs)[] = ["physical","psychological","psychosocial","professional"];
  const present = keys.filter(k => typeof p[k] === "number").length;
  return present===4 ? 1 : present>=2 ? 0.5 : 0.2;
}

/** Next Action engine (simple rules; expand later via server) */
export function getNextActions(k: CaseLite) {
  const hints: { icon: string; text: string; action: "ROUTE_PROVIDER"|"REQUEST_SPECIALIST"|"NARRATIVE_CAPTURE"|"ENABLE_DIARY"|"CONSENT_FIX"|"SDOH_PROTOCOL"|"GENERATE_MEDIATION_PDF"|"SEND_SMS"|"REQUEST_PROVIDER_UPDATE"|"REQUEST_CLINICAL_RECO"; }[] = [];
  const s = computeSettlementReadinessScore(k);

  if (!(k.consent?.signed && k.consent.scope?.shareWithAttorney)) hints.push({icon:"🚫", text:"Update consent to permit attorney sharing", action:"CONSENT_FIX"});
  if (!k.providerRouted) hints.push({icon:"📌", text:"Route case to preferred provider", action:"ROUTE_PROVIDER"});
  if (!k.specialistReportUploaded) hints.push({icon:"📄", text:"Request specialist evaluation/report", action:"REQUEST_SPECIALIST"});
  if (!k.documentation?.incidentNarrativeCaptured) hints.push({icon:"📝", text:"Capture incident narrative", action:"NARRATIVE_CAPTURE"});
  if (!(k.painDiaryCount30d && k.painDiaryCount30d>0)) hints.push({icon:"📲", text:"Enable & nudge pain diary", action:"ENABLE_DIARY"});
  if (s.blockers.some(b=>/SDOH/.test(b))) hints.push({icon:"🏠", text:"Initiate SDOH resource protocol", action:"SDOH_PROTOCOL"});
  if (s.score>=80) hints.push({icon:"📑", text:"Generate Mediation Summary PDF (2–3 pages)", action:"GENERATE_MEDIATION_PDF"});

  // Always allow SMS from here
  hints.push({icon:"✉️", text:"Send client SMS reminder", action:"SEND_SMS"});
  // Provider comms shortcuts
  hints.push({icon:"📨", text:"Request Provider Update", action:"REQUEST_PROVIDER_UPDATE"});
  hints.push({icon:"🧠", text:"Clinical Recommendation Request", action:"REQUEST_CLINICAL_RECO"});

  return hints;
}

/** Alert rules (RN + Attorney) */
export function computeAlerts(k: CaseLite) {
  const alerts: { level:"info"|"warn"|"crit"; text:string; }[] = [];
  const diaryDays = daysSince(k.lastPainDiaryAt);

  if (k.painDiaryCount30d && k.painDiaryCount30d>0 && diaryDays<=2) {
    // fresh
  } else if (diaryDays>=3 && diaryDays<7) {
    alerts.push({ level:"warn", text:"Diary inactive for 3+ days — nudge client." });
  } else if (diaryDays>=7) {
    alerts.push({ level:"crit", text:"Diary inactive for 7+ days — RN call trigger." });
  }

  if (k.sdoh && (k.sdoh.housing||k.sdoh.food||k.sdoh.transport||k.sdoh.insuranceGap)) {
    const unresolved = k.sdohResolved || {};
    const still = (k.sdoh.housing&&!unresolved.housing) || (k.sdoh.food&&!unresolved.food) || (k.sdoh.transport&&!unresolved.transport) || (k.sdoh.insuranceGap&&!unresolved.insuranceGap);
    if (still) alerts.push({ level:"warn", text:"Active SDOH risk — initiate community resource protocol." });
  }

  return alerts;
}
