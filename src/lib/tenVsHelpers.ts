/**
 * Shared helpers for 10-Vs / TenVs draft JSON (storage-only, no DB schema).
 * Used by TenVsBuilder, FinalizeCarePlanScreen, AttorneyCarePlanView, and client care plan views.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { isValidUuid } from '@/lib/rnUtils';

function handleRcCarePlanError(err: { message?: string }, context: 'SELECT' | 'INSERT'): never {
  toast.error('Care plan setup failed. Please try again.');
  console.error(`ensureRcCarePlanRow: ${context} failed`, err);
  const msg = String(err?.message ?? '');
  if (msg.includes('plan_type_check')) {
    console.error('[ensureRcCarePlanRow] plan_type_check: invalid plan_type was sent; INSERT must include plan_type=initial (or follow_up for follow-up plans).');
  }
  throw new Error(msg || `ensureRcCarePlanRow: ${context} failed`);
}

/**
 * RN-only: Ensures an rc_care_plans row exists for the case so carePlanId is never null for Finalize/Submit.
 * - If opts.carePlanId is a valid UUID: returns it (no DB writes).
 * - Else: SELECT by case_id (ordered by created_at desc, limit 1); if found returns that id.
 * - If not found: INSERT minimal row (plan_type=initial, status=draft) and return the new id.
 * INSERT always includes plan_type='initial', status='draft', case_id, created_at, updated_at.
 * @throws on SELECT/INSERT errors; toasts, logs, and rethrows so callers halt.
 */
