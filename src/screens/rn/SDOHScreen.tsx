// src/screens/rn/SDOHScreen.tsx
// FIXED VERSION - Loads client SDOH data, RN can only DECREASE severity (not increase)
// Uses authenticated REST helpers (supabaseRest) for rc_sdoh_assessments so load/save pass RLS (assigned RN only).

import React, { useEffect, useRef, useState } from "react";
import {
  SeverityScore,
  getSeverityLabel,
} from "../../constants/reconcileFramework";
import { RN_VIEW_ONLY_TOOLTIP } from "@/components/rn/RNCaseStateBadge";
import { supabaseGet, supabaseUpdate, supabaseInsert } from "@/lib/supabaseRest";

type SdohDomainId = "economic" | "education" | "healthcare" | "neighborhood" | "social";

interface SdohQuestion {
  id: string;
  domainId: SdohDomainId;
  label: string;
  clientField?: string; // Maps to client intake field if applicable
}

interface DomainConfig {
  id: SdohDomainId;
  title: string;
  description: string;
  questions: SdohQuestion[];
}

const DOMAINS: DomainConfig[] = [
  {
    id: "economic",
    title: "Economic Stability",
    description: "Income, employment, and ability to afford basic needs that support treatment and recovery.",
    questions: [
      { id: "econ_basic_needs", domainId: "economic", label: "Are they able to afford basic needs such as food, utilities, and personal essentials?" },
      { id: "econ_delay_care", domainId: "economic", label: "Have financial concerns caused them to delay or skip medical care?" },
      { id: "econ_job_stability", domainId: "economic", label: "Is their employment stable enough to support ongoing treatment needs?" },
    ],
  },
  {
    id: "education",
    title: "Education Access & Quality",
    description: "Literacy, language, and ability to understand and act on health information.",
    questions: [
      { id: "edu_health_literacy", domainId: "education", label: "Do they feel confident understanding medical instructions and health information?" },
      { id: "edu_language_barrier", domainId: "education", label: "Are language or literacy barriers affecting their ability to follow care recommendations?" },
      { id: "edu_system_navigation", domainId: "education", label: "Does their level of education or training limit their ability to navigate medical or legal processes?" },
    ],
  },
  {
    id: "healthcare",
    title: "Health Care Access & Quality",
    description: "Access to providers, treatments, and medications in a way that supports the plan of care.",
    questions: [
      { id: "hc_access_providers", domainId: "healthcare", label: "Do they have reliable access to primary care and needed specialists?" },
      { id: "hc_treatment_barriers", domainId: "healthcare", label: "Have they been unable to obtain treatments, medications, or referrals due to insurance or cost?" },
      { id: "hc_transport_impact", domainId: "healthcare", label: "Do transportation issues cause missed or delayed appointments?", clientField: "transportation_issue" },
    ],
  },
  {
    id: "neighborhood",
    title: "Neighborhood & Built Environment",
    description: "Housing safety, environmental hazards, and neighborhood factors that help or hinder recovery.",
    questions: [
      { id: "nb_housing_safety", domainId: "neighborhood", label: "Is their housing safe, stable, and free of hazards (mold, pests, violence)?", clientField: "housing_concern" },
      { id: "nb_environment_impact", domainId: "neighborhood", label: "Do environmental factors (noise, pollution, unsafe area) limit sleep, mobility, or recovery?" },
      { id: "nb_transport_support", domainId: "neighborhood", label: "Is transportation in their area reliable enough to support treatment adherence?", clientField: "transportation_issue" },
    ],
  },
  {
    id: "social",
    title: "Social & Community Context",
    description: "Support, relationships, stressors, and discrimination that affect their ability to engage in care.",
    questions: [
      { id: "soc_support", domainId: "social", label: "Do they have reliable social support for daily needs and recovery?" },
      { id: "soc_conflict", domainId: "social", label: "Are there conflicts or stressors at home or work affecting their ability to engage in care?" },
      { id: "soc_discrimination", domainId: "social", label: "Have they experienced discrimination or bias that affects their care or well-being?" },
    ],
  },
];

interface QuestionState {
  id: string;
  domainId: SdohDomainId;
  clientScore: SeverityScore | null;  // What client reported (from intake)
  rnScore: SeverityScore | null;       // What RN assessed (can only be <= clientScore)
  /** Client self-assessment notes (read-only) for this item. Preserved for CPB. */
  clientNote?: string | null;
}

interface DomainNotes {
  economic: string;
  education: string;
  healthcare: string;
  neighborhood: string;
  social: string;
}

interface SdohFlags {
  housing_insecurity: boolean;
  food_insecurity: boolean;
  transportation_barrier: boolean;
  financial_hardship: boolean;
  social_isolation: boolean;
}

interface SDOHScreenProps {
  readOnly?: boolean;
  onMarkDirty?: () => void;
}

