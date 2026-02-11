// src/screens/rn/FinalizeCarePlanScreen.tsx
// Step 6 of RN Care Plan Workflow - Final attestation with skipped sections acknowledgment

/*
 * RN DRAFT DATA INTEGRITY AUDIT NOTES (Phase 1)
 * --------------------------------------------
 * Single source of truth for active draft:
 *   - plan: rc_care_plans by case_id, order=created_at.desc, limit=1 (current plan; draft when in revision).
 *   - plan.id, plan.status, plan.plan_type, plan.submitted_at, plan.updated_at.
 *   - Revision mode: plan_type === 'follow_up'. editModeEnabled / isRevisionInProgress from props/state.
 *
 * 4Ps: rc_fourps_assessments case_id + assessment_type (intake vs reassessment) via supabaseGet + auth token ✅
 * SDOH: rc_sdoh_assessments case_id + assessment_type (initial vs reassessment) via auth token ✅
 * Overlays: rc_overlay_selections scoped to plan.id (draft) ✅
 * Guidelines: rc_guideline_references scoped to plan.id (draft) ✅
 * 10-Vs: draft doc key care-plan-drafts/{caseId}.json (storage); rc_care_plan_vs by care_plan_id ✅
 * Finalize: completion checks use current draft only (4Ps/SDOH assessment_type, plan.id for overlays/guidelines/10Vs) ✅
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAutoNoteAsUser, generateCarePlanCompletionNote } from "@/lib/autoNotes";
import { isUnableToReach, isParticipationUndetermined, getMedicalNecessityHardStopReason, ensureRcCarePlanRow, deriveParticipationStatusFromDraft, getEditWindowHoursFromParticipation, formatEditWindowEndsAt } from "@/lib/tenVsHelpers";
import { RN_VIEW_ONLY_TOOLTIP } from "@/components/rn/RNCaseStateBadge";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet } from "@/lib/supabaseRest";
import { toast } from "sonner";
import { TEN_VS_OPERATIONAL_GUIDE, getVDefinitionById } from "@/config/tenVsOperationalGuide";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface CompletionStatus {
  fourps: { completed: boolean; score?: number; assessedAt?: string };
  sdoh: { completed: boolean; score?: number; assessedAt?: string };
  overlays: { completed: boolean; count?: number };
  guidelines: { completed: boolean; count?: number; hasDeviations?: boolean };
  tenvs: {
    v1: boolean; v2: boolean; v3: boolean; v4: boolean; v5: boolean;
    v6: boolean; v7: boolean; v8: boolean; v9: boolean; v10: boolean;
  };
}

interface CaseSummary {
  caseNumber?: string;
  clientName?: string;
  dateOfInjury?: string;
}

const ATTESTATION_TEXT = `I attest that I have completed all pertinent portions of this care plan and this finalized version represents what is most appropriate at this time as a treatment path.`;

const BEGIN_EDITS_REASONS = [
  { value: "client_feedback", label: "Client feedback" },
  { value: "documentation_correction", label: "Documentation correction" },
  { value: "clinical_update", label: "Clinical update" },
  { value: "administrative_correction", label: "Administrative correction" },
  { value: "other", label: "Other" },
] as const;

interface FinalizeCarePlanScreenProps {
  readOnly?: boolean;
  isDirty?: boolean;
  carePlanSubmitted?: boolean;
  editWindowOpen?: boolean;
  onBeginEditsConfirm?: () => void;
  editModeEnabled?: boolean;
  onFinalizeComplete?: () => void;
}

const H_REFUSAL_LOCK_MSG =
  "Care Plan Refused has been recorded. Care plan editing and submission are locked. Intake Snapshot and existing documents remain viewable.";

const SECTION_NAMES: Record<string, string> = {
  fourps: "4Ps Assessment",
  sdoh: "SDOH Assessment",
  overlays: "Condition Overlays",
  guidelines: "Guidelines Reference",
  v1: "V1: Voice/View",
  v2: "V2: Viability",
  v3: "V3: Vision",
  v4: "V4: Veracity",
  v5: "V5: Versatility",
  v6: "V6: Vitality",
  v7: "V7: Vigilance",
  v8: "V8: Verification",
  v9: "V9: Value",
  v10: "V10: Validation",
};

const FinalizeCarePlanScreen: React.FC<FinalizeCarePlanScreenProps> = ({
  readOnly = false,
  isDirty = false,
  carePlanSubmitted = false,
  editWindowOpen = false,
  onBeginEditsConfirm,
  editModeEnabled = false,
  onFinalizeComplete,
}) => {
  // A) Hooks / state at top of component (must run first; no derived booleans above state they use)
  const { caseId: caseIdParam } = useParams<{ caseId: string }>();
  const caseId = caseIdParam ?? (typeof window !== "undefined" ? window.localStorage.getItem("rcms_active_case_id") : null);
  const navigate = useNavigate();

  const [showBeginEditsModal, setShowBeginEditsModal] = useState(false);
  const [beginEditsReason, setBeginEditsReason] = useState<string>("");
  const [beginEditsNote, setBeginEditsNote] = useState("");
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>({
    fourps: { completed: false },
    sdoh: { completed: false },
    overlays: { completed: false },
    guidelines: { completed: false },
    tenvs: {
      v1: false, v2: false, v3: false, v4: false, v5: false,
      v6: false, v7: false, v8: false, v9: false, v10: false,
    },
  });
  const [caseSummary, setCaseSummary] = useState<CaseSummary>({});
  const [skippedSections, setSkippedSections] = useState<string[]>([]);
  const [acknowledgedSkipped, setAcknowledgedSkipped] = useState(false);
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [attesterName, setAttesterName] = useState("");
  const [attesterCredentials, setAttesterCredentials] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [carePlanId, setCarePlanId] = useState<string | null>(null);
  const [alreadyFinalized, setAlreadyFinalized] = useState(false);
  /** Set when plan is submitted/approved; used for "Edits allowed until" and reminder. */
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  /** From rc_care_plans.participation_status when submitted; used for edit-window hours (do not read V2 after submission). */
  const [participationStatus, setParticipationStatus] = useState<string | null>(null);
  const [unableToReach, setUnableToReach] = useState(false);
  /** V8 slice from 10-Vs draft (storage) for eligibility; null when not loaded or unavailable. */
  const [v8Draft, setV8Draft] = useState<unknown>(null);
  /** Revision detection: same as CarePlanWorkflow/FourPsScreen — plan_type === 'follow_up' only (no new heuristics). */
  const [isRevisionInProgress, setIsRevisionInProgress] = useState<boolean>(false);
  const [requiredVs, setRequiredVs] = useState<string[]>([]);
  /** Revision number when in revision mode (e.g. 2 for "Revision #2"); null for initial. From existing metadata. */
  const [revisionNumber, setRevisionNumber] = useState<number | null>(null);
  /** True when 4Ps/SDOH (current draft assessment_type) have updated_at newer than last released plan. */
  const [hasRevisionChangesFromAssessments, setHasRevisionChangesFromAssessments] = useState(false);
  /** True when current draft row's updated_at is newer than last released plan (overlays/guidelines/10Vs saves). */
  const [hasRevisionChangesFromDraft, setHasRevisionChangesFromDraft] = useState(false);
  /** True after successful submit; shows success UI with "Back to Work Queue". */
  const [submitSucceeded, setSubmitSucceeded] = useState(false);
  /** When set, show actionable error UI (headline, next step, collapsed detail). Cleared on retry. */
  const [submitError, setSubmitError] = useState<{ detail: string } | null>(null);

  // B) Base booleans/values (defined before derived)
  /** Combined signal: isDirty (in-memory) OR persisted 4Ps/SDOH OR current draft row updated (no false "no changes"). */
  const hasRevisionChanges = isDirty || hasRevisionChangesFromAssessments || hasRevisionChangesFromDraft;

  /** Form disabled when read-only or when finalized and edits have not begun (RN must click "Begin edits" first). */
  const formDisabled = readOnly || (carePlanSubmitted && !editModeEnabled);

  // C) Derived booleans LAST (after all state and base values they depend on)
  // FINALIZE RELEASED VIEW CHECK: If released and no draft, Begin edits CTA is visible + clickable (not inside pointer-events-none).
  const isReleasedView = carePlanSubmitted;
  const hasActiveDraft = editModeEnabled || isRevisionInProgress;
  const shouldShowBeginEditsCta = isReleasedView && !hasActiveDraft;

  // Load completion status
  useEffect(() => {
    async function loadData() {
      if (!caseId) {
        setLoading(false);
        setStatus("No active case selected. Please select a case first.");
        return;
      }

      try {
        // Get case info (authenticated REST)
        const { data: caseResult, error: caseErr } = await supabaseGet<unknown[]>(
          "rc_cases",
          `id=eq.${caseId}&is_superseded=eq.false&select=case_number,client_id,date_of_injury`
        );
        if (caseErr) throw caseErr;
        if (caseResult && caseResult.length > 0) {
          const caseData = caseResult[0] as { case_number?: string; client_id?: string; date_of_injury?: string };
          let clientName = "Unknown Client";
          
          if (caseData.client_id) {
            const { data: clientResult, error: clientErr } = await supabaseGet<unknown[]>(
              "rc_clients",
              `id=eq.${caseData.client_id}&select=first_name,last_name`
            );
            if (!clientErr && clientResult && clientResult.length > 0) {
              const c = clientResult[0] as { first_name?: string; last_name?: string };
              clientName = `${c.first_name || ''} ${c.last_name || ''}`.trim();
            }
          }
          
          setCaseSummary({
            caseNumber: caseData.case_number,
            clientName,
            dateOfInjury: caseData.date_of_injury,
          });
        }

        // Get care plan; if none exists, ensure row (defensive guard so submit can UPDATE)
        const { data: planResult, error: planErr } = await supabaseGet<unknown[]>(
          "rc_care_plans",
          `case_id=eq.${caseId}&order=created_at.desc&limit=1`
        );
        if (planErr) throw planErr;
        let plan: { id: string; status?: string; plan_type?: string; previous_care_plan_id?: string } | null = (planResult && planResult.length > 0) ? (planResult[0] as { id: string; status?: string; plan_type?: string; previous_care_plan_id?: string }) : null;
        if (!plan && caseId) {
          try {
            const { carePlanId: id } = await ensureRcCarePlanRow({ supabase, caseId, carePlanId: null });
            setCarePlanId(id);
            plan = { id, status: 'draft' };
          } catch (e) {
            console.error('FinalizeCarePlanScreen: ensureRcCarePlanRow failed', e);
            toast.error('Care plan could not be saved. Please try again.');
            setStatus('Error: Could not ensure care plan row.');
            setLoading(false);
            return;
          }
        }
        if (plan) {
          setCarePlanId(plan.id);

          // Revision detection: same as CarePlanWorkflow/FourPsScreen — ONLY plan_type === 'follow_up' (no new heuristics).
          const revisionMode = plan.plan_type === 'follow_up';
          setIsRevisionInProgress(!!revisionMode);

          // Revision number: from existing metadata (count of released plans + 1 for this release).
          if (revisionMode) {
            try {
              const { data: releasedCountResult, error: releasedErr } = await supabaseGet<unknown[]>(
                "rc_care_plans",
                `case_id=eq.${caseId}&status=in.(submitted,approved)&select=id`
              );
              if (!releasedErr && releasedCountResult) {
                const releasedCount = Array.isArray(releasedCountResult) ? releasedCountResult.length : 0;
                setRevisionNumber(releasedCount + 1);
              } else {
                setRevisionNumber(null);
              }
            } catch {
              setRevisionNumber(null); // show "REVISION (in progress)" without number
            }
          } else {
            setRevisionNumber(null);
          }

          // Required V set: follow-up/revision requires all Vs; initial plan V1,V2,V3,V8,V9,V10.
          if (revisionMode) {
            setRequiredVs(TEN_VS_OPERATIONAL_GUIDE.map(v => v.id));
          } else {
            setRequiredVs(['V1', 'V2', 'V3', 'V8', 'V9', 'V10']);
          }

          if (plan.status === 'submitted' || plan.status === 'approved') {
            setAlreadyFinalized(true);
            setSubmittedAt((plan as { submitted_at?: string }).submitted_at ?? null);
            setParticipationStatus((plan as { participation_status?: string }).participation_status ?? 'unknown');
          }

          // Completion status: evaluate CURRENT DRAFT only (same sources as FourPsScreen/SDOHScreen — not last released).
          // 4Ps: rc_fourps_assessments by case_id + assessment_type (reassessment when revision, intake when initial).
          // SDOH: rc_sdoh_assessments by case_id + assessment_type (reassessment when revision, initial when not).
          const expectedFourPsType = revisionMode ? 'reassessment' : 'intake';
          const expectedSdohType = revisionMode ? 'reassessment' : 'initial';
          const { data: fourpsResult, error: fourpsErr } = await supabaseGet<unknown[]>(
            "rc_fourps_assessments",
            `case_id=eq.${caseId}&assessment_type=eq.${expectedFourPsType}&order=updated_at.desc&limit=1`
          );
          if (fourpsErr) throw fourpsErr;
          const fourpsCompleted = fourpsResult && fourpsResult.length > 0;

          const { data: sdohResult, error: sdohErr } = await supabaseGet<unknown[]>(
            "rc_sdoh_assessments",
            `case_id=eq.${caseId}&assessment_type=eq.${expectedSdohType}&order=updated_at.desc&limit=1`
          );
          if (sdohErr) throw sdohErr;
          const sdohCompleted = sdohResult && sdohResult.length > 0;

          // "No changes to re-submit" fix: derive changed from current draft state (4Ps/SDOH + draft row), not released artifacts.
          if (revisionMode) {
            try {
              const { data: priorReleasedResult, error: priorErr } = await supabaseGet<unknown[]>(
                "rc_care_plans",
                `case_id=eq.${caseId}&status=in.(submitted,approved)&select=submitted_at,updated_at&order=created_at.desc&limit=1`
              );
              if (priorErr) throw priorErr;
              const priorReleased = priorReleasedResult && priorReleasedResult.length > 0 ? (priorReleasedResult[0] as { submitted_at?: string; updated_at?: string }) : null;
              const baseline = priorReleased?.submitted_at || priorReleased?.updated_at;
              if (baseline) {
                const baselineTs = new Date(baseline).getTime();
                const fourpsRow = fourpsResult?.[0] as { updated_at?: string } | undefined;
                const sdohRow = sdohResult?.[0] as { updated_at?: string } | undefined;
                const fourpsUpdated = fourpsRow?.updated_at ? new Date(fourpsRow.updated_at).getTime() : 0;
                const sdohUpdated = sdohRow?.updated_at ? new Date(sdohRow.updated_at).getTime() : 0;
                setHasRevisionChangesFromAssessments(fourpsUpdated > baselineTs || sdohUpdated > baselineTs);
              } else {
                setHasRevisionChangesFromAssessments(false);
              }
              // Draft row updated (overlays/guidelines/10Vs) newer than last release = has changes.
              const planUpdated = (plan as { updated_at?: string }).updated_at;
              const priorTs = priorReleased?.submitted_at || (priorReleased as { updated_at?: string })?.updated_at;
              if (plan.status === 'draft' && priorTs && planUpdated) {
                setHasRevisionChangesFromDraft(new Date(planUpdated).getTime() > new Date(priorTs).getTime());
              } else {
                setHasRevisionChangesFromDraft(false);
              }
            } catch {
              setHasRevisionChangesFromAssessments(false);
              setHasRevisionChangesFromDraft(false);
            }
          } else {
            setHasRevisionChangesFromAssessments(false);
            setHasRevisionChangesFromDraft(false);
          }
          
          // Check overlays (plan-scoped to current draft)
          const { data: overlaysResult, error: overlaysErr } = await supabaseGet<unknown[]>(
            "rc_overlay_selections",
            `care_plan_id=eq.${plan.id}`
          );
          if (overlaysErr) throw overlaysErr;
          const overlaysCompleted = overlaysResult && overlaysResult.length > 0;
          
          // Check guidelines (plan-scoped to current draft)
          const { data: guidelinesResult, error: guidelinesErr } = await supabaseGet<unknown[]>(
            "rc_guideline_references",
            `care_plan_id=eq.${plan.id}`
          );
          if (guidelinesErr) throw guidelinesErr;
          const guidelinesCompleted = guidelinesResult && guidelinesResult.length > 0;
          const hasDeviations = (guidelinesResult as { deviates_from_guideline?: boolean }[] | undefined)?.some((g) => g.deviates_from_guideline) || false;
          
          // Check 10Vs completion (plan-scoped)
          const { data: tenvResult, error: tenvErr } = await supabaseGet<unknown[]>(
            "rc_care_plan_vs",
            `care_plan_id=eq.${plan.id}`
          );
          if (tenvErr) throw tenvErr;
          const completedVs = new Set((tenvResult as { v_key?: string }[] | undefined)?.map((v) => v.v_key) || []);

          const fourpsRow0 = fourpsResult?.[0] as { p1_physical?: number; p2_psychological?: number; p3_psychosocial?: number; p4_professional?: number; assessed_at?: string } | undefined;
          const sdohRow0 = sdohResult?.[0] as { overall_score?: number; assessed_at?: string } | undefined;
          setCompletionStatus({
            fourps: {
              completed: fourpsCompleted,
              score: fourpsRow0 ? Math.min(
                fourpsRow0.p1_physical ?? 5,
                fourpsRow0.p2_psychological ?? 5,
                fourpsRow0.p3_psychosocial ?? 5,
                fourpsRow0.p4_professional ?? 5
              ) : undefined,
              assessedAt: fourpsRow0?.assessed_at,
            },
            sdoh: {
              completed: sdohCompleted,
              score: sdohRow0?.overall_score,
              assessedAt: sdohRow0?.assessed_at,
            },
            overlays: {
              completed: overlaysCompleted,
              count: overlaysResult?.length || 0,
            },
            guidelines: {
              completed: guidelinesCompleted,
              count: guidelinesResult?.length || 0,
              hasDeviations,
            },
            tenvs: {
              v1: completedVs.has('voice_view'),
              v2: completedVs.has('viability'),
              v3: completedVs.has('vision'),
              v4: completedVs.has('veracity'),
              v5: completedVs.has('versatility'),
              v6: completedVs.has('vitality'),
              v7: completedVs.has('vigilance'),
              v8: completedVs.has('verification'),
              v9: completedVs.has('value'),
              v10: completedVs.has('validation'),
            },
          });

          // Calculate skipped sections
          const skipped: string[] = [];
          if (!fourpsCompleted) skipped.push('fourps');
          if (!sdohCompleted) skipped.push('sdoh');
          if (!overlaysCompleted) skipped.push('overlays');
          if (!guidelinesCompleted) skipped.push('guidelines');
          
          // Check mandatory Vs (V1, V2, V3, V8, V9, V10)
          if (!completedVs.has('voice_view')) skipped.push('v1');
          if (!completedVs.has('viability')) skipped.push('v2');
          if (!completedVs.has('vision')) skipped.push('v3');
          if (!completedVs.has('verification')) skipped.push('v8');
          if (!completedVs.has('value')) skipped.push('v9');
          if (!completedVs.has('validation')) skipped.push('v10');
          
          // Check triggered Vs (V4, V5, V6, V7) - these are optional based on triggers
          // For now we'll note them but not require them
          
          setSkippedSections(skipped);
        }

        // Check 10-Vs draft from storage for "Unable to reach" disclaimer and V8 eligibility
        try {
          const { data, error } = await supabase.storage.from('rcms-documents').download(`care-plan-drafts/${caseId}.json`);
          if (!error && data) {
            const text = await data.text();
            const draft = JSON.parse(text);
            if (isParticipationUndetermined(draft) || isUnableToReach(draft)) setUnableToReach(true);
            setV8Draft(draft);
          } else {
            setV8Draft(null);
          }
        } catch (_) {
          setV8Draft(null);
        }
      } catch (error) {
        console.error("Failed to load completion status:", error);
        setStatus("Error loading data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [caseId]);

  const isHRefusalRecorded = Boolean(v8Draft?.v2_viability?.refusal_recorded_at);

  /** Reasons that release is disabled (same logic as canSubmit). Shown in "Why can't I release?" when buttons disabled. */
  const getReleaseBlockReasons = (): string[] => {
    const reasons: string[] = [];
    if (isHRefusalRecorded) {
      reasons.push("Care plan refused has been recorded; release is locked.");
      return reasons;
    }
    if (carePlanSubmitted && !hasRevisionChanges) {
      reasons.push("No changes to re-submit. Make at least one change to release a revision.");
    }
    if (!attestationChecked) reasons.push("Attestation not agreed.");
    if (!attesterName.trim()) reasons.push("Your name is required.");
    if (!attesterCredentials.trim()) reasons.push("Credentials are required.");
    if (skippedSections.length > 0 && !acknowledgedSkipped) {
      reasons.push("Skipped sections must be acknowledged.");
    }
    if (skippedSections.includes('fourps') || skippedSections.includes('sdoh')) {
      reasons.push("Required RN assessments incomplete (4Ps/SDOH missing scores).");
    }
    const medNec = getMedicalNecessityHardStopReason(v8Draft ?? {});
    if (medNec.blocked && medNec.reason) reasons.push(medNec.reason);
    if (requiredVs.length > 0 && v8Draft) {
      const draft = v8Draft as { v3_vision?: { phase1_required_v_ack?: Record<string, { status: "addressed" | "na"; reason?: string; note?: string; }> } };
      const phase1Acks = draft.v3_vision?.phase1_required_v_ack || {};
      const missingVs: string[] = [];
      for (const vId of requiredVs) {
        const ack = phase1Acks[vId];
        if (!ack || !ack.status) missingVs.push(vId);
        else if (ack.status === 'na' && (!ack.reason || (ack.reason === 'other' && !ack.note?.trim()))) missingVs.push(vId);
      }
      if (missingVs.length > 0) {
        reasons.push("Required 10-V acknowledgments incomplete (Addressed or N/A with reason).");
      }
    }
    return reasons;
  };

  const canSubmit = (): boolean => {
    if (isHRefusalRecorded) return false;
    // Must not allow submit when finalized and no changes (or when in edit mode but not yet dirty).
    if (carePlanSubmitted && !hasRevisionChanges) return false;
    if (!attestationChecked) return false;
    if (!attesterName.trim()) return false;
    if (!attesterCredentials.trim()) return false;
    if (skippedSections.length > 0 && !acknowledgedSkipped) return false;
    const medNec = getMedicalNecessityHardStopReason(v8Draft ?? {});
    if (medNec.blocked) return false;
    
    // Phase 1: Check required V acknowledgments
    if (requiredVs.length > 0 && v8Draft) {
      const draft = v8Draft as { v3_vision?: { phase1_required_v_ack?: Record<string, { status: "addressed" | "na"; reason?: string; note?: string; }> } };
      const phase1Acks = draft.v3_vision?.phase1_required_v_ack || {};
      
      for (const vId of requiredVs) {
        const ack = phase1Acks[vId];
        if (!ack || !ack.status) {
          return false; // Missing acknowledgment
        }
        if (ack.status === 'na') {
          if (!ack.reason) {
            return false; // N/A requires a reason
          }
          if (ack.reason === 'other' && !ack.note?.trim()) {
            return false; // "Other" requires a note
          }
        }
      }
    }
    
    return true;
  };

  // --- RN SUBMISSION / ATTESTATION STATE MAP ---
  // Attestation: checkbox (attestationChecked), name (attesterName), credentials (attesterCredentials),
  // skipped-sections ack (acknowledgedSkipped when skippedSections.length > 0). Blockers: getReleaseBlockReasons / canSubmit.
  // Draft -> Submitted/Released: rc_care_plans.status draft -> submitted; attestation inserted; onFinalizeComplete() called.
  // Post-submit routing: success UI shows "Back to Work Queue" -> navigate(/rn/queue). No "Pending" loop; deterministic.
  //
  // RN SUBMISSION REGRESSION CHECKLIST:
  // - [ ] Attestation required before submit (name, credentials, agree checkbox; skipped ack if any).
  // - [ ] Blockers reflect current draft (no changes, 4Ps/SDOH, 10-V acks, medical necessity, etc.).
  // - [ ] Success shows "Back to Work Queue" and post-submit route is deterministic (/rn/queue).
  // - [ ] Revision success copy says "Revision submitted successfully"; initial says "Submitted successfully."
  // - [ ] RN queue status label is truthful (see rnStatusLabels.ts).

  const handleSubmit = async () => {
    if (isHRefusalRecorded) {
      toast.info(H_REFUSAL_LOCK_MSG);
      return;
    }
    if (!canSubmit()) return;
    const medNec = getMedicalNecessityHardStopReason(v8Draft ?? {});
    if (medNec.blocked) {
      toast.error(medNec.reason ?? 'Medical Necessity hard stop');
      return;
    }
    let planId = carePlanId;
    if (!planId && caseId) {
      try {
        const { carePlanId: id } = await ensureRcCarePlanRow({ supabase, caseId, carePlanId: null });
        planId = id;
        setCarePlanId(id);
      } catch (e) {
        console.error('FinalizeCarePlanScreen: ensureRcCarePlanRow failed (submit)', e);
        toast.error('Care plan could not be saved. Please try again.');
        return;
      }
    }
    if (!planId) return;

    setSubmitting(true);
    setStatus(null);
    setSubmitError(null);
    setSubmitSucceeded(false);

    try {
      // Create attestation record (authenticated session for RLS)
      const { error: attErr } = await supabase.from('rc_care_plan_attestations').insert({
        care_plan_id: planId,
        attestation_text: ATTESTATION_TEXT,
        skipped_sections: skippedSections,
        skipped_sections_acknowledged: skippedSections.length > 0 ? acknowledgedSkipped : true,
        fourps_completed: completionStatus.fourps.completed,
        sdoh_completed: completionStatus.sdoh.completed,
        overlays_reviewed: completionStatus.overlays.completed,
        guidelines_reviewed: completionStatus.guidelines.completed,
        tenvs_completed: Object.values(completionStatus.tenvs).some(v => v),
        v1_completed: completionStatus.tenvs.v1,
        v2_completed: completionStatus.tenvs.v2,
        v3_completed: completionStatus.tenvs.v3,
        v4_completed: completionStatus.tenvs.v4,
        v5_completed: completionStatus.tenvs.v5,
        v6_completed: completionStatus.tenvs.v6,
        v7_completed: completionStatus.tenvs.v7,
        v8_completed: completionStatus.tenvs.v8,
        v9_completed: completionStatus.tenvs.v9,
        v10_completed: completionStatus.tenvs.v10,
        attested_at: new Date().toISOString(),
        attester_name: attesterName,
        attester_credentials: attesterCredentials,
      });
      if (attErr) throw attErr;

      // Get case and care plan info for auto-note
      const { data: caseInfo } = await supabase.from('rc_cases').select('id,client_id').eq('id', caseId).eq('is_superseded', false).maybeSingle();
      const clientId = caseInfo?.client_id || null;

      // Check if this is initial or updated care plan
      const { data: existingPlans } = await supabase.from('rc_care_plans').select('*').eq('case_id', caseId).eq('status', 'submitted').order('created_at', { ascending: true });
      const existingSubmittedPlans = existingPlans || [];
      const isInitial = existingSubmittedPlans.length === 0;

      const noteTypePrefix = isInitial ? 'care_plan_initial_completed' : 'care_plan_updated_completed';
      const { data: existingNotes } = await supabase.from('rc_case_notes').select('*').eq('case_id', caseId).eq('note_type', noteTypePrefix).order('created_at', { ascending: false }).limit(5);
      const hasExistingNote = (existingNotes || []).some((note: { note_type?: string; content?: string }) =>
        note.note_type === noteTypePrefix && note.content && note.content.includes(planId!.slice(0, 8))
      );

      // Update care plan status to submitted (authenticated session for RLS)
      // Stamp participation_status from V2 viability at finalize (single source of truth; no extra RN input)
      // TEMP: After deploy, finalize once, open DevTools Console, copy the [CARE][FINALIZE] logs and paste into ChatGPT. Then remove logs in the next patch.
      console.log('[CARE][FINALIZE] caseId', caseId);
      console.log('[CARE][FINALIZE] draftVarName=v8Draft', v8Draft);
      console.log('[CARE][FINALIZE] has v2_viability?', !!(v8Draft?.v2_viability));
      console.log('[CARE][FINALIZE] v2_viability snapshot', v8Draft?.v2_viability);
      console.log('[CARE][FINALIZE] candidate fields', {
        participation_primary: v8Draft?.v2_viability?.participation_primary,
        participationPrimary: v8Draft?.v2_viability?.participationPrimary,
        participation: v8Draft?.v2_viability?.participation,
        client_participation: v8Draft?.v2_viability?.client_participation
      });
      const participation = deriveParticipationStatusFromDraft(v8Draft);
      console.log('[CARE][FINALIZE] derived participation_status', participation);
      const submittedAtIso = new Date().toISOString();
      const { error: patchErr } = await supabase.from('rc_care_plans').update({
        status: 'submitted',
        submitted_at: submittedAtIso,
        participation_status: participation,
        updated_at: new Date().toISOString(),
      }).eq('id', planId);
      if (patchErr) throw patchErr;

      // Create CARE-internal reminder for edit-window end (existing care_plan_reminders table; no schema changes)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const editWindowHours = getEditWindowHoursFromParticipation(participation);
          const editWindowEndsAt = new Date(new Date(submittedAtIso).getTime() + editWindowHours * 3600000);
          const rd = editWindowEndsAt;
          const reminderDate = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
          const reminderTime = `${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}:${String(rd.getSeconds()).padStart(2, '0')}`;
          await supabase.from('care_plan_reminders').insert({
            reminder_type: 'custom',
            title: 'Care plan edit window ends',
            description: `${caseSummary.caseNumber || caseId?.slice(0, 8)} • ${caseSummary.clientName || 'Client'}`,
            reminder_date: reminderDate,
            reminder_time: reminderTime,
            status: 'pending',
            rn_id: user.id,
            case_id: caseId ?? undefined,
            care_plan_id: null,
            priority: 'high',
            metadata: { type: 'care_plan', case_id: caseId, care_plan_id: planId },
          });
        }
      } catch (remErr) {
        console.warn('FinalizeCarePlanScreen: could not create care plan edit-window reminder', remErr);
      }

      setSubmittedAt(submittedAtIso);
      setParticipationStatus(participation);
      const { data: updatedPlan } = await supabase.from('rc_care_plans').select('pdf_url').eq('id', planId).single();
      const pdfUrl = updatedPlan?.pdf_url || null;

      if (!hasExistingNote && caseId) {
        try {
          const noteContent = generateCarePlanCompletionNote(isInitial, pdfUrl, planId);
          const r = await createAutoNoteAsUser({
            caseId: caseId,
            noteType: isInitial ? 'care_plan_initial_completed' : 'care_plan_updated_completed',
            title: isInitial ? 'Initial care plan completed — document attached.' : 'Updated care plan completed — document attached.',
            content: noteContent,
            triggerEvent: isInitial ? 'care_plan_initial_completed' : 'care_plan_updated_completed',
            visibleToRN: true,
            visibleToAttorney: true,
            documentUrl: pdfUrl,
            clientId: clientId,
          });
          if (!r.ok) console.error('Failed to create care plan completion auto-note:', r.error);
        } catch (noteError) {
          console.error('Failed to create care plan completion auto-note:', noteError);
        }
      }

      setAlreadyFinalized(true);
      setSubmitSucceeded(true);
      setStatus(null);
      setSubmitError(null);
      if (isRevisionInProgress) {
        toast.success("Revision submitted successfully.");
      } else {
        toast.success("Care plan submitted successfully.");
      }
      onFinalizeComplete?.();
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error("FinalizeCarePlanScreen: Failed to submit care plan:", err);
      const detail = err.message || String(error);
      setSubmitError({ detail });
      setStatus(null);
      setSubmitSucceeded(false);
      toast.error("Submission failed. Please retry. If it persists, contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleBeginEditsConfirm = () => {
    if (!beginEditsReason.trim()) {
      toast.error("Please select a reason.");
      return;
    }
    onBeginEditsConfirm?.();
    setShowBeginEditsModal(false);
    setBeginEditsReason("");
    setBeginEditsNote("");
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading care plan status...</div>;
  }

  return (
    <div>
      {/* Begin edits CTA: always visible when released view with no active draft (outside pointer-events-none). */}
      {shouldShowBeginEditsCta && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{
            marginBottom: "0.75rem", padding: "0.75rem 1rem", borderRadius: "8px",
            background: "#fef3c7", border: "1px solid #f59e0b", color: "#92400e"
          }}>
            <strong>This plan is finalized. No edits are in progress.</strong>
          </div>
          <div style={{
            padding: "1.25rem 1.5rem", borderRadius: "12px",
            border: "2px solid #e2e8f0", background: "#f8fafc"
          }}>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.9rem", color: "#475569" }}>
              To change this care plan, start a revision. You will need to re-finalize after making changes.
            </p>
            {onBeginEditsConfirm && (
              <button
                type="button"
                onClick={() => { setBeginEditsReason(""); setBeginEditsNote(""); setShowBeginEditsModal(true); }}
                style={{
                  padding: "0.5rem 1.25rem", borderRadius: "8px", border: "none",
                  background: "#0f172a", color: "#ffffff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                }}
              >
                Begin edits (start revision)
              </button>
            )}
          </div>
        </div>
      )}

      {/* Revision in progress: clear state so RN knows they are updating the current draft (no "Begin Edit" here). */}
      {isRevisionInProgress && !shouldShowBeginEditsCta && (
        <div style={{
          marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "8px",
          background: "#e0f2fe", border: "1px solid #0ea5e9", color: "#0369a1"
        }}>
          <strong>Revision in progress.</strong> This is a correction-only revision draft. Update the current draft (4Ps, SDOH, overlays, guidelines, 10-Vs as needed), then re-finalize to submit.
        </div>
      )}

      {/* Begin edits confirm modal — reason required, optional note */}
      <AlertDialog open={showBeginEditsModal} onOpenChange={setShowBeginEditsModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Begin edits to a finalized care plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Edits are allowed within the current window. Any saved changes must be re-finalized to create a new released version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>
              Reason <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select
              value={beginEditsReason}
              onChange={(e) => setBeginEditsReason(e.target.value)}
              required
              style={{
                width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px",
                border: "1px solid #cbd5e1", fontSize: "0.9rem"
              }}
            >
              <option value="">Select…</option>
              {BEGIN_EDITS_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Note (optional, max 200 characters)</label>
            <textarea
              value={beginEditsNote}
              onChange={(e) => setBeginEditsNote(e.target.value.slice(0, 200))}
              maxLength={200}
              rows={2}
              placeholder="Optional note…"
              style={{
                width: "100%", padding: "0.4rem 0.5rem", borderRadius: "6px",
                border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical"
              }}
            />
            {beginEditsNote.length > 0 && (
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{beginEditsNote.length}/200</span>
            )}
          </div>
          <AlertDialogFooter style={{ marginTop: "1rem" }}>
            <AlertDialogCancel onClick={() => { setBeginEditsReason(""); setBeginEditsNote(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBeginEditsConfirm}>Begin edits</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit mode enabled banner — after user has clicked Begin edits (when not already in revision draft) */}
      {editModeEnabled && !isRevisionInProgress && (
        <div style={{
          marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "8px",
          background: "#dbeafe", border: "1px solid #0ea5e9", color: "#0369a1"
        }}>
          <strong>Edit mode enabled (within allowed window).</strong> Save changes, then re-finalize to release an updated version.
        </div>
      )}
      {/* Finalize form area — greyed and non-interactive when formDisabled (finalized and edits not begun) */}
      <div style={{
        opacity: formDisabled ? 0.7 : 1,
        pointerEvents: formDisabled ? "none" : undefined,
      }}>
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {isRevisionInProgress && (
            <span style={{
              fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.05em", color: "#0c4a6e",
              padding: "0.35rem 0.75rem", borderRadius: "6px", background: "#e0f2fe", border: "1px solid #0ea5e9"
            }}>
              {revisionNumber != null ? `REVISION • Revision #${revisionNumber} (in progress)` : "REVISION (in progress)"}
            </span>
          )}
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.2rem" }}>
            Finalize Care Plan
          </h2>
        </div>
        <p style={{ fontSize: "0.8rem", color: "#64748b", maxWidth: "50rem" }}>
          {isRevisionInProgress
            ? "Update the current revision draft and provide attestation before submitting."
            : "Review your care plan completion status and provide attestation before submitting."}
        </p>
      </div>

      {/* Case Summary */}
      <div style={{
        marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px",
        border: "1px solid #e2e8f0", background: "#f8fafc"
      }}>
        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#64748b" }}>Case Number</div>
            <div style={{ fontWeight: 600 }}>{caseSummary.caseNumber || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#64748b" }}>Client</div>
            <div style={{ fontWeight: 600 }}>{caseSummary.clientName || 'Unknown'}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "#64748b" }}>Date of Injury</div>
            <div style={{ fontWeight: 600 }}>{caseSummary.dateOfInjury ? new Date(caseSummary.dateOfInjury).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Unable to reach — disclaimer when participation is "unable to reach" */}
      {unableToReach && (
        <div style={{
          marginBottom: "1.5rem", padding: "1rem", borderRadius: "10px",
          border: "2px solid #f59e0b", background: "#fffbeb"
        }}>
          <div style={{ fontWeight: 600, color: "#92400e", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            Unable to reach client
          </div>
          <p style={{ fontSize: "0.85rem", color: "#78350f", margin: 0 }}>
            This care plan was developed using the client&apos;s self-assessment information and the RN&apos;s clinical judgment. Client participation could not be obtained despite documented outreach attempts. The plan may be revised if/when the client provides additional input.
          </p>
        </div>
      )}

      {/* Completion Status */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Completion Status
        </h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem" }}>
          {/* 4Ps */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.fourps.completed ? "1px solid #86efac" : "1px solid #fecaca",
            background: completionStatus.fourps.completed ? "#f0fdf4" : "#fef2f2"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>4Ps Assessment</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.fourps.completed ? "✅" : "❌"}</span>
            </div>
            {completionStatus.fourps.completed && (
              <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.25rem" }}>
                Score: {completionStatus.fourps.score}/5 • {formatDate(completionStatus.fourps.assessedAt)}
              </div>
            )}
          </div>

          {/* SDOH */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.sdoh.completed ? "1px solid #86efac" : "1px solid #fecaca",
            background: completionStatus.sdoh.completed ? "#f0fdf4" : "#fef2f2"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>SDOH Assessment</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.sdoh.completed ? "✅" : "❌"}</span>
            </div>
            {completionStatus.sdoh.completed && (
              <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.25rem" }}>
                Score: {completionStatus.sdoh.score}/5 • {formatDate(completionStatus.sdoh.assessedAt)}
              </div>
            )}
          </div>

          {/* Overlays */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.overlays.completed ? "1px solid #86efac" : "1px solid #fcd34d",
            background: completionStatus.overlays.completed ? "#f0fdf4" : "#fffbeb"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Condition Overlays</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.overlays.completed ? "✅" : "⚠️"}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: completionStatus.overlays.completed ? "#166534" : "#92400e", marginTop: "0.25rem" }}>
              {completionStatus.overlays.count || 0} overlay(s) selected
            </div>
          </div>

          {/* Guidelines */}
          <div style={{
            padding: "0.75rem", borderRadius: "8px",
            border: completionStatus.guidelines.completed ? "1px solid #86efac" : "1px solid #fcd34d",
            background: completionStatus.guidelines.completed ? "#f0fdf4" : "#fffbeb"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>Guidelines Reference</span>
              <span style={{ fontSize: "1.2rem" }}>{completionStatus.guidelines.completed ? "✅" : "⚠️"}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: completionStatus.guidelines.completed ? "#166534" : "#92400e", marginTop: "0.25rem" }}>
              {completionStatus.guidelines.count || 0} reference(s)
              {completionStatus.guidelines.hasDeviations && " • ⚠️ Has deviations"}
            </div>
          </div>
        </div>

        {/* 10Vs Status */}
        <div style={{ marginTop: "1rem" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.5rem" }}>10-Vs Completion</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {[
              { key: 'v1', label: 'V1', mandatory: true },
              { key: 'v2', label: 'V2', mandatory: true },
              { key: 'v3', label: 'V3', mandatory: true },
              { key: 'v4', label: 'V4', mandatory: false },
              { key: 'v5', label: 'V5', mandatory: false },
              { key: 'v6', label: 'V6', mandatory: false },
              { key: 'v7', label: 'V7', mandatory: false },
              { key: 'v8', label: 'V8', mandatory: true },
              { key: 'v9', label: 'V9', mandatory: true },
              { key: 'v10', label: 'V10', mandatory: true },
            ].map(({ key, label, mandatory }) => {
              const completed = completionStatus.tenvs[key as keyof typeof completionStatus.tenvs];
              return (
                <div
                  key={key}
                  style={{
                    padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem",
                    border: completed ? "1px solid #86efac" : mandatory ? "1px solid #fecaca" : "1px solid #e2e8f0",
                    background: completed ? "#dcfce7" : mandatory ? "#fef2f2" : "#f8fafc",
                    color: completed ? "#166534" : mandatory ? "#dc2626" : "#64748b"
                  }}
                >
                  {completed ? "✓" : mandatory ? "✗" : "○"} {label}
                  {mandatory && <span style={{ fontSize: "0.65rem" }}> *</span>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.3rem" }}>
            * = Mandatory sections
          </div>
        </div>
      </div>

      {/* Skipped Sections Warning — Phase 1: disabled + grey when no changes */}
      {skippedSections.length > 0 && (
        <div
          style={{
            marginBottom: "1.5rem", padding: "1rem", borderRadius: "10px",
            border: "2px solid #f59e0b", background: "#fffbeb",
            opacity: formDisabled ? 0.6 : 1,
            pointerEvents: formDisabled ? "none" : undefined,
          }}
        >
          <div style={{ fontWeight: 600, color: "#92400e", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            ⚠️ The following sections were not completed:
          </div>
          <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem", color: "#92400e" }}>
            {skippedSections.map(section => (
              <li key={section} style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                {SECTION_NAMES[section] || section}
              </li>
            ))}
          </ul>
          
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef3c7", borderRadius: "6px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: formDisabled ? "not-allowed" : "pointer" }}>
              <input
                type="checkbox"
                checked={acknowledgedSkipped}
                onChange={(e) => setAcknowledgedSkipped(e.target.checked)}
                disabled={formDisabled}
                style={{ marginTop: "0.2rem" }}
              />
              <span style={{ fontSize: "0.85rem", color: "#92400e" }}>
                <strong>I acknowledge</strong> that the above sections were skipped and confirm this care plan 
                represents what is most appropriate at this time despite these sections not being completed.
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Attestation — Phase 1: disabled + grey when no changes */}
      <div
        style={{
          marginBottom: "1.5rem", padding: "1rem", borderRadius: "10px",
          border: "2px solid #0ea5e9", background: "#f0f9ff",
          opacity: formDisabled ? 0.6 : 1,
          pointerEvents: formDisabled ? "none" : undefined,
        }}
      >
        <div style={{ fontWeight: 600, color: "#0369a1", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
          📋 Attestation
        </div>
        
        <div style={{
          padding: "0.75rem", background: "#ffffff", borderRadius: "6px",
          border: "1px solid #bae6fd", marginBottom: "1rem"
        }}>
          <p style={{ fontSize: "0.85rem", color: "#0c4a6e", fontStyle: "italic", margin: 0 }}>
            "{ATTESTATION_TEXT}"
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
              Your Name *
            </label>
            <input
              type="text"
              value={attesterName}
              onChange={(e) => setAttesterName(e.target.value)}
              placeholder="Enter your full name"
              disabled={formDisabled}
              style={{
                width: "100%", padding: "0.4rem", borderRadius: "6px",
                border: "1px solid #cbd5e1", fontSize: "0.85rem"
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.2rem" }}>
              Credentials *
            </label>
            <input
              type="text"
              value={attesterCredentials}
              onChange={(e) => setAttesterCredentials(e.target.value)}
              disabled={formDisabled}
              placeholder="e.g., RN, BSN, CCM"
              style={{
                width: "100%", padding: "0.4rem", borderRadius: "6px",
                border: "1px solid #cbd5e1", fontSize: "0.85rem"
              }}
            />
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", cursor: formDisabled ? "not-allowed" : "pointer" }}>
          <input
            type="checkbox"
            checked={attestationChecked}
            onChange={(e) => setAttestationChecked(e.target.checked)}
            disabled={formDisabled}
            style={{ marginTop: "0.2rem" }}
          />
          <span style={{ fontSize: "0.85rem", color: "#0369a1" }}>
            <strong>I agree</strong> to the attestation statement above and confirm that this care plan 
            is complete and ready for submission.
          </span>
        </label>
      </div>

      {/* Submit Button — same column: "What happens next", revision indicator, button, success/error UI */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {/* What happens next — RN-facing helper before submit (initial vs revision) */}
        {!submitSucceeded && !submitError && !formDisabled && (
          <p style={{ fontSize: "0.85rem", color: "#475569", marginBottom: "0.25rem" }}>
            {isRevisionInProgress
              ? "After you submit, this revision replaces the prior released plan as the latest released plan."
              : "After you submit, this care plan is released and will be visible to the attorney and client as the latest released plan."}
          </p>
        )}
        {isRevisionInProgress && revisionNumber != null && !submitSucceeded && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{
              fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.05em", color: "#0c4a6e",
              padding: "0.2rem 0.5rem", borderRadius: "6px", background: "#e0f2fe", border: "1px solid #0ea5e9"
            }}>
              REVISION • Revision #{revisionNumber}
            </span>
          </div>
        )}
        {!submitSucceeded && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || submitting || readOnly}
              title={readOnly ? RN_VIEW_ONLY_TOOLTIP : isHRefusalRecorded ? H_REFUSAL_LOCK_MSG : undefined}
              style={{
                padding: "0.6rem 1.5rem", borderRadius: "999px", border: "none",
                background: canSubmit() && !submitting && !readOnly ? "#16a34a" : "#94a3b8",
                color: "#ffffff", fontSize: "0.9rem", fontWeight: 600,
                cursor: canSubmit() && !submitting && !readOnly ? "pointer" : "not-allowed"
              }}
            >
              {submitting ? "Submitting..." : isRevisionInProgress ? "✓ Finalize & Submit Revised Care Plan" : "✓ Finalize & Submit Care Plan"}
            </button>
          </div>
        )}
        {/* Why can't I release? — list unmet prerequisites when buttons are disabled */}
        {!submitSucceeded && !canSubmit() && !formDisabled && (() => {
          const reasons = getReleaseBlockReasons();
          if (reasons.length === 0) return null;
          const hasNoChangesBlocker = reasons.some(r => r.includes("No changes to re-submit"));
          return (
            <div style={{
              marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: "8px",
              border: "1px solid #f59e0b", background: "#fffbeb", color: "#92400e"
            }}>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "0.35rem" }}>
                Why can&apos;t I release?
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8rem" }}>
                {reasons.map((r, i) => (
                  <li key={i} style={{ marginBottom: "0.2rem" }}>{r}</li>
                ))}
              </ul>
              {isRevisionInProgress && hasNoChangesBlocker && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", fontStyle: "italic" }}>
                  Tip: Saving updates in 4Ps/SDOH or other sections counts as a revision change.
                </div>
              )}
            </div>
          );
        })()}
        {/* Submission failed — actionable, calm; collapsed detail only */}
        {submitError && (
          <Alert style={{ border: "1px solid #dc2626", backgroundColor: "#fef2f2", color: "#991b1b" }}>
            <AlertTitle style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              Submission failed
            </AlertTitle>
            <AlertDescription style={{ fontSize: "0.9rem", color: "#991b1b", marginBottom: "0.5rem" }}>
              Please retry. If it persists, contact support.
            </AlertDescription>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  style={{ fontSize: "0.8rem", textDecoration: "underline", color: "#991b1b", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Show details
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre style={{ fontSize: "0.75rem", marginTop: "0.5rem", padding: "0.5rem", background: "#fff", borderRadius: "6px", border: "1px solid #fecaca", overflow: "auto", maxHeight: "8rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {submitError.detail.length > 500 ? `${submitError.detail.slice(0, 500)}…` : submitError.detail}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </Alert>
        )}
        {/* Success state — clear confirmation, one sentence, Back to Work Queue */}
        {submitSucceeded && (
          <Alert style={{ border: "1px solid #16a34a", backgroundColor: "#f0fdf4", color: "#166534" }}>
            <AlertTitle style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.25rem" }}>
              {isRevisionInProgress ? "Revision submitted successfully." : "Submitted successfully."}
            </AlertTitle>
            <AlertDescription style={{ fontSize: "0.9rem", color: "#166534", marginBottom: "0.75rem" }}>
              {isRevisionInProgress
                ? "This revision replaces the prior released plan as the latest released plan."
                : "This care plan is released and visible to the attorney and client as the latest released plan."}
            </AlertDescription>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => navigate("/rn/queue")}
                style={{
                  padding: "0.5rem 1rem", borderRadius: "8px", border: "none",
                  background: "#16a34a", color: "#fff", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer"
                }}
              >
                Back to Work Queue
              </button>
            </div>
          </Alert>
        )}
        {/* Helper when in edit mode but no changes yet */}
        {!submitSucceeded && carePlanSubmitted && editModeEnabled && !hasRevisionChanges && (
          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Make at least one change to re-submit an updated version.</div>
        )}
      </div>
      </div>

      <div style={{ marginTop: "1.5rem", fontSize: "0.7rem", color: "#94a3b8", textAlign: "right" }}>
        💾 Data saves to Supabase (rc_care_plan_attestations table)
        {carePlanId && ` • Care Plan ID: ${carePlanId.slice(0, 8)}...`}
      </div>
    </div>
  );
};

export default FinalizeCarePlanScreen;
