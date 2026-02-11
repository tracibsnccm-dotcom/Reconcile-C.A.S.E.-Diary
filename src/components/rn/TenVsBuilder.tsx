// src/components/rn/TenVsBuilder.tsx
// Uses authenticated supabaseGet/Update/Insert + supabase client. 10-Vs draft: care-plan-drafts/{caseId}.json.

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useRNCaseEditMode } from "@/hooks/useRNCaseEditMode";
import { RNCaseStateBadge, RN_VIEW_ONLY_TOOLTIP } from "@/components/rn/RNCaseStateBadge";
import { RNEmptyState } from "@/components/rn/RNEmptyState";
import { isValidUuid } from "@/lib/rnUtils";
import { getMedicalNecessityHardStopReason, ensureRcCarePlanRow } from "@/lib/tenVsHelpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ChevronDown,
  ChevronUp,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Shield,
  Target,
  Zap,
  RefreshCw,
  Award,
  BarChart3,
  HeartPulse,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { format, parseISO, addDays } from "date-fns";
import { toast } from "sonner";
import { createAutoNoteAsUser } from "@/lib/autoNotes";
import {
  CLINICAL_OVERLAY_OPTIONS,
  normalizeOverlayArray,
  deriveOverlayDefaultsFromIntake,
  migrateClinicalOverlays,
} from "@/lib/clinicalOverlays";
import { CARE_OVERLAYS_PHASE_1, type CareOverlayPhase1 } from "@/config/careOverlays.phase1";
import { getSeverityLabel } from "@/constants/reconcileFramework";
import { PARTICIPATION_COPY } from "@/constants/participationMessaging";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TEN_VS_OPERATIONAL_GUIDE, getVDefinitionById } from "@/config/tenVsOperationalGuide";
import { Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseGet, supabaseUpdate } from "@/lib/supabaseRest";
import { useAuth } from "@/auth/supabaseAuth";
import { assertRnAcceptanceGate } from "@/lib/rnAcknowledgment";
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

/** Valid plan_type for rc_care_plans INSERTs; must satisfy rc_care_plans_plan_type_check ('initial', 'follow_up' only). */
const RC_CARE_PLANS_VALID_PLAN_TYPE = 'initial' as const;

const LOAD_TIMEOUT_MS = 12000;

interface TenVsData {
  v1_voice: {
    p1_physical?: string;
    p2_psychological?: string;
    p3_psychosocial?: string;
    p4_professional?: string;
  };
  v2_viability: {
    assessment?: string; // Keep for backward compatibility
    participation_primary?: 'wants' | 'undetermined' | 'refused';
    participation_secondary?: 'active_call' | 'async' | 'unreachable' | null;
    outreach_attempts_notes?: string | null;
    flagConcern?: boolean;
    concernComments?: string;
    /** Set only after refusal is RECORDED (attorney notified). Lock UI when set. */
    refusal_recorded_at?: string | null;
    /** Next follow-up due (e.g. now + 60 days). */
    followup_due_at?: string | null;
    refusal_notes?: string | null;
  };
  /** C-5: V2 Participation Gate. Draft JSON only; no DB schema. Default status = "participating" when missing. */
  v2_participation?: {
    status?: 'participating' | 'refused' | 'unable_to_determine';
    refusal_comment?: string;
    refusal_note_sent_at?: string | null;
  };
  v3_vision: {
    p1?: { goal?: string; target_date?: string; outcome?: string };
    p2?: { goal?: string; target_date?: string; outcome?: string };
    p3?: { goal?: string; target_date?: string; outcome?: string };
    p4?: { goal?: string; target_date?: string; outcome?: string };
    /** B-1: multi-select overlay labels (catalog values). Replaces legacy object. */
    clinical_overlays?: string[];
    /** Phase 1: Care Overlays (Lenses) state */
    phase1_overlay_selections?: string[];
    phase1_overlay_applied?: Record<string, { P1: boolean; P2: boolean; P3: boolean; P4: boolean }>;
    /** Phase 1: Required V acknowledgments for follow-up/revision plans */
    phase1_required_v_ack?: Record<string, { status: "addressed" | "na"; reason?: string; note?: string; }>;
  };
  v4_veracity: {
    p1?: { notes?: string; providers?: string; addressed?: string };
    p2?: { notes?: string; providers?: string; addressed?: string };
    p3?: { notes?: string; providers?: string; addressed?: string };
    p4?: { notes?: string; providers?: string; addressed?: string };
  };
  v5_vigilance: {
    p1?: { monitoring?: string; changes?: string; alerts?: string };
    p2?: { monitoring?: string; changes?: string; alerts?: string };
    p3?: { monitoring?: string; changes?: string; alerts?: string };
    p4?: { monitoring?: string; changes?: string; alerts?: string };
  };
  v6_vitality: {
    p1?: { functional?: string; quality?: string; engagement?: number };
    p2?: { functional?: string; quality?: string; engagement?: number };
    p3?: { functional?: string; quality?: string; engagement?: number };
    p4?: { functional?: string; quality?: string; engagement?: number };
  };
  v7_versatility: {
    p1?: { modifications?: string; reason?: string; approach?: string };
    p2?: { modifications?: string; reason?: string; approach?: string };
    p3?: { modifications?: string; reason?: string; approach?: string };
    p4?: { modifications?: string; reason?: string; approach?: string };
  };
  v8_verification: {
    p1?: { alignment?: string; evidence?: string; verified?: boolean };
    p2?: { alignment?: string; evidence?: string; verified?: boolean };
    p3?: { alignment?: string; evidence?: string; verified?: boolean };
    p4?: { alignment?: string; evidence?: string; verified?: boolean };
    /** V8 Verification: 'yes' | 'no' | null. Backward compat: also accept legacy .medical_necessity.meets */
    medical_necessity?: 'yes' | 'no' | null;
    medical_necessity_comments?: string | null;
  };
  v9_validation: {
    assessment?: string;
    feedback?: string;
    review_date_30?: string;
    review_date_60?: string;
  };
  v10_value: {
    p1?: { outcome?: string; improvement?: string };
    p2?: { outcome?: string; improvement?: string };
    p3?: { outcome?: string; improvement?: string };
    p4?: { outcome?: string; improvement?: string };
    summary?: string;
    roi?: string;
  };
}

interface ClientSummary {
  fourp_scores: {
    physical?: number;
    psychological?: number;
    psychosocial?: number;
    professional?: number;
  };
  sdoh_scores?: {
    housing?: number;
    food?: number;
    transport?: number;
    insuranceGap?: number;
    financial?: number;
    employment?: number;
    social_support?: number;
    safety?: number;
    healthcare_access?: number;
    income_range?: string | null;
  };
  viability_index: number;
  medications_count: number;
  treatments_count: number;
  data_source?: string;
}

interface TenVsBuilderProps { readOnly?: boolean; onMarkDirty?: () => void; }

// Evidence-Based Criteria URLs (placeholder - to be replaced later)
const ODG_URL = "https://example.com/odg";
const MCG_URL = "https://example.com/mcg";
const INTERQUAL_URL = "https://example.com/interqual";
const STATE_WC_URL = "https://example.com/state-wc";

const H_REFUSAL_LOCK_MSG =
  "Care Plan Refused has been recorded. Care plan editing and submission are locked. Intake Snapshot and existing documents remain viewable.";