export async function ensureRcCarePlanRow(opts: {
  supabase: SupabaseClient;
  caseId: string;
  carePlanId?: string | null;
}): Promise<{ carePlanId: string }> {
  if (opts.carePlanId && isValidUuid(opts.carePlanId)) {
    return { carePlanId: opts.carePlanId };
  }

  const { data: rows, error: selectErr } = await opts.supabase
    .from('rc_care_plans')
    .select('id')
    .eq('case_id', opts.caseId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (selectErr) handleRcCarePlanError(selectErr, 'SELECT');
  const existing = rows?.[0];
  if (existing?.id) return { carePlanId: existing.id };

  const now = new Date().toISOString();
  const payload = {
    plan_type: 'initial',
    status: 'draft',
    case_id: opts.caseId,
    created_at: now,
    updated_at: now,
  };

  if (payload.plan_type !== 'initial') {
    throw new Error('ensureRcCarePlanRow: preflight failed: plan_type must be "initial"');
  }

  const { data: inserted, error: insertErr } = await opts.supabase
    .from('rc_care_plans')
    .insert(payload)
    .select('id')
    .single();

  if (insertErr) handleRcCarePlanError(insertErr, 'INSERT');
  if (!inserted?.id) throw new Error('ensureRcCarePlanRow: insert returned no id');
  return { carePlanId: inserted.id };
}

/** V8 Medical Necessity eligibility result. One source of truth for Save Draft, Save & Continue, Complete, and Finalize Submit. */
export interface V8EligibilityResult {
  ok: boolean;
  reasons: string[];
  firstReason?: string;
}

const V8_COMMENT_REQUIRED_MSG =
  'Medical necessity rationale is required when you select "No". Please document why it does not meet medical necessity and next steps.';

/**
 * F-10 Medical Necessity HARD STOP: when medical_necessity === "no" (or false), ALL save/continue/complete/finalize
 * are blocked regardless of comment. Comment is still required (needsComment) when No; when missing, reason
 * includes that. When Yes or unset: blocked=false.
 * Used by: TenVsBuilder (Save Draft, Save & Continue, Complete, saveCarePlan guard), FinalizeCarePlanScreen (canSubmit, handleSubmit).
 */
export function getMedicalNecessityHardStopReason(draftOrV8: unknown): {
  blocked: boolean;
  needsComment: boolean;
  reason: string | null;
} {
  if (draftOrV8 == null) return { blocked: false, needsComment: false, reason: null };
  const v8 = (draftOrV8 as { v8_verification?: unknown })?.v8_verification ?? draftOrV8;
  if (!v8 || typeof v8 !== 'object') return { blocked: false, needsComment: false, reason: null };
  const v = v8 as Record<string, unknown>;
  const raw = v?.medical_necessity;
  const mn = (typeof raw === 'object' && raw != null && 'meets' in raw)
    ? (raw as { meets?: boolean }).meets
    : raw;
  const isNo = mn === 'no' || mn === false;
  if (!isNo) return { blocked: false, needsComment: false, reason: null };
  const comments = String(v?.medical_necessity_comments ?? (typeof raw === 'object' && raw != null && 'comments' in raw ? (raw as { comments?: string }).comments : undefined) ?? '').trim();
  const needsComment = !comments;
  const reason = needsComment
    ? 'Medical Necessity is set to No. A comment is required and all saving/submission is blocked.'
    : 'Medical Necessity is set to No. All saving/submission is blocked.';
  return { blocked: true, needsComment, reason };
}

/**
 * V8 Medical Necessity hard-stop: when medical_necessity === "No" (or false), comment is REQUIRED.
 * If comment is missing, returns ok: false. If medical_necessity === "Yes" or not "No", comment is optional (ok: true).
 * Accepts the full draft, v8_verification slice, or null/undefined (treats as ok to avoid blocking when draft unavailable).
 * Used by: Next step/Complete enabled state, Submit/Complete handler, Save Draft, Save & Continue, Finalize Submit.
 */
export function checkV8MedicalNecessityEligibility(
  draftOrV8: unknown
): V8EligibilityResult {
  if (draftOrV8 == null) return { ok: true, reasons: [], firstReason: undefined };
  const v8 = (draftOrV8 as { v8_verification?: unknown })?.v8_verification ?? draftOrV8;
  if (!v8 || typeof v8 !== 'object') return { ok: true, reasons: [], firstReason: undefined };
  const v = v8 as { medical_necessity?: string | boolean; medical_necessity_comments?: string; medical_necessity?: { meets?: boolean; comments?: string } };
  const mn = v?.medical_necessity ?? (v as { medical_necessity?: { meets?: boolean } })?.medical_necessity?.meets;
  const isNo = mn === 'no' || mn === false;
  if (!isNo) return { ok: true, reasons: [], firstReason: undefined };
  const comments = String(v?.medical_necessity_comments ?? (v as { medical_necessity?: { comments?: string } })?.medical_necessity?.comments ?? '').trim();
  if (comments) return { ok: true, reasons: [], firstReason: undefined };
  return { ok: false, reasons: [V8_COMMENT_REQUIRED_MSG], firstReason: V8_COMMENT_REQUIRED_MSG };
}

/**
 * Returns true when client participation could not be obtained despite documented outreach
 * (participation_primary=undetermined AND participation_secondary=unreachable).
 * Uses safe optional chaining and defaults.
 */
export function isUnableToReach(tenVsData: unknown): boolean {
  if (!tenVsData || typeof tenVsData !== 'object') return false;
  const v2 = (tenVsData as { v2_viability?: { participation_primary?: string; participation_secondary?: string } })
    ?.v2_viability;
  return (
    (v2?.participation_primary === 'undetermined' || false) &&
    (v2?.participation_secondary === 'unreachable' || false)
  );
}

/**
 * C-6: Returns true when v2_participation.status === 'unable_to_determine'.
 * Prefer this for participation-undetermined messaging; use isUnableToReach for legacy v2_viability.
 */
export function isParticipationUndetermined(tenVsData: unknown): boolean {
  if (!tenVsData || typeof tenVsData !== 'object') return false;
  const status = (tenVsData as { v2_participation?: { status?: string } })?.v2_participation?.status;
  return status === 'unable_to_determine';
}

/**
 * Derives participation_status for rc_care_plans from the 10-Vs draft (V2 viability).
 * Single source of truth at finalize; do not read V2 for edit windows once submitted.
 * V2 path: draft.v2_viability.participation_primary ('wants'|'undetermined'|'refused').
 * Fail-closed: missing/other → 'unknown' (edit window 24h).
 */
export function deriveParticipationStatusFromDraft(draft: unknown): 'undetermined' | 'client_participated' | 'client_refused' | 'unknown' {
  if (draft == null || typeof draft !== 'object') return 'unknown';
  
  const v2 = (draft as { v2_viability?: unknown })?.v2_viability;
  if (!v2 || typeof v2 !== 'object') return 'unknown';
  
  const v2Obj = v2 as Record<string, unknown>;
  
  // Try multiple possible field names
  const participationValue = 
    v2Obj.participation_primary ?? 
    v2Obj.participationPrimary ?? 
    v2Obj.participation ?? 
    v2Obj.client_participation ?? 
    null;
  
  if (participationValue == null) return 'unknown';
  
  // Normalize to lowercase string for comparison
  const normalized = String(participationValue).toLowerCase().trim();
  
  // Map to participation_status values
  // undetermined: includes 'undetermined', 'unable_to_reach', 'unable to reach'
  if (normalized === 'undetermined' || 
      normalized.includes('unable_to_reach') || 
      normalized.includes('unable to reach') ||
      normalized === 'unabletoreach') {
    return 'undetermined';
  }
  
  // client_participated: equals 'wants' or includes 'participated'
  if (normalized === 'wants' || normalized.includes('participated')) {
    return 'client_participated';
  }
  
  // client_refused: equals 'refused'
  if (normalized === 'refused') {
    return 'client_refused';
  }
  
  // Fail-closed: unknown → 24h
  return 'unknown';
}

/**
 * Edit-window hours from rc_care_plans.participation_status (preferred after submission).
 * - undetermined → 72h
 * - client_participated, client_refused, unknown → 24h
 * Use this when you have the submitted plan; do NOT read V2 viability for edit windows once submitted.
 */
export function getEditWindowHoursFromParticipation(participationStatus: string | null | undefined): number {
  return participationStatus === 'undetermined' ? 72 : 24;
}

/**
 * Edit-window hours from draft (V2 viability). Use ONLY at finalize before the submitted plan exists.
 * - Undetermined (v2_viability.participation_primary === 'undetermined') → 72h
 * - Else → 24h (fail-closed)
 * @deprecated Prefer deriveParticipationStatusFromDraft + getEditWindowHoursFromParticipation; do not use for edit window once rc_care_plans has participation_status.
 */
export function getEditWindowHours(draftOrV2: unknown): number {
  if (draftOrV2 == null || typeof draftOrV2 !== 'object') return 24;
  const v2 = (draftOrV2 as { v2_viability?: { participation_primary?: string } })?.v2_viability;
  const primary = v2?.participation_primary;
  return primary === 'undetermined' ? 72 : 24;
}

/** Format "Edits allowed until" datetime, e.g. "Tue, Feb 25 at 3:14 PM". */
export function formatEditWindowEndsAt(d: Date): string {
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
