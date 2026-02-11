import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  type Case,
  type Provider,
  type AuditEntry,
  type Role,
  ROLES,
  RCMS_CONFIG,
} from "@/config/rcms";
import { store, nextQuarterReset } from "@/lib/store";
import {
  isTrialActive,
  trialDaysRemaining,
  coerceTrialStartDate,
  TRIAL_DAYS,
} from "@/utils/trial";
import { useAuth, type RolesLoadDiagnostics } from "@/auth/supabaseAuth";
import { useAttorneyCases, useProviders, useAuditLogs } from "@/hooks/useSupabaseData";
import { audit } from "@/lib/supabaseOperations";
import { AttorneyCase } from "@/lib/attorneyCaseQueries";
import { supabase } from "@/integrations/supabase/client";
import { resolveAuthority, type Authority } from "@/lib/authority";

type TierName = "Trial" | "Basic" | "Solo" | "Mid-Sized" | "Enterprise" | "Expired (Trial)" | "Inactive";

export type AppUserRow = {
  id: string;
  auth_user_id: string;
  role: string;
  full_name: string | null;
  created_at?: string;
};

export async function fetchAppUserRow(userId: string): Promise<AppUserRow | null> {
  const { data, error } = await supabase
    .from("rc_users")
    .select("*")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as AppUserRow;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentTier: TierName;
  tier: TierName;
  setCurrentTier: (tier: TierName) => void;
  trialStartDate: string | null;
  setTrialStartDate: React.Dispatch<React.SetStateAction<string | null>>;
  trialEndDate: string | null;
  setTrialEndDate: React.Dispatch<React.SetStateAction<string | null>>;
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  audit: AuditEntry[];
  swapsUsed: number;
  setSwapsUsed: React.Dispatch<React.SetStateAction<number>>;
  extraProviderBlocks: number;
  setExtraProviderBlocks: React.Dispatch<React.SetStateAction<number>>;
  policyAck: boolean;
  setPolicyAck: React.Dispatch<React.SetStateAction<boolean>>;

  loading: boolean;
  attorneyRoleNotConfigured: boolean;
  rolesLoadError: string | null;
  rolesLoadErrorCode: string | null;
  rolesLoadDiagnostics: RolesLoadDiagnostics | null;

  tierCaps: typeof RCMS_CONFIG.tiers[keyof typeof RCMS_CONFIG.tiers] | null;
  providerSlots: number;
  routerEnabled: boolean;
  nextReset: Date;
  swapsCap: number;
  swapsRemaining: number;
  exportAllowed: boolean;
  isTrialExpired: boolean;
  daysUntilInactive: number | null;

  log: (action: string, caseId?: string) => void;
  revokeConsent: (caseId: string) => void;

  authority: Authority | null;
  authorityLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, roles, primaryRole, rolesLoadError, rolesLoadErrorCode, rolesLoadDiagnostics } = useAuth();

  const role = (primaryRole ? primaryRole.toUpperCase() : ROLES.ATTORNEY) as Role;
  const isAttorney = (() => {
    const r = (primaryRole || "").toLowerCase();
    return r === "attorney" || r === "super_user" || r === "super_admin";
  })();

  const { cases: attorneyCases, loading: attorneyCasesLoading, roleNotConfigured: attorneyRoleNotConfigured } = useAttorneyCases();

  const rawCases = isAttorney
    ? (attorneyCases as AttorneyCase[]).filter((c: AttorneyCase) => {
        const isReleasedOrClosed = c.case_status === "released" || c.case_status === "closed";
        const isCarePlanReleased = !!(c as AttorneyCase & { care_plan_released?: boolean }).care_plan_released;
        const isValid = isReleasedOrClosed || isCarePlanReleased;
        if (!isValid && process.env.NODE_ENV === "development") {
          console.warn(
            `[ATTORNEY_MVP_SAFETY] ⚠️ Filtering out non-released case (ID: ${c.id}, Status: ${c.case_status})`
          );
        }
        return isValid;
      })
    : [];
  const casesLoading = isAttorney ? attorneyCasesLoading : false;

  const { providers: supabaseProviders, loading: providersLoading } = useProviders();
  const { auditLogs, loading: auditLoading } = useAuditLogs();

  const setRole = () => {
    console.warn("Role is read-only and determined by database user_roles table");
  };
  const [currentTier, setCurrentTier] = useState<TierName>(store.get("currentTier", "Solo"));
  const [trialStartDate, setTrialStartDate] = useState<string | null>(store.get("trialStartDate", null));
  const [trialEndDate, setTrialEndDate] = useState<string | null>(store.get("trialEndDate", null));
  const [swapsUsed, setSwapsUsed] = useState<number>(store.get("swapsUsed", 0));
  const [extraProviderBlocks, setExtraProviderBlocks] = useState<number>(
    store.get("extraProviderBlocks", 0)
  );
  const [policyAck, setPolicyAck] = useState<boolean>(
    store.get(`policyAck_${user?.id || "guest"}`, false)
  );

  const [authority, setAuthority] = useState<Authority | null>(null);
  const [authorityLoading, setAuthorityLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAuthority(null);
      setAuthorityLoading(false);
      return;
    }
    let cancelled = false;
    setAuthorityLoading(true);
    resolveAuthority({ userId: user.id, role: primaryRole ?? null })
      .then((a) => {
        if (!cancelled) {
          setAuthority(a);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthority(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthorityLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, primaryRole]);

  const cases: Case[] = isAttorney
    ? (rawCases as (AttorneyCase & { care_plan_released?: boolean })[]).map((c) => {
        const isReleasedOrClosed = c.case_status === "released" || c.case_status === "closed";
        const isCarePlanReleased = !!c.care_plan_released;
        if (!isReleasedOrClosed && !isCarePlanReleased) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              `[ATTORNEY_MVP_SAFETY] ⚠️ Dropping non-released case from AppContext (ID: ${c.id}, Status: ${c.case_status})`
            );
          }
          return null;
        }

        const status = c.case_status === "released" ? "RELEASED" : c.case_status === "closed" ? "CLOSED" : "NEW";
        const clientName = (c as AttorneyCase & { clientName?: string | null }).clientName ?? null;
        const caseNumber = (c as AttorneyCase & { case_number?: string | null }).case_number ?? null;
        return {
          id: c.id,
          firmId: user?.id || "unknown",
          onsetOfService: c.created_at,
          client: {
            rcmsId: caseNumber || c.id,
            attyRef: "",
            displayNameMasked: clientName || "Unknown",
            fullName: clientName || "Unknown",
            dobMasked: "",
            gender: "prefer_not_to_say",
            state: "",
          },
          intake: {},
          fourPs: {},
          sdoh: {},
          demographics: {},
          consent: { signed: true },
          flags: [],
          sdohFlags: [],
          riskLevel: "stable",
          status,
          carePlanReleased: isCarePlanReleased,
          checkins: [],
          createdAt: c.created_at,
          updatedAt: c.updated_at || c.created_at,
        };
      }).filter((c): c is Case => c !== null)
    : [];

  useEffect(() => {
    if (isAttorney && process.env.NODE_ENV === "development") {
      const drafts = rawCases.filter((rc: AttorneyCase & { care_plan_released?: boolean }) => {
        if (rc.case_status) {
          const isReleasedOrClosed = rc.case_status === "released" || rc.case_status === "closed";
          const isCarePlanReleased = !!rc.care_plan_released;
          return !isReleasedOrClosed && !isCarePlanReleased;
        }
        return false;
      });

      if (drafts.length > 0) {
        console.error(
          "[ATTORNEY_MVP_SAFETY] ⚠️ CRITICAL: Draft cases detected after filtering!",
          `Found ${drafts.length} draft case(s). This should never happen.`,
          drafts
        );
      } else {
        console.debug(
          `[ATTORNEY_MVP_SAFETY] ✅ Invariant check passed: All ${rawCases.length} attorney cases are released/closed or care-plan-released`
        );
      }
    }
  }, [isAttorney, rawCases]);

  const providers: Provider[] = supabaseProviders.map((p: any) => ({
    id: p.id,
    name: p.name,
    specialty: p.specialty,
    city: p.address || "",
    state: "",
    distanceMiles: 0,
    active: p.accepting_patients,
  }));

  const auditEntries: AuditEntry[] = auditLogs.map((log: any) => ({
    id: log.id.toString(),
    ts: log.ts,
    actorRole: log.actor_role,
    actorId: log.actor_id,
    action: log.action,
    caseId: log.case_id,
    meta: log.meta,
  }));

  useEffect(() => store.set("currentTier", currentTier), [currentTier]);
  useEffect(() => store.set("trialStartDate", trialStartDate), [trialStartDate]);
  useEffect(() => store.set("trialEndDate", trialEndDate), [trialEndDate]);
  useEffect(() => store.set("swapsUsed", swapsUsed), [swapsUsed]);
  useEffect(() => store.set("extraProviderBlocks", extraProviderBlocks), [extraProviderBlocks]);
  useEffect(() => {
    if (user?.id) {
      store.set(`policyAck_${user.id}`, policyAck);
    }
  }, [policyAck, user?.id]);

  useEffect(() => {
    const userData = { trialStartDate, trialEndDate };
    const coerced = coerceTrialStartDate(userData);
    if (coerced && coerced !== trialStartDate) {
      setTrialStartDate(coerced);
    }
  }, [trialStartDate, trialEndDate]);

  const tierCaps = currentTier in RCMS_CONFIG.tiers ? RCMS_CONFIG.tiers[currentTier] : null;
  const providerSlots = (tierCaps?.providerSlots ?? 0) + extraProviderBlocks * 5;
  const routerEnabled = tierCaps?.routerEnabled ?? false;
  const nextReset = nextQuarterReset();
  const swapsCap = tierCaps?.swapsCap ?? 0;
  const swapsRemaining = Math.max(0, swapsCap - swapsUsed);
  const exportAllowed = tierCaps?.exportAllowed ?? false;

  const userData = { trialStartDate, trialEndDate };
  const isTrialExpired = !isTrialActive(userData);
  const trialDays = trialDaysRemaining(userData);
  const gracePeriodDays = isTrialExpired ? TRIAL_DAYS + 14 - trialDays : null;
  const daysUntilInactive = gracePeriodDays !== null && gracePeriodDays <= 14 ? gracePeriodDays : null;

  async function log(action: string, caseId?: string) {
    try {
      await audit({
        actorRole: role,
        actorId: user?.id || "unknown",
        action: action as any,
        caseId,
      });
    } catch (error) {
      console.error("Failed to log audit event:", error);
    }
  }

  function revokeConsent(caseId: string) {
    log("CONSENT_REVOKED", caseId);
  }

  function setCases(_cases: React.SetStateAction<Case[]>) {
    console.warn("setCases is deprecated. Data is managed by Supabase. Changes will be overwritten.");
  }

  function setProviders(_providers: React.SetStateAction<Provider[]>) {
    console.warn("setProviders is deprecated. Data is managed by Supabase. Changes will be overwritten.");
  }

  const loading = casesLoading || providersLoading || auditLoading;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentTier,
        tier: currentTier,
        setCurrentTier,
        trialStartDate,
        setTrialStartDate,
        trialEndDate,
        setTrialEndDate,
        providers,
        setProviders,
        cases,
        setCases,
        audit: auditEntries,
        swapsUsed,
        setSwapsUsed,
        extraProviderBlocks,
        setExtraProviderBlocks,
        policyAck,
        setPolicyAck,
        loading,
        attorneyRoleNotConfigured,
        rolesLoadError,
        rolesLoadErrorCode,
        rolesLoadDiagnostics,
        tierCaps,
        providerSlots,
        routerEnabled,
        nextReset,
        swapsCap,
        swapsRemaining,
        exportAllowed,
        isTrialExpired,
        daysUntilInactive,
        log,
        revokeConsent,
        authority,
        authorityLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
