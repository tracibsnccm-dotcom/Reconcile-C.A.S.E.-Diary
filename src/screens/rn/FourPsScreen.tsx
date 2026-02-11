// src/screens/rn/FourPsScreen.tsx
// FIXED VERSION - Loads client scores, RN can only DECREASE severity (not increase)
// Uses authenticated Supabase client (supabaseRest) so 4Ps save passes RLS.

import React, { useEffect, useRef, useState } from "react";
import {
  FOUR_PS,
  SeverityScore,
  getSeverityLabel,
} from "../../constants/reconcileFramework";
import { RN_VIEW_ONLY_TOOLTIP } from "@/components/rn/RNCaseStateBadge";
import { supabaseGet, supabaseUpdate, supabaseInsert } from "@/lib/supabaseRest";
import { useAuth } from "@/auth/supabaseAuth";
import { assertRnAcceptanceGate } from "@/lib/rnAcknowledgment";

interface DimensionState {
  id: string;
  clientScore: SeverityScore | null;  // What the client rated themselves
  rnScore: SeverityScore | null;       // What the RN assessed (can only be <= clientScore)
  note: string;
  clientCheckinDate?: string;
  /** Client self-assessment notes (read-only), from rc_client_checkins.note or per-P source. Preserved for CPB. */
  clientNote?: string | null;
}

const toNum = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
};

