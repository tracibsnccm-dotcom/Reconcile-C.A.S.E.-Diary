// src/screens/ClientEndScreen.tsx
import React, { useMemo } from "react";

type InjuryType =
  | "Back/Neck Injury"
  | "Shoulder Injury"
  | "Knee Injury"
  | "Head Injury / Concussion"
  | "Soft Tissue / Sprain-Strain"
  | "Fracture"
  | "Other";

type DemoCase = {
  caseId: string;
  clientDisplayName: string;
  incidentDate: string;
  jurisdiction: string;
  mechanism: string;

  injuries: string[];
  chronicConditions: string[];

  careDisruptions: {
    transportation: string;
    workIncome: string;
    childcare: string;
    housingFood: string;
    summary: string;
  };

  sdohDomains: {
    economicStability: number; // 1–5 (1 worst)
    educationAccessQuality: number;
    healthCareAccessQuality: number;
    neighborhoodBuiltEnvironment: number;
    socialCommunityContext: number;
    narrative: string;
  };

  clinicalRiskFlags: {
    careDelayRisk: "Low" | "Moderate" | "High";
    documentationRisk: "Low" | "Moderate" | "High";
    adherenceMisinterpretationRisk: "Low" | "Moderate" | "High";
  };

  rnPlan: {
    immediateFocus: string[];
    next7Days: string[];
    recordsTargets: string[];
    evidenceBasedSupport: string[];
  };

  lastRnUpdate: string;
};

interface ClientEndScreenProps {
  injuryType: InjuryType;
  onRestart: () => void;
}

/**
 * IMPORTANT:
 * - This is demo-safe: it writes a high-quality demo case summary for the Attorney Console
 * - It does NOT expose proprietary RN workflows/logic
 *
 * Storage key MUST match AttorneyConsole.tsx:
 */
const ATTORNEY_DEMO_STORAGE_KEY = "rcms_case_summary_attorney_demo";

/**
 * Optional: if your ClientIntakeScreen is already saving a JSON blob somewhere,
 * we’ll try to read it and enrich the demo. If it’s not there, no problem.
 * You can change this key later if you already use a different one.
 */
const CLIENT_INTAKE_STORAGE_KEY = "rcms_client_intake_demo";

function nowStamp() {
  const d = new Date();
  return d.toLocaleString();
}

function safeParseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeInjuries(injuryType: InjuryType, extra?: string[]): string[] {
  const base = [injuryType];
  const merged = [...base, ...(extra ?? [])]
    .map((s) => (s ?? "").trim())
    .filter(Boolean);

  // de-dupe
  return Array.from(new Set(merged));
}

function defaultMechanism(injuryType: InjuryType) {
  // keep it general and credible
  if (injuryType === "Head Injury / Concussion") {
    return "Motor vehicle collision; client reports head impact symptoms and functional disruption following the incident.";
  }
  return "Motor vehicle collision; acute onset pain and functional limitation reported following the incident.";
}

