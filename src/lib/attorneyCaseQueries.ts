/**
 * Attorney Case Queries
 * 
 * This module provides helper functions for attorneys to query cases from Supabase.
 * All queries use direct Supabase queries with RLS policies to ensure attorneys can 
 * ONLY see released/closed cases, never drafts.
 * 
 * The database layer enforces this restriction via RLS policies which automatically
 * filter cases by attorney_id and case_status.
 */

import { supabase } from "@/integrations/supabase/client";

/**
 * Get all cases accessible to the authenticated attorney.
 * Returns released/closed/ready cases (never drafts).
 * 
 * Explicitly filters by attorney_id to ensure attorneys only see their own cases.
 * 
 * @returns Array of case objects with latest released/closed/ready version per revision chain
 */
export async function getAttorneyCases() {
  console.log('=== getAttorneyCases: About to fetch cases ===');
  
  // Get authenticated user
  const { data: { user: authUser } } = await supabase.auth.getUser();
  console.log('getAttorneyCases: Authenticated user ID:', authUser?.id);
  
  if (!authUser?.id) {
    console.error('getAttorneyCases: No authenticated user');
    return [];
  }

  // Verify user is an attorney
  const { data: rcUser, error: rcUserError } = await supabase
    .from('rc_users')
    .select('id, role, auth_user_id')
    .eq('auth_user_id', authUser.id)
    .eq('role', 'attorney')
    .maybeSingle();

  if (rcUserError) {
    console.error('getAttorneyCases: Error fetching rc_user:', rcUserError);
    throw rcUserError;
  }

  if (!rcUser) {
    console.error('getAttorneyCases: No attorney rc_user found for authenticated user');
    return [];
  }

  // Use auth_user_id for case filtering since cases store auth_user_id as attorney_id
  const attorneyRcUserId = rcUser.auth_user_id;
  console.log('getAttorneyCases: Attorney rc_user ID:', attorneyRcUserId);
  console.log('getAttorneyCases: User role:', rcUser.role);
  
  // Query 1: rc_cases with released/closed/ready status
  const statusFilter = ['released', 'closed', 'ready'];
  const { data: releasedData, error: releasedError } = await supabase
    .from('rc_cases')
    .select('*')
    .eq('attorney_id', attorneyRcUserId)
    .eq('is_superseded', false)
    .in('case_status', statusFilter)
    .order('updated_at', { ascending: false });

  if (releasedError) {
    console.error('Error fetching attorney cases:', releasedError);
    throw releasedError;
  }

  const releasedCases = (releasedData || []) as (AttorneyCase & { care_plan_released?: boolean })[];
  const releasedIds = new Set(releasedCases.map((c) => c.id));

  // ATTORNEY-5: Also include cases with submitted care plan (RN released) — they belong in Active Cases
  const { data: submittedPlans } = await supabase
    .from('rc_care_plans')
    .select('case_id')
    .eq('status', 'submitted');

  const carePlanCaseIds = [...new Set((submittedPlans || []).map((p: { case_id: string }) => p.case_id))];
  const carePlanCaseIdsNotReleased = carePlanCaseIds.filter((id) => !releasedIds.has(id));

  let carePlanCases: (AttorneyCase & { care_plan_released?: boolean })[] = [];
  if (carePlanCaseIdsNotReleased.length > 0) {
    const { data: carePlanData, error: carePlanError } = await supabase
      .from('rc_cases')
      .select('*')
      .in('id', carePlanCaseIdsNotReleased)
      .eq('attorney_id', attorneyRcUserId)
      .eq('is_superseded', false)
      .order('updated_at', { ascending: false });

    if (!carePlanError && carePlanData?.length) {
      carePlanCases = carePlanData.map((c: any) => ({ ...c, care_plan_released: true })) as (AttorneyCase & { care_plan_released?: boolean })[];
    }
  }

  const merged = [...releasedCases, ...carePlanCases];
  merged.sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

  // Batch fetch client names for all cases (avoid N+1)
  const clientIds = [...new Set(merged.map((c) => c.client_id).filter(Boolean))];
  const clientNameMap = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from("rc_clients")
      .select("id, first_name, last_name")
      .in("id", clientIds);
    for (const cl of clients || []) {
      const fn = (cl.first_name || "").trim();
      const ln = (cl.last_name || "").trim();
      const full = `${fn} ${ln}`.trim() || "Client";
      clientNameMap.set(cl.id, full);
    }
  }

  return merged.map((c) => ({
    ...c,
    clientName: c.client_id ? clientNameMap.get(c.client_id) ?? null : null,
  })) as (AttorneyCase & { clientName: string | null })[];
}

/**
 * Get cases for the Private Case Notes dropdown only.
 * Includes pending/pre-RN statuses (attorney_confirmed, intake_pending, etc.) so attorneys
 * can add private notes before RN care coordination. Does NOT change getAttorneyCases or
 * other released-only behavior.
 *
 * @returns Array of { id, case_number, client_name } for the case selector
 */
