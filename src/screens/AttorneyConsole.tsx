// src/screens/AttorneyConsole.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CaseSummary,
  SeverityScore,
  FOUR_PS,
  TEN_VS,
  getSeverityLabel,
} from "../constants/reconcileFramework";
import { resolveLatestReleasedCase, CaseWithRevision } from "../lib/resolveLatestReleasedCase";
import { AttorneyPrintReportButton } from "../attorney/AttorneyPrintReportButton";
import { ExportAuditTrail } from "../components/ExportAuditTrail";

type AttorneyTab =
  | "overview"
  | "clinicalStory"
  | "sdohRisk"
  | "timeline"
  | "documents"
  | "exportAudit";

type ClientStatus = "Active" | "At-Risk" | "Needs Review";

type DemoClient = {
  id: string;
  displayName: string;
  caseId: string;
  injury: string;
  jurisdiction: string;
  lastUpdateISO: string;
  status: ClientStatus;
  case_status: "draft" | "released" | "closed";
  summary: CaseSummary;
};

type NavSection = "console" | "reports" | "settings";

type ReportKind =
  | "RN_CARE_SUMMARY"
  | "DENIAL_RESPONSE_PACKET"
  | "TIMELINE_SNAPSHOT";
type ReportStatus = "Not available" | "Ready";

type DemoReport = {
  id: string;
  kind: ReportKind;
  title: string;
  subtitle: string;
  status: ReportStatus;
  updatedAtISO: string;
  severityScore: SeverityScore | null;
  severityLabel: string | null;
  body: string[];
};

const DEMO_MODE_STORAGE_KEY = "rcms_attorney_demo_mode";

// ---- Storage helpers ----
// TODO: Case data source - Currently reads from localStorage key "rcms_case_summary".
// This is where RNPublishPanel writes published RN assessments (CaseSummary with fourPs, tenVs, sdoh, crisis).
// In production, this should read from Supabase database table with caseId association, not global localStorage.
function loadCaseSummaryFromStorage(): CaseSummary | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("rcms_case_summary");
    if (!raw) return null;
    return JSON.parse(raw) as CaseSummary;
  } catch (e) {
    console.error("Failed to load case summary", e);
    return null;
  }
}

function saveCaseSummaryToStorage(summary: CaseSummary) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("rcms_case_summary", JSON.stringify(summary));
}

function loadDemoModeFromStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(DEMO_MODE_STORAGE_KEY);
    if (raw === null) return false; // MVP: default OFF (use real data)
    return raw === "true";
  } catch {
    return false; // MVP: default OFF (use real data)
  }
}

function saveDemoModeToStorage(value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(value));
}

// ---- Scoring helpers ----
function worstScore(scores: (SeverityScore | undefined)[]): SeverityScore | null {
  const filtered = scores.filter(
    (s): s is SeverityScore => typeof s === "number"
  );
  if (filtered.length === 0) return null;
  return filtered.reduce((min, s) => (s < min ? s : min), filtered[0]);
}

function getClientWorstClinical(summary: CaseSummary): SeverityScore | null {
  return worstScore([
    summary.fourPs?.overallScore,
    summary.tenVs?.overallScore,
    summary.crisis?.severityScore,
  ]);
}