function buildDemoCase001(params: {
  injuryType: InjuryType;
  intake?: any;
}): DemoCase {
  const { injuryType, intake } = params;

  // Pull whatever we can from intake without assuming a strict schema.
  // If fields aren’t present, fallback gracefully.
  const clientName =
    (intake?.clientName || intake?.name || intake?.fullName || "Demo Client").toString();

  const jurisdiction = (intake?.jurisdiction || intake?.state || "Texas").toString();

  const incidentDate =
    (intake?.incidentDate || intake?.dateOfInjury || intake?.doi || "2024-10-25").toString();

  const mechanism =
    (intake?.mechanism || intake?.whatHappened || intake?.incidentSummary || defaultMechanism(injuryType)).toString();

  const chronicConditionsRaw =
    intake?.chronicConditions || intake?.conditions || intake?.pmh || [];
  const chronicConditions =
    Array.isArray(chronicConditionsRaw) && chronicConditionsRaw.length
      ? chronicConditionsRaw.map((x: any) => String(x)).filter(Boolean)
      : ["Hypertension (history)", "Anxiety (history)"];

  const extraInjuriesRaw = intake?.injuries || intake?.injurySelections || [];
  const extraInjuries =
    Array.isArray(extraInjuriesRaw) ? extraInjuriesRaw.map((x: any) => String(x)) : [];

  const clientVoiceWhatHappened = (intake?.clientVoiceWhatHappened || intake?.whatHappened || "").toString();
  const clientVoiceHardestPart = (intake?.clientVoiceHardestPart || "").toString();
  const clientVoiceNeedMost = (intake?.clientVoiceNeedMost || "").toString();

  // Care disruptions (demo narrative)
  const transportation =
    (intake?.transportationIssue ||
      intake?.transportation ||
      "Primary vehicle unavailable or unreliable after the incident; transportation barriers affected appointment attendance.")
      .toString();

  const workIncome =
    (intake?.workIncomeIssue ||
      intake?.incomeImpact ||
      "Reduced work capacity reported due to pain and disruptions; financial strain impacted ability to keep consistent visits.")
      .toString();

  const childcare =
    (intake?.childcareIssue ||
      intake?.childcare ||
      "Childcare constraints and scheduling conflicts interfered with appointment windows and follow-through.")
      .toString();

  const housingFood =
    (intake?.housingFoodIssue ||
      intake?.foodHousing ||
      "Short-term resource strain reported; prioritizing essentials affected consistent follow-up.")
      .toString();

  // SDOH scores (if your intake captured them; otherwise set reasonable demo defaults)
  const sdoh = intake?.sdohDomains || intake?.sdoh || {};
  const economicStability = Number(sdoh?.economicStability ?? 2) || 2;
  const educationAccessQuality = Number(sdoh?.educationAccessQuality ?? 4) || 4;
  const healthCareAccessQuality = Number(sdoh?.healthCareAccessQuality ?? 2) || 2;
  const neighborhoodBuiltEnvironment = Number(sdoh?.neighborhoodBuiltEnvironment ?? 3) || 3;
  const socialCommunityContext = Number(sdoh?.socialCommunityContext ?? 3) || 3;

  const sdohNarrative =
    (sdoh?.narrative ||
      "Client reports real-world barriers (transportation + income disruption + childcare constraints) that interfered with scheduling and adherence. Documenting these protects the integrity of the client and the medical record by showing that care gaps were driven by external disruptions—not lack of effort or credibility.")
      .toString();

  // Risk flags: keep demo-level, not “diagnostic”
  const careDelayRisk: "Low" | "Moderate" | "High" =
    economicStability <= 2 || healthCareAccessQuality <= 2 ? "High" : "Moderate";

  const adherenceMisinterpretationRisk: "Low" | "Moderate" | "High" =
    careDelayRisk === "High" ? "High" : "Moderate";

  const documentationRisk: "Low" | "Moderate" | "High" =
    (clientVoiceWhatHappened.trim().length + clientVoiceHardestPart.trim().length + clientVoiceNeedMost.trim().length) > 20
      ? "Moderate"
      : "Moderate";

  const injuries = normalizeInjuries(injuryType, extraInjuries);

  return {
    caseId: "DEMO-001",
    clientDisplayName: `${clientName} (Case #001)`,
    incidentDate,
    jurisdiction,
    mechanism,

    injuries,
    chronicConditions,

    careDisruptions: {
      transportation,
      workIncome,
      childcare,
      housingFood,
      summary:
        "External disruptions contributed to delayed/fragmented care. This is clinically relevant and legally relevant because delays may be misread as “noncompliance” without context.",
    },

    sdohDomains: {
      economicStability,
      educationAccessQuality,
      healthCareAccessQuality,
      neighborhoodBuiltEnvironment,
      socialCommunityContext,
      narrative: sdohNarrative,
    },

    clinicalRiskFlags: {
      careDelayRisk,
      documentationRisk,
      adherenceMisinterpretationRisk,
    },

    rnPlan: {
      immediateFocus: [
        "Close care gaps: confirm follow-up schedule and reduce time-to-visit delays.",
        "Support symptom documentation: pain journal guidance; functional limitation tracking (sleep, ADLs, work).",
        "Barrier mitigation: transportation + childcare solutions; community resources as appropriate.",
      ],
      next7Days: [
        "Verify appointment plan (frequency, next dates).",
        "Identify missing records and request where needed.",
        "Check escalation triggers if symptoms worsen.",
      ],
      recordsTargets: [
        "ED record + discharge instructions",
        "Follow-up visit notes + restrictions",
        "PT evaluation + progress notes (if applicable)",
        "Imaging reports and referrals (if performed)",
      ],
      evidenceBasedSupport: [
        "Align care pathway with evidence-based criteria where applicable (e.g., ODG/MCG-style rationale) to support medical necessity.",
        "Use payer-language framing to reduce denial leverage and strengthen treatment justification.",
      ],
    },

    lastRnUpdate: nowStamp(),
  };
}

const ClientEndScreen: React.FC<ClientEndScreenProps> = ({ injuryType, onRestart }) => {
  // Build the attorney demo case as soon as we hit the thank-you screen
  const built = useMemo(() => {
    const intake = safeParseJson<any>(window.localStorage.getItem(CLIENT_INTAKE_STORAGE_KEY));
    return buildDemoCase001({ injuryType, intake });
  }, [injuryType]);

  // Write once on render (safe for demo)
  useMemo(() => {
    try {
      window.localStorage.setItem(ATTORNEY_DEMO_STORAGE_KEY, JSON.stringify(built));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="border rounded-xl bg-white p-5 shadow-sm">
        <div className="text-xl font-semibold">Thank you — your demo intake is complete.</div>

        <div className="mt-2 text-sm text-slate-700">
          This is a shortened demo version. In the live environment, clients are guided through a fuller intake
          (typically 60–90 minutes) that maps into RN care management workflows.
        </div>

        <div className="mt-4 border rounded-lg p-3 bg-slate-50">
          <div className="text-sm font-semibold">What happens next (demo)</div>
          <ul className="mt-2 text-sm text-slate-700 list-disc pl-5 space-y-1">
            <li>
              Based on your reported injury focus (<span className="font-semibold">{injuryType}</span>), you will
              receive educational guidance in the live platform.
            </li>
            <li>
              You’ll be encouraged to use the pain/treatment journal frequently — memory fades quickly, and early
              documentation strengthens credibility and supports appropriate care.
            </li>
            <li>
              Some demo items are excluded to protect proprietary workflows and IP.
            </li>
          </ul>
        </div>

        <div className="mt-4 border rounded-lg p-3 bg-white">
          <div className="text-sm font-semibold">Demo case generated for attorney preview</div>
          <div className="mt-2 text-sm text-slate-700">
            <div>
              <span className="font-semibold">Case ID:</span> {built.caseId}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Client:</span> {built.clientDisplayName}
            </div>
            <div className="mt-1">
              <span className="font-semibold">Jurisdiction:</span> {built.jurisdiction}
            </div>
          </div>

          <div className="mt-3 text-[11px] text-slate-600">
            (This demo writes a safe case summary into local storage so the Attorney Console can display a complete,
            credible preview without exposing proprietary logic.)
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            onClick={() => {
              // If your app has a tab system, the attorney will click Attorney Console at the top.
              // This just scrolls user up for a clean “done” feeling.
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            Done
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg border text-sm bg-white hover:bg-slate-50"
            onClick={onRestart}
          >
            Restart demo
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientEndScreen;