export async function getAttorneyCasesForPrivateNotes(): Promise<
  { id: string; case_number: string | null; client_name: string }[]
> {
  const attorneyRcUserId = await getAttorneyRcUserId();
  if (!attorneyRcUserId) return [];

  const statuses = [
    "attorney_confirmed",
    "intake_pending",
    "ready",
    "released",
    "closed",
    "assigned_to_rn",
  ];

  const { data, error } = await supabase
    .from("rc_cases")
    .select("id, case_number, rc_clients(first_name, last_name)")
    .eq("attorney_id", attorneyRcUserId)
    .eq("is_superseded", false)
    .in("case_status", statuses)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getAttorneyCasesForPrivateNotes:", error);
    return [];
  }

  return (data || []).map((c: any) => {
    const rc = c.rc_clients;
    const client_name =
      rc && (rc.first_name || rc.last_name)
        ? `${rc.first_name || ""} ${rc.last_name || ""}`.trim()
        : "Client";
    return {
      id: c.id,
      case_number: c.case_number ?? null,
      client_name,
    };
  });
}

/**
 * Get the attorney's auth_user_id for the current user. Returns null if not authenticated or not an attorney.
 * Cases now store auth_user_id as attorney_id, so we return auth_user_id directly.
 */
export async function getAttorneyRcUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;
  const { data: rc } = await supabase.from('rc_users').select('id').eq('auth_user_id', user.id).eq('role', 'attorney').maybeSingle();
  // Return auth_user_id directly since cases now use auth_user_id as attorney_id
  return rc ? user.id : null;
}

/**
 * Get a single case by ID for the authenticated attorney.
 * Returns the latest released/closed version if the case exists in a revision chain.
 * 
 * @param caseId - The case ID to fetch (can be any version in the chain)
 * @returns Case object or null if not found or not accessible
 */
export async function getAttorneyCaseById(caseId: string) {
  // First, get all accessible cases
  const allCases = await getAttorneyCases();
  
  // Find the case by ID (the view returns the latest final version per root)
  // If the provided caseId is in a revision chain, we need to find the root
  // and then get the latest final version for that root
  
  // For now, we'll search by direct ID match first
  const directMatch = allCases.find(c => c.id === caseId);
  if (directMatch) {
    return directMatch;
  }
  
  // If not found, the case might be a draft or the ID might be from a different
  // version in the chain. The view only returns final cases, so if we can't find it,
  // it means either:
  // 1. The case doesn't exist
  // 2. The case is a draft (not accessible to attorneys)
  // 3. The attorney doesn't have access to this case
  
  return null;
}

/**
 * Get cases for a specific client.
 * Returns only released/closed cases for that client.
 * 
 * @param clientId - The client ID
 * @returns Array of case objects
 */
export async function getAttorneyCasesByClientId(clientId: string) {
  const allCases = await getAttorneyCases();
  return allCases.filter(c => c.client_id === clientId);
}

/**
 * Fetch client display name from rc_clients by client_id.
 * Used for attorney case detail to show client name on owned sensitive cases.
 */
export async function getClientNameByClientId(clientId: string): Promise<string | null> {
  if (!clientId) return null;
  const { data, error } = await supabase
    .from("rc_clients")
    .select("first_name, last_name")
    .eq("id", clientId)
    .maybeSingle();
  if (error || !data) return null;
  const firstName = (data.first_name || "").trim();
  const lastName = (data.last_name || "").trim();
  const full = `${firstName} ${lastName}`.trim();
  return full || null;
}

/**
 * Check if a case ID is accessible to the attorney and get its latest final version.
 * This is useful when you have a case ID from user selection and need to resolve
 * it to the latest released/closed version.
 * 
 * Uses the database function resolve_attorney_case() which handles revision chains
 * and returns the latest released/closed version even if the provided caseId is a draft.
 * 
 * @param caseId - Any case ID (could be draft, released, or closed)
 * @returns The latest released/closed case in the same revision chain, or null
 */
export async function resolveAttorneyCase(caseId: string) {
  const { data, error } = await supabase.rpc('resolve_attorney_case', {
    case_id_param: caseId
  });

  if (error) {
    console.error('Error resolving attorney case:', error);
    return null;
  }

  return (data && data.length > 0) ? data[0] : null;
}

/**
 * Type definition for attorney-accessible case
 * Matches the structure returned by attorney_accessible_cases() function
 */
export interface AttorneyCase {
  id: string;
  client_id: string;
  attorney_id: string | null;
  case_number?: string | null;
  case_type: string | null;
  case_status: 'released' | 'closed' | 'ready' | 'attorney_confirmed' | 'assigned_to_rn' | string;
  date_of_injury: string | null;
  jurisdiction: string | null;
  revision_of_case_id: string | null;
  released_at: string | null;
  closed_at: string | null;
  updated_at: string;
  created_at: string;
  /** ATTORNEY-5: True when rc_care_plans has submitted plan; case appears in Active Cases */
  care_plan_released?: boolean;
  /** Client display name (batch-fetched); attorney owns all cases so identity is visible */
  clientName?: string | null;
}
