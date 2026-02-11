// src/hooks/useSupabaseData.ts
// React hooks for fetching data from Supabase

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/supabaseAuth";
import { getAttorneyCases, AttorneyCase } from "@/lib/attorneyCaseQueries";
import { isOptionalTableError } from "@/lib/optionalTableUtils";

/* ===================== Types ===================== */

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  practice_name?: string;
  phone?: string;
  email?: string;
  fax?: string;
  address?: string;
  npi?: string;
  accepting_patients: boolean;
}

export interface CaseData {
  id: string;
  client_label?: string;
  atty_ref?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  
  // New fields from migration
  provider_routed?: boolean;
  specialist_report_uploaded?: boolean;
  last_pain_diary_at?: string;
  pain_diary_count_30d?: number;
  sdoh_resolved?: any;
  odg_benchmarks?: any;
  flags?: string[];
  documentation?: any;
  
  // Nested data
  consent?: any;
  incident?: any;
  fourps?: any;
  sdoh?: any;
}

export interface AuditLog {
  id: number;
  ts: string;
  actor_role: string;
  actor_id: string;
  action: string;
  case_id?: string;
  meta?: any;
}

/* ===================== Providers Hook ===================== */

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(!supabase || !isSupabaseConfigured() ? false : true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    async function fetchProviders() {
      try {
        const { data, error: fetchError } = await supabase
          .from("providers")
          .select("*")
          .order("name");

        if (fetchError) throw fetchError;
        setProviders(data || []);
      } catch (err) {
        if (isOptionalTableError(err)) {
          setProviders([]);
        } else {
          console.error("Failed to fetch providers:", err);
          setError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProviders();

    const channel = supabase
      .channel("providers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "providers" },
        () => { fetchProviders(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { providers, loading, error, refetch: () => setLoading(true) };
}

/* ===================== Cases Hook ===================== */

export function useCases() {
  const { user } = useAuth();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [loading, setLoading] = useState(!supabase || !isSupabaseConfigured() ? false : true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured()) {
      setCases([]);
      setLoading(false);
      return;
    }

    if (!user) {
      setCases([]);
      setLoading(false);
      return;
    }

    async function fetchCases() {
      try {
        // Fetch cases the user has access to via rc_case_assignments
        const { data, error: fetchError } = await supabase
          .from("rc_cases")
          .select(`
            *,
            rc_case_assignments!inner(user_id)
          `)
          .eq("rc_case_assignments.user_id", user.id)
          .eq("is_superseded", false)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setCases(data || []);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("rc-cases-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rc_cases",
        },
        () => {
          fetchCases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { cases, loading, error, refetch: () => setLoading(true) };
}

/* ===================== Attorney Cases Hook (Released-Only) ===================== */

/**
 * Hook for attorneys to fetch cases.
 * ONLY returns released/closed cases via attorney_accessible_cases() RPC.
 * Never exposes draft cases.
 */
export function useAttorneyCases() {
  const { user, roles, rolesLoading } = useAuth();
  const [cases, setCases] = useState<AttorneyCase[]>([]);
  const [loading, setLoading] = useState(!supabase || !isSupabaseConfigured() ? false : true);
  const [error, setError] = useState<Error | null>(null);
  const [roleNotConfigured, setRoleNotConfigured] = useState(false);

  useEffect(() => {
    setRoleNotConfigured(false);

    if (!supabase || !isSupabaseConfigured()) {
      setCases([]);
      setLoading(false);
      return;
    }

    if (rolesLoading) {
      return;
    }

    if (!user) {
      setCases([]);
      setLoading(false);
      return;
    }

    // Roles from auth: rc_users.role is lowercase ('attorney', 'super_user', 'super_admin'). Normalize before compare.
    const upperRoles = roles && roles.length > 0 ? roles.map((r) => (r || '').toUpperCase()) : [];

    // isRN: rc_users 'rn' or 'rn_supervisor' (mapped to RN_CM, RN_CM_SUPERVISOR)
    const isRN = upperRoles.some(
      (r) =>
        r === 'RN' ||
        r === 'RN_CM' ||
        r === 'RN_CCM' ||
        r === 'RN_CM_SUPERVISOR' ||
        r === 'RN_CM_MANAGER' ||
        r === 'RN_CM_DIRECTOR' ||
        (r.includes('RN') && !r.includes('ATTORNEY'))
    );

    // isAttorney: normalize (toLowerCase) and accept attorney, super_user, super_admin (DB uses lowercase)
    const isAttorney = (roles || []).some((r) => {
      const n = (r || '').toLowerCase();
      return n === 'attorney' || n === 'super_user' || n === 'super_admin';
    });

    if (isRN) {
      setCases([]);
      setLoading(false);
      return;
    }

    // roles have finished loading here (we return on rolesLoading above). Only show "role not configured"
    // when the role is not one of the allowed attorney roles.
    if (!isAttorney) {
      setCases([]);
      setLoading(false);
      setRoleNotConfigured(true);
      return;
    }

    async function fetchAttorneyCases() {
      try {
        const attorneyCases = await getAttorneyCases();
        setCases(attorneyCases || []);
      } catch (err) {
        console.error("useAttorneyCases: Failed to fetch attorney cases:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttorneyCases();
  }, [user, roles, rolesLoading]);

  return { cases, loading, error, roleNotConfigured, refetch: () => setLoading(true) };
}

/* ===================== Audit Logs Hook ===================== */

export function useAuditLogs(caseId?: string) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(!supabase || !isSupabaseConfigured() ? false : true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured()) {
      setAuditLogs([]);
      setLoading(false);
      return;
    }

    async function fetchAuditLogs() {
      try {
        let query = supabase
          .from("audit_logs")
          .select("*")
          .order("ts", { ascending: false })
          .limit(100);

        if (caseId) query = query.eq("case_id", caseId);

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;
        setAuditLogs(data || []);
      } catch (err) {
        if (isOptionalTableError(err)) {
          setAuditLogs([]);
        } else {
          console.error("Failed to fetch audit logs:", err);
          setError(err as Error);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAuditLogs();

    const channel = supabase
      .channel("audit-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        () => { fetchAuditLogs(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [caseId]);

  return { auditLogs, loading, error, refetch: () => setLoading(true) };
}

/* ===================== Case Details Hook ===================== */

export function useCaseDetails(caseId: string) {
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [intake, setIntake] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(!supabase || !isSupabaseConfigured() ? false : true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured()) {
      setCaseData(null);
      setIntake(null);
      setCheckins([]);
      setDocuments([]);
      setLoading(false);
      return;
    }

    async function fetchCaseDetails() {
      try {
        // Fetch case
        const { data: caseResult, error: caseError } = await supabase
          .from("cases")
          .select("*")
          .eq("id", caseId)
          .single();

        if (caseError) throw caseError;
        setCaseData(caseResult);

        // Fetch intake
        const { data: intakeResult, error: intakeError } = await supabase
          .from("intakes")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!intakeError && intakeResult) {
          setIntake(intakeResult);
        }

        // Fetch checkins
        const { data: checkinsResult, error: checkinsError } = await supabase
          .from("checkins")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false });

        if (!checkinsError && checkinsResult) {
          setCheckins(checkinsResult);
        }

        // Fetch documents
        const { data: docsResult, error: docsError } = await supabase
          .from("documents")
          .select("*")
          .eq("case_id", caseId)
          .order("created_at", { ascending: false });

        if (!docsError && docsResult) {
          setDocuments(docsResult);
        }
      } catch (err) {
        console.error("Failed to fetch case details:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  return {
    caseData,
    intake,
    checkins,
    documents,
    loading,
    error,
    refetch: () => setLoading(true),
  };
}

/* ===================== User Cases Hook (for specific user) ===================== */

export function useUserCases(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(!supabase || !isSupabaseConfigured() ? false : true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured()) {
      setCases([]);
      setLoading(false);
      return;
    }

    if (!targetUserId) {
      setCases([]);
      setLoading(false);
      return;
    }

    async function fetchUserCases() {
      try {
        const { data, error: fetchError } = await supabase
          .from("case_assignments")
          .select(`
            case_id,
            role,
            cases (*)
          `)
          .eq("user_id", targetUserId);

        if (fetchError) throw fetchError;
        
        // Extract cases from assignments
        const casesData = data?.map((assignment: any) => ({
          ...assignment.cases,
          assignedRole: assignment.role,
        })) || [];
        
        setCases(casesData);
      } catch (err) {
        console.error("Failed to fetch user cases:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserCases();
  }, [targetUserId]);

  return { cases, loading, error, refetch: () => setLoading(true) };
}