function daysSince(iso: string): number {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - d;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// TODO: Hard-coded mock data - DEMO_CLIENTS contains static demo case data.
// These are placeholder clients with embedded CaseSummary objects.
// In production, this should be replaced with:
//   1. ActiveCaseContext.useActiveCase() to get real case data
//   2. Supabase queries to fetch cases assigned to this attorney
//   3. Real case list from database, not hard-coded array
// ---- Demo data ----
const DEMO_CLIENTS: DemoClient[] = [
  {
    id: "demo-001",
    displayName: "Client A.",
    caseId: "CASE-001",
    injury: "MVC – neck/back pain + headaches",
    jurisdiction: "Texas",
    lastUpdateISO: new Date().toISOString(),
    status: "At-Risk",
    case_status: "released",
    summary: {
      updatedAt: new Date().toISOString(),
      fourPs: {
        overallScore: 2,
        narrative:
          "Client reports persistent pain, sleep disruption, and reduced function since the collision. Work demands worsen symptoms. Supports exist but are strained.",
        dimensions: [
          { id: "physical", score: 2, note: "Pain limits ADLs; flares with activity." },
          { id: "psychological", score: 3, note: "Anxiety/frustration; coping mixed." },
          { id: "psychosocial", score: 2, note: "Support present but inconsistent." },
          { id: "professional", score: 3, note: "Work capacity reduced; risk of missed time." },
        ],
      },
      tenVs: {
        overallScore: 2,
        narrative:
          "Care plan requires reinforcement and tighter follow-through. Treatment access and adherence risk are present; documentation should be strengthened in real time.",
        dimensions: [
          { id: "voiceView", score: 3, note: "Client story clear; needs structured capture." },
          { id: "viability", score: 2, note: "Plan feasible but fragile without supports." },
          { id: "vision", score: 3, note: "Goals exist; timeline needs clarity." },
          { id: "veracity", score: 3, note: "Records support complaint; continue verification." },
          { id: "versatility", score: 2, note: "Plan needs contingencies for flares/denials." },
          { id: "vitality", score: 2, note: "Energy/function reduced; pacing needed." },
          { id: "vigilance", score: 2, note: "Follow-up cadence must be consistent." },
          { id: "verification", score: 3, note: "Confirm imaging/visits; track timelines." },
          { id: "value", score: 3, note: "Care has value; ensure medical necessity narrative." },
          { id: "validation", score: 3, note: "Client experience acknowledged; reinforce adherence." },
        ],
      },
      sdoh: {
        overallScore: 2,
        narrative:
          "Transportation instability and schedule constraints are disrupting follow-up. Household responsibilities contribute to missed appointments and delayed care.",
      },
      crisis: { severityScore: 4 },
    },
  },
  {
    id: "demo-002",
    displayName: "Client B.",
    caseId: "CASE-002",
    injury: "Work injury – shoulder/upper extremity",
    jurisdiction: "Illinois",
    lastUpdateISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: "Active",
    case_status: "closed",
    summary: {
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      fourPs: {
        overallScore: 3,
        dimensions: [
          { id: "physical", score: 3 },
          { id: "psychological", score: 3 },
          { id: "psychosocial", score: 4 },
          { id: "professional", score: 2 },
        ],
        narrative:
          "Moderate functional limitations with work impact. Supports are stronger, but job demands are a destabilizer.",
      },
      tenVs: {
        overallScore: 3,
        dimensions: [
          { id: "voiceView", score: 4 },
          { id: "viability", score: 3 },
          { id: "vision", score: 3 },
          { id: "veracity", score: 3 },
          { id: "versatility", score: 3 },
          { id: "vitality", score: 3 },
          { id: "vigilance", score: 3 },
          { id: "verification", score: 3 },
          { id: "value", score: 3 },
          { id: "validation", score: 4 },
        ],
        narrative:
          "Care plan is stable but needs reinforcement around work restrictions and documentation.",
      },
      sdoh: {
        overallScore: 4,
        narrative: "Generally supportive environment; minor barriers.",
      },
      crisis: { severityScore: 5 },
    },
  },
  {
    id: "demo-003",
    displayName: "Client C.",
    caseId: "CASE-003",
    injury: "Chronic condition flare – pain + fatigue",
    jurisdiction: "Missouri",
    lastUpdateISO: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    status: "Needs Review",
    case_status: "draft",
    summary: {
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
      fourPs: {
        overallScore: 2,
        dimensions: [
          { id: "physical", score: 2 },
          { id: "psychological", score: 2 },
          { id: "psychosocial", score: 3 },
          { id: "professional", score: 4 },
        ],
        narrative:
          "Symptoms disrupt daily stability. Psychological strain is notable. Work stability is better than health stability.",
      },
      tenVs: {
        overallScore: 2,
        dimensions: [
          { id: "voiceView", score: 3 },
          { id: "viability", score: 2 },
          { id: "vision", score: 2 },
          { id: "veracity", score: 3 },
          { id: "versatility", score: 2 },
          { id: "vitality", score: 2 },
          { id: "vigilance", score: 2 },
          { id: "verification", score: 3 },
          { id: "value", score: 3 },
          { id: "validation", score: 3 },
        ],
        narrative:
          "Plan needs active monitoring. Fatigue and pain drive adherence risk; care pacing and documentation are key.",
      },
      sdoh: {
        overallScore: 3,
        narrative: "Mixed supports; access constraints may affect follow-through.",
      },
      crisis: { severityScore: 4 },
    },
  },
];

// TODO: Mock-only reports - buildDemoReports generates placeholder reports from summary data.
// Currently creates structured DemoReport objects with static body text.
// In production, reports should be:
//   1. Generated from actual RN published summaries stored in database
//   2. Include real narrative content from RN assessments
//   3. Link to actual documents/artifacts stored in Supabase
//   4. Support version history and updates from RN publish workflow
function buildDemoReports(
  selectedClient: DemoClient,
  summary: CaseSummary | null
): DemoReport[] {
  const s = summary ?? selectedClient.summary;

  const fourPsOverall = s.fourPs?.overallScore;
  const tenVsOverall = s.tenVs?.overallScore;
  const sdohOverall = s.sdoh?.overallScore;
  const crisisSeverity = s.crisis?.severityScore;

  const worst = worstScore([fourPsOverall, tenVsOverall, crisisSeverity]);
  const worstLabel = worst ? getSeverityLabel(worst) : null;

  const updatedAtISO =
    s.updatedAt || selectedClient.lastUpdateISO || new Date().toISOString();

  const readyCareSummary: ReportStatus =
    s.fourPs?.overallScore && s.tenVs?.overallScore ? "Ready" : "Not available";

  const readyDenialPacket: ReportStatus = s.tenVs?.overallScore ? "Ready" : "Not available";

  const readyTimeline: ReportStatus = s.updatedAt ? "Ready" : "Not available";

  const careSummaryBody: string[] = [
    "Attorney-facing care summary generated from RN scoring tools (4Ps, 10-Vs, SDOH, Crisis Mode).",
    `4Ps overall: ${fourPsOverall ? `${fourPsOverall}/5` : "Not yet scored"}`,
    `10-Vs overall: ${tenVsOverall ? `${tenVsOverall}/5` : "Not yet scored"}`,
    `SDOH overall: ${sdohOverall ? `${sdohOverall}/5` : "Not yet scored"}`,
    `Crisis severity (max): ${crisisSeverity ? `${crisisSeverity}/5` : "Not yet documented"}`,
    "Notes: This portal is read-only; no PHI is stored or displayed.",
  ];

  const denialPacketBody: string[] = [
    "Template-style packet used to support timely denial challenges using payer-recognized evidence logic.",
    "Includes: care pathway justification, adherence barriers (documented), and documentation timing safeguards.",
    "Notes: This is a demo placeholder. Live mode will pull released RN notes and supporting artifacts.",
  ];

  const timelineBody: string[] = [
    "Key-event snapshot intended for attorney review (high-level only).",
    "Includes: major care events, imaging flags, care plan pivots, and crisis escalations (if applicable).",
    "Notes: Detailed event history remains in the RN Timeline & Notes module.",
  ];

  return [
    {
      id: `${selectedClient.id}-care-summary`,
      kind: "RN_CARE_SUMMARY",
      title: "RN Care Summary",
      subtitle: "Attorney-facing snapshot generated from RN scoring tools",
      status: readyCareSummary,
      updatedAtISO,
      severityScore: worst,
      severityLabel: worstLabel,
      body: careSummaryBody,
    },
    {
      id: `${selectedClient.id}-denial-packet`,
      kind: "DENIAL_RESPONSE_PACKET",
      title: "Denial Response Packet",
      subtitle: "Evidence-logic outline for timely denial challenges",
      status: readyDenialPacket,
      updatedAtISO,
      severityScore: worst,
      severityLabel: worstLabel,
      body: denialPacketBody,
    },
    {
      id: `${selectedClient.id}-timeline-snapshot`,
      kind: "TIMELINE_SNAPSHOT",
      title: "Timeline Snapshot",
      subtitle: "High-level timeline highlights (attorney view)",
      status: readyTimeline,
      updatedAtISO,
      severityScore: worst,
      severityLabel: worstLabel,
      body: timelineBody,
    },
  ];
}

const AttorneyConsole: React.FC = () => {
  const [nav, setNav] = useState<NavSection>("console");
  const [activeTab, setActiveTab] = useState<AttorneyTab>("overview");
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(() => loadDemoModeFromStorage());

  const [showFullExplanation, setShowFullExplanation] = useState(false);

  const [selectedClientId, setSelectedClientId] = useState<string>("demo-001");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "All">("All");
  const [sortMode, setSortMode] = useState<"NeedsAttention" | "Recent">("NeedsAttention");

  const [openReportId, setOpenReportId] = useState<string | null>(null);

  // Account dropdown + toast
  const [accountOpen, setAccountOpen] = useState(false);
  const accountWrapRef = useRef<HTMLDivElement | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // NEW: RN comms modal
  const [rnComposeOpen, setRnComposeOpen] = useState(false);
  const [rnComposeMode, setRnComposeMode] = useState<"message" | "call">("message");
  const [rnMsg, setRnMsg] = useState("");
  const [rnCallNotes, setRnCallNotes] = useState("");
  const [rnCallBestTimes, setRnCallBestTimes] = useState("");

  const selectedClient = useMemo(() => {
    return DEMO_CLIENTS.find((c) => c.id === selectedClientId) ?? DEMO_CLIENTS[0];
  }, [selectedClientId]);

  // TODO: In production, fetch cases array from Supabase or useActiveCase context
  // For demo mode, use DEMO_CLIENTS converted to CaseWithRevision format
  const casesArray: CaseWithRevision[] = useMemo(() => {
    if (demoMode) {
      // Convert DEMO_CLIENTS to CaseWithRevision format for the resolver
      return DEMO_CLIENTS.map((client) => ({
        id: client.caseId,
        revision_of_case_id: null, // Demo clients don't have revision chains
        case_status: client.case_status,
        closed_at: null,
        released_at: null,
        updated_at: client.lastUpdateISO,
        created_at: client.lastUpdateISO,
      }));
    }
    // TODO: Replace with actual Supabase query or context data
    // Example: const { cases } = useSupabaseCases();
    return [];
  }, [demoMode]);

  // Resolve the latest released/closed case from the revision lineage
  const displayCase = useMemo(() => {
    // Get the case ID from selectedClient (or selectedCase if available)
    const caseId = selectedClient?.caseId || selectedClientId;
    const resolved = resolveLatestReleasedCase(casesArray, caseId);
    
    // For demo mode: if resolver returns null (no released/closed found), 
    // find the first released/closed case from DEMO_CLIENTS as fallback
    if (!resolved && demoMode) {
      const releasedOrClosed = DEMO_CLIENTS.find(
        (c) => c.case_status === "released" || c.case_status === "closed"
      );
      if (releasedOrClosed) {
        return {
          id: releasedOrClosed.caseId,
          revision_of_case_id: null,
          case_status: releasedOrClosed.case_status,
          closed_at: null,
          released_at: null,
          updated_at: releasedOrClosed.lastUpdateISO,
          created_at: releasedOrClosed.lastUpdateISO,
        } as CaseWithRevision;
      }
    }
    
    return resolved;
  }, [casesArray, selectedClient, selectedClientId, demoMode]);

  // Alias for clarity
  const resolvedCase = displayCase;
  
  // Find the demo client that matches the resolved case (for accessing summary data)
  const resolvedDemoClient = useMemo(() => {
    if (!resolvedCase || !demoMode) return null;
    return DEMO_CLIENTS.find((c) => c.caseId === resolvedCase.id) ?? null;
  }, [resolvedCase, demoMode]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200);
  };

  // Close account menu on outside click + Esc
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!accountOpen) return;
      const target = e.target as Node | null;
      if (!target) return;
      if (accountWrapRef.current && accountWrapRef.current.contains(target)) return;
      setAccountOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAccountOpen(false);
        setOpenReportId(null);
        setRnComposeOpen(false);
      }
    };

    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // TODO: Case data sourcing - In demo mode, reads from localStorage (published RN data) or falls back to resolved case's summary.
  // When demoMode is OFF, summary is set to null (shows "awaiting onboarding").
  // In production, this should:
  //   1. Read from useActiveCase() context to get the active case
  //   2. Fetch published RN summary from Supabase using activeCase.id
  //   3. NOT use localStorage (browser-specific, not case-scoped)
  //   4. NOT use hard-coded demo client data
  // Initialize/seed only in Demo Mode - use resolved case's summary, not selected client
  useEffect(() => {
    if (!demoMode) {
      setSummary(null);
      return;
    }

    // Use resolved case's summary, not selected client's (to ensure we never show unreleased data)
    if (resolvedDemoClient) {
      const stored = loadCaseSummaryFromStorage();
      if (stored) setSummary(stored);
      else {
        saveCaseSummaryToStorage(resolvedDemoClient.summary);
        setSummary(resolvedDemoClient.summary);
      }
    } else {
      setSummary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode, resolvedDemoClient]);

  // TODO: Client switching - Currently uses hard-coded selectedClientId state with DEMO_CLIENTS array.
  // When switching, it uses the resolved case's summary (never unreleased).
  // In production, this should:
  //   1. Use useActiveCase().setActiveCaseById(caseId) to switch active case
  //   2. Fetch the published RN summary for that case from Supabase
  //   3. NOT overwrite localStorage (should be case-specific database records)
  // When switching clients: only in Demo Mode - use resolved case, not selected client
  useEffect(() => {
    if (!demoMode) return;
    // Use resolved case's summary, not selected client's (to ensure we never show unreleased data)
    if (resolvedDemoClient) {
      saveCaseSummaryToStorage(resolvedDemoClient.summary);
      setSummary(resolvedDemoClient.summary);
    } else {
      setSummary(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId, demoMode, resolvedDemoClient]);

  const handleRefresh = () => {
    if (!demoMode) return;
    setSummary(loadCaseSummaryFromStorage());
  };

  const toggleDemoMode = () => {
    const next = !demoMode;
    setDemoMode(next);
    saveDemoModeToStorage(next);
    if (!next) {
      setOpenReportId(null);
      setActiveTab("overview");
      setNav("console");
      setRnComposeOpen(false);
    }
  };

  // TODO: Published RN data usage - These variables extract RN assessment data from the CaseSummary.
  // This is where published RN output (from RNPublishPanel) appears:
  //   - fourPs: 4Ps overallScore, narrative, dimensions array
  //   - tenVs: 10-Vs overallScore, narrative, dimensions array  
  //   - sdoh: SDOH overallScore, narrative
  //   - crisis: Crisis severityScore
  // Currently reads from summary state (loaded from localStorage in demo mode).
  // In production, this data should come from Supabase table (rn_case_summaries) filtered by activeCase.id.
  const fourPs = summary?.fourPs;
  const tenVs = summary?.tenVs;
  const sdoh = summary?.sdoh;
  const crisis = summary?.crisis;

  const fourPsOverall = fourPs?.overallScore;
  const tenVsOverall = tenVs?.overallScore;
  const sdohOverall = sdoh?.overallScore;
  const crisisSeverity = crisis?.severityScore;

  const hasFourPs = !!fourPs;
  const hasTenVs = !!tenVs;
  const hasSdoh = !!sdoh;
  const hasCrisis = !!crisis;

  const clinicalWorst = worstScore([fourPsOverall, tenVsOverall, crisisSeverity]);

  const combinedClinicalLabel = (() => {
    if (!demoMode) return "Live mode: awaiting onboarding";
    if (!clinicalWorst) return "Awaiting RN 4Ps / 10-Vs / Crisis scoring";
    const label = getSeverityLabel(clinicalWorst);
    if (!label) return `Clinical concern score: ${clinicalWorst}/5`;
    return `${label} (worst clinical score ${clinicalWorst}/5)`;
  })();

  const engagementLabel = (() => {
    if (!demoMode) return "Live mode: awaiting onboarding";
    if (!sdohOverall) return "Pending RN SDOH scoring (1–5).";
    if (sdohOverall === 1)
      return "SDOH: 1/5 – Critical barriers that can severely disrupt care and case performance.";
    if (sdohOverall === 2)
      return "SDOH: 2/5 – High concern; major barriers likely impact adherence and stability.";
    if (sdohOverall === 3)
      return "SDOH: 3/5 – Moderate barriers; both risks and supports present.";
    if (sdohOverall === 4)
      return "SDOH: 4/5 – Mild issues; generally stable environment.";
    return "SDOH: 5/5 – Strongly supportive environment for care and follow-through.";
  })();

  const updatedAtDisplay = summary?.updatedAt
    ? new Date(summary.updatedAt).toLocaleString()
    : null;

  const buildClinicalNarrative = () => {
    const lines: string[] = [];

    if (!demoMode) {
      lines.push("Live mode is not active yet. Cases will appear here once onboarding begins.");
      return lines;
    }

    if (!fourPs && !tenVs && !sdoh && !crisis) {
      lines.push(
        "No released RN notes or reports available at this time."
      );
      return lines;
    }

    if (fourPsOverall) {
      lines.push(
        `Across the 4Ps of Wellness, the RN has scored overall wellness at ${fourPsOverall}/5.`
      );
    } else {
      lines.push(
        "4Ps of Wellness has not yet been fully scored; clinical domain risks are still pending."
      );
    }

    if (tenVsOverall) {
      lines.push(
        `Using the 10-Vs of Care Management, the RN has scored the overall 10-Vs level at ${tenVsOverall}/5, reflecting how the care plan is being maintained and where it needs reinforcement.`
      );
    } else {
      lines.push(
        "The 10-Vs of Care Management has not yet been scored; clinical care planning signals are still being summarized."
      );
    }

    if (sdohOverall) {
      lines.push(
        `Social Drivers of Health (SDOH) are scored at ${sdohOverall}/5 in terms of how supportive or disruptive the environment is for care and adherence.`
      );
    } else {
      lines.push(
        "The SDOH tool has not yet been saved; social and environmental risk is still being documented."
      );
    }

    if (crisisSeverity) {
      lines.push(
        `Crisis Mode severity has reached ${crisisSeverity}/5 at least once, reflecting the highest level of acute concern seen in this case.`
      );
    } else {
      lines.push(
        "No released Crisis Mode documentation available at this time."
      );
    }

    return lines;
  };

  const renderTenVsMiniList = () => {
    if (!demoMode) return null;
    if (!tenVs || !tenVs.dimensions || tenVs.dimensions.length === 0) return null;
    return (
      <ul
        style={{
          fontSize: "0.82rem",
          color: "#64748b",
          paddingLeft: "1.1rem",
          marginTop: "0.35rem",
        }}
      >
        {tenVs.dimensions.map((dim) => {
          const def = TEN_VS.find((v) => v.id === dim.id);
          const label = def ? def.label : dim.id;
          return (
            <li key={dim.id}>
              <strong style={{ color: "#0f172a" }}>{label}:</strong> {dim.score}/5
            </li>
          );
        })}
      </ul>
    );
  };

  const renderFourPsMiniList = () => {
    if (!demoMode) return null;
    if (!fourPs || !fourPs.dimensions || fourPs.dimensions.length === 0) return null;
    return (
      <ul
        style={{
          fontSize: "0.82rem",
          color: "#64748b",
          paddingLeft: "1.1rem",
          marginTop: "0.35rem",
        }}
      >
        {fourPs.dimensions.map((dim) => {
          const def = FOUR_PS.find((p) => p.id === dim.id);
          const label = def ? def.label : dim.id;
          return (
            <li key={dim.id}>
              <strong style={{ color: "#0f172a" }}>{label}:</strong> {dim.score}/5
            </li>
          );
        })}
      </ul>
    );
  };

  const renderWhatWeDoCard = () => {
    const summaryLines = [
      "RCMS provides proactive RN Care Management (real-time treatment guidance + documentation logic) so the medical record stays defensible while care is happening.",
      "When treatment is denied, we challenge it immediately using payer-recognized evidence logic (ODG/MCG-style rationale) — protecting credibility and preserving leverage.",
    ];

    const whyItMattersBullets = [
      "Strengthens medical necessity with payer-recognized criteria (ODG/MCG-style rationale).",
      "Prevents the “unappealed denial = not necessary” inference.",
      "Documents external barriers to care (not perceived noncompliance), protecting credibility and pain/suffering integrity.",
    ];

    return (
      <div
        style={{
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "1rem",
          marginBottom: "0.85rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.2rem" }}>
              RN Care Management vs. Retrospective LNC Review
            </div>
            <div style={{ fontSize: "0.9rem", color: "#0f172a", lineHeight: 1.45 }}>
              {summaryLines.map((line, idx) => (
                <p key={idx} style={{ margin: idx === 0 ? "0 0 0.35rem 0" : "0" }}>
                  {line}
                </p>
              ))}
            </div>

            <div style={{ marginTop: "0.65rem" }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                Why it matters
              </div>
              <ul
                style={{
                  fontSize: "0.9rem",
                  color: "#334155",
                  paddingLeft: "1.2rem",
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {whyItMattersBullets.map((b, i) => (
                  <li key={i} style={{ marginBottom: "0.15rem" }}>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ minWidth: "180px", textAlign: "right" }}>
            <button
              type="button"
              onClick={() => setShowFullExplanation((v) => !v)}
              style={{
                padding: "0.45rem 0.75rem",
                borderRadius: "999px",
                border: "1px solid #0f2a6a",
                background: showFullExplanation ? "#0f2a6a" : "#ffffff",
                color: showFullExplanation ? "#ffffff" : "#0f2a6a",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {showFullExplanation ? "Hide full explanation" : "Read full explanation"}
            </button>
          </div>
        </div>

        {showFullExplanation && (
          <div
            style={{
              marginTop: "0.9rem",
              paddingTop: "0.9rem",
              borderTop: "1px solid #e2e8f0",
              fontSize: "0.92rem",
              color: "#0f172a",
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 800, marginBottom: "0.25rem" }}>
              Attorney Portal • Read-Only
            </div>
            <div style={{ color: "#334155" }}>
              RN Care Managers work <b>prospectively and in real time</b>. RCMS strengthens the
              clinical record while care is ongoing by documenting 4Ps, 10-Vs, SDOH barriers, and
              crisis escalations as they occur (assessment-based; no diagnosis).
            </div>

            <div style={{ fontWeight: 800, marginTop: "0.85rem", marginBottom: "0.25rem" }}>
              Bottom Line
            </div>
            <div style={{ color: "#334155" }}>
              RCMS does not replace legal counsel or medical providers — we <b>enhance both</b> by
              strengthening the clinical record in real time, supporting appropriate care, and
              protecting case credibility under payer and defense scrutiny.
            </div>
          </div>
        )}
      </div>
    );
  };

  const filteredSortedClients = useMemo(() => {
    if (!demoMode) return [];

    const q = search.trim().toLowerCase();
    let list = [...DEMO_CLIENTS];

    if (statusFilter !== "All") list = list.filter((c) => c.status === statusFilter);

    if (q) {
      list = list.filter((c) => {
        const hay = `${c.displayName} ${c.caseId} ${c.injury} ${c.jurisdiction}`.toLowerCase();
        return hay.includes(q);
      });
    }

    if (sortMode === "Recent") {
      list.sort((a, b) => new Date(b.lastUpdateISO).getTime() - new Date(a.lastUpdateISO).getTime());
      return list;
    }

    const statusWeight: Record<ClientStatus, number> = {
      "Needs Review": 0,
      "At-Risk": 1,
      "Active": 2,
    };

    list.sort((a, b) => {
      const aw = getClientWorstClinical(a.summary) ?? 99;
      const bw = getClientWorstClinical(b.summary) ?? 99;
      if (aw !== bw) return aw - bw;

      const ad = daysSince(a.lastUpdateISO);
      const bd = daysSince(b.lastUpdateISO);
      if (ad !== bd) return bd - ad;

      return statusWeight[a.status] - statusWeight[b.status];
    });

    return list;
  }, [search, statusFilter, sortMode, demoMode]);

  const statusChipStyle = (status: ClientStatus) => {
    const base = {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.35rem",
      padding: "0.18rem 0.5rem",
      borderRadius: "999px",
      fontSize: "0.72rem",
      fontWeight: 800 as const,
      border: "1px solid #e2e8f0",
      whiteSpace: "nowrap" as const,
    };

    if (status === "Active") return { ...base, background: "#ecfeff", color: "#155e75" };
    if (status === "At-Risk") return { ...base, background: "#fff7ed", color: "#9a3412" };
    return { ...base, background: "#fef2f2", color: "#991b1b" };
  };

  const navItemStyle = (active: boolean) => ({
    width: "100%",
    textAlign: "left" as const,
    padding: "0.6rem 0.75rem",
    borderRadius: "12px",
    border: active ? "1px solid #0f2a6a" : "1px solid transparent",
    background: active ? "#e0f2fe" : "transparent",
    color: "#0f172a",
    fontSize: "0.9rem",
    fontWeight: active ? 900 : 800,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
  });

  const demoPillStyle = (on: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: on ? "rgba(34,197,94,0.22)" : "rgba(148,163,184,0.22)",
    fontSize: "0.78rem",
    fontWeight: 900 as const,
    whiteSpace: "nowrap" as const,
  });

  const envPillStyle = () => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: "rgba(255,255,255,0.08)",
    fontSize: "0.78rem",
    fontWeight: 900 as const,
    whiteSpace: "nowrap" as const,
  });

  // Use resolved case's client for reports, not selected client (to ensure we never show unreleased data)
  const reports = useMemo(() => {
    const clientForReports = resolvedDemoClient ?? selectedClient;
    return buildDemoReports(clientForReports, summary);
  }, [resolvedDemoClient, selectedClient, summary]);

  const openReport = useMemo(() => {
    if (!openReportId) return null;
    return reports.find((r) => r.id === openReportId) ?? null;
  }, [openReportId, reports]);

  const renderReportStatusPill = (status: ReportStatus) => {
    const on = status === "Ready";
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.18rem 0.55rem",
          borderRadius: "999px",
          border: `1px solid ${on ? "#22c55e" : "#cbd5e1"}`,
          background: on ? "#dcfce7" : "#f8fafc",
          color: on ? "#166534" : "#475569",
          fontSize: "0.75rem",
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: on ? "#22c55e" : "#cbd5e1" }} />
        {status}
      </span>
    );
  };

  const renderSeverityPill = (score: SeverityScore | null, label: string | null) => {
    if (!score) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "0.18rem 0.55rem",
            borderRadius: "999px",
            border: "1px solid #cbd5e1",
            background: "#f8fafc",
            color: "#64748b",
            fontSize: "0.75rem",
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          Severity: —
        </span>
      );
    }
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0.18rem 0.55rem",
          borderRadius: "999px",
          border: "1px solid #cbd5e1",
          background: "#ffffff",
          color: "#0f172a",
          fontSize: "0.75rem",
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
        title={label ?? undefined}
      >
        Severity: {score}/5{label ? ` • ${label}` : ""}
      </span>
    );
  };

  const renderModal = () => {
    if (!openReport) return null;

    return (
      <div
        role="dialog"
        aria-modal="true"
        onClick={() => setOpenReportId(null)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.55)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "520px",
            maxWidth: "95vw",
            height: "100%",
            background: "#ffffff",
            borderLeft: "1px solid #e2e8f0",
            padding: "1rem",
            overflowY: "auto",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: 900, marginBottom: "0.15rem" }}>
                {openReport.title}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#64748b" }}>{openReport.subtitle}</div>
            </div>
            <button
              type="button"
              onClick={() => setOpenReportId(null)}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                background: "#ffffff",
                cursor: "pointer",
                fontWeight: 900,
              }}
            >
              Close
            </button>
          </div>

          <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {renderReportStatusPill(openReport.status)}
            {renderSeverityPill(openReport.severityScore, openReport.severityLabel)}
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.18rem 0.55rem",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#475569",
                fontSize: "0.75rem",
                fontWeight: 900,
              }}
            >
              Updated: {fmtDateTime(openReport.updatedAtISO)}
            </span>
          </div>

          <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 900, marginBottom: "0.35rem" }}>
              Report Content (Demo)
            </div>
            <ul style={{ paddingLeft: "1.1rem", margin: 0, color: "#334155", lineHeight: 1.55 }}>
              {openReport.body.map((line, idx) => (
                <li key={idx} style={{ marginBottom: "0.35rem" }}>
                  {line}
                </li>
              ))}
            </ul>

            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                color: "#475569",
                fontSize: "0.85rem",
                lineHeight: 1.45,
              }}
            >
              Demo note: This is a structured placeholder. In live mode, reports are unavailable until onboarding.
            </div>
          </div>
        </div>
      </div>
    );
  };

  // NEW: RN comms modal render
  const renderRnComposeModal = () => {
    if (!rnComposeOpen) return null;

    const title = rnComposeMode === "message" ? "Message RN (Demo)" : "Request RN Call (Demo)";
    const subtitle =
      rnComposeMode === "message"
        ? "Send a message to the RN assigned to this client (demo placeholder)."
        : "Request a callback from the RN (demo placeholder).";

    return (
      <div
        role="dialog"
        aria-modal="true"
        onClick={() => setRnComposeOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.55)",
          zIndex: 1200,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1rem",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "640px",
            maxWidth: "95vw",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.25)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "1rem 1rem 0.75rem 1rem", borderBottom: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "1.05rem", fontWeight: 900, marginBottom: "0.15rem", color: "#0f172a" }}>
                  {title}
                </div>
                <div style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.4 }}>{subtitle}</div>
                <div style={{ marginTop: "0.45rem", fontSize: "0.82rem", color: "#475569" }}>
                  Client: <strong>{selectedClient.displayName}</strong> • <strong>{selectedClient.caseId}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setRnComposeOpen(false)}
                style={{
                  padding: "0.4rem 0.7rem",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 900,
                  color: "#0f172a",
                }}
              >
                Close
              </button>
            </div>
          </div>

          <div style={{ padding: "1rem" }}>
            {rnComposeMode === "message" ? (
              <>
                <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.35rem" }}>
                  Message
                </div>
                <textarea
                  value={rnMsg}
                  onChange={(e) => setRnMsg(e.target.value)}
                  placeholder="Type your message to the RN..."
                  style={{
                    width: "100%",
                    minHeight: "140px",
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    padding: "0.75rem",
                    fontSize: "0.9rem",
                    lineHeight: 1.45,
                    resize: "vertical",
                  }}
                />
                <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                  Demo note: This will be wired to messaging in live mode.
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.35rem" }}>
                      Best time(s) to call
                    </div>
                    <input
                      value={rnCallBestTimes}
                      onChange={(e) => setRnCallBestTimes(e.target.value)}
                      placeholder="e.g., Today 2–4pm CST or Tomorrow AM"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        padding: "0.6rem 0.7rem",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.35rem" }}>
                      Phone number (optional)
                    </div>
                    <input
                      value={""}
                      onChange={() => {}}
                      placeholder="(demo) pulled from firm profile later"
                      disabled
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        padding: "0.6rem 0.7rem",
                        fontSize: "0.9rem",
                        background: "#f8fafc",
                        color: "#94a3b8",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 900, color: "#0f172a", marginBottom: "0.35rem" }}>
                    Call request notes
                  </div>
                  <textarea
                    value={rnCallNotes}
                    onChange={(e) => setRnCallNotes(e.target.value)}
                    placeholder="What do you need from the RN on this call?"
                    style={{
                      width: "100%",
                      minHeight: "120px",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      padding: "0.75rem",
                      fontSize: "0.9rem",
                      lineHeight: 1.45,
                      resize: "vertical",
                    }}
                  />
                </div>

                <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                  Demo note: This will create a call task/notification in live mode.
                </div>
              </>
            )}

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setRnComposeOpen(false)}
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "999px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#0f172a",
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  if (rnComposeMode === "message") {
                    const trimmed = rnMsg.trim();
                    if (!trimmed) {
                      showToast("Please type a message.");
                      return;
                    }
                    setRnMsg("");
                    setRnComposeOpen(false);
                    showToast("Message sent to RN (demo).");
                    return;
                  }

                  const notes = rnCallNotes.trim();
                  const times = rnCallBestTimes.trim();
                  if (!notes && !times) {
                    showToast("Add call notes or best time(s).");
                    return;
                  }
                  setRnCallNotes("");
                  setRnCallBestTimes("");
                  setRnComposeOpen(false);
                  showToast("Call request sent to RN (demo).");
                }}
                style={{
                  padding: "0.5rem 0.95rem",
                  borderRadius: "999px",
                  border: "1px solid #0f2a6a",
                  background: "#0f2a6a",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  fontWeight: 900,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {rnComposeMode === "message" ? "Send message" : "Send call request"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConsoleBody = () => {
    const renderLeftClientsPanel = () => {
      return (
        <div
          style={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "0.85rem",
            height: "fit-content",
          }}
        >
          <div style={{ fontSize: "0.9rem", fontWeight: 900, marginBottom: "0.35rem" }}>
            Clients
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.6rem" }}>
            Attorney view is read-only and does not display PHI.
          </div>

          {!demoMode ? (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: "12px",
                padding: "0.9rem",
                color: "#475569",
                background: "#f8fafc",
                fontSize: "0.9rem",
                lineHeight: 1.45,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: "0.25rem" }}>No cases yet</div>
              <div>Live mode is awaiting onboarding. Once cases are created, they will appear here.</div>
            </div>
          ) : (
            <>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search: name, case, injury, state..."
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "0.55rem 0.65rem",
                  fontSize: "0.85rem",
                  marginBottom: "0.55rem",
                }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.6rem" }}>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "0.55rem 0.65rem",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                  }}
                >
                  <option value="All">All statuses</option>
                  <option value="Needs Review">Needs Review</option>
                  <option value="At-Risk">At-Risk</option>
                  <option value="Active">Active</option>
                </select>

                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as any)}
                  style={{
                    width: "100%",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "0.55rem 0.65rem",
                    fontSize: "0.85rem",
                    background: "#ffffff",
                  }}
                >
                  <option value="NeedsAttention">Sort: Needs attention</option>
                  <option value="Recent">Sort: Most recent</option>
                </select>
              </div>

              <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "0.5rem" }}>
                Showing <strong>{filteredSortedClients.length}</strong> of{" "}
                <strong>{DEMO_CLIENTS.length}</strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {filteredSortedClients.map((c) => {
                  const active = c.id === selectedClientId;
                  const last = new Date(c.lastUpdateISO).toLocaleDateString();
                  const staleDays = daysSince(c.lastUpdateISO);
                  const worst = getClientWorstClinical(c.summary);
                  const worstLabel = worst ? getSeverityLabel(worst) : null;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedClientId(c.id)}
                      style={{
                        textAlign: "left",
                        padding: "0.7rem",
                        borderRadius: "12px",
                        border: active ? "1px solid #0f2a6a" : "1px solid #e2e8f0",
                        background: active ? "#0f2a6a" : "#ffffff",
                        color: active ? "#ffffff" : "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 900 }}>
                          {c.displayName} • {c.caseId}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span style={statusChipStyle(c.status)}>
                            <span
                              style={{
                                width: "7px",
                                height: "7px",
                                borderRadius: "999px",
                                background:
                                  c.status === "Active"
                                    ? "#06b6d4"
                                    : c.status === "At-Risk"
                                    ? "#f97316"
                                    : "#ef4444",
                              }}
                            />
                            {c.status}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: "0.82rem", opacity: active ? 0.95 : 1, marginTop: "0.2rem" }}>
                        {c.injury}
                      </div>

                      <div style={{ fontSize: "0.78rem", opacity: active ? 0.9 : 1, marginTop: "0.25rem" }}>
                        {c.jurisdiction} • Last update: {last}
                        {staleDays >= 7 ? ` • Stale: ${staleDays}d` : ""}
                      </div>

                      <div style={{ fontSize: "0.78rem", opacity: active ? 0.9 : 1, marginTop: "0.25rem" }}>
                        <strong>Worst clinical:</strong>{" "}
                        {worst ? `${worst}/5` : "—"}
                        {worstLabel ? ` • ${worstLabel}` : ""}
                      </div>
                    </button>
                  );
                })}

                {filteredSortedClients.length === 0 && (
                  <div
                    style={{
                      border: "1px dashed #cbd5e1",
                      borderRadius: "12px",
                      padding: "0.85rem",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    No matches. Clear filters or search.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    };

    const renderReportPreviewGrid = () => {
      // If no resolved case (no released/closed version), show approved empty state
      if (!resolvedCase) {
        return (
          <div
            style={{
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
              background: "#f8fafc",
              padding: "1rem",
              color: "#475569",
              fontSize: "0.92rem",
              lineHeight: 1.45,
              textAlign: "center",
            }}
          >
            No released RN notes or reports available at this time.
          </div>
        );
      }

      if (!demoMode) {
        return (
          <div
            style={{
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
              background: "#f8fafc",
              padding: "1rem",
              color: "#475569",
              fontSize: "0.92rem",
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: "0.25rem" }}>Unavailable</div>
            <div>Live mode is awaiting onboarding. Report previews will appear once cases exist.</div>
          </div>
        );
      }

      return (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 900, marginBottom: "0.2rem" }}>
                Report Preview (Demo)
              </div>
              <div style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.45 }}>
                These are structured placeholders. Click <b>View</b> to open the slide-over preview.
              </div>
            </div>
            <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
              Selected: <strong>{selectedClient.caseId}</strong>
            </div>
          </div>

          <div style={{ marginTop: "0.85rem", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.85rem" }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "176px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 900, marginBottom: "0.2rem" }}>
                      {r.title}
                    </div>
                    {renderReportStatusPill(r.status)}
                  </div>

                  <div style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.45 }}>
                    {r.subtitle}
                  </div>

                  <div style={{ marginTop: "0.65rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {renderSeverityPill(r.severityScore, r.severityLabel)}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.18rem 0.55rem",
                        borderRadius: "999px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#475569",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                      }}
                    >
                      Updated: {fmtDateTime(r.updatedAtISO)}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "0.9rem", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setOpenReportId(r.id)}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "999px",
                      border: "1px solid #0f2a6a",
                      background: "#0f2a6a",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderTab = () => {
      switch (activeTab) {
        case "overview":
          return (
            <div>
              {renderWhatWeDoCard()}

              {/* NEW: RN communication buttons */}
              <div
                style={{
                  marginBottom: "0.75rem",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  padding: "0.85rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 900, marginBottom: "0.15rem" }}>
                      RN Communication
                    </div>
                    <div style={{ fontSize: "0.88rem", color: "#64748b" }}>
                      Contact the RN assigned to this client (demo placeholder).
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => {
                        setRnComposeMode("message");
                        setRnComposeOpen(true);
                      }}
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: "999px",
                        border: "1px solid #0f2a6a",
                        background: "#0f2a6a",
                        color: "#ffffff",
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Message RN
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRnComposeMode("call");
                        setRnComposeOpen(true);
                      }}
                      style={{
                        padding: "0.45rem 0.85rem",
                        borderRadius: "999px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        color: "#0f172a",
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Request call from RN
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  marginBottom: "0.75rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.85rem" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b", marginBottom: "0.25rem" }}>
                    Clinical Snapshot (Ps, Vs, Crisis)
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.15rem" }}>
                    {combinedClinicalLabel}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {demoMode ? (
                      <>
                        {fourPsOverall && <div>4Ps overall: {fourPsOverall}/5</div>}
                        {tenVsOverall && <div>10-Vs overall: {tenVsOverall}/5</div>}
                        {crisisSeverity && <div>Crisis severity (max): {crisisSeverity}/5</div>}
                        {!fourPsOverall && !tenVsOverall && !crisisSeverity && (
                          <div>RN has not yet saved 4Ps, 10-Vs, or Crisis Mode scoring for this case.</div>
                        )}
                      </>
                    ) : (
                      <div>Unavailable until onboarding begins.</div>
                    )}
                  </div>
                  {renderFourPsMiniList()}
                </div>

                <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.85rem" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b", marginBottom: "0.25rem" }}>
                    10-Vs of Care Management™
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.1rem" }}>
                    {demoMode
                      ? tenVsOverall
                        ? `10-Vs overall: ${tenVsOverall}/5`
                        : "Awaiting 10-Vs scoring"
                      : "Live mode: awaiting onboarding"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {demoMode ? (
                      tenVsOverall ? (
                        <span>RN has scored each of the 10 Vs on a 1–5 scale to reflect care plan maintenance and reinforcement needs.</span>
                      ) : (
                        <span>No released 10-Vs summary available at this time.</span>
                      )
                    ) : (
                      <span>Unavailable until onboarding begins.</span>
                    )}
                  </div>
                  {renderTenVsMiniList()}
                </div>

                <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.85rem" }}>
                  <div style={{ fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b", marginBottom: "0.25rem" }}>
                    Social Drivers of Health (SDOH)
                  </div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.1rem" }}>
                    {demoMode ? (sdohOverall ? `SDOH overall: ${sdohOverall}/5` : "SDOH Pending") : "Live mode: awaiting onboarding"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{engagementLabel}</div>
                </div>
              </div>

              <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.95rem" }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                  RN Care Overview (Attorney-Facing)
                </div>
                <p style={{ fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.35rem" }}>
                  {demoMode
                    ? "This panel will ultimately be auto-generated using the RN's 4Ps, 10-Vs, SDOH, and Crisis scoring. For this view, use the cards above as a quick snapshot of clinical strength, vulnerability, and context."
                    : "Live mode is awaiting onboarding. Once cases are created, this panel will populate automatically."}
                </p>
                <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  {demoMode ? "Note: Some workflows are summarized in this view." : "Read-only portal."}
                </p>
              </div>
            </div>
          );

        case "clinicalStory": {
          const narrativeLines = buildClinicalNarrative();
          const tenVsNarrative = tenVs?.narrative;
          const fourPsNarrative = fourPs?.narrative;

          return (
            <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.95rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                Clinically Informed Care Narrative – Snapshot
              </div>
              <p style={{ fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.3rem" }}>
                This translates RN tools (4Ps, 10-Vs, SDOH, Crisis Mode) into a concise attorney-facing summary.
              </p>
              <ul style={{ fontSize: "0.88rem", color: "#64748b", paddingLeft: "1.1rem", marginBottom: "0.4rem" }}>
                {narrativeLines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>

              {/* TODO: Published RN narratives - These sections display RN assessment narratives from published CaseSummary.
                  This is where RN → Attorney narrative output appears:
                    - fourPsNarrative: From RN 4Ps screen, published via RNPublishPanel
                    - tenVsNarrative: From RN 10-Vs screen, published via RNPublishPanel
                    - sdoh.narrative: Shown in sdohRisk tab
                  Currently works in demo mode when summary contains these narratives.
                  In production, narratives should come from published RN summaries in Supabase database. */}
              {demoMode && fourPsNarrative && (
                <div style={{ marginTop: "0.55rem", paddingTop: "0.55rem", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                    RN 4Ps Narrative
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#0f172a", whiteSpace: "pre-wrap" }}>
                    {fourPsNarrative}
                  </p>
                </div>
              )}

              {demoMode && tenVsNarrative && (
                <div style={{ marginTop: "0.55rem", paddingTop: "0.55rem", borderTop: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                    RN 10-Vs Narrative
                  </div>
                  <p style={{ fontSize: "0.88rem", color: "#0f172a", whiteSpace: "pre-wrap" }}>
                    {tenVsNarrative}
                  </p>
                </div>
              )}
            </div>
          );
        }

        case "sdohRisk":
          return (
            <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.95rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                SDOH & Risk Signals
              </div>
              <p style={{ fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.35rem" }}>
                Summarizes how social drivers, safety issues, and adherence risks may help or hurt the case, using the same 1–5 severity scale.
              </p>

              {!demoMode ? (
                <div style={{ color: "#475569", fontSize: "0.9rem" }}>
                  Live mode is awaiting onboarding.
                </div>
              ) : (
                <>
                  <ul style={{ fontSize: "0.88rem", color: "#64748b", paddingLeft: "1.1rem", marginBottom: "0.35rem" }}>
                    <li>
                      SDOH overall: <strong>{sdohOverall ? `${sdohOverall}/5` : "Not yet scored"}</strong>
                    </li>
                    <li>
                      4Ps overall: <strong>{fourPsOverall ? `${fourPsOverall}/5` : "Not yet scored"}</strong>
                    </li>
                    <li>
                      10-Vs overall: <strong>{tenVsOverall ? `${tenVsOverall}/5` : "Not yet scored"}</strong>
                    </li>
                    <li>
                      Crisis severity (max): <strong>{crisisSeverity ? `${crisisSeverity}/5` : "Not yet scored"}</strong>
                    </li>
                  </ul>

                  {sdoh?.narrative ? (
                    <div style={{ marginTop: "0.55rem", paddingTop: "0.55rem", borderTop: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 800, marginBottom: "0.25rem" }}>
                        RN SDOH Narrative
                      </div>
                      <p style={{ fontSize: "0.88rem", color: "#0f172a", whiteSpace: "pre-wrap" }}>
                        {sdoh.narrative}
                      </p>
                    </div>
                  ) : (
                    <p style={{ fontSize: "0.88rem", color: "#64748b", marginTop: "0.35rem" }}>
                      No released SDOH documentation available at this time.
                    </p>
                  )}
                </>
              )}
            </div>
          );

        case "timeline":
          // TODO: Missing RN output - Timeline tab is currently empty/placeholder.
          // Expected to show: key events from RN timeline (visits, imaging, crises, major changes, RN contacts).
          // This should be populated from RN TimelineScreen data, either:
          //   1. A filtered/summarized version of RN timeline events
          //   2. Or a separate attorney-facing timeline table in Supabase
          // Currently no data source is wired - this is a future feature placeholder.
          return (
            <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.95rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                High-Level Timeline (Attorney View)
              </div>
              <p style={{ fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.35rem" }}>
                In later phases, this will show a filtered version of the RN timeline focused on key events: visits, imaging, crises, major changes, and RN contacts.
              </p>
              <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "0.3rem" }}>
                {demoMode
                  ? "For now, use the RN Timeline & Notes module as the source of truth for detailed event history."
                  : "Live mode is awaiting onboarding."}
              </p>
            </div>
          );

        case "documents":
          return (
            <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.95rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                Reports & Docs
              </div>
              <p style={{ fontSize: "0.9rem", color: "#0f172a", marginBottom: "0.5rem" }}>
                Attorney hub for RN deliverables: structured reports, summaries, and attachments.
              </p>
              {resolvedCase && (resolvedCase.released_at || resolvedCase.updated_at) && (
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "0.65rem" }}>
                  Released to Attorney on{" "}
                  <strong>
                    {new Date(resolvedCase.released_at || resolvedCase.updated_at || "").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                </div>
              )}

              {renderReportPreviewGrid()}

              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: "0.88rem", fontWeight: 900, marginBottom: "0.25rem" }}>
                  Included deliverables (examples)
                </div>
                <ul style={{ fontSize: "0.88rem", color: "#64748b", paddingLeft: "1.1rem", margin: 0 }}>
                  <li>RN care summary reports (generated from the Engine).</li>
                  <li>Pain diary / functional snapshots, if shared.</li>
                  <li>Crisis documentation summaries when material to the matter.</li>
                  <li>Future: links to firm DMS / evidence folders.</li>
                </ul>
              </div>
            </div>
          );

        case "exportAudit":
          return (
            <div style={{ borderRadius: "10px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.95rem" }}>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "0.35rem" }}>
                Export Audit Trail
              </div>
              <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "0.75rem" }}>
                Read-only record of your exports of released RN case snapshots. Shows only exports for released or closed cases.
              </p>
              <ExportAuditTrail />
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div>
        <div style={{ marginBottom: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.15rem" }}>
              Attorney Console
            </h1>
            <p style={{ fontSize: "0.92rem", color: "#64748b" }}>
              Read-only, clinically informed view of the matter to support strategy, negotiations, and decision-making.
            </p>
            {resolvedCase && (resolvedCase.released_at || resolvedCase.updated_at) && (
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "0.25rem" }}>
                Released to Attorney on{" "}
                <strong>
                  {new Date(resolvedCase.released_at || resolvedCase.updated_at || "").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
              </div>
            )}
            {resolvedCase && (
              <div style={{ marginTop: "0.5rem" }}>
                <AttorneyPrintReportButton
                  resolvedCase={resolvedCase}
                  summary={summary}
                  clientLabel={selectedClient?.displayName}
                />
              </div>
            )}
          </div>

          <div style={{ textAlign: "right", fontSize: "0.85rem", color: "#64748b" }}>
            {demoMode ? (
              updatedAtDisplay ? (
                <div style={{ marginBottom: "0.2rem" }}>
                  Last RN update: <strong>{updatedAtDisplay}</strong>
                </div>
              ) : (
                <div style={{ marginBottom: "0.2rem" }}>No RN summary saved yet.</div>
              )
            ) : (
              <div style={{ marginBottom: "0.2rem" }}>Live mode: awaiting onboarding.</div>
            )}

            <button
              type="button"
              onClick={handleRefresh}
              disabled={!demoMode}
              style={{
                padding: "0.35rem 0.85rem",
                borderRadius: "999px",
                border: "1px solid #cbd5e1",
                background: demoMode ? "#ffffff" : "#f1f5f9",
                fontSize: "0.85rem",
                cursor: demoMode ? "pointer" : "not-allowed",
                color: demoMode ? "#0f172a" : "#94a3b8",
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "0.85rem", alignItems: "start" }}>
          {renderLeftClientsPanel()}

          <div>
            <div style={{ marginBottom: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.4rem", fontSize: "0.8rem" }}>
              {[
                { label: "4Ps (Not available)", done: hasFourPs },
                { label: "10-Vs (Not available)", done: hasTenVs },
                { label: "SDOH (Not available)", done: hasSdoh },
                { label: "Crisis Mode (Not available)", done: hasCrisis },
              ].map((item) => (
                <span
                  key={item.label}
                  style={{
                    padding: "0.22rem 0.65rem",
                    borderRadius: "999px",
                    border: "1px solid #cbd5e1",
                    background: item.done ? "#e0f2fe" : "#f8fafc",
                    color: item.done ? "#0369a1" : "#64748b",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    opacity: demoMode ? 1 : 0.55,
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: item.done ? "#22c55e" : "#cbd5e1" }} />
                  {item.label}
                  {item.done ? "✓" : ""}
                </span>
              ))}
            </div>

            <div style={{ marginBottom: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {(
                [
                  { key: "overview", label: "Overview" },
                  { key: "clinicalStory", label: "Clinical Story" },
                  { key: "sdohRisk", label: "SDOH & Risk" },
                  { key: "timeline", label: "Timeline" },
                  { key: "documents", label: "Reports & Docs" },
                  { key: "exportAudit", label: "Export Audit Trail" },
                ] as { key: AttorneyTab; label: string }[]
              ).map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: "0.45rem 0.95rem",
                      borderRadius: "999px",
                      border: active ? "1px solid #0f2a6a" : "1px solid #cbd5e1",
                      background: active ? "#0f2a6a" : "#ffffff",
                      color: active ? "#ffffff" : "#0f172a",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div style={{ background: "#ffffff", borderRadius: "10px", padding: "1rem", border: "1px solid #e2e8f0", minHeight: "320px" }}>
              {!displayCase ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "280px",
                    color: "#64748b",
                    fontSize: "0.92rem",
                    textAlign: "center",
                    padding: "2rem",
                  }}
                >
                  No released RN notes or reports available at this time.
                </div>
              ) : (
                renderTab()
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderReports = () => {
    return (
      <div>
        <h1 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.35rem" }}>
          Reports
        </h1>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "0.85rem",
          }}
        >
          <p style={{ fontSize: "0.92rem", color: "#64748b", margin: 0 }}>
            {demoMode
              ? "Demo reports are structured placeholders (read-only). No PHI is stored or displayed."
              : "Reports are unavailable in live mode until onboarding begins."}
          </p>

          {demoMode && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0f172a" }}>
                Selected client
              </div>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                style={{
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "0.5rem 0.65rem",
                  fontSize: "0.9rem",
                  background: "#ffffff",
                  minWidth: "280px",
                }}
              >
                {DEMO_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.displayName} • {c.caseId} • {c.jurisdiction}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!demoMode ? (
          <div
            style={{
              borderRadius: "12px",
              border: "1px dashed #cbd5e1",
              background: "#f8fafc",
              padding: "1rem",
              color: "#475569",
              fontSize: "0.92rem",
              lineHeight: 1.45,
              maxWidth: "720px",
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: "0.25rem" }}>Unavailable</div>
            <div>Live mode is awaiting onboarding. Reports will populate once cases exist.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.85rem" }}>
            {reports.map((r) => (
              <div
                key={r.id}
                style={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "180px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "0.95rem", fontWeight: 900, marginBottom: "0.2rem" }}>
                      {r.title}
                    </div>
                    {renderReportStatusPill(r.status)}
                  </div>

                  <div style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.45 }}>
                    {r.subtitle}
                  </div>

                  <div style={{ marginTop: "0.65rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {renderSeverityPill(r.severityScore, r.severityLabel)}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.18rem 0.55rem",
                        borderRadius: "999px",
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                        color: "#475569",
                        fontSize: "0.75rem",
                        fontWeight: 900,
                      }}
                    >
                      Updated: {fmtDateTime(r.updatedAtISO)}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "0.9rem", display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center" }}>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Selected: <strong>{selectedClient.caseId}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenReportId(r.id)}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "999px",
                      border: "1px solid #0f2a6a",
                      background: "#0f2a6a",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 900,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => {
    const cardBase: React.CSSProperties = {
      borderRadius: "12px",
      border: "1px solid #e2e8f0",
      background: "#ffffff",
      padding: "1rem",
      maxWidth: "820px",
    };

    const pill = (label: string) => (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0.18rem 0.55rem",
          borderRadius: "999px",
          border: "1px solid #cbd5e1",
          background: "#f8fafc",
          color: "#475569",
          fontSize: "0.75rem",
          fontWeight: 900,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    );

    return (
      <div>
        <h1 style={{ fontSize: "1.15rem", fontWeight: 900, marginBottom: "0.35rem" }}>
          Settings
        </h1>
        <p style={{ fontSize: "0.92rem", color: "#64748b", marginBottom: "0.85rem" }}>
          Demo-only settings. No PHI is stored in this portal.
        </p>

        <div style={cardBase}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 900, marginBottom: "0.2rem" }}>
                Demo Mode
              </div>
              <div style={{ fontSize: "0.88rem", color: "#64748b" }}>
                Internal toggle for demo vs live data wiring later (persists locally).
              </div>
            </div>
            <button
              type="button"
              onClick={toggleDemoMode}
              style={{
                padding: "0.45rem 0.85rem",
                borderRadius: "999px",
                border: demoMode ? "1px solid #22c55e" : "1px solid #94a3b8",
                background: demoMode ? "#22c55e" : "#94a3b8",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {demoMode ? "Demo Mode: ON" : "Demo Mode: OFF"}
            </button>
          </div>

          <div style={{ marginTop: "0.9rem", paddingTop: "0.9rem", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, marginBottom: "0.2rem" }}>
              Portal Security
            </div>
            <ul style={{ fontSize: "0.88rem", color: "#334155", paddingLeft: "1.1rem", margin: 0, lineHeight: 1.5 }}>
              <li>Attorney portal is read-only in this phase.</li>
              <li>No PHI is stored or displayed in demo mode.</li>
              <li>Data sources will switch to Supabase when onboarding starts.</li>
            </ul>
          </div>
        </div>

        <div style={{ ...cardBase, marginTop: "0.85rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 900, marginBottom: "0.15rem" }}>
                What attorneys can expect next
              </div>
              <div style={{ fontSize: "0.88rem", color: "#64748b", lineHeight: 1.45 }}>
                This platform is active development with a working demo today and live onboarding next.
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {pill("Read-only")}
              {pill("No PHI in demo")}
              {pill(demoMode ? "Demo Mode ON" : "Demo Mode OFF")}
            </div>
          </div>

          <div style={{ marginTop: "0.9rem", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.75rem" }}>
            <div style={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.85rem" }}>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b", fontWeight: 900, marginBottom: "0.35rem" }}>
                Now
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#334155", fontSize: "0.88rem", lineHeight: 1.5 }}>
                <li>Demo data (no PHI)</li>
                <li>Attorney portal read-only views</li>
                <li>RN scoring examples (4Ps, 10-Vs, SDOH, Crisis)</li>
              </ul>
            </div>

            <div style={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.85rem" }}>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b", fontWeight: 900, marginBottom: "0.35rem" }}>
                Next
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#334155", fontSize: "0.88rem", lineHeight: 1.5 }}>
                <li>Live case onboarding</li>
                <li>Real-time RN updates (assessment-based)</li>
                <li>Report delivery (care summaries + denial support)</li>
              </ul>
            </div>

            <div style={{ borderRadius: "12px", border: "1px solid #e2e8f0", background: "#ffffff", padding: "0.85rem" }}>
              <div style={{ fontSize: "0.78rem", textTransform: "uppercase", color: "#64748b", fontWeight: 900, marginBottom: "0.35rem" }}>
                Later
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.1rem", color: "#334155", fontSize: "0.88rem", lineHeight: 1.5 }}>
                <li>Firm integrations (DMS/evidence folders)</li>
                <li>Alerts + escalations</li>
                <li>Expanded reporting and analytics</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: "0.85rem", padding: "0.75rem", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "0.88rem", lineHeight: 1.5 }}>
            RCMS is designed to strengthen the medical record while care is happening. The attorney view stays focused on actionable, defensible care signals—not diagnosis.
          </div>
        </div>
      </div>
    );
  };

  const renderMain = () => {
    if (nav === "console") return renderConsoleBody();
    if (nav === "reports") return renderReports();
    return renderSettings();
  };

  const headerHeight = 64;
  const headerCenterText = displayCase
    ? `${selectedClient.displayName} • ${displayCase.id} • ${selectedClient.jurisdiction}`
    : demoMode
    ? `${selectedClient.displayName} • ${selectedClient.caseId} • ${selectedClient.jurisdiction}`
    : "Awaiting onboarding • No cases yet";

  const headerShadow = "0 6px 20px rgba(15, 23, 42, 0.18)";
  const headerDivider = "1px solid rgba(255,255,255,0.14)";

  const accountBtnStyle: React.CSSProperties = {
    padding: "0.35rem 0.7rem",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.25)",
    background: accountOpen ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: "0.82rem",
    fontWeight: 800,
    cursor: "pointer",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    right: 0,
    top: "calc(100% + 10px)",
    width: "220px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
    overflow: "hidden",
    zIndex: 2000,
  };

  const dropdownItemStyle: React.CSSProperties = {
    width: "100%",
    textAlign: "left",
    padding: "0.7rem 0.85rem",
    background: "#ffffff",
    border: "none",
    cursor: "pointer",
    fontSize: "0.9rem",
    fontWeight: 800,
    color: "#0f172a",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
  };

  const dropdownSubStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#64748b",
    marginTop: "0.12rem",
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "14px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 5000,
            background: "#0f172a",
            color: "#ffffff",
            borderRadius: "999px",
            padding: "0.55rem 0.85rem",
            fontSize: "0.85rem",
            fontWeight: 800,
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.35)",
            maxWidth: "90vw",
            textAlign: "center",
          }}
        >
          {toast}
        </div>
      )}

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: `${headerHeight}px`,
          background: "#0f2a6a",
          color: "#ffffff",
          borderBottom: headerDivider,
          boxShadow: headerShadow,
        }}
      >
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 1.25rem",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, letterSpacing: "0.2px" }}>
              Reconcile C.A.R.E.™
            </div>
            <div style={{ fontSize: "0.82rem", opacity: 0.92, fontWeight: 800 }}>
              Attorney Portal • Read-Only
            </div>
          </div>

          <div style={{ textAlign: "center", fontSize: "0.85rem", opacity: 0.95 }}>
            {headerCenterText}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={envPillStyle()}>ENV: {demoMode ? "DEMO" : "LIVE"}</span>

            <span style={demoPillStyle(demoMode)}>
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "999px",
                  background: demoMode ? "#22c55e" : "#94a3b8",
                }}
              />
              Demo Mode: {demoMode ? "ON" : "OFF"}
            </span>

            <button
              type="button"
              onClick={toggleDemoMode}
              style={{
                padding: "0.35rem 0.7rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 900,
                cursor: "pointer",
              }}
              title="Internal toggle for demo vs live data"
            >
              Toggle
            </button>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.08)",
                fontSize: "0.78rem",
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              🔒 Secure • Read-only
            </span>

            <div ref={accountWrapRef} style={{ position: "relative" }}>
              <button
                type="button"
                style={accountBtnStyle}
                onClick={() => setAccountOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                My Account ▾
              </button>

              {accountOpen && (
                <div style={dropdownStyle} role="menu" aria-label="Account menu">
                  <div
                    style={{
                      padding: "0.65rem 0.85rem",
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 900, color: "#0f172a" }}>
                      Attorney User
                    </div>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b" }}>
                      Demo account • Read-only
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    style={dropdownItemStyle}
                    onClick={() => {
                      setAccountOpen(false);
                      showToast("Profile (demo)");
                    }}
                  >
                    <span>
                      Profile
                      <span style={dropdownSubStyle}>View account details</span>
                    </span>
                    <span style={{ color: "#94a3b8" }}>›</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    style={{ ...dropdownItemStyle, borderTop: "1px solid #eef2f7" }}
                    onClick={() => {
                      setAccountOpen(false);
                      showToast("Support (demo)");
                    }}
                  >
                    <span>
                      Support
                      <span style={dropdownSubStyle}>Contact RCMS</span>
                    </span>
                    <span style={{ color: "#94a3b8" }}>›</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    style={{
                      ...dropdownItemStyle,
                      borderTop: "1px solid #eef2f7",
                      color: "#991b1b",
                      background: "#ffffff",
                    }}
                    onClick={() => {
                      setAccountOpen(false);
                      showToast("Signed out (demo)");
                    }}
                  >
                    <span>
                      Sign out
                      <span style={{ ...dropdownSubStyle, color: "#b91c1c" }}>Demo placeholder</span>
                    </span>
                    <span style={{ color: "#fca5a5" }}>›</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: "0.85rem",
          padding: "1.25rem",
          alignItems: "start",
        }}
      >
        <div
          style={{
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            padding: "0.9rem",
            height: "fit-content",
            position: "sticky",
            top: `${headerHeight + 16}px`,
          }}
        >
          <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 900, marginBottom: "0.55rem" }}>
            Navigation
          </div>

          <button type="button" onClick={() => setNav("console")} style={navItemStyle(nav === "console")}>
            <span>Attorney Console</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>›</span>
          </button>

          <button type="button" onClick={() => setNav("reports")} style={navItemStyle(nav === "reports")}>
            <span>Reports</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>›</span>
          </button>

          <button type="button" onClick={() => setNav("settings")} style={navItemStyle(nav === "settings")}>
            <span>Settings</span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>›</span>
          </button>

          <div style={{ marginTop: "0.85rem", paddingTop: "0.85rem", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 900, marginBottom: "0.25rem" }}>
              Portal Status
            </div>
            <div style={{ fontSize: "0.88rem", color: "#0f172a", lineHeight: 1.45 }}>
              {demoMode ? (
                <span>
                  Demo data loaded. <b>No PHI</b>.
                </span>
              ) : (
                <span>
                  Live mode reserved for onboarding. <b>Not active</b>.
                </span>
              )}
            </div>
            <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
              Tip: Press <b>Esc</b> to close menus/modals.
            </div>
          </div>
        </div>

        <div>{renderMain()}</div>
      </div>

      {renderModal()}
      {renderRnComposeModal()}
    </div>
  );
};

export default AttorneyConsole;