export default function TenVsBuilder({ readOnly: readOnlyProp, onMarkDirty }: TenVsBuilderProps = {}) {
  const { caseId } = useParams<{ caseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isViewOnly, mode, backToDraftId, loading: modeLoading } = useRNCaseEditMode(caseId ?? null);
  const effectiveReadOnly = readOnlyProp !== undefined ? readOnlyProp : isViewOnly;
  const showBadge = readOnlyProp === undefined;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [clientSummary, setClientSummary] = useState<ClientSummary | null>(null);
  const [tenVsData, setTenVsData] = useState<TenVsData>({
    v1_voice: {},
    v2_viability: {},
    v3_vision: {},
    v4_veracity: {},
    v5_vigilance: {},
    v6_vitality: {},
    v7_versatility: {},
    v8_verification: {},
    v9_validation: {},
    v10_value: {},
  });
  /** Call from user-event handlers only; load/effect must use setTenVsData. */
  const setTenVsDataAndMarkDirty = useCallback((update: React.SetStateAction<TenVsData>) => {
    setTenVsData(update);
    onMarkDirty?.();
  }, [onMarkDirty]);
  const [carePlanStatus, setCarePlanStatus] = useState<'Draft' | 'In Progress' | 'Complete'>('Draft');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [carePlanId, setCarePlanId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('debug') === '1';
    }
    return false;
  });
  const [intakeSnapshotOpen, setIntakeSnapshotOpen] = useState(false);
  const [latestIntakeJson, setLatestIntakeJson] = useState<any>(null);
  const [intakeCreatedAt, setIntakeCreatedAt] = useState<string | null>(null);
  const [intakeId, setIntakeId] = useState<string | null>(null);
  const [showRefusalConfirm, setShowRefusalConfirm] = useState(false);
  const [recordingRefusal, setRecordingRefusal] = useState(false);
  const [v8MedicalNecessityError, setV8MedicalNecessityError] = useState(false);
  
  // Phase 1 Overlay state: selected overlay IDs and applied status per P
  const [selectedOverlayIds, setSelectedOverlayIds] = useState<string[]>([]);
  const [appliedOverlayByP, setAppliedOverlayByP] = useState<Record<string, { P1: boolean; P2: boolean; P3: boolean; P4: boolean }>>({});
  
  // Phase 1: Follow-up/revision detection and required V set
  const [isFollowUpOrRevision, setIsFollowUpOrRevision] = useState<boolean>(false);
  const [requiredVs, setRequiredVs] = useState<string[]>([]);
  const [followUpRevisionSignal, setFollowUpRevisionSignal] = useState<string | null>(null);

  // Derived: refusal selection (changeable until recorded) vs refusal recorded (locks UI)
  const refusalRecordedAt = tenVsData.v2_viability?.refusal_recorded_at ?? null;
  const isRefusalRecorded = Boolean(refusalRecordedAt);
  const refusalSelected = tenVsData.v2_viability?.participation_primary === 'refused';
  // H-14: H-block refusal recorded — lock CPB and block all save/submit
  const isHRefusalRecorded = Boolean(tenVsData.v2_viability?.refusal_recorded_at);
  const isHRefusalLocked = isHRefusalRecorded;

  // CLICK TRUTH debug state
  const [lastClickAt, setLastClickAt] = useState<string | null>(null);
  const [lastClickName, setLastClickName] = useState<'draft' | 'continue' | 'complete' | null>(null);
  const [clickCountDraft, setClickCountDraft] = useState(0);
  const [clickCountContinue, setClickCountContinue] = useState(0);
  const [clickCountComplete, setClickCountComplete] = useState(0);

  // SAVE TRUTH debug state
  const [saveTruth, setSaveTruth] = useState<{
    lastAction: 'none' | 'draft' | 'continue' | 'complete';
    actionStartedAt: string | null;
    actionFinishedAt: string | null;
    guardFailures: string[];
    saveAttempted: boolean;
    payloadSummary: {
      caseId: string | null;
      hasTenVsData: boolean;
      tenVsKeys: string[];
      draftId: string | null;
    } | null;
    supabaseOps: Array<{
      op: string;
      table: string;
      status: 'pending' | 'success' | 'error';
      errorCode?: string;
      errorMessage?: string;
    }>;
    reread: {
      ok: boolean;
      id: string | null;
      updatedAt: string | null;
      hasTenVsData: boolean;
    } | null;
    persistenceTarget?: string | null;
    storagePath?: string | null;
    storageUpload: {
      success: boolean;
      error?: string;
      path?: string;
    } | null;
    rcCarePlansUpdate?: {
      success: boolean;
      error?: string;
    } | null;
    finalResult: 'success' | 'error' | null;
  }>({
    lastAction: 'none',
    actionStartedAt: null,
    actionFinishedAt: null,
    guardFailures: [],
    saveAttempted: false,
    payloadSummary: null,
    supabaseOps: [],
    reread: null,
    storageUpload: null,
    finalResult: null,
  });

  // Update showDebug when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setShowDebug(params.get('debug') === '1');
  }, [location.search]);

  useEffect(() => {
    if (!caseId) return;
    fetchCaseData();
  }, [caseId]);

  useEffect(() => {
    setLoadTimedOut(false);
  }, [caseId]);

  useEffect(() => {
    if (!caseId || !loading) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setLoadTimedOut(true);
      timeoutRef.current = null;
    }, LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [caseId, loading]);

  // Helper function to search for a value in nested JSON object
  function findValueInJson(obj: any, paths: string[]): { path: string | null; value: any } {
    for (const path of paths) {
      const parts = path.split('.');
      let current: any = obj;
      let found = true;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          found = false;
          break;
        }
      }
      if (found && current !== undefined && current !== null) {
        return { path, value: current };
      }
    }
    return { path: null, value: null };
  }

  // Trace intake data function - fetches from both rc_cases and rc_client_intakes
  async function traceIntakeData(caseId: string) {
    const trace: any = {
      caseId,
      caseRow: null,
      intakeFound: false,
      intakeId: null,
      intakeCreatedAt: null,
      intakeJsonKeys: [],
      fourpsFromCase: null,
      sdohFromCase: null,
      fourpsFromIntake: null,
      sdohFromIntake: null,
      matchedFourpsPath: null,
      matchedSdohPath: null,
      matchedPainPath: null,
      matchedAnxietyPath: null,
      matchedDepressionPath: null,
      extractedFourps: null,
      extractedSdoh: null,
      extractedPain: null,
      extractedAnxiety: null,
      extractedDepression: null,
      errors: [],
    };

    try {
      const { data: caseResult, error: caseErr } = await supabaseGet<unknown[]>(
        "rc_cases",
        `id=eq.${caseId}&is_superseded=eq.false&select=id,assigned_rn_id,fourps,sdoh,created_at`
      );
      if (!caseErr && caseResult && caseResult.length > 0) {
        trace.caseRow = caseResult[0];
        trace.fourpsFromCase = (caseResult[0] as Record<string, unknown>).fourps;
        trace.sdohFromCase = (caseResult[0] as Record<string, unknown>).sdoh;
      } else {
        trace.errors.push('Case not found in rc_cases');
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      trace.errors.push(`Error fetching rc_cases: ${err?.message || String(e)}`);
    }

    try {
      const { data: intakeResult, error: intakeErr } = await supabaseGet<unknown[]>(
        "rc_client_intakes",
        `case_id=eq.${caseId}&select=id,case_id,intake_json,created_at,status&order=created_at.desc&limit=1`
      );
      if (!intakeErr && intakeResult && intakeResult.length > 0) {
        const intake = intakeResult[0] as { id: string; case_id: string; intake_json?: unknown; created_at?: string; status?: string };
        trace.intakeFound = true;
        trace.intakeId = intake.id;
        trace.intakeCreatedAt = intake.created_at;
        if (intake.intake_json) {
          const json = intake.intake_json as Record<string, unknown>;
          trace.intakeJsonKeys = Object.keys(json);
          
          // Search for fourPs/fourps using common paths
          const fourpsPaths = ['fourPs', 'fourps', 'intake.fourPs', 'intake.fourps', 'raw_intake.fourPs', 'raw_intake.fourps'];
          const fourpsResult = findValueInJson(json, fourpsPaths);
          trace.matchedFourpsPath = fourpsResult.path;
          trace.extractedFourps = fourpsResult.value;
          trace.fourpsFromIntake = fourpsResult.value;
          
          // Search for sdoh using common paths
          const sdohPaths = ['sdoh', 'intake.sdoh', 'raw_intake.sdoh'];
          const sdohResult = findValueInJson(json, sdohPaths);
          trace.matchedSdohPath = sdohResult.path;
          trace.extractedSdoh = sdohResult.value;
          trace.sdohFromIntake = sdohResult.value;
          
          // Search for pain using common paths
          const painPaths = ['pain', 'pain_0_10', 'summary.pain_0_10', 'intake.pain', 'raw_intake.pain'];
          const painResult = findValueInJson(json, painPaths);
          trace.matchedPainPath = painResult.path;
          trace.extractedPain = painResult.value;
          
          // Search for anxiety using common paths
          const anxietyPaths = ['anxiety', 'anxiety_1_5', 'summary.anxiety_1_5', 'intake.anxiety', 'raw_intake.anxiety'];
          const anxietyResult = findValueInJson(json, anxietyPaths);
          trace.matchedAnxietyPath = anxietyResult.path;
          trace.extractedAnxiety = anxietyResult.value;
          
          // Search for depression using common paths
          const depressionPaths = ['depression', 'depression_1_5', 'summary.depression_1_5', 'intake.depression', 'raw_intake.depression'];
          const depressionResult = findValueInJson(json, depressionPaths);
          trace.matchedDepressionPath = depressionResult.path;
          trace.extractedDepression = depressionResult.value;
        }
      } else {
        trace.errors.push('No intake found in rc_client_intakes');
      }
    } catch (e: unknown) {
      const err = e as { message?: string };
      trace.errors.push(`Error fetching rc_client_intakes: ${err?.message || String(e)}`);
    }

    return trace;
  }

  // Normalize 4Ps and SDOH data with fallback order
  function getFourPsAndSdoh(caseRow: any, latestIntakeJson: any): { fourps: any; sdoh: any; source: string } {
    let fourps: any = null;
    let sdoh: any = null;
    let source = 'none';

    // Fallback 1: Use rc_cases.fourps and rc_cases.sdoh if populated
    if (caseRow?.fourps && (caseRow.fourps.physical || caseRow.fourps.psychological || caseRow.fourps.psychosocial || caseRow.fourps.professional)) {
      fourps = caseRow.fourps;
      source = 'rc_cases.fourps';
    }
    if (caseRow?.sdoh && Object.keys(caseRow.sdoh).length > 0) {
      sdoh = caseRow.sdoh;
      if (source === 'none') source = 'rc_cases.sdoh';
      else if (source === 'rc_cases.fourps') source = 'rc_cases (both)';
    }

    // Fallback 2: Derive from latestIntakeJson if case fields not populated
    // Search using common paths (same as trace function)
    if (!fourps && latestIntakeJson) {
      const json = latestIntakeJson as any;
      const fourpsPaths = ['fourPs', 'fourps', 'intake.fourPs', 'intake.fourps', 'raw_intake.fourPs', 'raw_intake.fourps'];
      const fourpsResult = findValueInJson(json, fourpsPaths);
      if (fourpsResult.value && (fourpsResult.value.physical || fourpsResult.value.psychological || fourpsResult.value.psychosocial || fourpsResult.value.professional)) {
        fourps = fourpsResult.value;
        source = source === 'none' ? `intake_json.${fourpsResult.path || 'fourPs'}` : 'intake_json (both)';
      }
    }
    if (!sdoh && latestIntakeJson) {
      const json = latestIntakeJson as any;
      const sdohPaths = ['sdoh', 'intake.sdoh', 'raw_intake.sdoh'];
      const sdohResult = findValueInJson(json, sdohPaths);
      if (sdohResult.value && Object.keys(sdohResult.value).length > 0) {
        sdoh = sdohResult.value;
        if (source === 'none') source = `intake_json.${sdohResult.path || 'sdoh'}`;
        else if (source.includes('intake_json')) source = 'intake_json (both)';
        else source = `${source} + intake_json`;
      }
    }

    return { fourps, sdoh, source };
  }

  async function fetchCaseData() {
    if (!caseId) return;

    setLoading(true);
    setError(null);
    setLoadTimedOut(false);
    
    try {
      console.log('TenVsBuilder: Fetching case data for', caseId);
      
      const { data: caseResult, error: caseErr } = await supabaseGet<unknown[]>(
        "rc_cases",
        `id=eq.${caseId}&is_superseded=eq.false&select=id,case_number,client_id,date_of_injury,fourps,sdoh`
      );
      if (caseErr || !caseResult || caseResult.length === 0) {
        setError('Case not found');
        setLoading(false);
        return;
      }
      
      const caseInfo = caseResult[0] as Record<string, unknown> & { client_id?: string };
      console.log('TenVsBuilder: Case found:', caseInfo);
      
      let clientName = 'Unknown Client';
      if (caseInfo.client_id) {
        try {
          const { data: clientResult } = await supabaseGet<unknown[]>(
            "rc_clients",
            `id=eq.${caseInfo.client_id}&select=first_name,last_name`
          );
          if (clientResult && clientResult.length > 0) {
            const c = clientResult[0] as { first_name?: string; last_name?: string };
            clientName = `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown Client';
          }
        } catch (e) {
          console.log('TenVsBuilder: Could not fetch client name');
        }
      }
      
      setCaseData({
        ...caseInfo,
        client_name: clientName,
      });
      
      // Trace intake data for debugging
      const trace = await traceIntakeData(caseId);
      setDebugInfo(trace);
      
      // Fetch latest intake_json
      let latestIntakeJson: unknown = null;
      let intakeDate: string | null = null;
      let fetchedIntakeId: string | null = null;
      try {
        const { data: intakeResult } = await supabaseGet<unknown[]>(
          "rc_client_intakes",
          `case_id=eq.${caseId}&select=id,intake_json,created_at&order=created_at.desc&limit=1`
        );
        if (intakeResult && intakeResult.length > 0) {
          const row = intakeResult[0] as { id: string; intake_json?: unknown; created_at?: string };
          if (row.intake_json) {
            latestIntakeJson = row.intake_json;
            intakeDate = row.created_at ?? null;
            fetchedIntakeId = row.id;
          }
        }
      } catch (e) {
        console.log('TenVsBuilder: Could not fetch intake_json');
      }
      
      // Store intake data for snapshot panel
      setLatestIntakeJson(latestIntakeJson);
      setIntakeCreatedAt(intakeDate);
      setIntakeId(fetchedIntakeId);
      
      // Normalize 4Ps and SDOH using fallback logic
      const { fourps, sdoh, source } = getFourPsAndSdoh(caseInfo, latestIntakeJson);
      console.log('TenVsBuilder: Normalized data source:', source, { fourps, sdoh });
      
      // Use normalized fourps (fallback to empty object if null)
      const fourpScores = fourps || {};
      
      // Calculate viability index
      const viabilityIndex = fourpScores.physical || fourpScores.psychological || fourpScores.psychosocial || fourpScores.professional
        ? ((fourpScores.physical || 0) + (fourpScores.psychological || 0) +
           (fourpScores.psychosocial || 0) + (fourpScores.professional || 0)) / 4
        : 0;
      
      setClientSummary({
        fourp_scores: fourpScores,
        sdoh_scores: sdoh || {},
        viability_index: viabilityIndex,
        medications_count: 0,
        treatments_count: 0,
        data_source: source,
      });
      
      let currentPlan: Record<string, unknown> | null = null;
      try {
        const { data: carePlanResult } = await supabaseGet<unknown[]>(
          "rc_care_plans",
          `case_id=eq.${caseId}&select=*&order=updated_at.desc&limit=1`
        );
        if (carePlanResult && carePlanResult.length > 0) {
          currentPlan = carePlanResult[0] as Record<string, unknown>;
          setCarePlanId(currentPlan.id as string);
          const st = currentPlan.status as string;
          setCarePlanStatus(st === 'submitted' || st === 'approved' ? 'Complete' : st === 'draft' ? 'Draft' : 'In Progress');
          setLastUpdated(currentPlan.updated_at as string | undefined);
          await loadVAssessments(currentPlan.id as string);
        }
      } catch (e) {
        console.log('TenVsBuilder: No existing care plan metadata found');
      }
      
      // STEP 1: Determine follow-up/revision context (Phase 1 requirement)
      // Detection priority: A) plan_type='follow_up', B) previous_care_plan_id exists, C) prior RELEASED plan exists
      let detectedFollowUpOrRevision = false;
      let detectionSignal: string | null = null;
      
      if (currentPlan) {
        if (currentPlan.plan_type === 'follow_up') {
          detectedFollowUpOrRevision = true;
          detectionSignal = 'plan_type=follow_up';
        } else if (currentPlan.previous_care_plan_id) {
          detectedFollowUpOrRevision = true;
          detectionSignal = 'previous_care_plan_id exists';
        }
      }
      
      if (!detectedFollowUpOrRevision && currentPlan && currentPlan.status === 'draft') {
        try {
          const { data: priorPlansResult } = await supabaseGet<unknown[]>(
            "rc_care_plans",
            `case_id=eq.${caseId}&status=in.(submitted,approved)&select=id&order=created_at.desc&limit=1`
          );
          if (priorPlansResult && priorPlansResult.length > 0) {
            detectedFollowUpOrRevision = true;
            detectionSignal = 'prior RELEASED plan exists for case';
          }
        } catch (e) {
          console.log('TenVsBuilder: Could not check for prior released plans');
        }
      }
      
      setIsFollowUpOrRevision(detectedFollowUpOrRevision);
      setFollowUpRevisionSignal(detectionSignal);
      
      // STEP 3: Compute required V set
      if (detectedFollowUpOrRevision) {
        // Follow-up/revision: require V1-V10 (all 10 Vs)
        const allVs = TEN_VS_OPERATIONAL_GUIDE.map(v => v.id);
        setRequiredVs(allVs);
      } else {
        // Initial plan: use overlay-triggered Vs logic (if present) + always include V8, V9, V10
        // For now, default to V1, V2, V3, V8, V9, V10 (mandatory initial set)
        // TODO: Integrate with overlay-triggered V logic when available
        const initialRequiredVs = ['V1', 'V2', 'V3', 'V8', 'V9', 'V10'];
        setRequiredVs(initialRequiredVs);
      }
      
      // Load 10-Vs data from storage
      try {
        const loadedTenVs = await loadTenVsFromStorage(caseId);
        const defaultsFromIntake = deriveOverlayDefaultsFromIntake(latestIntakeJson);
        if (loadedTenVs) {
          const v2 = loadedTenVs.v2_viability ?? {};
          const primary = v2.participation_primary === 'refused' || v2.assessment === 'does_not_want_to_participate' ? 'refused' : (v2.participation_primary ?? undefined);
          const savedOverlays = migrateClinicalOverlays(loadedTenVs.v3_vision?.clinical_overlays);
          const mergedOverlays = normalizeOverlayArray([...defaultsFromIntake, ...savedOverlays]);
          setTenVsData(prev => ({
            ...prev,
            ...loadedTenVs,
            v2_viability: {
              ...prev.v2_viability,
              ...v2,
              participation_primary: primary ?? prev.v2_viability?.participation_primary,
              assessment: v2.assessment ?? (primary === 'refused' ? 'does_not_want_to_participate' : undefined),
              refusal_recorded_at: v2.refusal_recorded_at ?? undefined,
              followup_due_at: v2.followup_due_at ?? undefined,
            },
            v3_vision: {
              ...(loadedTenVs.v3_vision || {}),
              clinical_overlays: mergedOverlays,
              p1: loadedTenVs.v3_vision?.p1 ?? {},
              // Preserve Phase 1 V acknowledgments
              phase1_required_v_ack: loadedTenVs.v3_vision?.phase1_required_v_ack,
            },
          }));
          // Restore Phase 1 overlay state
          if (loadedTenVs.v3_vision?.phase1_overlay_selections) {
            setSelectedOverlayIds(loadedTenVs.v3_vision.phase1_overlay_selections);
          }
          if (loadedTenVs.v3_vision?.phase1_overlay_applied) {
            setAppliedOverlayByP(loadedTenVs.v3_vision.phase1_overlay_applied);
          }
          console.log('TenVsBuilder: Loaded 10-Vs data from storage');
        } else {
          setTenVsData(prev => ({
            ...prev,
            v3_vision: {
              ...prev.v3_vision,
              clinical_overlays: normalizeOverlayArray(defaultsFromIntake),
            },
          }));
          console.log('TenVsBuilder: No 10-Vs data found in storage');
        }
      } catch (e) {
        console.log('TenVsBuilder: Could not load 10-Vs data from storage:', e);
      }
      
      // intake_json client_voice.primary === "refused" is reflected via tenVsData load above when present
      
      setLoading(false);
    } catch (err: any) {
      console.error('TenVsBuilder: Error fetching case data:', err);
      setError(err.message || 'Failed to load case data');
      setLoading(false);
    }
  }
  
  async function loadVAssessments(planId: string) {
    try {
      const { data: vsResult } = await supabaseGet<unknown[]>(
        "rc_care_plan_vs",
        `care_plan_id=eq.${planId}&select=*`
      );
      if (vsResult && vsResult.length > 0) {
        console.log('TenVsBuilder: Loaded V assessments:', vsResult.length);
      }
    } catch (e) {
      console.log('TenVsBuilder: Could not load V assessments');
    }
  }
  
  /** H-block: HIGH PRIORITY attorney note for care plan refusal. Approved minimum-necessary body. No toast. Uses auth user + created_by. */
  async function createRefusalAttorneyNote(details: string | null) {
    if (!caseId) throw new Error('Case ID is missing.');
    const noteTitle = 'HIGH PRIORITY: Client refused RN Care Management Services';
    let noteContent = 'Client refused RN Care Management Services. Minimum necessary documentation satisfied. RN will not proceed with further care plan development.';
    if (details && details.trim()) {
      noteContent += ` Refusal details: ${details.trim()}`;
    }
    const r = await createAutoNoteAsUser({
      caseId,
      noteType: 'client_refusal',
      title: noteTitle,
      content: noteContent,
      triggerEvent: 'client_refused_care_management',
      visibleToClient: false,
      visibleToRN: true,
      visibleToAttorney: true,
    });
    return r;
  }

  /** C-5: HIGH PRIORITY attorney note for V2 participation refusal. Uses createAutoNoteAsUser (auth + created_by). No toast. */
  async function createV2ParticipationRefusalAttorneyNote(refusalComment: string) {
    if (!caseId) throw new Error('Case ID is missing.');
    const noteTitle = 'HIGH PRIORITY: Client refused RN Care Management Services';
    const noteContent = `Client refused RN Care Management participation. Refusal details: ${refusalComment}. Minimum necessary documentation satisfied. CPB locked.`;
    const r = await createAutoNoteAsUser({
      caseId,
      noteType: 'v2_participation_refusal',
      title: noteTitle,
      content: noteContent,
      triggerEvent: 'v2_participation_refused',
      visibleToClient: false,
      visibleToRN: true,
      visibleToAttorney: true,
    });
    if (!r.ok) throw r.error;
  }

  /** Flag case as declined/refused. Priority: rc_cases.flags (JSON) > rn_status > status. */
  async function flagCaseDeclined(caseIdParam: string) {
    const { data: raw, error: fetchErr } = await supabaseGet<unknown[]>(
      "rc_cases",
      `id=eq.${caseIdParam}&is_superseded=eq.false&select=*`
    );
    if (fetchErr || !raw) return;
    const arr = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
    const r = arr[0] as Record<string, unknown> | undefined;
    if (!r) return;
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {};
    const hasFlags = r.flags != null;
    const hasRnStatus = r.rn_status != null;
    const hasStatus = r.status != null;
    const hasCaseStatus = r.case_status != null;
    if (hasFlags) {
      const prev = typeof r.flags === 'object' && !Array.isArray(r.flags) ? (r.flags as Record<string, unknown>) : {};
      patch.flags = { ...prev, service_declined: true, service_declined_at: now };
    } else if (hasRnStatus) {
      patch.rn_status = 'declined';
    } else if (hasStatus || hasCaseStatus) {
      if (hasStatus) patch.status = 'declined';
      else patch.case_status = 'declined';
    }
    if (Object.keys(patch).length === 0) return;
    await supabaseUpdate("rc_cases", `id=eq.${caseIdParam}`, patch);
  }

  /** Care Plan Refused: confirm → persist refusal + attorney note + flag case → lock UI. */
  async function handleCarePlanRefused() {
    if (!caseId) {
      toast.error('Case ID is missing.');
      return;
    }
    try {
      if (user?.id) {
        await assertRnAcceptanceGate({
          case_id: caseId,
          rn_user_id: user.id,
          actor_role: "rn",
        });
      }
    } catch (gateErr) {
      const msg = gateErr instanceof Error ? gateErr.message : "RN acknowledgment required";
      toast.error(msg);
      return;
    }
    const refusalRecordedAtGuard = tenVsData.v2_viability?.refusal_recorded_at;
    if (refusalRecordedAtGuard) {
      toast.info('Care Plan Refusal already recorded.');
      return;
    }
    setRecordingRefusal(true);
    const now = new Date().toISOString();
    const followupDue = addDays(new Date(), 60);
    const followupDueIso = followupDue.toISOString();

    const refusalPayload = {
      ...tenVsData,
      v3_vision: {
        ...tenVsData.v3_vision,
        clinical_overlays: normalizeOverlayArray(tenVsData.v3_vision?.clinical_overlays ?? []),
      },
      v2_viability: {
        ...tenVsData.v2_viability,
        participation_primary: 'refused' as const,
        participation_secondary: null,
        refusal_recorded_at: now,
        followup_due_at: followupDueIso,
        refusal_notes: tenVsData.v2_viability?.refusal_notes ?? null,
        assessment: 'does_not_want_to_participate',
      },
    };

    try {
      const columnNames = ['ten_vs_data', 'ten_vs_json', 'care_plan_json', 'plan_json', 'plan_data', 'data', 'tenvs_data'];
      let saved = false;
      if (carePlanId) {
        for (const col of columnNames) {
          const { error: patchErr } = await supabaseUpdate(
            "rc_care_plans",
            `id=eq.${carePlanId}`,
            { [col]: refusalPayload, updated_at: now } as Record<string, unknown>
          );
          if (!patchErr) {
            saved = true;
            break;
          }
        }
      }
      if (!saved) {
        const { data: userData } = await supabase.auth.getUser();
        const rnUserId = userData?.user?.id ?? null;
        for (const col of columnNames) {
          const payload: Record<string, unknown> = {
            case_id: caseId,
            plan_type: RC_CARE_PLANS_VALID_PLAN_TYPE,
            plan_number: 1,
            status: 'draft',
            [col]: refusalPayload,
          };
          if (rnUserId) payload.created_by = rnUserId;
          const { data: insertResult, error: insErr } = await supabase
            .from('rc_care_plans')
            .insert(payload)
            .select('id');
          if (!insErr && insertResult && Array.isArray(insertResult) && insertResult.length > 0) {
            setCarePlanId((insertResult[0] as { id: string }).id);
            saved = true;
            break;
          }
        }
      }
      if (!saved) throw new Error('Could not persist refusal to care plan.');

      const details = tenVsData.v2_viability?.refusal_notes ?? tenVsData.v2_viability?.outreach_attempts_notes ?? null;
      const noteRes = await createRefusalAttorneyNote(details);
      if (!noteRes.ok) {
        console.error('H-block refusal note failed', noteRes.error);
        toast.warning('Refusal recorded, but attorney note could not be created (permissions).');
      }
      await flagCaseDeclined(caseId);

      setTenVsData(prev => ({
        ...prev,
        v2_viability: {
          ...prev.v2_viability,
          participation_primary: 'refused',
          participation_secondary: null,
          refusal_recorded_at: now,
          followup_due_at: followupDueIso,
          assessment: 'does_not_want_to_participate',
        },
      }));
      if (noteRes.ok) toast.success('Refusal recorded and attorney notified.');
      setShowRefusalConfirm(false);
    } catch (e: unknown) {
      const err = e as { message?: string };
      console.error('Care Plan Refused error:', e);
      toast.error(err?.message || 'Failed to record refusal.');
    } finally {
      setRecordingRefusal(false);
    }
  }

  // Storage persistence helper functions
  async function uploadTenVsToStorage(
    caseId: string,
    tenVsData: TenVsData
  ): Promise<string> {
    const storagePath = `care-plan-drafts/${caseId}.json`;
    const jsonBlob = new Blob([JSON.stringify(tenVsData, null, 2)], { type: 'application/json' });
    
    // Upload to storage bucket (upsert)
    const { error: uploadError } = await supabase.storage
      .from('rcms-documents')
      .upload(storagePath, jsonBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/json',
      });
    
    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    return storagePath;
  }

  async function loadTenVsFromStorage(caseId: string): Promise<TenVsData | null> {
    try {
      const storagePath = `care-plan-drafts/${caseId}.json`;
      
      // Try to download from storage
      const { data, error } = await supabase.storage
        .from('rcms-documents')
        .download(storagePath);
      
      if (error || !data) {
        return null;
      }
      
      const text = await data.text();
      return JSON.parse(text) as TenVsData;
    } catch (err) {
      console.error('Error loading from storage:', err);
      return null;
    }
  }

  async function saveCarePlan(mode: 'draft' | 'continue' | 'complete') {
    // H-14: H-block refusal recorded — block ALL write modes before any other logic
    if (isHRefusalLocked) {
      toast.info(H_REFUSAL_LOCK_MSG);
      setSaving(false);
      return;
    }
    // F-10: Medical Necessity hard-stop — block all modes before any other logic
    const medNecSave = getMedicalNecessityHardStopReason(tenVsData);
    if (medNecSave.blocked) {
      setV8MedicalNecessityError(medNecSave.needsComment);
      toast.error(medNecSave.reason ?? 'Medical Necessity hard stop');
      setSaving(false);
      return;
    }

    const isComplete = mode === 'complete';
    const shouldContinue = mode === 'continue';
    
    // Initialize SAVE TRUTH state (storage-only persistence for drafts)
    const actionStartTime = new Date().toISOString();
    setSaveTruth({
      lastAction: mode,
      actionStartedAt: actionStartTime,
      actionFinishedAt: null,
      guardFailures: [],
      saveAttempted: false,
      payloadSummary: null,
      supabaseOps: [],
      reread: null,
      persistenceTarget: null,
      storagePath: null,
      storageUpload: null,
      finalResult: null,
    });

    // Guard checks - record failures instead of silently returning
    const guardFailures: string[] = [];
    
    if (!caseId) {
      guardFailures.push('Missing caseId');
      toast.error(mode === 'continue' ? 'Cannot continue: missing case ID' : 'Case ID is missing. Cannot save care plan.');
    }
    
    // Check for tenVsData (allow empty object but record it)
    const hasTenVsData = tenVsData && Object.keys(tenVsData).length > 0;
    if (!hasTenVsData) {
      guardFailures.push('tenVsData empty');
      toast.error('No care plan data to save');
    }

    // C-5: V2 Participation refusal — refusal_comment required when status=refused (draft only)
    const participationStatusSave = tenVsData.v2_participation?.status ?? 'participating';
    const isC5RefusedSave = participationStatusSave === 'refused';
    if (mode === 'draft' && isC5RefusedSave && !(tenVsData.v2_participation?.refusal_comment?.trim())) {
      guardFailures.push('Refusal details (required)');
      toast.error('Refusal details (required)');
    }
    // C-5: Block continue/complete when participation=refused
    if ((mode === 'continue' || mode === 'complete') && isC5RefusedSave) {
      guardFailures.push('Client refused participation. CPB sections are locked. Save Draft to record refusal.');
      toast.error('Client refused participation. CPB sections are locked. Save Draft to record refusal.');
    }

    // Phase 1: Block Finalize (continue/complete) if required V acknowledgments are missing
    if ((mode === 'continue' || mode === 'complete') && requiredVs.length > 0) {
      const phase1Acks = tenVsData.v3_vision?.phase1_required_v_ack || {};
      const missingVs: string[] = [];
      
      for (const vId of requiredVs) {
        const ack = phase1Acks[vId];
        if (!ack || !ack.status) {
          missingVs.push(vId);
        } else if (ack.status === 'na') {
          // N/A requires a reason
          if (!ack.reason) {
            missingVs.push(vId);
          } else if (ack.reason === 'other' && !ack.note?.trim()) {
            // "Other" requires a note
            missingVs.push(vId);
          }
        }
      }
      
      if (missingVs.length > 0) {
        const missingLabels = missingVs.map(vId => {
          const vDef = getVDefinitionById(vId as any);
          return vDef?.label || vId;
        }).join(', ');
        guardFailures.push(`Please acknowledge all required 10-V checks (Addressed or N/A) before finalizing. Missing: ${missingLabels}`);
        toast.error(`Please acknowledge all required 10-V checks (Addressed or N/A) before finalizing. Missing: ${missingLabels}`);
      }
    }

    // Record payload summary
    const tenVsKeys = tenVsData ? Object.keys(tenVsData) : [];
    setSaveTruth(prev => ({
      ...prev,
      payloadSummary: {
        caseId: caseId || null,
        hasTenVsData,
        tenVsKeys,
        draftId: carePlanId || null,
      },
      guardFailures,
    }));

    // If any guard fails, stop here
    if (guardFailures.length > 0) {
      setSaveTruth(prev => ({
        ...prev,
        actionFinishedAt: new Date().toISOString(),
      }));
      setSaving(false);
      return;
    }

    setV8MedicalNecessityError(false);

    // Log payload
    console.log('[CPB SAVE] payload', { caseId, mode, tenVsKeys });

    setSaving(true);
    setSaveTruth(prev => ({ ...prev, saveAttempted: true }));

    try {
      if (caseId && user?.id) {
        await assertRnAcceptanceGate({
          case_id: caseId,
          rn_user_id: user.id,
          actor_role: "rn",
        });
      }
      // Ensure rc_care_plans row exists and carePlanId is set before storage/UPDATE/navigate
      let resolvedCarePlanId: string;
      try {
        const { carePlanId: id } = await ensureRcCarePlanRow({ supabase, caseId: caseId!, carePlanId });
        resolvedCarePlanId = id;
        setCarePlanId(id);
      } catch (ensureErr: unknown) {
        const err = ensureErr instanceof Error ? ensureErr : new Error(String(ensureErr));
        console.error('TenVsBuilder: ensureRcCarePlanRow failed', err);
        toast.error('Care plan could not be saved. Please try again.');
        setSaveTruth(prev => ({ ...prev, finalResult: 'error', actionFinishedAt: new Date().toISOString() }));
        setSaving(false);
        return;
      }

      const planStatus = isComplete ? 'submitted' : 'draft';
      
      // C-5: V2 Participation refusal — idempotent high-priority attorney note on first Save Draft when refused.
      // Auto-note failure (RLS/401) must NOT abort Save Draft: wrap in try/catch, only set refusal_note_sent_at when note succeeds.
      const needToSendV2RefusalNote = mode === 'draft' && isC5RefusedSave &&
        !!(tenVsData.v2_participation?.refusal_comment?.trim()) && !tenVsData.v2_participation?.refusal_note_sent_at;
      let nowForNote: string | null = null;
      let noteSent = false;
      if (needToSendV2RefusalNote) {
        try {
          await createV2ParticipationRefusalAttorneyNote(tenVsData.v2_participation!.refusal_comment!.trim());
          nowForNote = new Date().toISOString();
          noteSent = true;
        } catch {
          // Do not abort Save Draft. Do not set refusal_note_sent_at so the system can retry later.
          // Toast will be shown after draft upload succeeds.
        }
      }

      // Step 1: Upload JSON to storage (STORAGE-ONLY for drafts; no rc_documents)
      let storagePath: string | null = null;
      
      try {
        const toSave: TenVsData = {
          ...tenVsData,
          v3_vision: {
            ...tenVsData.v3_vision,
            clinical_overlays: normalizeOverlayArray(tenVsData.v3_vision?.clinical_overlays ?? []),
            phase1_overlay_selections: selectedOverlayIds,
            phase1_overlay_applied: appliedOverlayByP,
          },
          v2_participation: noteSent && nowForNote
            ? { ...(tenVsData.v2_participation || {}), refusal_note_sent_at: nowForNote }
            : tenVsData.v2_participation,
        };
        storagePath = await uploadTenVsToStorage(caseId!, toSave);
        
        if (needToSendV2RefusalNote && !noteSent) {
          toast.warning('Draft saved, but attorney auto-note could not be created (permissions). Please notify admin.');
        }
        if (noteSent && nowForNote) {
          setTenVsData(prev => ({ ...prev, v2_participation: { ...(prev.v2_participation || {}), refusal_note_sent_at: nowForNote } }));
        }

        setSaveTruth(prev => ({
          ...prev,
          storageUpload: { success: true, path: storagePath! },
          persistenceTarget: 'storage-only',
          storagePath,
        }));
        
        console.log('TenVsBuilder: 10-Vs data uploaded to storage', { storagePath });
      } catch (uploadErr: any) {
        const errorMsg = uploadErr?.message || String(uploadErr);
        setSaveTruth(prev => ({
          ...prev,
          storageUpload: { success: false, error: errorMsg },
          finalResult: 'error',
        }));
        toast.error(`Failed to upload to storage: ${errorMsg}`);
        throw uploadErr;
      }
      
      // Set finalResult only when persistence is fully done: draft/continue = storage only; complete = after rc_care_plans succeeds
      if (!isComplete) {
        setSaveTruth(prev => ({ ...prev, finalResult: 'success' }));
      }
      
      const now = new Date().toISOString();
      
      if (isComplete) {
        // Step 2: Update rc_care_plans (row guaranteed by ensureRcCarePlanRow)
        try {
          const { error: updateErr } = await supabase
            .from('rc_care_plans')
            .update({ status: 'submitted', submitted_at: now, updated_at: now })
            .eq('id', resolvedCarePlanId);
          if (updateErr) throw updateErr;
          setSaveTruth(prev => ({
            ...prev,
            rcCarePlansUpdate: { success: true },
            finalResult: 'success',
            supabaseOps: [...prev.supabaseOps, { op: 'UPDATE', table: 'rc_care_plans', status: 'success' as const }],
          }));
          console.log('TenVsBuilder: Care plan metadata updated');
        } catch (updateErr: unknown) {
          const errorMsg = updateErr instanceof Error ? updateErr.message : String(updateErr);
          setSaveTruth(prev => ({
            ...prev,
            rcCarePlansUpdate: { success: false, error: errorMsg },
            supabaseOps: [...prev.supabaseOps, { op: 'UPDATE', table: 'rc_care_plans', status: 'error' as const, errorCode: 'UPDATE_ERROR', errorMessage: errorMsg }],
          }));
          toast.error(`Metadata update failed: ${errorMsg}`);
          throw updateErr;
        }
      }
      
      // Verify storage save by re-reading (storage-only)
      if (storagePath) {
        try {
          const loadedData = await loadTenVsFromStorage(caseId!);
          const hasSavedData = loadedData && Object.keys(loadedData).length > 0;
          setSaveTruth(prev => ({
            ...prev,
            reread: { ok: !!loadedData, id: null, updatedAt: now, hasTenVsData: hasSavedData },
          }));
          if (!hasSavedData) toast.error('Saved but verification shows empty data');
        } catch (rereadErr: any) {
          setSaveTruth(prev => ({
            ...prev,
            reread: { ok: false, id: null, updatedAt: null, hasTenVsData: false },
          }));
          console.warn('Could not verify storage save:', rereadErr);
        }
      }
      
      setCarePlanStatus(isComplete ? 'Complete' : carePlanStatus === 'Draft' ? 'In Progress' : carePlanStatus);
      setLastUpdated(new Date().toISOString());
      
      if (isComplete) {
        toast.success('Care plan completed!');
        setTimeout(() => navigate(`/rn/case/${caseId}/finalize`), 1000);
      } else if (shouldContinue) {
        toast.success('Care plan saved! Continuing to finalize...');
        navigate(`/rn/case/${caseId}/finalize`);
      } else {
        toast.success('Draft saved');
      }
    } catch (err: any) {
      console.error('TenVsBuilder: Error saving care plan:', err);
      const errorMessage = err?.message || 'Failed to save care plan';
      toast.error(`Failed to save: ${errorMessage}`);
      // Ensure finalResult is set to error if not already set
      setSaveTruth(prev => ({
        ...prev,
        finalResult: prev.finalResult || 'error',
      }));
    } finally {
      setSaving(false);
      setSaveTruth(prev => ({
        ...prev,
        actionFinishedAt: new Date().toISOString(),
      }));
    }
  }

  const handleBackToDraft = (draftId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rcms_active_case_id", draftId);
    }
    navigate(`/rn/case/${draftId}/ten-vs`);
  };

  const calculateViabilityIndex = () => {
    // V2 no longer uses numeric scores, so viability index is calculated from 4Ps
    // This is already handled in the clientSummary calculation
    return null;
  };

  const getStatusBadge = () => {
    switch (carePlanStatus) {
      case 'Draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'Complete':
        return <Badge className="bg-green-500">Complete</Badge>;
      default:
        return <Badge variant="outline">{carePlanStatus}</Badge>;
    }
  };

  // Helper function to safely render values
  const renderValue = (v: any): string => {
    // Handle null/undefined
    if (v == null) return 'Not provided';
    
    // Handle empty string
    if (typeof v === 'string' && v.trim() === '') return 'Not provided';
    
    // Handle empty array
    if (Array.isArray(v) && v.length === 0) return 'Not provided';
    
    // Handle empty object
    if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return 'Not provided';
    
    // Handle arrays with content
    if (Array.isArray(v)) {
      return v.join(', ');
    }
    
    // Handle objects with content
    if (typeof v === 'object') {
      return JSON.stringify(v, null, 2);
    }
    
    return String(v);
  };

  // Extract 4Ps from intake_json
  const extractFourPsFromIntake = (json: any): any => {
    if (!json) return null;
    const fourpsPaths = ['fourPs', 'fourps', 'intake.fourPs', 'intake.fourps', 'raw_intake.fourPs', 'raw_intake.fourps'];
    const result = findValueInJson(json, fourpsPaths);
    return result.value;
  };

  /**
   * Extract client 4Ps self-assessment from intake-like JSON and/or rc_cases.fourps.
   * Used for read-only display in V3: VISION. Never throws; returns {} when missing.
   * Supports: fourPs, fourps, intake.*, raw_intake.*, self_assessment.four_ps, four_ps_scores, assessments["4ps"].
   */
  function extractClient4PsSelfAssessment(
    intakeLike: any,
    caseFourps?: { physical?: number; psychological?: number; psychosocial?: number; professional?: number } | null
  ): { p1?: number; p2?: number; p3?: number; p4?: number; labels?: { p1?: string; p2?: string; p3?: string; p4?: string }; source?: string } {
    const out: { p1?: number; p2?: number; p3?: number; p4?: number; labels?: { p1?: string; p2?: string; p3?: string; p4?: string }; source?: string } = {};
    const toNum = (v: unknown): number | undefined =>
      typeof v === 'number' && v >= 1 && v <= 5 ? v : undefined;
    const read = (o: any) => ({
      p1: toNum(o?.physical ?? o?.p1_physical),
      p2: toNum(o?.psychological ?? o?.p2_psychological),
      p3: toNum(o?.psychosocial ?? o?.p3_psychosocial),
      p4: toNum(o?.professional ?? o?.p4_professional),
    });
    let obj: any = null;
    let source = '';
    if (intakeLike) {
      const fourpsPaths = ['fourPs', 'fourps', 'intake.fourPs', 'intake.fourps', 'raw_intake.fourPs', 'raw_intake.fourps', 'self_assessment.four_ps', 'self_assessment.four_ps_scores', 'four_ps_scores'];
      const res = findValueInJson(intakeLike, fourpsPaths);
      if (res.value) {
        obj = res.value;
        source = `intake.${res.path || 'fourps'}`;
      }
      if (!obj && intakeLike?.assessments) {
        obj = intakeLike.assessments['4ps'] ?? intakeLike.assessments['four_ps'] ?? intakeLike.assessments.four_ps;
        if (obj) source = 'intake.assessments';
      }
    }
    const fromIntake = obj ? read(obj) : { p1: undefined, p2: undefined, p3: undefined, p4: undefined };
    const fromCase = caseFourps ? read(caseFourps) : { p1: undefined, p2: undefined, p3: undefined, p4: undefined };
    out.p1 = fromIntake.p1 ?? fromCase.p1;
    out.p2 = fromIntake.p2 ?? fromCase.p2;
    out.p3 = fromIntake.p3 ?? fromCase.p3;
    out.p4 = fromIntake.p4 ?? fromCase.p4;
    if (source && caseFourps && (!out.p1 || !out.p2 || !out.p3 || !out.p4)) source = 'intake+rc_cases.fourps';
    else if (!source && fromCase.p1 !== undefined) source = 'rc_cases.fourps';
    if (source) out.source = source;
    const lab: { p1?: string; p2?: string; p3?: string; p4?: string } = {};
    if (out.p1 != null) lab.p1 = getSeverityLabel(out.p1) ?? undefined;
    if (out.p2 != null) lab.p2 = getSeverityLabel(out.p2) ?? undefined;
    if (out.p3 != null) lab.p3 = getSeverityLabel(out.p3) ?? undefined;
    if (out.p4 != null) lab.p4 = getSeverityLabel(out.p4) ?? undefined;
    if (Object.keys(lab).length) out.labels = lab;
    return out;
  }

  // Extract SDOH from intake_json
  const extractSdohFromIntake = (json: any): any => {
    if (!json) return null;
    const sdohPaths = ['sdoh', 'intake.sdoh', 'raw_intake.sdoh'];
    const result = findValueInJson(json, sdohPaths);
    return result.value;
  };

  const SDOH_DOMAIN_KEYS = ['housing', 'food', 'transport', 'insuranceGap', 'financial', 'employment', 'social_support', 'safety', 'healthcare_access'] as const;
  const SDOH_DOMAIN_LABELS: Record<(typeof SDOH_DOMAIN_KEYS)[number], string> = {
    housing: 'Housing',
    food: 'Food',
    transport: 'Transportation',
    insuranceGap: 'Insurance gap',
    financial: 'Financial',
    employment: 'Employment',
    social_support: 'Social support',
    safety: 'Safety',
    healthcare_access: 'Healthcare access',
  };
  /** Returns 1–5 overall SDOH score for display only. Prefers sdoh.overall_score; else mean of domain 1–5 values, rounded and clamped. No percent/index. */
  function computeSdohOverallScore1to5(sdoh: Record<string, unknown> | null | undefined): number | null {
    if (!sdoh || typeof sdoh !== 'object') return null;
    const explicit = sdoh.overall_score;
    if (typeof explicit === 'number' && explicit >= 1 && explicit <= 5) return Math.round(explicit) as 1 | 2 | 3 | 4 | 5;
    const values: number[] = [];
    for (const k of SDOH_DOMAIN_KEYS) {
      const v = sdoh[k];
      if (typeof v === 'number' && v >= 1 && v <= 5) values.push(v);
    }
    if (values.length === 0) return null;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return Math.max(1, Math.min(5, Math.round(mean))) as 1 | 2 | 3 | 4 | 5;
  }

  /** Shared card pattern for 4Ps Viability and SDOH Viability in Client Summary. Same container, title, score weight, and definition typography. */
  function ViabilityCard({
    title,
    subtitle,
    scoreNode,
    definitionNode,
    bodyNode,
    containerClassName,
  }: {
    title: string;
    subtitle?: ReactNode;
    scoreNode: ReactNode;
    definitionNode: ReactNode;
    bodyNode?: ReactNode;
    containerClassName?: string;
  }) {
    return (
      <div className={`border rounded-lg p-4 ${containerClassName ?? ''}`.trim()}>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle != null && <p className="text-xs text-foreground/80 mt-0.5">{subtitle}</p>}
        <div className="mt-2">{scoreNode}</div>
        <div className="mt-2 text-sm text-foreground/80">{definitionNode}</div>
        {bodyNode != null && <div className="mt-3">{bodyNode}</div>}
      </div>
    );
  }

  // Extract medications from intake_json
  const extractMedicationsFromIntake = (json: any): any[] => {
    if (!json) return [];
    
    // Try multiple paths
    const medPaths = ['medications', 'intake.medications', 'raw_intake.medications'];
    let meds: any = null;
    
    for (const path of medPaths) {
      const parts = path.split('.');
      let current: any = json;
      let found = true;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          found = false;
          break;
        }
      }
      if (found && current !== undefined && current !== null) {
        meds = current;
        break;
      }
    }
    
    if (!meds) return [];
    
    // Handle different structures
    if (Array.isArray(meds)) {
      return meds;
    }
    
    // Handle { preInjury: [...], postInjury: [...] } structure
    if (meds.preInjury || meds.postInjury) {
      const all: any[] = [];
      if (Array.isArray(meds.preInjury)) {
        all.push(...meds.preInjury.map((m: any) => ({ ...m, timing: 'Pre-injury' })));
      }
      if (Array.isArray(meds.postInjury)) {
        all.push(...meds.postInjury.map((m: any) => ({ ...m, timing: 'Post-injury' })));
      }
      return all;
    }
    
    return [];
  };

  if (!caseId) {
    return (
      <div className="p-6">
        <RNEmptyState
          title="No case selected"
          message="Select a case to continue."
          variant="empty"
          actions={[{ label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") }]}
        />
      </div>
    );
  }

  if (!isValidUuid(caseId)) {
    return (
      <div className="p-6">
        <RNEmptyState
          title="Case not found"
          message="Unable to load case. The case ID may be invalid."
          variant="error"
          actions={[{ label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") }]}
        />
      </div>
    );
  }

  if (loadTimedOut) {
    return (
      <div className="p-6">
        <RNEmptyState
          title="Loading is taking longer than expected"
          message="This is taking longer than expected. Please retry."
          variant="error"
          actions={[
            { label: "Retry", onClick: fetchCaseData },
            { label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") },
          ]}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <RNEmptyState title="Loading case…" message="Please wait." variant="loading" />
      </div>
    );
  }

  if (error) {
    const isNotFound = error === "Case not found";
    return (
      <div className="p-6">
        <RNEmptyState
          title={isNotFound ? "Case not available" : "We couldn't load this case right now."}
          message={isNotFound ? "Case not available." : "We couldn't load this case right now."}
          variant="error"
          actions={[
            { label: "Retry", onClick: fetchCaseData },
            { label: "Back to Dashboard", onClick: () => navigate("/rn/dashboard") },
          ]}
        />
      </div>
    );
  }

  const viabilityIndex = calculateViabilityIndex();
  
  // Determine if controls should be disabled: lock ONLY after refusal is RECORDED (not on selection)
  const isDisabled = !!refusalRecordedAt || effectiveReadOnly;
  // C-5: V2 Participation Gate — lock V1,V3–V10 when participation = refused
  const participationStatus = tenVsData.v2_participation?.status ?? 'participating';
  const isC5Refused = participationStatus === 'refused';
  const isSectionLocked = isDisabled || isC5Refused;
  // F-10: V8 Medical Necessity hard-stop — when No: comment required, all save/continue/complete/finalize blocked
  const medNec = getMedicalNecessityHardStopReason(tenVsData);
  // H-14: CPB lock = section lock (C-5, view-only, H-refusal), H-refusal recorded, or F-10 med necessity blocked (no intake/docs lock)
  const isCpbLocked = isSectionLocked || isHRefusalLocked || medNec.blocked;

  const caseIdentifier = [caseData?.client_name, caseData?.case_number].filter(Boolean).join(' • ') || (caseId ? caseId.slice(-8) : '—');

  // Helper component to render V definition info block
  function VDefinitionBlock({ vId }: { vId: "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8" | "V9" | "V10" }) {
    const vDef = getVDefinitionById(vId);
    if (!vDef) return null;

    return (
      <Collapsible defaultOpen={false}>
        <Card className="border-blue-200 bg-blue-50/50">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-sm font-semibold text-blue-900">What this means</CardTitle>
                </div>
                <ChevronDown className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-1">Literal meaning:</p>
                <p className="text-sm text-blue-900 mb-3">{vDef.literalMeaning}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-1">Etymology-Aligned Definition:</p>
                <p className="text-sm text-blue-900">{vDef.definition}</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header bar: Back to Dashboard + Case identifier — fixed height to prevent layout jump */}
      <div className="min-h-[3.5rem] flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <Button onClick={() => navigate('/rn/dashboard')} variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="text-sm font-semibold text-slate-900">
          Case <span className="font-mono text-slate-600">{caseIdentifier}</span>
        </div>
      </div>
      
      {/* Refusal Banner — only when refusal has been RECORDED (attorney notified). H-12: isRefusalRecorded locks refusal UI. */}
      {isRefusalRecorded && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">Client Refused Care Plan</AlertTitle>
          <AlertDescription className="text-orange-800">
            Read-only mode. Do not create or store additional care plan content unless the client re-engages.
          </AlertDescription>
        </Alert>
      )}
      {/* C-5: V2 Participation Refusal — CPB locked; document refusal and Save Draft. Intake/docs remain viewable. */}
      {isC5Refused && (
        <Alert className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 font-semibold">Client Refused Participation</AlertTitle>
          <AlertDescription className="text-amber-800">
            CPB sections are locked. Document refusal in the Participation Gate (V2) and use Save Draft to record. Intake Snapshot and existing documents remain viewable.
          </AlertDescription>
        </Alert>
      )}

      {/* Draft vs Released state badge - standalone only (when used in CarePlanWorkflow, badge is in workflow header) */}
      {showBadge && (
        <RNCaseStateBadge
          mode={mode}
          isViewOnly={isViewOnly}
          loading={modeLoading}
          backToDraftId={backToDraftId}
          onBackToDraft={handleBackToDraft}
          showBackToDraft={true}
          showPublishHint={true}
          sourceCaseId={caseId}
          onCreateRevisionSuccess={(newDraftId) => {
            if (typeof window !== "undefined") {
              window.localStorage.setItem("rcms_active_case_id", newDraftId);
            }
            toast.success("Revision created. You are now editing a new draft.");
            navigate(`/rn/case/${newDraftId}/ten-vs`);
          }}
        />
      )}
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">10-Vs Care Plan Builder</h1>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Evidence-Based Criteria
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem
                onClick={() => window.open(ODG_URL, '_blank', 'noopener,noreferrer')}
                className="cursor-pointer"
              >
                ODG (opens in new tab)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(MCG_URL, '_blank', 'noopener,noreferrer')}
                className="cursor-pointer"
              >
                MCG (opens in new tab)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(INTERQUAL_URL, '_blank', 'noopener,noreferrer')}
                className="cursor-pointer"
              >
                InterQual (opens in new tab)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(STATE_WC_URL, '_blank', 'noopener,noreferrer')}
                className="cursor-pointer"
              >
                State WC Guidelines (opens in new tab — Phase 2 will add state map inside CARE)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIntakeSnapshotOpen(!intakeSnapshotOpen)}
          >
            {intakeSnapshotOpen ? 'Hide Intake Snapshot' : 'View Intake Snapshot'}
          </Button>
          {getStatusBadge()}
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Last updated: {format(parseISO(lastUpdated), 'MMM d, yyyy h:mm a')}
            </span>
          )}
        </div>
      </div>

      {/* Debug Panel - Temporary (only shows when ?debug=1) */}
      {showDebug && debugInfo && (
        <Card className="border-2 border-red-500">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-red-700">🔍 RN Debug Panel (Temporary - ?debug=1)</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(false)}>Hide</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs font-mono">
            <div className="border-b pb-2">
              <div><strong>Case ID:</strong> {debugInfo.caseId}</div>
              <div><strong>Intake Found:</strong> {debugInfo.intakeFound ? 'Yes' : 'No'}</div>
              {debugInfo.intakeId && <div><strong>Intake ID:</strong> {debugInfo.intakeId}</div>}
              {debugInfo.intakeCreatedAt && <div><strong>Intake Created:</strong> {debugInfo.intakeCreatedAt}</div>}
              <div><strong>Intake JSON Top-Level Keys:</strong> {debugInfo.intakeJsonKeys.length > 0 ? debugInfo.intakeJsonKeys.join(', ') : 'None'}</div>
            </div>
            
            <div className="border-b pb-2">
              <div className="font-semibold text-red-800 mb-1">From rc_cases:</div>
              <div><strong>4Ps:</strong> {debugInfo.fourpsFromCase ? JSON.stringify(debugInfo.fourpsFromCase, null, 2) : 'null'}</div>
              <div><strong>SDOH:</strong> {debugInfo.sdohFromCase ? JSON.stringify(debugInfo.sdohFromCase, null, 2) : 'null'}</div>
            </div>
            
            <div className="border-b pb-2">
              <div className="font-semibold text-red-800 mb-1">From intake_json (with path matching):</div>
              <div><strong>4Ps Matched Path:</strong> {debugInfo.matchedFourpsPath || 'none'}</div>
              <div><strong>4Ps Extracted Value:</strong> {debugInfo.extractedFourps ? JSON.stringify(debugInfo.extractedFourps, null, 2) : 'null'}</div>
              <div className="mt-1"><strong>SDOH Matched Path:</strong> {debugInfo.matchedSdohPath || 'none'}</div>
              <div><strong>SDOH Extracted Value:</strong> {debugInfo.extractedSdoh ? JSON.stringify(debugInfo.extractedSdoh, null, 2) : 'null'}</div>
              <div className="mt-1"><strong>Pain Matched Path:</strong> {debugInfo.matchedPainPath || 'none'}</div>
              <div><strong>Pain Extracted Value:</strong> {debugInfo.extractedPain !== null && debugInfo.extractedPain !== undefined ? String(debugInfo.extractedPain) : 'null'}</div>
              <div className="mt-1"><strong>Anxiety Matched Path:</strong> {debugInfo.matchedAnxietyPath || 'none'}</div>
              <div><strong>Anxiety Extracted Value:</strong> {debugInfo.extractedAnxiety !== null && debugInfo.extractedAnxiety !== undefined ? String(debugInfo.extractedAnxiety) : 'null'}</div>
              <div className="mt-1"><strong>Depression Matched Path:</strong> {debugInfo.matchedDepressionPath || 'none'}</div>
              <div><strong>Depression Extracted Value:</strong> {debugInfo.extractedDepression !== null && debugInfo.extractedDepression !== undefined ? String(debugInfo.extractedDepression) : 'null'}</div>
            </div>
            
            <div className="border-b pb-2">
              <div className="font-semibold text-red-800 mb-1">Current UI State:</div>
              <div><strong>Data Source Used:</strong> {clientSummary?.data_source || 'none'}</div>
              <div><strong>4Ps Scores (UI):</strong> {clientSummary?.fourp_scores ? JSON.stringify(clientSummary.fourp_scores) : 'null'}</div>
              <div><strong>SDOH Scores (UI):</strong> {clientSummary?.sdoh_scores ? JSON.stringify(clientSummary.sdoh_scores) : 'null'}</div>
            </div>
            
            {debugInfo.errors.length > 0 && (
              <div className="mt-2 text-red-600">
                <strong>Errors:</strong>
                <ul className="list-disc list-inside">
                  {debugInfo.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Area with Split View */}
      <div className="flex w-full gap-4">
        {/* Main CPB Content */}
        <section className="flex-1 min-w-0 space-y-6" style={{ position: 'relative' }}>
          {/* Client Summary Panel */}
          <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-center">
                    <CardTitle>Client Summary</CardTitle>
                    {summaryOpen ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {clientSummary && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Date of Injury</p>
                          <p className="text-sm">
                            {caseData?.date_of_injury
                              ? format(parseISO(caseData.date_of_injury), 'MMM d, yyyy')
                              : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Case Number</p>
                          <p className="text-sm font-mono">{caseData?.case_number || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ViabilityCard
                          containerClassName="bg-white border-l-4 border-l-sky-200 ring-1 ring-black/5"
                          title="4Ps Viability"
                          scoreNode={
                            <p className="text-lg font-bold">
                              {clientSummary.viability_index != null && clientSummary.viability_index > 0
                                ? (() => {
                                    const n = Math.max(1, Math.min(5, Math.round(Number(clientSummary.viability_index))));
                                    const lab = getSeverityLabel(n);
                                    return lab ? `${n}/5 — ${lab}` : `${n}/5`;
                                  })()
                                : 'Not calculated'}
                            </p>
                          }
                          definitionNode={
                            <>
                              <p className="font-medium text-foreground">Intrinsic factors (4Ps):</p>
                              <p className="mt-0.5">Internal health drivers and capacity/engagement factors reflected in the 4Ps self-assessment. Use to inform goal-setting and participation planning.</p>
                            </>
                          }
                          bodyNode={
                            <div className="text-sm space-y-1">
                              <div>Physical: <span className="font-medium">{renderValue(clientSummary.fourp_scores.physical)}</span></div>
                              <div>Psychological: <span className="font-medium">{renderValue(clientSummary.fourp_scores.psychological)}</span></div>
                              <div>Psychosocial: <span className="font-medium">{renderValue(clientSummary.fourp_scores.psychosocial)}</span></div>
                              <div>Professional: <span className="font-medium">{renderValue(clientSummary.fourp_scores.professional)}</span></div>
                            </div>
                          }
                        />
                        <ViabilityCard
                          containerClassName="bg-white border-l-4 border-l-violet-200 ring-1 ring-black/5"
                          title="SDOH Viability"
                          scoreNode={
                            <p className="text-lg font-bold">
                              {clientSummary.sdoh_scores && Object.keys(clientSummary.sdoh_scores).length > 0
                                ? (() => {
                                    const n = computeSdohOverallScore1to5(clientSummary.sdoh_scores as Record<string, unknown>);
                                    if (n == null) return 'Not collected';
                                    const lab = getSeverityLabel(n);
                                    return lab ? `${n}/5 — ${lab}` : `${n}/5`;
                                  })()
                                : 'Not collected'}
                            </p>
                          }
                          definitionNode={
                            <>
                              <p className="font-medium text-foreground">Extrinsic factors (SDOH):</p>
                              <p className="mt-0.5">External stability factors (housing, food, transport, etc.) that can accelerate or limit recovery.</p>
                            </>
                          }
                          bodyNode={
                            <>
                              {clientSummary.sdoh_scores && Object.keys(clientSummary.sdoh_scores).length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                                  {SDOH_DOMAIN_KEYS.map(k => {
                                    const v = clientSummary.sdoh_scores![k];
                                    const disp = typeof v === 'number' && v >= 1 && v <= 5 ? `${v}/5` : (v === true ? 'Present' : v === false ? 'Not present' : 'Not answered');
                                    return <div key={k}>{SDOH_DOMAIN_LABELS[k]}: <span className="font-medium">{disp}</span></div>;
                                  })}
                                </div>
                              ) : null}
                              {(() => {
                                const st = tenVsData.v2_participation?.status;
                                if (!st) return null;
                                const lab = st === 'participating' ? 'Participating' : st === 'refused' ? 'Refused' : 'Unable to reach';
                                return <p className="text-sm text-foreground/80 mt-2">Participation status: {lab}</p>;
                              })()}
                            </>
                          }
                        />
                      </div>
                      {clientSummary.data_source && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Data source:</strong> {clientSummary.data_source}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

      {/* 10-Vs Accordion */}
      <Accordion type="multiple" className="space-y-4">
        {/* V1: VOICE/VIEW */}
        <AccordionItem value="v1" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              <span className="font-semibold">V1: VOICE/VIEW</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V1" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Feelings</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p1_physical || ''}
                    readOnly={isCpbLocked}
                    disabled={isCpbLocked}
                    onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p1_physical: e.target.value }
                    }))}
                    placeholder="What is the client feeling right now?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Fears</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p2_psychological || ''}
                    readOnly={isCpbLocked}
                    disabled={isCpbLocked}
                    onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p2_psychological: e.target.value }
                    }))}
                    placeholder="What is the client afraid of or worried about?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Concerns</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p3_psychosocial || ''}
                    readOnly={isCpbLocked}
                    disabled={isCpbLocked}
                    onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p3_psychosocial: e.target.value }
                    }))}
                    placeholder="What concerns does the client have about recovery, treatment, work, or daily life?"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>General comments</Label>
                  <Textarea
                    value={tenVsData.v1_voice.p4_professional || ''}
                    readOnly={isCpbLocked}
                    disabled={isCpbLocked}
                    onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                      ...prev,
                      v1_voice: { ...prev.v1_voice, p4_professional: e.target.value }
                    }))}
                    placeholder="Additional narrative context in the client's own voice."
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V2: VIABILITY */}
        <AccordionItem value="v2" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <span className="font-semibold">V2: VIABILITY</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
              {viabilityIndex != null && !isNaN(Number(viabilityIndex)) && (
                <Badge variant="outline" className="ml-2">
                  Index: {Math.max(1, Math.min(5, Math.round(Number(viabilityIndex))))}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V2" />
              {/* C-5: V2 Participation Gate — determines whether CPB proceeds */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Participation Gate</CardTitle>
                  <p className="text-sm text-muted-foreground font-normal">V2 determines whether CPB proceeds. If refused, document below and Save Draft to record.</p>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div>
                    <Label>Participation</Label>
                    <RadioGroup
                      value={tenVsData.v2_participation?.status ?? 'participating'}
                      onValueChange={(value: 'participating' | 'refused' | 'unable_to_determine') => {
                        setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v2_participation: { ...(prev.v2_participation || {}), status: value },
                        }));
                      }}
                      className="flex flex-col gap-2 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="participating" id="v2-part-participating" />
                        <Label htmlFor="v2-part-participating" className="font-normal cursor-pointer">Participating (Proceed)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="refused" id="v2-part-refused" />
                        <Label htmlFor="v2-part-refused" className="font-normal cursor-pointer">Refused</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unable_to_determine" id="v2-part-unable" />
                        <Label htmlFor="v2-part-unable" className="font-normal cursor-pointer">{PARTICIPATION_COPY.unable_to_determine.statusLabel}</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {participationStatus === 'unable_to_determine' && (
                    <p className="text-sm text-muted-foreground mt-2">{PARTICIPATION_COPY.unable_to_determine.rnHelper}</p>
                  )}
                  {participationStatus === 'refused' && (
                    <div>
                      <Label>Refusal details (required)</Label>
                      <Textarea
                        value={tenVsData.v2_participation?.refusal_comment ?? ''}
                        onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v2_participation: { ...(prev.v2_participation || {}), refusal_comment: e.target.value },
                        }))}
                        placeholder="Document the refusal in minimum-necessary terms…"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-sm text-muted-foreground">
                Assesses readiness, capacity, and stability across the 4Ps and SDOH.
              </p>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Participation Status (Primary) *</Label>
                    <Select
                      value={tenVsData.v2_viability.participation_primary || ''}
                      onValueChange={(value: 'wants' | 'undetermined' | 'refused') => {
                        setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v2_viability: {
                            ...prev.v2_viability,
                            participation_primary: value,
                            assessment: value === 'refused' ? 'does_not_want_to_participate' : (value === 'wants' ? 'wants_to_participate' : 'undetermined'),
                            participation_secondary: null,
                          },
                        }));
                      }}
                      disabled={isDisabled}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select participation status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wants">Client wants to participate</SelectItem>
                        <SelectItem value="undetermined">Undetermined</SelectItem>
                        <SelectItem value="refused">Client refused care plan</SelectItem>
                      </SelectContent>
                    </Select>
                    {refusalSelected && !refusalRecordedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Client has refused. Use the red &quot;Care Plan Refused&quot; button below to record refusal and notify the attorney. You can change this selection until then.
                      </p>
                    )}
                  </div>
                  
                  {/* Secondary participation options - conditional */}
                  {tenVsData.v2_viability.participation_primary === 'wants' && (
                    <div>
                      <Label>Participation Method (Secondary)</Label>
                      <Select
                        value={tenVsData.v2_viability.participation_secondary || ''}
                        onValueChange={(value: 'active_call' | 'async' | null) => {
                          setTenVsDataAndMarkDirty(prev => ({
                            ...prev,
                            v2_viability: {
                              ...prev.v2_viability,
                              participation_secondary: value
                            }
                          }));
                        }}
                        disabled={isCpbLocked}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select participation method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active_call">Actively participated (call/telephonic)</SelectItem>
                          <SelectItem value="async">Participated asynchronously (intake/portal/written input)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {tenVsData.v2_viability.participation_primary === 'undetermined' && (
                    <div>
                      <Label>Completion Method (Secondary)</Label>
                      <Select
                        value={tenVsData.v2_viability.participation_secondary || ''}
                        onValueChange={(value: 'unreachable' | null) => {
                          setTenVsDataAndMarkDirty(prev => ({
                            ...prev,
                            v2_viability: {
                              ...prev.v2_viability,
                              participation_secondary: value
                            }
                          }));
                        }}
                        disabled={isCpbLocked}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select completion method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unreachable">Care plan completed without client participation (unable to reach client despite multiple attempts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Outreach Attempts Notes - shown for undetermined or refused. H-12: when refused, editable until recorded (isDisabled only); when undetermined, use isSectionLocked. */}
                  {(tenVsData.v2_viability.participation_primary === 'undetermined' || tenVsData.v2_viability.participation_primary === 'refused') && (
                    <div>
                      <Label>Outreach Attempts Notes</Label>
                      <Textarea
                        value={tenVsData.v2_viability.outreach_attempts_notes || ''}
                        onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v2_viability: {
                            ...prev.v2_viability,
                            outreach_attempts_notes: e.target.value
                          }
                        }))}
                        placeholder="Document outreach attempts and client response..."
                        rows={4}
                        readOnly={tenVsData.v2_viability.participation_primary === 'refused' ? isDisabled : isCpbLocked}
                        disabled={tenVsData.v2_viability.participation_primary === 'refused' ? isDisabled : isCpbLocked}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="v2-flag-concern"
                      checked={tenVsData.v2_viability.flagConcern || false}
                      onCheckedChange={(checked) => setTenVsDataAndMarkDirty(prev => ({
                        ...prev,
                        v2_viability: {
                          ...prev.v2_viability,
                          flagConcern: checked === true
                        }
                      }))}
                      disabled={isCpbLocked}
                    />
                    <Label htmlFor="v2-flag-concern" className="cursor-pointer">
                      Flag concern
                    </Label>
                  </div>
                  {tenVsData.v2_viability.flagConcern && (
                    <div>
                      <Label>Additional comments</Label>
                      <Textarea
                        value={tenVsData.v2_viability.concernComments || ''}
                        onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v2_viability: {
                            ...prev.v2_viability,
                            concernComments: e.target.value
                          }
                        }))}
                        placeholder="Enter additional comments about the concern..."
                        rows={4}
                        readOnly={isCpbLocked}
                        disabled={isCpbLocked}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V3: VISION */}
        <AccordionItem value="v3" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <span className="font-semibold">V3: VISION</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V3" />
              {/* Phase 1: Care Overlays (Lenses) — FIRST section in V3 */}
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                <h4 className="font-semibold text-sm">Care Overlays (Lenses)</h4>
                <p className="text-sm text-muted-foreground">Select overlays that apply to this case. Review guidance and apply to P sections as needed.</p>
                
                {/* Overlay Checklist */}
                <div className="space-y-2">
                  {CARE_OVERLAYS_PHASE_1.map((overlay) => {
                    const checked = selectedOverlayIds.includes(overlay.id);
                    return (
                      <div key={overlay.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`overlay-phase1-${overlay.id}`}
                            checked={checked}
                            onCheckedChange={(c) => {
                              if (c) {
                                setSelectedOverlayIds(prev => [...prev, overlay.id]);
                                // Initialize applied status if not exists
                                setAppliedOverlayByP(prev => ({
                                  ...prev,
                                  [overlay.id]: prev[overlay.id] || { P1: false, P2: false, P3: false, P4: false }
                                }));
                              } else {
                                setSelectedOverlayIds(prev => prev.filter(id => id !== overlay.id));
                              }
                            }}
                            disabled={isCpbLocked}
                          />
                          <Label htmlFor={`overlay-phase1-${overlay.id}`} className="text-sm font-normal cursor-pointer">
                            <span className="font-medium">{overlay.title}</span>
                            <span className="text-muted-foreground ml-2">({overlay.appliesTo})</span>
                          </Label>
                        </div>
                        
                        {/* Show guidance when overlay is selected */}
                        {checked && (
                          <div className="ml-6 mt-2 space-y-3 p-3 bg-background rounded border border-border">
                            {(['P1', 'P2', 'P3', 'P4'] as const).map((pKey) => {
                              const guidance = overlay.guidanceByP[pKey];
                              if (!guidance || guidance.length === 0) return null;
                              
                              const pLabel = pKey === 'P4' && overlay.p4LabelOverride === 'Pedagogical' 
                                ? 'Pedagogical (P4)' 
                                : ['Physical (P1)', 'Psychological (P2)', 'Psychosocial (P3)', 'Professional (P4)'][parseInt(pKey.slice(1)) - 1];
                              
                              const applied = appliedOverlayByP[overlay.id]?.[pKey] || false;
                              const pFieldKey = pKey.toLowerCase() as 'p1' | 'p2' | 'p3' | 'p4';
                              
                              return (
                                <div key={pKey} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-semibold">{pLabel}</h5>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={applied ? "outline" : "default"}
                                      onClick={() => {
                                        if (isCpbLocked) return;
                                        
                                        const currentGoal = tenVsData.v3_vision?.[pFieldKey]?.goal || '';
                                        const guidanceText = guidance.join('\n');
                                        const separator = currentGoal.trim() ? '\n\n' : '';
                                        const newText = `${currentGoal}${separator}Overlay-informed additions (${overlay.title}):\n${guidanceText}`;
                                        
                                        setTenVsDataAndMarkDirty(prev => ({
                                          ...prev,
                                          v3_vision: {
                                            ...prev.v3_vision,
                                            [pFieldKey]: {
                                              ...prev.v3_vision?.[pFieldKey],
                                              goal: newText
                                            }
                                          }
                                        }));
                                        
                                        setAppliedOverlayByP(prev => ({
                                          ...prev,
                                          [overlay.id]: {
                                            ...prev[overlay.id],
                                            [pKey]: true
                                          }
                                        }));
                                        
                                        toast.success(`Applied ${overlay.title} guidance to ${pLabel}`);
                                      }}
                                      disabled={isCpbLocked || applied}
                                      className="h-7 text-xs"
                                    >
                                      {applied ? '✓ Applied' : `Apply to ${pKey}`}
                                    </Button>
                                  </div>
                                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                    {guidance.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })}
                            
                            {/* Show notes if present */}
                            {overlay.notes && overlay.notes.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <h5 className="text-sm font-semibold mb-2">Notes</h5>
                                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                                  {overlay.notes.map((note, idx) => (
                                    <li key={idx}>{note}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* B-3: Client Self-Assessment (4Ps) — read-only context below Overlays, above P1–P4 */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <h4 className="font-semibold text-sm">Client Self-Assessment (4Ps)</h4>
                <p className="text-sm text-muted-foreground">Client-reported pillar scores (read-only). Use to inform goals.</p>
                {(() => {
                  const a = extractClient4PsSelfAssessment(latestIntakeJson, caseData?.fourps);
                  const rows = [
                    { key: 'p1' as const, label: 'Physical (P1)' },
                    { key: 'p2' as const, label: 'Psychological (P2)' },
                    { key: 'p3' as const, label: 'Psychosocial (P3)' },
                    { key: 'p4' as const, label: 'Professional (P4)' },
                  ];
                  const hasAny = a.p1 != null || a.p2 != null || a.p3 != null || a.p4 != null;
                  if (!hasAny) {
                    return <p className="text-xs text-muted-foreground">Not provided</p>;
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      {rows.map(({ key, label }) => (
                        <div key={key} className="p-2 bg-background/60 rounded border">
                          <span className="font-medium text-foreground">{label}:</span>{' '}
                          {a[key] != null ? (
                            <span>{a[key]}/5{a.labels?.[key] ? ` — ${a.labels[key]}` : ''}</span>
                          ) : (
                            <span className="text-muted-foreground">Not provided</span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <p className="text-sm text-muted-foreground">
                Defines shared goals and desired recovery trajectory.
              </p>

              {['p1', 'p2', 'p3', 'p4'].map((p, idx) => {
                // Check if any selected overlay is pediatric - if so, use "Pedagogical" for P4
                const hasPediatricOverlay = selectedOverlayIds.some(id => {
                  const overlay = CARE_OVERLAYS_PHASE_1.find(o => o.id === id);
                  return overlay?.isPediatric && overlay?.p4LabelOverride === 'Pedagogical';
                });
                const pLabel = idx === 3 && hasPediatricOverlay 
                  ? 'Pedagogical' 
                  : ['Physical', 'Psychological', 'Psychosocial', 'Professional'][idx];
                const pData = tenVsData.v3_vision[p as keyof typeof tenVsData.v3_vision];
                return (
                  <Card key={p}>
                    <CardHeader>
                      <CardTitle className="text-base">{pLabel}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Goal</Label>
                        <Textarea
                          value={pData?.goal || ''}
                          readOnly={isCpbLocked}
                          disabled={isCpbLocked}
                          onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                            ...prev,
                            v3_vision: {
                              ...prev.v3_vision,
                              [p]: { ...pData, goal: e.target.value }
                            }
                          }))}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Target Date</Label>
                          <Input
                            type="date"
                            value={pData?.target_date || ''}
                            readOnly={isCpbLocked}
                            disabled={isCpbLocked}
                            onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                              ...prev,
                              v3_vision: {
                                ...prev.v3_vision,
                                [p]: { ...pData, target_date: e.target.value }
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label>Measurable Outcome</Label>
                          <Textarea
                            value={pData?.outcome || ''}
                            readOnly={isCpbLocked}
                            disabled={isCpbLocked}
                            onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                              ...prev,
                              v3_vision: {
                                ...prev.v3_vision,
                                [p]: { ...pData, outcome: e.target.value }
                              }
                            }))}
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V4: VERACITY */}
        <AccordionItem value="v4" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">V4: VERACITY</span>
              <Badge variant="secondary" className="ml-2 text-xs">TRIGGERED</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V4" />
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Trigger:</strong> Client refuses treatment OR provider is unresponsive
                </p>
              </div>
              {/* Simplified V4 content */}
              <Textarea
                readOnly={isCpbLocked}
                disabled={isCpbLocked}
                placeholder="Document issues with treatment refusal or provider communication..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V5: VERSATILITY */}
        <AccordionItem value="v5" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-indigo-500" />
              <span className="font-semibold">V5: VERSATILITY</span>
              <Badge variant="secondary" className="ml-2 text-xs">TRIGGERED</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V5" />
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-800">
                  <strong>Trigger:</strong> Treatment needs revision, additional services needed, or condition changed.
                  <br /><strong>Action:</strong> Loop back to 4Ps to check if scores have changed.
                </p>
              </div>
              <Textarea
                readOnly={isCpbLocked}
                disabled={isCpbLocked}
                placeholder="Document plan modifications and reasons..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V6: VITALITY */}
        <AccordionItem value="v6" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-red-500" />
              <span className="font-semibold">V6: VITALITY</span>
              <Badge variant="secondary" className="ml-2 text-xs">TRIGGERED</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V6" />
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Trigger:</strong> Case stalled, treatment stalled, or patient plateaued.
                  <br /><strong>Action:</strong> Also re-triggers V8 (Verification) and V9 (Value) review.
                </p>
              </div>
              <Textarea
                readOnly={isCpbLocked}
                disabled={isCpbLocked}
                placeholder="Document why momentum has stopped and next steps..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V7: VIGILANCE */}
        <AccordionItem value="v7" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">V7: VIGILANCE</span>
              <Badge variant="secondary" className="ml-2 text-xs">ONGOING</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V7" />
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-800">
                  <strong>Tracks:</strong> Plan revision frequency, subsequent care plan call frequency
                </p>
              </div>
              <Textarea
                readOnly={isCpbLocked}
                disabled={isCpbLocked}
                placeholder="Document monitoring notes, subsequent care plan calls, plan revisions..."
                rows={4}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V8: VERIFICATION */}
        <AccordionItem value="v8" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-500" />
              <span className="font-semibold">V8: VERIFICATION</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V8" />
              {['p1', 'p2'].map((p, idx) => {
                const pLabel = ['Physical', 'Psychological'][idx];
                const pData = tenVsData.v8_verification[p as keyof typeof tenVsData.v8_verification];
                return (
                  <Card key={p}>
                    <CardHeader>
                      <CardTitle className="text-base">{pLabel}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Guideline Alignment (ODG/MCG/InterQual)</Label>
                        <Textarea
                          value={pData?.alignment || ''}
                          readOnly={isCpbLocked}
                          disabled={isCpbLocked}
                          onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                            ...prev,
                            v8_verification: {
                              ...prev.v8_verification,
                              [p]: { ...pData, alignment: e.target.value }
                            }
                          }))}
                          placeholder="Reference guideline and note alignment or deviation..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label>Evidence/Documentation</Label>
                        <Textarea
                          value={pData?.evidence || ''}
                          readOnly={isCpbLocked}
                          disabled={isCpbLocked}
                          onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                            ...prev,
                            v8_verification: {
                              ...prev.v8_verification,
                              [p]: { ...pData, evidence: e.target.value }
                            }
                          }))}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`v8-${p}-verified`}
                          checked={pData?.verified || false}
                          disabled={isCpbLocked}
                          onCheckedChange={(checked) => setTenVsDataAndMarkDirty(prev => ({
                            ...prev,
                            v8_verification: {
                              ...prev.v8_verification,
                              [p]: { ...pData, verified: checked === true }
                            }
                          }))}
                        />
                        <Label htmlFor={`v8-${p}-verified`} className="cursor-pointer">
                          Verified
                        </Label>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Medical Necessity Section — "Does this request meet medical necessity?" + Comments; keep Verified above */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Medical Necessity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Does this request meet medical necessity?</Label>
                    <Select
                      value={(() => {
                        const v = tenVsData.v8_verification.medical_necessity;
                        if (v === 'yes' || v === 'no') return v;
                        const legacy = (tenVsData.v8_verification as any).medical_necessity?.meets;
                        if (legacy === true) return 'yes';
                        if (legacy === false) return 'no';
                        return '';
                      })()}
                      onValueChange={(value) => {
                        setV8MedicalNecessityError(false);
                        setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v8_verification: {
                            ...prev.v8_verification,
                            medical_necessity: value === 'yes' ? 'yes' : value === 'no' ? 'no' : null
                          }
                        }));
                      }}
                      disabled={isCpbLocked}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select yes or no" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Comments{tenVsData.v8_verification.medical_necessity === 'no' ? ' (required)' : ''}
                    </Label>
                    <Textarea
                      id="v8-medical-necessity-comments"
                      value={tenVsData.v8_verification.medical_necessity_comments ?? (tenVsData.v8_verification as any).medical_necessity?.comments ?? ''}
                      readOnly={isCpbLocked}
                      disabled={isCpbLocked}
                      onChange={(e) => {
                        setV8MedicalNecessityError(false);
                        setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v8_verification: {
                            ...prev.v8_verification,
                            medical_necessity_comments: e.target.value
                          }
                        }));
                      }}
                      placeholder="Enter medical necessity comments..."
                      rows={4}
                      className={v8MedicalNecessityError ? 'border-destructive border-2' : ''}
                    />
                    {v8MedicalNecessityError && (
                      <p className="text-destructive text-sm mt-1">Medical necessity rationale is required when you select &quot;No&quot;. Please document why it does not meet medical necessity and next steps.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V9: VALUE */}
        <AccordionItem value="v9" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold">V9: VALUE</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V9" />
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Overall Value Summary</Label>
                    <Textarea
                      value={tenVsData.v10_value.summary || ''}
                      readOnly={isCpbLocked}
                      disabled={isCpbLocked}
                      onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                        ...prev,
                        v10_value: { ...prev.v10_value, summary: e.target.value }
                      }))}
                      placeholder="Summarize the value/benefit achieved..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>ROI Notes (for attorney summary)</Label>
                    <Textarea
                      value={tenVsData.v10_value.roi || ''}
                      readOnly={isCpbLocked}
                      disabled={isCpbLocked}
                      onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                        ...prev,
                        v10_value: { ...prev.v10_value, roi: e.target.value }
                      }))}
                      placeholder="Document return on investment for legal use..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* V10: VALIDATION */}
        <AccordionItem value="v10" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span className="font-semibold">V10: VALIDATION</span>
              <Badge variant="outline" className="ml-2 text-xs">MANDATORY</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <VDefinitionBlock vId="V10" />
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label>Overall Assessment</Label>
                    <Textarea
                      value={tenVsData.v9_validation.assessment || ''}
                      readOnly={isCpbLocked}
                      disabled={isCpbLocked}
                      onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                        ...prev,
                        v9_validation: { ...prev.v9_validation, assessment: e.target.value }
                      }))}
                      placeholder="Document QA review and equity considerations..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>30-Day Review Date</Label>
                      <Input
                        type="date"
                        value={tenVsData.v9_validation.review_date_30 || ''}
                        readOnly={isCpbLocked}
                        disabled={isCpbLocked}
                        onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v9_validation: { ...prev.v9_validation, review_date_30: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>60-Day Review Date</Label>
                      <Input
                        type="date"
                        value={tenVsData.v9_validation.review_date_60 || ''}
                        readOnly={isCpbLocked}
                        disabled={isCpbLocked}
                        onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                          ...prev,
                          v9_validation: { ...prev.v9_validation, review_date_60: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Client Feedback Notes</Label>
                    <Textarea
                      value={tenVsData.v9_validation.feedback || ''}
                      readOnly={isCpbLocked}
                      disabled={isCpbLocked}
                      onChange={(e) => setTenVsDataAndMarkDirty(prev => ({
                        ...prev,
                        v9_validation: { ...prev.v9_validation, feedback: e.target.value }
                      }))}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Phase 1: 10-V Review Panel (Subsequent Care Plan/Revision) */}
        {requiredVs.length > 0 && (
          <AccordionItem value="phase1-v-review" className="border rounded-lg px-4 border-blue-300 bg-blue-50/30">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">
                  {isFollowUpOrRevision 
                    ? "Full 10-V Review (Subsequent Care Plan / Revision)" 
                    : "Triggered V Review (Overlay-guided)"}
                </span>
                <Badge variant="outline" className="ml-2 text-xs bg-blue-100">
                  PHASE 1
                </Badge>
                {followUpRevisionSignal && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Detected: {followUpRevisionSignal}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Phase 1 V Review Required</AlertTitle>
                  <AlertDescription>
                    {isFollowUpOrRevision 
                      ? "For subsequent care plan/revision plans, all 10-V checks (V1-V10) must be acknowledged as Addressed or N/A before finalizing."
                      : "Please acknowledge all required V checks before finalizing."}
                  </AlertDescription>
                </Alert>

                {requiredVs.map((vId) => {
                  const vDef = getVDefinitionById(vId as any);
                  if (!vDef) return null;
                  
                  const currentAck = tenVsData.v3_vision?.phase1_required_v_ack?.[vId];
                  const status = currentAck?.status || null;
                  const reason = currentAck?.reason || '';
                  const note = currentAck?.note || '';

                  return (
                    <Card key={vId} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="text-base">{vDef.label}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Definition Block */}
                        <div className="bg-muted/30 p-3 rounded space-y-2 text-sm">
                          <div>
                            <strong>Literal Meaning:</strong> {vDef.literalMeaning}
                          </div>
                          <div>
                            <strong>Definition:</strong> {vDef.definition}
                          </div>
                        </div>

                        {/* Status Selection */}
                        <div>
                          <Label className="text-sm font-semibold">Status *</Label>
                          <RadioGroup
                            value={status || ''}
                            onValueChange={(value: "addressed" | "na") => {
                              setTenVsDataAndMarkDirty(prev => ({
                                ...prev,
                                v3_vision: {
                                  ...prev.v3_vision,
                                  phase1_required_v_ack: {
                                    ...(prev.v3_vision?.phase1_required_v_ack || {}),
                                    [vId]: {
                                      status: value,
                                      reason: value === 'na' ? (prev.v3_vision?.phase1_required_v_ack?.[vId]?.reason || '') : undefined,
                                      note: value === 'na' && prev.v3_vision?.phase1_required_v_ack?.[vId]?.reason === 'other' 
                                        ? (prev.v3_vision?.phase1_required_v_ack?.[vId]?.note || '') 
                                        : undefined,
                                    }
                                  }
                                }
                              }));
                            }}
                            disabled={isCpbLocked}
                            className="mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="addressed" id={`${vId}-addressed`} />
                              <Label htmlFor={`${vId}-addressed`} className="font-normal cursor-pointer">Addressed</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="na" id={`${vId}-na`} />
                              <Label htmlFor={`${vId}-na`} className="font-normal cursor-pointer">N/A</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* N/A Reason Dropdown */}
                        {status === 'na' && (
                          <div>
                            <Label className="text-sm font-semibold">Reason for N/A *</Label>
                            <Select
                              value={reason}
                              onValueChange={(value: string) => {
                                setTenVsDataAndMarkDirty(prev => ({
                                  ...prev,
                                  v3_vision: {
                                    ...prev.v3_vision,
                                    phase1_required_v_ack: {
                                      ...(prev.v3_vision?.phase1_required_v_ack || {}),
                                      [vId]: {
                                        status: 'na',
                                        reason: value,
                                        note: value === 'other' ? (prev.v3_vision?.phase1_required_v_ack?.[vId]?.note || '') : undefined,
                                      }
                                    }
                                  }
                                }));
                              }}
                              disabled={isCpbLocked}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="not_relevant">Not relevant to this client context</SelectItem>
                                <SelectItem value="already_addressed">Already addressed elsewhere in the plan</SelectItem>
                                <SelectItem value="no_constraint">Client situation does not present this constraint</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Other Note Textbox */}
                        {status === 'na' && reason === 'other' && (
                          <div>
                            <Label className="text-sm font-semibold">Additional Note *</Label>
                            <Textarea
                              value={note}
                              onChange={(e) => {
                                const newNote = e.target.value.slice(0, 200);
                                setTenVsDataAndMarkDirty(prev => ({
                                  ...prev,
                                  v3_vision: {
                                    ...prev.v3_vision,
                                    phase1_required_v_ack: {
                                      ...(prev.v3_vision?.phase1_required_v_ack || {}),
                                      [vId]: {
                                        status: 'na',
                                        reason: 'other',
                                        note: newNote,
                                      }
                                    }
                                  }
                                }));
                              }}
                              placeholder="Please provide a brief explanation (max 200 characters)"
                              rows={2}
                              maxLength={200}
                              disabled={isCpbLocked}
                              readOnly={isCpbLocked}
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              {note.length}/200 characters
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

          {/* CLICK TRUTH Debug Strip */}
          <Card className="border-2 border-yellow-400 bg-yellow-50" style={{ position: 'relative', zIndex: 40 }}>
            <CardContent className="p-2">
              <div className="text-xs font-mono space-y-1">
                <div><strong>CLICK TRUTH:</strong></div>
                <div>lastClickAt: {lastClickAt || 'never'}</div>
                <div>lastClickName: {lastClickName || 'none'}</div>
                <div>clickCountDraft: {clickCountDraft} | clickCountContinue: {clickCountContinue} | clickCountComplete: {clickCountComplete}</div>
              </div>
            </CardContent>
          </Card>

          {/* SAVE TRUTH Debug Panel */}
          <Card className="border-2 border-red-500 bg-red-50" style={{ position: 'relative', zIndex: 40 }}>
            <CardContent className="p-3">
              <div className="text-xs font-mono space-y-2">
                <div><strong>SAVE TRUTH:</strong></div>
                <div>lastAction: {saveTruth.lastAction}</div>
                <div>actionStartedAt: {saveTruth.actionStartedAt || 'never'}</div>
                <div>actionFinishedAt: {saveTruth.actionFinishedAt ?? (saveTruth.actionStartedAt ? 'pending' : '—')}</div>
                <div>saveAttempted: {saveTruth.saveAttempted ? 'yes' : 'no'}</div>
                
                {saveTruth.guardFailures.length > 0 && (
                  <div className="mt-2">
                    <div><strong>guardFailures:</strong></div>
                    <ul className="list-disc list-inside ml-2">
                      {saveTruth.guardFailures.map((failure, idx) => (
                        <li key={idx} className="text-red-700">{failure}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {saveTruth.payloadSummary && (
                  <div className="mt-2">
                    <div><strong>payloadSummary:</strong></div>
                    <div className="ml-2">
                      <div>caseId: {saveTruth.payloadSummary.caseId || 'null'}</div>
                      <div>hasTenVsData: {saveTruth.payloadSummary.hasTenVsData ? 'yes' : 'no'}</div>
                      <div>tenVsKeys: [{saveTruth.payloadSummary.tenVsKeys.join(', ') || 'none'}]</div>
                      <div>draftId: {saveTruth.payloadSummary.draftId || 'null'}</div>
                    </div>
                  </div>
                )}
                
                {saveTruth.persistenceTarget && (
                  <div className="mt-2">
                    <div><strong>persistenceTarget:</strong> <span className="text-green-700 font-bold">{saveTruth.persistenceTarget}</span></div>
                  </div>
                )}
                
                {saveTruth.storagePath && (
                  <div className="mt-2">
                    <div><strong>storagePath:</strong> {saveTruth.storagePath}</div>
                  </div>
                )}
                
                {saveTruth.storageUpload && (
                  <div className="mt-2">
                    <div><strong>storageUpload:</strong></div>
                    <div className="ml-2">
                      <div>success: <span className={saveTruth.storageUpload.success ? 'text-green-700' : 'text-red-700'}>{saveTruth.storageUpload.success ? 'yes' : 'no'}</span></div>
                      {saveTruth.storageUpload.path && <div>path: {saveTruth.storageUpload.path}</div>}
                      {saveTruth.storageUpload.error && <div className="text-red-700">error: {saveTruth.storageUpload.error}</div>}
                    </div>
                  </div>
                )}
                
                {saveTruth.rcCarePlansUpdate !== undefined && saveTruth.rcCarePlansUpdate !== null && (
                  <div className="mt-2">
                    <div><strong>rcCarePlansUpdate:</strong></div>
                    <div className="ml-2">
                      <div>success: <span className={saveTruth.rcCarePlansUpdate.success ? 'text-green-700' : 'text-red-700'}>{saveTruth.rcCarePlansUpdate.success ? 'yes' : 'no'}</span></div>
                      {saveTruth.rcCarePlansUpdate.error && <div className="text-red-700">error: {saveTruth.rcCarePlansUpdate.error}</div>}
                    </div>
                  </div>
                )}
                
                {saveTruth.finalResult && (
                  <div className="mt-2">
                    <div><strong>finalResult:</strong> <span className={saveTruth.finalResult === 'success' ? 'text-green-700 font-bold' : 'text-red-700 font-bold'}>{saveTruth.finalResult}</span></div>
                  </div>
                )}
                
                {saveTruth.supabaseOps.length > 0 && (
                  <div className="mt-2">
                    <div><strong>Operations:</strong></div>
                    <ul className="list-disc list-inside ml-2">
                      {saveTruth.supabaseOps.map((op, idx) => (
                        <li key={idx}>
                          <strong>{op.op}</strong> {op.table}: <span className={op.status === 'success' ? 'text-green-700' : op.status === 'error' ? 'text-red-700' : 'text-yellow-700'}>{op.status}</span>
                          {op.errorCode && ` (${op.errorCode})`}
                          {op.errorMessage && ` - ${op.errorMessage}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {saveTruth.reread && (
                  <div className="mt-2">
                    <div><strong>Verification (reread):</strong></div>
                    <div className="ml-2">
                      <div>success: <span className={saveTruth.reread.ok ? 'text-green-700' : 'text-red-700'}>{saveTruth.reread.ok ? 'yes' : 'no'}</span></div>
                      <div>updatedAt: {saveTruth.reread.updatedAt || 'null'}</div>
                      <div>hasTenVsData: <span className={saveTruth.reread.hasTenVsData ? 'text-green-700' : 'text-red-700'}>{saveTruth.reread.hasTenVsData ? 'yes' : 'no'}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Controls */}
          <Card className="relative z-10" style={{ position: 'relative' }}>
            <CardContent className="p-4 relative">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLastClickAt(new Date().toISOString());
                      setLastClickName('draft');
                      setClickCountDraft((c) => c + 1);
                      toast.info('Save Draft clicked');
                      setSaving(true);
                      try {
                        await saveCarePlan('draft');
                      } catch (err) {
                        console.error('Error in saveCarePlan (draft):', err);
                        toast.error(`Save Draft failed: ${err instanceof Error ? err.message : String(err)}`);
                        setSaving(false);
                      }
                    }}
                    disabled={saving || medNec.blocked || isHRefusalLocked}
                    title={isHRefusalLocked ? H_REFUSAL_LOCK_MSG : saving ? 'Saving...' : medNec.blocked ? (medNec.reason ?? undefined) : undefined}
                    className="relative z-10 pointer-events-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLastClickAt(new Date().toISOString());
                      setLastClickName('continue');
                      setClickCountContinue((c) => c + 1);
                      toast.info('Save & Continue clicked');
                      setSaving(true);
                      try {
                        await saveCarePlan('continue');
                      } catch (err) {
                        console.error('Error in saveCarePlan (continue):', err);
                        toast.error(`Save & Continue failed: ${err instanceof Error ? err.message : String(err)}`);
                        setSaving(false);
                      }
                    }}
                    disabled={saving || medNec.blocked || isC5Refused || isHRefusalLocked}
                    title={isHRefusalLocked ? H_REFUSAL_LOCK_MSG : isC5Refused ? 'Client refused participation. CPB sections are locked. Save Draft to record refusal.' : saving ? 'Saving...' : medNec.blocked ? (medNec.reason ?? undefined) : undefined}
                    className="relative z-10 pointer-events-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                  >
                    <Save className="h-4 w-4" />
                    Save & Continue
                  </button>
                  {saving && (
                    <span className="text-sm text-muted-foreground ml-2">Saving...</span>
                  )}
                  {isHRefusalRecorded && (
                    <span className="text-sm text-muted-foreground ml-2">{H_REFUSAL_LOCK_MSG}</span>
                  )}
                  {isC5Refused && !isHRefusalRecorded && (
                    <span className="text-sm text-muted-foreground ml-2">Client refused participation. CPB sections are locked. Save Draft to record refusal.</span>
                  )}
                </div>
                {isRefusalRecorded ? (
                  <Button
                    type="button"
                    variant="destructive"
                    disabled
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-red-600 text-white cursor-not-allowed opacity-90"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Care Plan Refused
                  </Button>
                ) : refusalSelected ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowRefusalConfirm(true); }}
                    disabled={saving || recordingRefusal}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    {recordingRefusal ? 'Recording...' : 'Care Plan Refused'}
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLastClickAt(new Date().toISOString());
                      setLastClickName('complete');
                      setClickCountComplete((c) => c + 1);
                      toast.info('Complete Care Plan clicked');
                      setSaving(true);
                      try {
                        await saveCarePlan('complete');
                      } catch (err) {
                        console.error('Error in saveCarePlan (complete):', err);
                        toast.error(`Complete Care Plan failed: ${err instanceof Error ? err.message : String(err)}`);
                        setSaving(false);
                      }
                    }}
                    disabled={saving || isCpbLocked || medNec.blocked}
                    title={isHRefusalLocked ? H_REFUSAL_LOCK_MSG : isC5Refused ? 'Client refused participation. CPB sections are locked. Save Draft to record refusal.' : isCpbLocked ? RN_VIEW_ONLY_TOOLTIP : medNec.blocked ? (medNec.reason ?? undefined) : undefined}
                    className="relative z-10 pointer-events-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-white bg-green-600 hover:bg-green-700 h-10 px-4 py-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {saving ? 'Completing...' : 'Complete Care Plan'}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          <AlertDialog open={showRefusalConfirm} onOpenChange={setShowRefusalConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Care Plan Refused</AlertDialogTitle>
                <AlertDialogDescription>
                  This will record refusal and notify the attorney. Continue?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleCarePlanRefused();
                  }}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={recordingRefusal || isRefusalRecorded}
                >
                  {recordingRefusal ? 'Recording...' : 'Continue'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Intake Snapshot Panel - Docked to Right */}
        {intakeSnapshotOpen && (
          <aside className="w-[420px] shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] overflow-auto">
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-500" />
                    Intake Snapshot
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIntakeSnapshotOpen(false)}
                  >
                    <ChevronUp />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Header Section */}
                <div className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-muted-foreground">Intake Information</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Read-only client-submitted intake responses
                      </p>
                    </div>
                    {intakeId && (
                      <Badge variant="outline" className="text-xs">
                        ID: {intakeId.substring(0, 8)}...
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    <strong>Intake captured:</strong>{' '}
                    {intakeCreatedAt
                      ? format(parseISO(intakeCreatedAt), 'MMM d, yyyy h:mm a')
                      : 'Unknown'}
                  </div>
                </div>

                {/* 4Ps Details */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">4Ps Assessment Details</h4>
                  {(() => {
                    const fourps = extractFourPsFromIntake(latestIntakeJson);
                    if (!fourps || (!fourps.physical && !fourps.psychological && !fourps.psychosocial && !fourps.professional)) {
                      return <p className="text-sm text-muted-foreground">Not provided</p>;
                    }
                    return (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 py-2 text-sm">
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">Physical</div>
                            <div className="font-medium">{fourps.physical !== undefined && fourps.physical !== null ? `${fourps.physical}/5` : renderValue(null)}</div>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">Psychological</div>
                            <div className="font-medium">{fourps.psychological !== undefined && fourps.psychological !== null ? `${fourps.psychological}/5` : renderValue(null)}</div>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">Psychosocial</div>
                            <div className="font-medium">{fourps.psychosocial !== undefined && fourps.psychosocial !== null ? `${fourps.psychosocial}/5` : renderValue(null)}</div>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">Professional</div>
                            <div className="font-medium">{fourps.professional !== undefined && fourps.professional !== null ? `${fourps.professional}/5` : renderValue(null)}</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">Intrinsic factors reflect the client&apos;s capacity and engagement. Use participation status and clinical context to judge feasibility.</p>
                      </div>
                    );
                  })()}
                </div>

                {/* SDOH Details — Extrinsic factors (SDOH) + domain breakdown only; Intrinsic is under 4Ps context. */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">SDOH Viability</h4>
                  <p className="text-sm text-muted-foreground">External stability factors that can accelerate or limit recovery.</p>
                  {(() => {
                    const sdoh = extractSdohFromIntake(latestIntakeJson);
                    const fourps = extractFourPsFromIntake(latestIntakeJson);
                    const partSt = tenVsData.v2_participation?.status;
                    const partLab = partSt === 'participating' ? 'Participating' : partSt === 'refused' ? 'Refused' : partSt === 'unable_to_determine' ? 'Unable to reach' : null;
                    if (!sdoh || Object.keys(sdoh).length === 0) {
                      return (
                        <div className="space-y-2">
                          <p className="text-sm"><strong>Overall SDOH score:</strong> <span className="text-muted-foreground">Not collected</span></p>
                          <p className="text-sm font-medium text-muted-foreground">How to interpret this</p>
                          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                            <li>Extrinsic factors reflect external barriers/resources (SDOH) that affect plan feasibility.</li>
                            <li>Use this alongside 4Ps and participation status to set realistic goals and attorney messaging.</li>
                          </ul>
                          {partLab && <p className="text-sm text-muted-foreground">Participation status: {partLab}</p>}
                          {fourps && (fourps.physical ?? fourps.psychological ?? fourps.psychosocial ?? fourps.professional) != null && (
                            <p className="text-sm text-muted-foreground">4Ps self-assessment context: P1 <span className="font-medium">{fourps.physical != null ? `${fourps.physical}/5` : '—'}</span>, P2 <span className="font-medium">{fourps.psychological != null ? `${fourps.psychological}/5` : '—'}</span>, P3 <span className="font-medium">{fourps.psychosocial != null ? `${fourps.psychosocial}/5` : '—'}</span>, P4 <span className="font-medium">{fourps.professional != null ? `${fourps.professional}/5` : '—'}</span></p>
                          )}
                        </div>
                      );
                    }
                    const overall = computeSdohOverallScore1to5(sdoh as Record<string, unknown>);
                    const lab = overall != null ? getSeverityLabel(overall) : null;
                    return (
                      <div className="space-y-3">
                        <div className="text-sm">
                          <strong>Overall SDOH score:</strong>{' '}
                          <span className="font-medium">{overall != null ? (lab ? `${overall}/5 — ${lab}` : `${overall}/5`) : 'Not collected'}</span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Extrinsic factors (SDOH)</p>
                        <div className="grid grid-cols-2 gap-2 py-2 text-sm">
                          {SDOH_DOMAIN_KEYS.map(k => {
                            const v = sdoh[k];
                            const disp = typeof v === 'number' && v >= 1 && v <= 5 ? `${v}/5` : (v === true ? 'Present' : v === false ? 'Not present' : 'Not answered');
                            return (
                              <div key={k} className="p-2 bg-muted/30 rounded">
                                <div className="font-semibold mb-1">{SDOH_DOMAIN_LABELS[k]}</div>
                                <div className="font-medium">{disp}</div>
                              </div>
                            );
                          })}
                        </div>
                        {sdoh.income_range && (
                          <div className="text-sm">
                            <strong>Income Range:</strong> {renderValue(sdoh.income_range)}
                          </div>
                        )}
                        <p className="text-sm font-medium text-muted-foreground pt-1">How to interpret this</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                          <li>Extrinsic factors reflect external barriers/resources (SDOH) that affect plan feasibility.</li>
                          <li>Use this alongside 4Ps and participation status to set realistic goals and attorney messaging.</li>
                        </ul>
                        {partLab && <p className="text-sm text-muted-foreground">Participation status: {partLab}</p>}
                        {fourps && (fourps.physical ?? fourps.psychological ?? fourps.psychosocial ?? fourps.professional) != null && (
                          <p className="text-sm text-muted-foreground">4Ps self-assessment context: P1 <span className="font-medium">{fourps.physical != null ? `${fourps.physical}/5` : '—'}</span>, P2 <span className="font-medium">{fourps.psychological != null ? `${fourps.psychological}/5` : '—'}</span>, P3 <span className="font-medium">{fourps.psychosocial != null ? `${fourps.psychosocial}/5` : '—'}</span>, P4 <span className="font-medium">{fourps.professional != null ? `${fourps.professional}/5` : '—'}</span></p>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Medication Sheet */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Medication Sheet</h4>
                  {(() => {
                    const medications = extractMedicationsFromIntake(latestIntakeJson);
                    if (medications.length === 0) {
                      // Also check for simple medList string
                      const medList = latestIntakeJson?.medList || latestIntakeJson?.intake?.medList || latestIntakeJson?.raw_intake?.medList;
                      if (medList && typeof medList === 'string' && medList.trim()) {
                        return (
                          <div className="text-xs">
                            <p className="mb-2">{medList}</p>
                          </div>
                        );
                      }
                      return <p className="text-xs text-muted-foreground">Not provided</p>;
                    }
                    
                    return (
                      <div className="space-y-2">
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2 font-semibold">Medication</th>
                                <th className="text-left p-2 font-semibold">Dose/Frequency</th>
                                <th className="text-left p-2 font-semibold">Condition/Indication</th>
                                <th className="text-left p-2 font-semibold">Notes</th>
                                <th className="text-left p-2 font-semibold">Timing</th>
                              </tr>
                            </thead>
                            <tbody>
                              {medications.map((med: any, idx: number) => (
                                <tr key={idx} className="border-b">
                                  <td className="p-2">
                                    {renderValue(med.brandName || med.genericName || med.medication_name || med.name)}
                                  </td>
                                  <td className="p-2">
                                    {renderValue(med.dose || med.dosage ? `${med.dose || med.dosage}${med.frequency ? `, ${med.frequency}` : ''}` : null)}
                                  </td>
                                  <td className="p-2">
                                    {renderValue(med.condition || med.indication || med.prescribing_doctor)}
                                  </td>
                                  <td className="p-2">
                                    {renderValue(med.notes || med.side_effects)}
                                  </td>
                                  <td className="p-2">
                                    {renderValue(med.timing || med.injury_timing)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Other Key Intake Items */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">Other Intake Information</h4>
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    {(() => {
                      const allergies = latestIntakeJson?.allergies || latestIntakeJson?.intake?.allergies || latestIntakeJson?.raw_intake?.allergies;
                      const conditions = latestIntakeJson?.conditions || latestIntakeJson?.intake?.conditions || latestIntakeJson?.raw_intake?.conditions;
                      const incidentNarrative = latestIntakeJson?.incidentNarrative || latestIntakeJson?.intake?.incidentNarrative || latestIntakeJson?.raw_intake?.incidentNarrative;
                      const pcp = latestIntakeJson?.pcp || latestIntakeJson?.intake?.pcp || latestIntakeJson?.raw_intake?.pcp;
                      const pharmacy = latestIntakeJson?.pharmacy || latestIntakeJson?.intake?.pharmacy || latestIntakeJson?.raw_intake?.pharmacy;
                      
                      const hasAny = allergies || conditions || pcp || pharmacy || incidentNarrative;
                      
                      if (!hasAny) {
                        return <p className="text-xs text-muted-foreground">Not provided</p>;
                      }
                      
                      return (
                        <>
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">Allergies</div>
                            <div>{renderValue(allergies)}</div>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">Pre-existing Conditions</div>
                            <div>{renderValue(conditions)}</div>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">PCP</div>
                            <div>{renderValue(pcp)}</div>
                          </div>
                          <div className="p-2 bg-muted/30 rounded">
                            <div className="font-semibold mb-1">Pharmacy</div>
                            <div>{renderValue(pharmacy)}</div>
                          </div>
                          {incidentNarrative && (
                            <div className="p-2 bg-muted/30 rounded">
                              <div className="font-semibold mb-1">Incident Narrative</div>
                              <div className="whitespace-pre-wrap">{renderValue(incidentNarrative)}</div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