// Convert Yes/No from client intake to severity score
// "Yes" to a problem = score of 2 (concern identified)
// "No" to a problem = score of 4 (no concern)
function yesNoToScore(value: string | null | undefined): SeverityScore | null {
  if (!value) return null;
  if (value.toLowerCase() === 'yes') return 2; // Problem identified = more severe
  if (value.toLowerCase() === 'no') return 4;  // No problem = stable
  return null;
}

const toNum = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Ceiling = clientScore when it exists; else no baseline → RN can select 1–5. RN cannot inflate above client baseline. */
function getMaxAllowed(clientScore: SeverityScore | null, _rnScore: SeverityScore | null): SeverityScore | null {
  return clientScore != null ? clientScore : null;
}

const canSelect = (choice: unknown, maxAllowed: SeverityScore | null): boolean => {
  const c = toNum(choice);
  if (c == null) return false;
  if (maxAllowed == null) return c >= 1 && c <= 5;
  return c <= maxAllowed;
};

function computeDomainScore(questions: QuestionState[], domainId: SdohDomainId): SeverityScore | null {
  const domainQs = questions.filter((q) => q.domainId === domainId);
  const scores = domainQs
    .map((q) => q.rnScore ?? q.clientScore)
    .filter((s): s is SeverityScore => s !== null);
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / scores.length) as SeverityScore;
}

function computeOverallScore(questions: QuestionState[]): SeverityScore | null {
  const scores = questions
    .map((q) => q.rnScore ?? q.clientScore)
    .filter((s): s is SeverityScore => s !== null);
  if (scores.length === 0) return null;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / scores.length) as SeverityScore;
}

/** Fields stored in rc_sdoh_assessments (match save payload). */
interface AssessmentRow {
  id?: string;
  created_at?: string;
  updated_at?: string;
  economic_employment?: number | null;
  economic_income?: number | null;
  economic_expenses?: number | null;
  economic_notes?: string | null;
  education_literacy?: number | null;
  education_language?: number | null;
  education_notes?: string | null;
  healthcare_coverage?: number | null;
  healthcare_access?: number | null;
  healthcare_quality?: number | null;
  healthcare_notes?: string | null;
  neighborhood_housing?: number | null;
  neighborhood_transportation?: number | null;
  neighborhood_safety?: number | null;
  neighborhood_notes?: string | null;
  community_integration?: number | null;
  community_support?: number | null;
  community_stress?: number | null;
  community_notes?: string | null;
  overall_score?: number | null;
  overall_notes?: string | null;
  housing_insecurity_flag?: boolean;
  food_insecurity_flag?: boolean;
  transportation_barrier_flag?: boolean;
  financial_hardship_flag?: boolean;
  social_isolation_flag?: boolean;
}

/**
 * Maps DB row → UI state. Uses domain scores from row for rnScore per question;
 * does not overwrite with defaults when row has values.
 */
function hydrateFromAssessmentRow(
  row: AssessmentRow,
  baseQuestions: QuestionState[]
): {
  questions: QuestionState[];
  domainNotes: DomainNotes;
  narrative: string;
  flags: SdohFlags;
  existingAssessmentId: string | null;
} {
  const getDomainScore = (domainId: SdohDomainId): SeverityScore | null => {
    const n = (v: number | null | undefined): SeverityScore | null =>
      v != null && v >= 1 && v <= 5 ? (v as SeverityScore) : null;
    switch (domainId) {
      case "economic":
        return n(row.economic_employment ?? row.economic_income ?? row.economic_expenses) ?? null;
      case "education":
        return n(row.education_literacy ?? row.education_language) ?? null;
      case "healthcare":
        return n(row.healthcare_coverage ?? row.healthcare_access ?? row.healthcare_quality) ?? null;
      case "neighborhood":
        return n(row.neighborhood_housing ?? row.neighborhood_transportation ?? row.neighborhood_safety) ?? null;
      case "social":
        return n(row.community_integration ?? row.community_support ?? row.community_stress) ?? null;
      default:
        return null;
    }
  };

  const questions = baseQuestions.map((q) => {
    const fromRow = getDomainScore(q.domainId);
    const rnScore = fromRow ?? (q.clientScore != null ? q.clientScore : q.rnScore);
    return { ...q, rnScore: rnScore as SeverityScore | null };
  });

  const domainNotes: DomainNotes = {
    economic: row.economic_notes ?? "",
    education: row.education_notes ?? "",
    healthcare: row.healthcare_notes ?? "",
    neighborhood: row.neighborhood_notes ?? "",
    social: row.community_notes ?? "",
  };
  const narrative = row.overall_notes ?? "";
  const flags: SdohFlags = {
    housing_insecurity: row.housing_insecurity_flag ?? false,
    food_insecurity: row.food_insecurity_flag ?? false,
    transportation_barrier: row.transportation_barrier_flag ?? false,
    financial_hardship: row.financial_hardship_flag ?? false,
    social_isolation: row.social_isolation_flag ?? false,
  };
  const existingAssessmentId = row.id ?? null;

  const appliedFields = [
    "questions(rnScore per domain)",
    "domainNotes",
    "narrative",
    "flags",
    "existingAssessmentId",
  ];
  console.debug("[SDOH hydrate] applied:", appliedFields, {
    id: existingAssessmentId,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });

  return { questions, domainNotes, narrative, flags, existingAssessmentId };
}