/** Normalize check-in value to SeverityScore (1–5) or null. Handles number, string, boolean, yes/no. Missing → null (do not default to 5). */
const toClientScore = (v: unknown): SeverityScore | null => {
  const n = toNum(v);
  if (n != null && n >= 1 && n <= 5) return n as SeverityScore;
  if (typeof v === "boolean") return (v ? 4 : 2) as SeverityScore;
  if (typeof v === "string") {
    const s = v.toLowerCase();
    if (s === "yes" || s === "true") return 4 as SeverityScore;
    if (s === "no" || s === "false") return 2 as SeverityScore;
  }
  return null;
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

function computeOverallScore(dimensions: DimensionState[]): SeverityScore | null {
  const scores = dimensions
    .map((d) => d.rnScore ?? d.clientScore)
    .filter((s): s is SeverityScore => typeof s === "number");
  if (scores.length === 0) return null;
  // Maslow logic: overall follows the WORST (lowest) score
  return scores.reduce((min, s) => (s < min ? s : min), scores[0]);
}

interface FourPsScreenProps { readOnly?: boolean; onMarkDirty?: () => void; }

const FourPsScreen: React.FC<FourPsScreenProps> = ({ readOnly = false, onMarkDirty }) => {
  const { user } = useAuth();
  const [dimensions, setDimensions] = useState<DimensionState[]>(
    FOUR_PS.map((p) => ({
      id: p.id,
      clientScore: null,
      rnScore: null,
      note: "",
    }))
  );
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingAssessmentId, setExistingAssessmentId] = useState<string | null>(null);
  const [abuseRiskFlag, setAbuseRiskFlag] = useState(false);
  const [suicideRiskFlag, setSuicideRiskFlag] = useState(false);
  const [safetyNotes, setSafetyNotes] = useState("");
  const [isFollowUp, setIsFollowUp] = useState(false);
  /** Revision mode: working on a follow-up/revision care plan → load/save assessment_type='reassessment'. */
  const [revisionMode, setRevisionMode] = useState(false);

  const caseId = typeof window !== 'undefined' 
    ? window.localStorage.getItem("rcms_active_case_id") 
    : null;

  // Load client's check-in scores AND any existing RN assessment (scoped by assessment_type for revisions)
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

        const expectedAssessmentType = revisionModeResolved ? 'reassessment' : 'intake';

        // First, load the CLIENT's most recent check-in (their self-assessment) — authenticated
        const { data: checkinData, error: checkinErr } = await supabaseGet<unknown[]>(
          "rc_client_checkins",
          `case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );
        if (checkinErr) throw checkinErr;
        const checkinResult = Array.isArray(checkinData) ? checkinData : [];

        let clientScores = {
          physical: null as SeverityScore | null,
          psychological: null as SeverityScore | null,
          psychosocial: null as SeverityScore | null,
          professional: null as SeverityScore | null,
        };
        let checkinDate: string | undefined;

        const clientNote = checkinResult.length > 0
          ? (checkinResult[0] as Record<string, unknown> & { note?: string }).note ?? null
          : null;
        const clientNoteStr = typeof clientNote === "string" && clientNote.trim() ? clientNote.trim() : null;

        if (checkinResult.length > 0) {
          const checkin = checkinResult[0] as Record<string, unknown> & { created_at?: string };
          checkinDate = checkin.created_at;
          // Read from fourp_* or fall back to p_* (schema may use either). Normalize to number | null.
          clientScores = {
            physical: toClientScore(checkin.fourp_physical ?? checkin.p_physical),
            psychological: toClientScore(checkin.fourp_psychological ?? checkin.p_psychological),
            psychosocial: toClientScore(checkin.fourp_psychosocial ?? checkin.p_psychosocial),
            professional: toClientScore(checkin.fourp_professional ?? checkin.p_purpose),
          };
          console.log("FourPsScreen: Loaded client scores:", clientScores);
        } else {
          console.log("FourPsScreen: No client check-in found");
          setStatus("⚠️ No client self-assessment found. Client should complete their wellness check-in first.");
        }

        // Load existing RN assessment for this case + assessment_type (revision-scoped)
        const { data: existingData, error: existingErr } = await supabaseGet<unknown[]>(
          "rc_fourps_assessments",
          `case_id=eq.${caseId}&assessment_type=eq.${expectedAssessmentType}&order=updated_at.desc&limit=1`
        );
        if (existingErr) throw existingErr;
        const existingResult = Array.isArray(existingData) ? existingData : [];

        if (existingResult.length > 0) {
          const existing = existingResult[0] as {
            id: string;
            p1_physical?: SeverityScore;
            p2_psychological?: SeverityScore;
            p3_psychosocial?: SeverityScore;
            p4_professional?: SeverityScore;
            p1_notes?: string;
            p2_notes?: string;
            p3_notes?: string;
            p4_notes?: string;
            abuse_risk_flag?: boolean;
            suicide_risk_flag?: boolean;
            safety_notes?: string | null;
          };
          setExistingAssessmentId(existing.id);
          setIsFollowUp(true);
          // Show saved RN scores for this assessment type; only fall back to client when no saved value and client exists
          const rn = (saved: SeverityScore | null | undefined, client: SeverityScore | null) =>
            saved ?? (client != null ? client : null);
          setDimensions([
            { id: 'physical', clientScore: clientScores.physical, rnScore: rn(existing.p1_physical, clientScores.physical), note: existing.p1_notes || '', clientCheckinDate: checkinDate, clientNote: clientNoteStr ?? null },
            { id: 'psychological', clientScore: clientScores.psychological, rnScore: rn(existing.p2_psychological, clientScores.psychological), note: existing.p2_notes || '', clientCheckinDate: checkinDate, clientNote: null },
            { id: 'psychosocial', clientScore: clientScores.psychosocial, rnScore: rn(existing.p3_psychosocial, clientScores.psychosocial), note: existing.p3_notes || '', clientCheckinDate: checkinDate, clientNote: null },
            { id: 'professional', clientScore: clientScores.professional, rnScore: rn(existing.p4_professional, clientScores.professional), note: existing.p4_notes || '', clientCheckinDate: checkinDate, clientNote: null },
          ]);
          setAbuseRiskFlag(existing.abuse_risk_flag || false);
          setSuicideRiskFlag(existing.suicide_risk_flag || false);
          setSafetyNotes(existing.safety_notes || '');
          setStatus(revisionModeResolved ? "Loaded revision 4Ps assessment." : "Loaded existing RN assessment. This is a subsequent care plan assessment.");
        } else {
          // No saved assessment for this type: placeholders (rnScore null when baseline missing; else client)
          setExistingAssessmentId(null);
          setIsFollowUp(revisionModeResolved);
          setDimensions([
            { id: 'physical', clientScore: clientScores.physical, rnScore: clientScores.physical != null ? clientScores.physical : null, note: '', clientCheckinDate: checkinDate, clientNote: clientNoteStr ?? null },
            { id: 'psychological', clientScore: clientScores.psychological, rnScore: clientScores.psychological != null ? clientScores.psychological : null, note: '', clientCheckinDate: checkinDate, clientNote: null },
            { id: 'psychosocial', clientScore: clientScores.psychosocial, rnScore: clientScores.psychosocial != null ? clientScores.psychosocial : null, note: '', clientCheckinDate: checkinDate, clientNote: null },
            { id: 'professional', clientScore: clientScores.professional, rnScore: clientScores.professional != null ? clientScores.professional : null, note: '', clientCheckinDate: checkinDate, clientNote: null },
          ]);
          if (clientScores.physical !== null) {
            setStatus("Client scores loaded. Review and adjust if needed (you can only decrease scores, not increase).");
          }
        }
      } catch (error) {
        console.error("Failed to load 4Ps data:", error);
        setStatus("Error loading data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const overallScore = computeOverallScore(dimensions);
  const severityLabel = overallScore ? getSeverityLabel(overallScore) : null;
  const missingBaseline = dimensions.some((d) => d.clientScore == null);

  const getAllScores = (): SeverityScore[] => [1, 2, 3, 4, 5];

  const handleScoreChange = (id: string, value: string) => {
    const dim = dimensions.find(d => d.id === id);
    if (!dim) return;
    const maxAllowed = getMaxAllowed(dim.clientScore, dim.rnScore);
    const num = toNum(value);
    if (num == null) return;
    if (maxAllowed != null && num > maxAllowed) return;
    if (num < 1 || num > 5) return;
    onMarkDirty?.();
    setDimensions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, rnScore: num as SeverityScore } : d
      )
    );
    setStatus(null);
  };

  /** Reset: set rnScore back to clientScore and clear rationale (when baseline exists). */
  const handleResetRnScore = (id: string) => {
    const dim = dimensions.find(d => d.id === id);
    if (!dim || dim.clientScore == null) return;
    onMarkDirty?.();
    setDimensions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, rnScore: dim.clientScore, note: "" } : d))
    );
    setStatus(null);
  };

  /** Clear: set rnScore to null (only when baseline missing; Save remains blocked until RN selects). */
  const handleClearRnScore = (id: string) => {
    const dim = dimensions.find(d => d.id === id);
    if (!dim || dim.rnScore == null) return;
    if (dim.clientScore != null) return; // When baseline exists, use Reset instead
    onMarkDirty?.();
    setDimensions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, rnScore: null, note: "" } : d))
    );
    setStatus(null);
  };

  const hasLoggedBaseline = useRef(false);
  useEffect(() => {
    if (!loading && !hasLoggedBaseline.current) {
      hasLoggedBaseline.current = true;
      console.debug("[4Ps baseline/maxAllowed]", dimensions.map(d => ({ id: d.id, clientScore: d.clientScore, rnScore: d.rnScore, maxAllowed: (d.clientScore ?? d.rnScore ?? null) })));
    }
  }, [loading, dimensions]);

  const handleNoteChange = (id: string, value: string) => {
    onMarkDirty?.();
    setDimensions((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, note: value } : d
      )
    );
    setStatus(null);
  };

  // Check if any adjusted scores are missing required notes
  const getMissingNotes = (): string[] => {
    const missing: string[] = [];
    dimensions.forEach(dim => {
      const scoreChanged = dim.rnScore !== null && dim.clientScore !== null && dim.rnScore !== dim.clientScore;
      if (scoreChanged && !dim.note.trim()) {
        const def = FOUR_PS.find(p => p.id === dim.id);
        missing.push(def?.label || dim.id);
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
    const missingRnWhereBaselineMissing = dimensions.filter((d) => d.clientScore == null && d.rnScore == null);
    if (missingRnWhereBaselineMissing.length > 0) {
      setStatus("RN assessment required where client self-assessment is missing.");
      return;
    }

    const score = overallScore;
    if (!score) {
      setStatus("Please complete at least one P before saving.");
      return;
    }

    // Validate that all adjusted scores have notes
    const missingNotes = getMissingNotes();
    if (missingNotes.length > 0) {
      setStatus(`⚠️ Notes required for adjusted scores: ${missingNotes.join(", ")}. Please document why you changed the score from the client's assessment.`);
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      if (user?.id) {
        await assertRnAcceptanceGate({
          case_id: caseId,
          rn_user_id: user.id,
          actor_role: "rn",
        });
      }
      const physical = dimensions.find(d => d.id === 'physical');
      const psychological = dimensions.find(d => d.id === 'psychological');
      const psychosocial = dimensions.find(d => d.id === 'psychosocial');
      const professional = dimensions.find(d => d.id === 'professional');

      const expectedType = revisionMode ? 'reassessment' : 'intake';
      const wasUpdate = !!existingAssessmentId;
      const assessmentData = {
        case_id: caseId,
        assessment_type: expectedType,
        p1_physical: physical?.rnScore ?? physical?.clientScore ?? 3,
        p2_psychological: psychological?.rnScore ?? psychological?.clientScore ?? 3,
        p3_psychosocial: psychosocial?.rnScore ?? psychosocial?.clientScore ?? 3,
        p4_professional: professional?.rnScore ?? professional?.clientScore ?? 3,
        p1_notes: physical?.note || null,
        p2_notes: psychological?.note || null,
        p3_notes: psychosocial?.note || null,
        p4_notes: professional?.note || null,
        abuse_risk_flag: abuseRiskFlag,
        suicide_risk_flag: suicideRiskFlag,
        safety_notes: safetyNotes || null,
      };
      // Defensive: strip client_checkin_id so it is never sent (column does not exist on rc_fourps_assessments)
      const payload = { ...assessmentData } as Record<string, unknown>;
      delete payload.client_checkin_id;

      if (existingAssessmentId) {
        const { error: updateErr } = await supabaseUpdate(
          "rc_fourps_assessments",
          `id=eq.${existingAssessmentId}`,
          { ...payload, updated_at: new Date().toISOString() }
        );
        if (updateErr) throw updateErr;
      } else {
        const { data: insertData, error: insertErr } = await supabaseInsert<{ id: string }[]>(
          "rc_fourps_assessments",
          payload
        );
        if (insertErr) throw insertErr;
        const result = Array.isArray(insertData) ? insertData : insertData ? [insertData] : [];
        if (result.length > 0) {
          setExistingAssessmentId(result[0].id);
        }
      }
      // Refetch after save with same filter so UI state matches DB
      const { data: refetched, error: refetchErr } = await supabaseGet<unknown[]>(
        "rc_fourps_assessments",
        `case_id=eq.${caseId}&assessment_type=eq.${expectedType}&order=updated_at.desc&limit=1`
      );
      if (!refetchErr && refetched && Array.isArray(refetched) && refetched.length > 0) {
        const row = refetched[0] as {
          id: string;
          p1_physical?: SeverityScore;
          p2_psychological?: SeverityScore;
          p3_psychosocial?: SeverityScore;
          p4_professional?: SeverityScore;
          p1_notes?: string;
          p2_notes?: string;
          p3_notes?: string;
          p4_notes?: string;
        };
        setExistingAssessmentId(row.id);
        const rn = (saved: SeverityScore | null | undefined, client: SeverityScore | null) =>
          saved ?? (client != null ? client : null);
        setDimensions((prev) => [
          { id: 'physical', clientScore: prev[0].clientScore, rnScore: rn(row.p1_physical, prev[0].clientScore), note: row.p1_notes || '', clientCheckinDate: prev[0].clientCheckinDate, clientNote: prev[0].clientNote ?? null },
          { id: 'psychological', clientScore: prev[1].clientScore, rnScore: rn(row.p2_psychological, prev[1].clientScore), note: row.p2_notes || '', clientCheckinDate: prev[1].clientCheckinDate, clientNote: null },
          { id: 'psychosocial', clientScore: prev[2].clientScore, rnScore: rn(row.p3_psychosocial, prev[2].clientScore), note: row.p3_notes || '', clientCheckinDate: prev[2].clientCheckinDate, clientNote: null },
          { id: 'professional', clientScore: prev[3].clientScore, rnScore: rn(row.p4_professional, prev[3].clientScore), note: row.p4_notes || '', clientCheckinDate: prev[3].clientCheckinDate, clientNote: null },
        ]);
      }
      setStatus(wasUpdate ? "✓ 4Ps assessment updated." : "✓ 4Ps assessment saved.");
    } catch (error: any) {
      console.error("Failed to save 4Ps assessment:", error);
      setStatus(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Loading 4Ps assessment...
      </div>
    );
  }

  return (
    <div>
      {/* Temporary debug: confirm mode and assessment_type are stable on re-entry */}
      <p style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.5rem" }}>
        Mode: {revisionMode ? "Revision" : "Initial"} • assessment_type: {revisionMode ? "reassessment" : "intake"}
      </p>
      <div style={{ marginBottom: "0.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
          4Ps of Wellness – RN Assessment
          {isFollowUp && <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#0ea5e9", marginLeft: "0.5rem" }}>(Subsequent Care Plan)</span>}
        </h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "46rem", marginBottom: "0.5rem" }}>
          Score each P on the 1–5 severity scale, where <strong>1 = Critical / Very Poor</strong> and{" "}
          <strong>5 = Stable / Strong / Good</strong>. The overall 4Ps score follows the{" "}
          <strong>worst (lowest) P score</strong>, consistent with Maslow logic.
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
              Scoring Rule: Client Score is the Ceiling
            </div>
            <p style={{ fontSize: "0.8rem", color: "#78350f", margin: 0 }}>
              The client's self-assessment sets the <strong>maximum score</strong> for each P. 
              As the RN, you may <strong>decrease</strong> the score if your clinical assessment 
              indicates the client's condition is more severe than they reported — but you 
              <strong> cannot increase</strong> the score above what the client rated themselves.
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
              <strong>Example:</strong> If client rates P1 Physical as 4, you can select 1, 2, 3, or 4 — but not 5.
              <br />
              <strong>Why?</strong> The client's lived experience is the baseline. Clinical judgment can identify 
              concerns the client may not recognize, but cannot override their perception of stability.
              <br />
              <strong style={{ color: "#dc2626" }}>📝 Required:</strong> If you adjust any score, you <strong>must</strong> document 
              your clinical reasoning in the notes field explaining why you disagree with the client's self-assessment.
            </div>
          </div>
        </div>
      </div>

      {/* Overall score badge */}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.6rem 0.8rem",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          fontSize: "0.8rem",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#64748b", marginBottom: "0.1rem" }}>
            Overall 4Ps Severity (RN Assessment)
          </div>
          <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0f172a" }}>
            {overallScore ? (
              <>
                {severityLabel ? `${severityLabel} (${overallScore}/5)` : `Overall score: ${overallScore}/5`}
              </>
            ) : (
              "No scores yet"
            )}
          </div>
        </div>
        <div style={{ fontSize: "0.72rem", color: "#64748b", textAlign: "right" }}>
          The overall score follows the <strong>lowest (worst)</strong> P score.<br />
          A single critical domain destabilizes the whole picture.
        </div>
      </div>

      {/* 4Ps grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {dimensions.map((dim, dimIndex) => {
          const def = FOUR_PS.find((p) => p.id === dim.id);
          const label = def ? def.label : dim.id;
          const description = def ? def.definition : "";
          const maxAllowed = getMaxAllowed(dim.clientScore, dim.rnScore);
          const panelMissingBaseline = dim.clientScore == null;
          const scoreChanged = dim.rnScore !== null && dim.clientScore !== null && dim.rnScore !== dim.clientScore;
          const legacyAboveBaseline = dim.rnScore != null && dim.clientScore != null && dim.rnScore > dim.clientScore;
          const rnScore = dim.rnScore;
          if (dimIndex === 0) {
            console.debug("[RN score render]", { id: dim.id, rnScore, selectValue: rnScore == null ? "" : String(rnScore) });
          }

          return (
            <div
              key={dim.id}
              style={{
                borderRadius: "10px",
                border: scoreChanged ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                background: "#ffffff",
                padding: "0.75rem 0.9rem",
                fontSize: "0.8rem",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>
                {label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.5rem" }}>
                {description}
              </div>

              {/* Client Self-Assessment panel: baseline score + optional client notes (read-only). Red when missing baseline. */}
              <div style={{
                    padding: "0.5rem",
                    borderRadius: "6px",
                    marginBottom: "0.5rem",
                    ...(panelMissingBaseline
                      ? { background: "#fef2f2", border: "1px solid #fecaca" }
                      : { background: "#f0f9ff", border: "1px solid #bae6fd" }),
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.25rem", marginBottom: "0.2rem" }}>
                      <span style={{
                        fontSize: "0.7rem",
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.25rem" }}>
                      <span style={{
                        fontWeight: 600,
                        ...(panelMissingBaseline ? { color: "#991b1b" } : { color: "#0c4a6e" }),
                      }}>
                        {dim.clientScore !== null ? (
                          <>Client score: {dim.clientScore} — {getSeverityLabel(dim.clientScore) ?? ""}</>
                        ) : (
                          <>
                            Client self-assessment not completed — RN scoring required.
                          </>
                        )}
                      </span>
                      {dim.clientCheckinDate && (
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          {formatDate(dim.clientCheckinDate)}
                        </span>
                      )}
                    </div>
                    {dim.clientScore == null && (
                      <div style={{ fontSize: "0.72rem", color: "#b91c1c", marginTop: "0.25rem" }}>
                        Scores will remain blank until RN completes assessment.
                      </div>
                    )}
                    {dim.clientNote && (
                      <div style={{
                        marginTop: "0.35rem",
                        paddingTop: "0.35rem",
                        borderTop: panelMissingBaseline ? "1px solid #fecaca" : "1px solid #bae6fd",
                        fontSize: "0.75rem",
                        color: panelMissingBaseline ? "#991b1b" : "#0c4a6e",
                      }}>
                        Client note (general): {dim.clientNote}
                      </div>
                    )}
              </div>

              {/* RN's Score Selection — fail-closed: options above maxAllowed disabled; whole select disabled when baseline missing */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "0.5rem",
              }}>
                <label style={{ fontSize: "0.75rem", color: "#0f172a", minWidth: "7rem" }}>
                  RN Assessment:
                </label>
                <select
                  value={rnScore == null ? "" : String(rnScore)}
                  onChange={(e) => handleScoreChange(dim.id, e.target.value)}
                  disabled={readOnly}
                  style={{
                    padding: "0.25rem 0.4rem",
                    borderRadius: "6px",
                    border: scoreChanged ? "2px solid #f59e0b" : "1px solid #cbd5e1",
                    fontSize: "0.78rem",
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
                        {s} - {getSeverityLabel(s)}
                        {disabled ? " (above client — locked)" : ""}
                      </option>
                    );
                  })}
                </select>
                {!readOnly && (
                  dim.clientScore != null ? (
                    (dim.rnScore != null || dim.note.trim()) && (
                      <button
                        type="button"
                        onClick={() => handleResetRnScore(dim.id)}
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
                    dim.rnScore != null && (
                      <button
                        type="button"
                        onClick={() => handleClearRnScore(dim.id)}
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
                {scoreChanged && !legacyAboveBaseline && (
                  <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 600 }}>
                    ⚠️ Adjusted
                  </span>
                )}
                {legacyAboveBaseline && (
                  <span style={{ fontSize: "0.65rem", color: "#b45309", fontStyle: "italic" }}>
                    Legacy value above client baseline; cannot increase further.
                  </span>
                )}
              </div>

              {/* Helper when baseline missing + RN blank; otherwise standard explanation */}
              {panelMissingBaseline && dim.rnScore == null ? (
                <div style={{ fontSize: "0.7rem", color: "#b91c1c", fontWeight: 500, marginBottom: "0.4rem" }}>
                  No client baseline — RN assessment required. You can select any score 1–5.
                </div>
              ) : maxAllowed == null ? (
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.4rem" }}>
                  No baseline ceiling — you can select any score 1–5.
                </div>
              ) : (
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.4rem" }}>
                  RN may decrease scores but cannot increase above client self-assessment. You can select scores 1–{maxAllowed}.
                </div>
              )}

              {/* RN Notes — required when RN scores lower than client (downward adjustment) */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "#0f172a", marginBottom: "0.2rem" }}>
                  {scoreChanged ? "Rationale for RN adjustment (required)" : "RN Clinical Notes"}
                </label>
                <textarea
                  value={dim.note}
                  onChange={(e) => handleNoteChange(dim.id, e.target.value)}
                  readOnly={readOnly}
                  rows={3}
                  placeholder={scoreChanged 
                    ? "Document why you adjusted the score from the client's self-assessment..."
                    : "Document your clinical observations and agreement/rationale..."}
                  style={{
                    width: "100%",
                    borderRadius: "6px",
                    border: scoreChanged && !dim.note ? "2px solid #dc2626" : "1px solid #cbd5e1",
                    padding: "0.35rem 0.4rem",
                    fontSize: "0.78rem",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety Flags Section */}
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          borderRadius: "10px",
          border: "1px solid #fecaca",
          background: "#fef2f2",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "#991b1b" }}>
          ⚠️ Safety Flags
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "0.5rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <input
              type="checkbox"
              checked={abuseRiskFlag}
              onChange={(e) => { onMarkDirty?.(); setAbuseRiskFlag(e.target.checked); }}
              disabled={readOnly}
            />
            Abuse Risk Identified
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem" }}>
            <input
              type="checkbox"
              checked={suicideRiskFlag}
              onChange={(e) => { onMarkDirty?.(); setSuicideRiskFlag(e.target.checked); }}
              disabled={readOnly}
            />
            Suicide/Self-Harm Risk Identified
          </label>
        </div>
        {(abuseRiskFlag || suicideRiskFlag) && (
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", marginBottom: "0.2rem" }}>
              Safety Notes (required if flags checked)
            </label>
            <textarea
              value={safetyNotes}
              onChange={(e) => { onMarkDirty?.(); setSafetyNotes(e.target.value); }}
              readOnly={readOnly}
              rows={2}
              placeholder="Document safety concerns and interventions..."
              style={{
                width: "100%",
                borderRadius: "6px",
                border: "1px solid #fca5a5",
                padding: "0.35rem 0.4rem",
                fontSize: "0.78rem",
                resize: "vertical",
              }}
            />
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={handleSave}
          disabled={saving || readOnly}
          title={readOnly ? RN_VIEW_ONLY_TOOLTIP : undefined}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: "999px",
            border: "none",
            background: saving || readOnly ? "#94a3b8" : "#0f2a6a",
            color: "#ffffff",
            fontSize: "0.8rem",
            cursor: saving || readOnly ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : existingAssessmentId ? "Update 4Ps Assessment" : "Save 4Ps Assessment"}
        </button>
        {status && (
          <div
            style={{
              fontSize: "0.76rem",
              color: status.startsWith("✓") ? "#16a34a" : status.startsWith("Error") ? "#dc2626" : "#b45309",
              textAlign: "right",
              maxWidth: "60%",
            }}
          >
            {status}
          </div>
        )}
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_fourps_assessments table)
        {existingAssessmentId && ` • Assessment ID: ${existingAssessmentId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default FourPsScreen;