const SDOHScreen: React.FC<SDOHScreenProps> = ({ readOnly = false, onMarkDirty }) => {
  const [questions, setQuestions] = useState<QuestionState[]>(
    DOMAINS.flatMap((d) => d.questions.map((q) => ({ 
      id: q.id, 
      domainId: q.domainId, 
      clientScore: null,
      rnScore: null 
    })))
  );
  const [domainNotes, setDomainNotes] = useState<DomainNotes>({
    economic: "", education: "", healthcare: "", neighborhood: "", social: ""
  });
  const [narrative, setNarrative] = useState("");
  const [flags, setFlags] = useState<SdohFlags>({
    housing_insecurity: false,
    food_insecurity: false,
    transportation_barrier: false,
    financial_hardship: false,
    social_isolation: false,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingAssessmentId, setExistingAssessmentId] = useState<string | null>(null);
  const [clientIntakeDate, setClientIntakeDate] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState(false);
  /** Revision mode: working on a follow-up/revision care plan → load/save assessment_type='reassessment'. */
  const [revisionMode, setRevisionMode] = useState(false);
  /** Per-question rationale when RN scores lower than client (required for downward adjustment). Stored in overall_notes as "<KEY>: <rationale>". */
  const [adjustmentRationaleByQuestion, setAdjustmentRationaleByQuestion] = useState<Record<string, string>>({});

  const caseId = typeof window !== 'undefined' ? window.localStorage.getItem("rcms_active_case_id") : null;

  // Load client intake SDOH data and any existing RN assessment (scoped by assessment_type for revisions)
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        // Deterministic revision mode: ONLY from current care plan record (plan_type === 'follow_up')
        let revisionModeResolved = false;
        try {
          const { data: planData } = await supabaseGet<unknown[]>(
            "rc_care_plans",
            `case_id=eq.${caseId}&order=created_at.desc&limit=1`
          );
          const planResult = Array.isArray(planData) ? planData : [];
          const plan = planResult.length > 0 ? (planResult[0] as { plan_type?: string }) : null;
          revisionModeResolved = plan?.plan_type === 'follow_up';
        } catch (_) {
          // ignore
        }
        setRevisionMode(revisionModeResolved);

        const expectedAssessmentType = revisionModeResolved ? 'reassessment' : 'initial';

        // Load client intake data (SDOH flags from their intake) — authenticated so RLS applies
        const { data: caseData, error: caseErr } = await supabaseGet<unknown[]>(
          "rc_cases",
          `id=eq.${caseId}&is_superseded=eq.false&select=client_id,created_at`
        );
        if (caseErr) throw caseErr;
        const caseResult = Array.isArray(caseData) ? caseData : [];

        let clientSdohData: Record<string, unknown> | null = null;

        if (caseResult.length > 0 && (caseResult[0] as { client_id?: string }).client_id) {
          const clientId = (caseResult[0] as { client_id: string }).client_id;
          const { data: clientData, error: clientErr } = await supabaseGet<unknown[]>(
            "rc_clients",
            `id=eq.${clientId}&select=*`
          );
          if (clientErr) throw clientErr;
          const clientResult = Array.isArray(clientData) ? clientData : [];
          if (clientResult.length > 0) {
            clientSdohData = clientResult[0] as Record<string, unknown>;
            const created = (clientResult[0] as { created_at?: string }).created_at ?? (caseResult[0] as { created_at?: string }).created_at;
            setClientIntakeDate(created ?? null);
          }
        }

        const { data: checkinData, error: checkinErr } = await supabaseGet<unknown[]>(
          "rc_client_checkins",
          `case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );
        if (checkinErr) throw checkinErr;
        const checkinResult = Array.isArray(checkinData) ? checkinData : [];

        if (checkinResult.length > 0) {
          const row = checkinResult[0] as Record<string, unknown> & { created_at?: string };
          clientSdohData = { ...(clientSdohData ?? {}), ...row };
          setClientIntakeDate(row.created_at ?? null);
        }

        // Client note from check-in if present (single note; no per-item source in schema)
        const clientNoteFromCheckin = (checkinResult.length > 0)
          ? ((): string | null => {
              const n = (checkinResult[0] as Record<string, unknown> & { note?: string }).note;
              return typeof n === "string" && n.trim() ? n.trim() : null;
            })()
          : null;

        // Map client intake responses to question scores
        const updatedQuestions = questions.map(q => {
          let clientScore: SeverityScore | null = null;
          
          // Map specific fields from client intake
          if (clientSdohData) {
            if (q.id === 'hc_transport_impact' || q.id === 'nb_transport_support') {
              clientScore = yesNoToScore(clientSdohData.transportation_issue || clientSdohData.transportationIssue);
            } else if (q.id === 'nb_housing_safety') {
              clientScore = yesNoToScore(clientSdohData.housing_concern || clientSdohData.housingConcern);
              // Invert: "Yes" to housing concern = problem = lower score
              if (clientSdohData.housing_concern === 'Yes' || clientSdohData.housingConcern === 'Yes') {
                clientScore = 2;
              } else if (clientSdohData.housing_concern === 'No' || clientSdohData.housingConcern === 'No') {
                clientScore = 4;
              }
            } else if (q.id === 'econ_basic_needs') {
              // Food concern maps to economic basic needs
              if (clientSdohData.food_concern === 'Yes' || clientSdohData.foodConcern === 'Yes') {
                clientScore = 2;
              } else if (clientSdohData.food_concern === 'No' || clientSdohData.foodConcern === 'No') {
                clientScore = 4;
              }
            }
          }
          // clientNote: per-item when available; for now use shared check-in note only for first relevant item to avoid repetition
          const clientNote = (q.id === 'econ_basic_needs' && clientNoteFromCheckin) ? clientNoteFromCheckin : null;
          return { ...q, clientScore, rnScore: clientScore != null ? clientScore : null, clientNote };
        });

        // Set flags based on client intake
        if (clientSdohData) {
          setFlags({
            housing_insecurity: clientSdohData.housing_concern === 'Yes' || clientSdohData.housingConcern === 'Yes',
            food_insecurity: clientSdohData.food_concern === 'Yes' || clientSdohData.foodConcern === 'Yes',
            transportation_barrier: clientSdohData.transportation_issue === 'Yes' || clientSdohData.transportationIssue === 'Yes',
            financial_hardship: false,
            social_isolation: false,
          });
        }

        // Load existing RN assessment for this case + assessment_type (revision-scoped)
        const { data: existingData, error: existingErr } = await supabaseGet<unknown[]>(
          "rc_sdoh_assessments",
          `case_id=eq.${caseId}&assessment_type=eq.${expectedAssessmentType}&order=updated_at.desc&limit=1`
        );
        if (existingErr) throw existingErr;
        const existingResult = Array.isArray(existingData) ? existingData : [];

        if (existingResult && existingResult.length > 0) {
          const row = existingResult[0] as AssessmentRow;
          console.debug("[SDOH load] assessment row:", {
            id: row.id,
            assessment_type: expectedAssessmentType,
            updated_at: row.updated_at,
          });
          const hydrated = hydrateFromAssessmentRow(row, updatedQuestions);
          setQuestions(hydrated.questions);
          setDomainNotes(hydrated.domainNotes);
          setNarrative(hydrated.narrative);
          setFlags(hydrated.flags);
          setExistingAssessmentId(hydrated.existingAssessmentId);
          setIsFollowUp(true);
          setStatus(revisionModeResolved ? "Loaded revision SDOH assessment." : "Loaded existing RN assessment. This is a subsequent care plan assessment.");
        } else {
          setExistingAssessmentId(null);
          setIsFollowUp(revisionModeResolved);
          setQuestions(updatedQuestions);
          if (clientSdohData) {
            setStatus("Client intake data loaded. Review and assess each domain.");
          } else {
            setStatus("⚠️ No client intake data found. Client should complete intake first.");
          }
        }
      } catch (error) {
        console.error("Failed to load SDOH data:", error);
        setStatus("Error loading data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const getAllScores = (): SeverityScore[] => [1, 2, 3, 4, 5];

  const handleScoreChange = (qId: string, value: string) => {
    const question = questions.find(q => q.id === qId);
    if (!question) return;
    const maxAllowed = getMaxAllowed(question.clientScore, question.rnScore);
    const num = toNum(value);
    if (num == null) return;
    if (maxAllowed != null && num > maxAllowed) return;
    if (num < 1 || num > 5) return;
    onMarkDirty?.();
    setQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, rnScore: num as SeverityScore } : q)));
    setStatus(null);
  };

  /** Reset: set rnScore back to clientScore and clear rationale (when baseline exists). */
  const handleResetRnScore = (qId: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q || q.clientScore == null) return;
    onMarkDirty?.();
    setQuestions((prev) => prev.map((x) => (x.id === qId ? { ...x, rnScore: q.clientScore } : x)));
    setAdjustmentRationaleByQuestion((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setStatus(null);
  };

  /** Clear: set rnScore to null (only when baseline missing; Save remains blocked until RN selects). */
  const handleClearRnScore = (qId: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q || q.rnScore == null) return;
    if (q.clientScore != null) return; // When baseline exists, use Reset instead
    onMarkDirty?.();
    setQuestions((prev) => prev.map((x) => (x.id === qId ? { ...x, rnScore: null } : x)));
    setAdjustmentRationaleByQuestion((prev) => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setStatus(null);
  };

  const hasLoggedBaseline = useRef(false);
  useEffect(() => {
    if (!loading && !hasLoggedBaseline.current) {
      hasLoggedBaseline.current = true;
      console.debug("[SDOH baseline/maxAllowed]", questions.slice(0, 5).map((q) => ({ id: q.id, clientScore: q.clientScore, rnScore: q.rnScore, maxAllowed: (q.clientScore ?? q.rnScore ?? null) })));
    }
  }, [loading, questions]);

  /** Per-question: clientScore exists and rnScore < clientScore → rationale required. */
  const needsRationale = (q: QuestionState) =>
    q.clientScore != null && q.rnScore != null && q.rnScore < q.clientScore;

  // Check if any adjusted scores are missing required rationale (per-question for SDOH)
  const getMissingNotes = (): string[] => {
    const missing: string[] = [];
    questions.forEach(q => {
      if (needsRationale(q) && !(adjustmentRationaleByQuestion[q.id] || "").trim()) {
        const def = DOMAINS.flatMap(d => d.questions).find(x => x.id === q.id);
        missing.push(def?.label ?? q.id);
      }
    });
    return missing;
  };

  const handleSave = async () => {
    if (!caseId) {
      setStatus("No active case selected. Please select a case first.");
      return;
    }

    // Block save when any item has missing client baseline and RN has not selected a score
    const missingRnWhereBaselineMissing = questions.filter((q) => q.clientScore == null && q.rnScore == null);
    if (missingRnWhereBaselineMissing.length > 0) {
      setStatus("RN assessment required where client self-assessment is missing.");
      return;
    }

    // Validate that all adjusted scores (per-question) have required rationale
    const missingNotes = getMissingNotes();
    if (missingNotes.length > 0) {
      setStatus(`⚠️ Rationale required for RN adjustment: ${missingNotes.join(", ")}. Please document why you scored lower than the client.`);
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      // Append per-question rationale as "<KEY>: <rationale>" to overall_notes (no per-item *_notes in SDOH)
      const rationaleLines = questions.filter(needsRationale).map(q => `${q.id}: ${(adjustmentRationaleByQuestion[q.id] || "").trim()}`);
      const finalOverallNotes = (narrative.trim() ? narrative.trim() + "\n" : "") + rationaleLines.join("\n");

      const economicScore = computeDomainScore(questions, 'economic');
      const educationScore = computeDomainScore(questions, 'education');
      const healthcareScore = computeDomainScore(questions, 'healthcare');
      const neighborhoodScore = computeDomainScore(questions, 'neighborhood');
      const socialScore = computeDomainScore(questions, 'social');
      const overallScore = computeOverallScore(questions);

      const expectedAssessmentType = revisionMode ? 'reassessment' : 'initial';
      console.debug("[SDOH save] assessment_type:", expectedAssessmentType);
      const assessmentData = {
        case_id: caseId,
        assessment_type: expectedAssessmentType,
        
        economic_employment: economicScore,
        economic_income: economicScore,
        economic_expenses: economicScore,
        economic_notes: domainNotes.economic || null,
        
        neighborhood_housing: neighborhoodScore,
        neighborhood_transportation: neighborhoodScore,
        neighborhood_safety: neighborhoodScore,
        neighborhood_notes: domainNotes.neighborhood || null,
        
        education_literacy: educationScore,
        education_language: educationScore,
        education_notes: domainNotes.education || null,
        
        food_hunger: economicScore,
        food_access: economicScore,
        
        community_integration: socialScore,
        community_support: socialScore,
        community_stress: socialScore,
        community_notes: domainNotes.social || null,
        
        healthcare_coverage: healthcareScore,
        healthcare_access: healthcareScore,
        healthcare_quality: healthcareScore,
        healthcare_notes: domainNotes.healthcare || null,
        
        overall_score: overallScore,
        overall_notes: finalOverallNotes || null,
        
        housing_insecurity_flag: flags.housing_insecurity,
        food_insecurity_flag: flags.food_insecurity,
        transportation_barrier_flag: flags.transportation_barrier,
        financial_hardship_flag: flags.financial_hardship,
        social_isolation_flag: flags.social_isolation,
      };

      const wasUpdate = !!existingAssessmentId;
      // Uses authenticated REST helpers (supabaseRest) so SDOH save passes RLS (assigned RN only).
      if (existingAssessmentId) {
        const { error: updateErr } = await supabaseUpdate(
          "rc_sdoh_assessments",
          `id=eq.${existingAssessmentId}`,
          { ...assessmentData, updated_at: new Date().toISOString() }
        );
        if (updateErr) throw updateErr;
      } else {
        const { data: insertData, error: insertErr } = await supabaseInsert<{ id: string } | { id: string }[]>(
          "rc_sdoh_assessments",
          assessmentData
        );
        if (insertErr) throw insertErr;
        const result = Array.isArray(insertData) ? insertData : insertData ? [insertData] : [];
        if (result.length > 0) {
          setExistingAssessmentId((result[0] as { id: string }).id);
        }
      }

      // After successful save: refetch row for this assessment type and hydrate so UI state matches DB
      const { data: refetched, error: refetchErr } = await supabaseGet<unknown[]>(
        "rc_sdoh_assessments",
        `case_id=eq.${caseId}&assessment_type=eq.${expectedAssessmentType}&order=updated_at.desc&limit=1`
      );
      if (!refetchErr && refetched && Array.isArray(refetched) && refetched.length > 0) {
        const h = hydrateFromAssessmentRow(refetched[0] as AssessmentRow, questions);
        setQuestions(h.questions);
        setDomainNotes(h.domainNotes);
        setNarrative(h.narrative);
        setFlags(h.flags);
        setExistingAssessmentId(h.existingAssessmentId);
      }
      setStatus(wasUpdate ? "✓ SDOH assessment updated." : "✓ SDOH assessment saved.");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Failed to save SDOH assessment:", err?.message ?? err, error);
      setStatus(`Error saving: ${err?.message ?? "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const overallScore = computeOverallScore(questions);
  const missingBaseline = questions.some((q) => q.clientScore == null);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading SDOH assessment...</div>;
  }

  return (
    <div>
      {/* Temporary debug: confirm mode and assessment_type are stable on re-entry */}
      <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
        Mode: {revisionMode ? "Revision" : "Initial"} • assessment_type: {revisionMode ? "reassessment" : "initial"}
      </p>
      <div style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
          SDOH – Social Determinants of Health
          {isFollowUp && <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#0ea5e9", marginLeft: "0.5rem" }}>(Subsequent Care Plan)</span>}
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "46rem" }}>
          Evaluate each SDOH domain using the 1–5 scale where <strong>1 = Severe barrier/crisis</strong> and{" "}
          <strong>5 = No significant barriers</strong>. These factors directly affect treatment adherence and recovery outcomes.
        </p>
        {caseId && (
          <p style={{ fontSize: "0.75rem", color: "#0ea5e9", marginTop: "0.25rem" }}>
            Case ID: {caseId}
          </p>
        )}
      </div>

      {/* Scoring Rule Explanation Box */}
      <div style={{
        marginBottom: "1rem",
        padding: "0.75rem 1rem",
        borderRadius: "10px",
        border: "2px solid #f59e0b",
        background: "#fffbeb",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🔒</span>
          <div>
            <div style={{ fontWeight: 600, color: "#92400e", marginBottom: "0.25rem" }}>
              Scoring Rule: Client's Perception is the Ceiling
            </div>
            <p style={{ fontSize: "0.8rem", color: "#78350f", margin: 0 }}>
              The client's self-reported SDOH concerns set the <strong>maximum score</strong> for each item. 
              As the RN, you may <strong>decrease</strong> the score if your assessment identifies additional 
              barriers or concerns the client didn't report — but you <strong>cannot increase</strong> the 
              score above what the client indicated.
            </p>
            <p style={{ fontSize: "0.78rem", color: "#92400e", margin: "0.35rem 0 0 0", fontWeight: 500 }}>
              RN may decrease scores but cannot increase above client self-assessment.
            </p>
            <p style={{ fontSize: "0.75rem", color: "#78350f", margin: "0.35rem 0 0 0" }}>
              Quick guide: 5=best/stable, 3=intermittent issues, 1=severe deficits. RN may score lower than client baseline with rationale; cannot score higher.
            </p>
            <div style={{ 
              marginTop: "0.5rem", 
              padding: "0.4rem 0.6rem", 
              background: "#fef3c7", 
              borderRadius: "6px",
              fontSize: "0.75rem",
              color: "#92400e"
            }}>
              <strong>Example:</strong> If client reported "No" to housing concerns (score 4), you can select 1, 2, 3, or 4 — but not 5.
              <br />
              <strong>Why?</strong> The client's lived experience is the baseline. You may uncover additional barriers 
              they didn't recognize, but cannot override their perception of their own situation.
              <br />
              <strong style={{ color: "#dc2626" }}>📝 Required:</strong> If you adjust any score in a domain, you <strong>must</strong> document 
              your reasoning in that domain's notes field explaining why you identified additional concerns.
            </div>
          </div>
        </div>
      </div>

      {/* Overall Score */}
      <div style={{
        marginBottom: "1rem", padding: "0.6rem 0.8rem", borderRadius: "10px",
        border: "1px solid #e2e8f0", background: "#f8fafc",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b" }}>
            Overall SDOH Score (RN Assessment)
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
            {overallScore ? `${getSeverityLabel(overallScore)} (${overallScore}/5)` : "Score at least one question"}
          </div>
        </div>
        {clientIntakeDate && (
          <div style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "right" }}>
            Client intake: {formatDate(clientIntakeDate)}
          </div>
        )}
      </div>

      {/* SDOH Flags */}
      <div style={{
        marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px",
        border: "1px solid #fecaca", background: "#fef2f2"
      }}>
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#991b1b" }}>⚠️ SDOH Risk Flags</div>
        <p style={{ fontSize: "0.75rem", color: "#7f1d1d", marginBottom: "0.5rem" }}>
          Flags from client intake are pre-checked. You may add additional flags but cannot remove client-reported concerns.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {[
            { key: 'housing_insecurity', label: 'Housing Insecurity' },
            { key: 'food_insecurity', label: 'Food Insecurity' },
            { key: 'transportation_barrier', label: 'Transportation Barrier' },
            { key: 'financial_hardship', label: 'Financial Hardship' },
            { key: 'social_isolation', label: 'Social Isolation' },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
              <input
                type="checkbox"
                checked={flags[key as keyof SdohFlags]}
                onChange={(e) => { onMarkDirty?.(); setFlags(prev => ({ ...prev, [key]: e.target.checked })); }}
                disabled={readOnly}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Domain Cards */}
      {DOMAINS.map((domain) => {
        const domainQuestions = questions.filter(q => q.domainId === domain.id);
        const domainScore = computeDomainScore(questions, domain.id);
        const hasClientData = domainQuestions.some(q => q.clientScore !== null);
        
        return (
          <div key={domain.id} style={{
            marginBottom: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0",
            background: "#ffffff", padding: "0.75rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div>
                <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {domain.title}
                  {hasClientData && (
                    <span style={{ 
                      fontSize: "0.65rem", 
                      padding: "0.1rem 0.4rem", 
                      borderRadius: "4px",
                      background: "#dbeafe", 
                      color: "#1e40af" 
                    }}>
                      Has client data
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{domain.description}</div>
              </div>
              {domainScore && (
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0f172a" }}>
                  {domainScore}/5
                </div>
              )}
            </div>

            {domainQuestions.map((qState, qIndex) => {
              const qDef = domain.questions.find(q => q.id === qState.id);
              const maxAllowed = getMaxAllowed(qState.clientScore, qState.rnScore);
              const panelMissingBaseline = qState.clientScore == null;
              const scoreChanged = qState.rnScore !== null && qState.clientScore !== null && qState.rnScore !== qState.clientScore;
              const legacyAboveBaseline = qState.rnScore != null && qState.clientScore != null && qState.rnScore > qState.clientScore;
              const rnScore = qState.rnScore;
              const isFirstQuestion = domain.id === DOMAINS[0].id && qIndex === 0;
              if (isFirstQuestion) {
                console.debug("[RN score render]", { id: qState.id, rnScore, selectValue: rnScore == null ? "" : String(rnScore) });
              }

              return (
                <div key={qState.id} style={{
                  padding: "0.5rem",
                  borderTop: "1px solid #f1f5f9",
                }}>
                  <div style={{ fontSize: "0.78rem", marginBottom: "0.4rem" }}>
                    {qDef?.label}
                  </div>

                  {/* Client Self-Assessment panel: red when missing baseline, blue when completed */}
                  <div style={{
                        padding: "0.4rem 0.5rem",
                        borderRadius: "6px",
                        marginBottom: "0.5rem",
                        ...(panelMissingBaseline
                          ? { background: "#fef2f2", border: "1px solid #fecaca" }
                          : { background: "#f0f9ff", border: "1px solid #bae6fd" }),
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.15rem" }}>
                          <span style={{
                            fontSize: "0.68rem",
                            textTransform: "uppercase",
                            ...(panelMissingBaseline ? { color: "#b91c1c", fontWeight: 600 } : { color: "#0369a1" }),
                          }}>
                            Client Self-Assessment
                          </span>
                          {panelMissingBaseline && (
                            <span style={{
                              fontSize: "0.65rem",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "999px",
                              background: "#dc2626",
                              color: "#ffffff",
                              fontWeight: 600,
                            }}>
                              Action required
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          ...(panelMissingBaseline ? { color: "#991b1b" } : { color: "#0c4a6e" }),
                        }}>
                          {qState.clientScore !== null ? (
                            <>Client score: {qState.clientScore} — {getSeverityLabel(qState.clientScore) ?? ""}</>
                          ) : (
                            <>Client self-assessment not completed — RN scoring required.</>
                          )}
                        </div>
                        {qState.clientScore == null && (
                          <div style={{ fontSize: "0.72rem", color: "#b91c1c", marginTop: "0.25rem" }}>
                            Scores will remain blank until RN completes assessment.
                          </div>
                        )}
                        {qState.clientNote && (
                          <div style={{
                            marginTop: "0.25rem",
                            paddingTop: "0.25rem",
                            borderTop: panelMissingBaseline ? "1px solid #fecaca" : "1px solid #bae6fd",
                            fontSize: "0.72rem",
                            color: panelMissingBaseline ? "#991b1b" : "#0c4a6e",
                          }}>
                            Client note (general): {qState.clientNote}
                          </div>
                        )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    {/* RN's Score Selection — fail-closed: options above maxAllowed disabled; whole select disabled when baseline missing */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>RN:</span>
                      <select
                        value={rnScore == null ? "" : String(rnScore)}
                        onChange={(e) => handleScoreChange(qState.id, e.target.value)}
                        disabled={readOnly}
                        style={{
                          padding: "0.2rem 0.4rem", borderRadius: "6px",
                          border: scoreChanged ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                          fontSize: "0.75rem", minWidth: "70px",
                          background: scoreChanged ? "#fffbeb" : "#ffffff",
                        }}
                      >
                        <option value="" disabled>Select RN score…</option>
                        {getAllScores().map((s) => {
                          const disabled = !canSelect(s, maxAllowed);
                          return (
                            <option
                              key={s}
                              value={String(s)}
                              disabled={disabled}
                              style={disabled ? { color: "#94a3b8" } : undefined}
                            >
                              {s}{disabled ? " (locked)" : ""}
                            </option>
                          );
                        })}
                      </select>
                      {!readOnly && (
                        qState.clientScore != null ? (
                          (qState.rnScore != null || (adjustmentRationaleByQuestion[qState.id] ?? "").trim()) && (
                            <button
                              type="button"
                              onClick={() => handleResetRnScore(qState.id)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontSize: "0.72rem",
                                color: "#64748b",
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                            >
                              Reset to baseline
                            </button>
                          )
                        ) : (
                          qState.rnScore != null && (
                            <button
                              type="button"
                              onClick={() => handleClearRnScore(qState.id)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                fontSize: "0.72rem",
                                color: "#64748b",
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                            >
                              Clear
                            </button>
                          )
                        )
                      )}
                    </div>
                    
                    {scoreChanged && !legacyAboveBaseline && (
                      <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 600 }}>
                        ⚠️ Adjusted from client
                      </span>
                    )}
                    {legacyAboveBaseline && (
                      <span style={{ fontSize: "0.65rem", color: "#b45309", fontStyle: "italic" }}>
                        Legacy value above client baseline; cannot increase further.
                      </span>
                    )}
                    {panelMissingBaseline && qState.rnScore == null ? (
                      <span style={{ fontSize: "0.65rem", color: "#b91c1c", fontWeight: 500 }}>
                        No client baseline — RN assessment required. You can select any score 1–5.
                      </span>
                    ) : maxAllowed == null ? (
                      <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                        (Can select 1–5)
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                        (Can select 1–{maxAllowed})
                      </span>
                    )}
                  </div>

                  {/* Per-question required rationale when RN scores lower than client */}
                  {scoreChanged && !legacyAboveBaseline && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <label style={{ display: "block", fontSize: "0.75rem", color: "#0f172a", marginBottom: "0.2rem" }}>
                        Rationale for RN adjustment (required)
                      </label>
                      <textarea
                        value={adjustmentRationaleByQuestion[qState.id] ?? ""}
                        onChange={(e) => {
                          onMarkDirty?.();
                          setAdjustmentRationaleByQuestion(prev => ({ ...prev, [qState.id]: e.target.value }));
                        }}
                        readOnly={readOnly}
                        rows={2}
                        placeholder="Document why you scored lower than the client's self-assessment..."
                        style={{
                          width: "100%", borderRadius: "6px", fontSize: "0.78rem", resize: "vertical",
                          border: (adjustmentRationaleByQuestion[qState.id] ?? "").trim() ? "1px solid #cbd5e1" : "2px solid #dc2626",
                          padding: "0.35rem", background: (adjustmentRationaleByQuestion[qState.id] ?? "").trim() ? "#ffffff" : "#fef2f2",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
                RN Notes for {domain.title}
              </label>
              <textarea
                value={domainNotes[domain.id]}
                onChange={(e) => { onMarkDirty?.(); setDomainNotes(prev => ({ ...prev, [domain.id]: e.target.value })); }}
                readOnly={readOnly}
                rows={2}
                placeholder="Document your clinical observations for this domain..."
                style={{
                  width: "100%", borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  padding: "0.35rem", fontSize: "0.78rem", resize: "vertical",
                  background: readOnly ? "#f1f5f9" : "#ffffff",
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Narrative */}
      <div style={{ marginBottom: "0.75rem" }}>
        <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.3rem" }}>
          SDOH Summary Narrative (attorney-facing)
        </label>
        <textarea
          value={narrative}
          onChange={(e) => { onMarkDirty?.(); setNarrative(e.target.value); }}
          readOnly={readOnly}
          rows={4}
          placeholder="Summarize how SDOH factors impact this client's recovery and treatment adherence..."
          style={{
            width: "100%", borderRadius: "6px", border: "1px solid #cbd5e1",
            padding: "0.4rem", fontSize: "0.78rem", resize: "vertical"
          }}
        />
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving || readOnly}
          title={readOnly ? RN_VIEW_ONLY_TOOLTIP : undefined}
          style={{
            padding: "0.45rem 1rem", borderRadius: "999px", border: "none",
            background: saving || readOnly ? "#94a3b8" : "#0f2a6a", color: "#ffffff",
            fontSize: "0.8rem", cursor: saving || readOnly ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Saving..." : existingAssessmentId ? "Update SDOH Assessment" : "Save SDOH Assessment"}
        </button>
        {status && (
          <div style={{
            fontSize: "0.76rem",
            color: status.startsWith("✓") ? "#16a34a" : status.startsWith("Error") ? "#dc2626" : "#b45309",
            maxWidth: "60%",
          }}>
            {status}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_sdoh_assessments table)
        {existingAssessmentId && ` • Assessment ID: ${existingAssessmentId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default SDOHScreen;
