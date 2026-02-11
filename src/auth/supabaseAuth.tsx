// src/auth/supabaseAuth.tsx

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type Session,
  type User,
} from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

// Redact patterns that might contain secrets. Do NOT display env vars, keys, tokens.
function sanitizeForDisplay(s: string): string {
  if (!s || typeof s !== 'string') return s;
  return s
    .replace(/(?:process\.env|import\.meta\.env)\.\w+/gi, '[REDACTED]')
    .replace(/(?:api[_-]?key|apikey|secret|password|token|credential|bearer)\s*[=:]\s*['"]?[^\s'"]{8,}['"]?/gi, '[REDACTED]')
    .replace(/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]');
}

// Map rc_users role values (lowercase) to app role names. DB canonical: 'attorney', 'super_user', 'super_admin', etc.
function mapRcUserRoleToAppRole(rcRole: string): string {
  const roleMap: Record<string, string> = {
    'attorney': 'ATTORNEY',
    'super_user': 'SUPER_USER',
    'super_admin': 'SUPER_ADMIN',
    'rn_cm': 'RN_CM',
    'rn': 'RN_CM',
    'rn_supervisor': 'RN_CM_SUPERVISOR',
    'provider': 'PROVIDER',
    'client': 'CLIENT',
    'supervisor': 'RN_CM_SUPERVISOR',
  };
  return roleMap[rcRole.toLowerCase()] || rcRole.toUpperCase();
}

export type RolesLoadDiagnostics = {
  hasSession: boolean;
  auth_user_id: string | null;
  roleQueryTable: string;
  roleQueryResultCount?: number;
  role?: string;
  error?: string;
  /** DEV: was session present on first getSession(). */
  hadSessionInitially?: boolean;
  /** DEV: ms to fetch role from rc_users. */
  roleFetchDurationMs?: number;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean; // Backwards compatibility: authLoading || rolesLoading
  authLoading: boolean; // True while checking if user is logged in
  rolesLoading: boolean; // True while fetching roles
  /** Set when role load fails (timeout, Supabase/RLS/network). Never a bypass; deny access when set. */
  rolesLoadError: string | null;
  /** Error code when rolesLoadError is set (e.g. PGRST116, TIMEOUT). */
  rolesLoadErrorCode: string | null;
  /** DEV/debug only: diagnostics when rolesLoadError is set. */
  rolesLoadDiagnostics: RolesLoadDiagnostics | null;
  roles: string[];
  primaryRole: string | null;
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesLoadError, setRolesLoadError] = useState<string | null>(null);
  const [rolesLoadErrorCode, setRolesLoadErrorCode] = useState<string | null>(null);
  const [rolesLoadDiagnostics, setRolesLoadDiagnostics] = useState<RolesLoadDiagnostics | null>(null);

  const lastLoadedUserIdRef = useRef<string | null>(null);
  const hadSessionInitiallyRef = useRef<boolean | null>(null);
  const userRef = useRef<User | null>(null);
  const sessionRef = useRef<Session | null>(null);
  userRef.current = user;
  sessionRef.current = session;

  // Init: getSession() first, then onAuthStateChange to keep session in sync. No role fetch here.
  useEffect(() => {
    const init = async () => {
      try {
        if (!supabase || !isSupabaseConfigured()) {
          setSession(null);
          setUser(null);
          hadSessionInitiallyRef.current = false;
          setAuthLoading(false);
          return;
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          if (import.meta.env.DEV) console.warn('Auth getSession error:', error.message);
        }
        hadSessionInitiallyRef.current = !!session?.user;
        setSession(session ?? null);
        setUser(session?.user ?? null);
      } catch (e) {
        if (import.meta.env.DEV) console.warn('Auth getSession exception:', e);
      } finally {
        setAuthLoading(false);
      }
    };

    void init();

    if (!supabase || !isSupabaseConfigured()) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // Role fetch when user changes. Deterministic: getSession supplies user; we wait 500ms only if no user, then fetch rc_users once. Always resolve (loaded/denied/error). No hanging.
  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setRolesLoadError(null);
      setRolesLoadErrorCode(null);
      setRolesLoadDiagnostics(null);
      setRolesLoading(true);
      const t = window.setTimeout(() => {
        if (cancelled) return;
        if (!userRef.current?.id) {
          const msg = 'Not authenticated';
          setRolesLoadError(sanitizeForDisplay(msg));
          setRolesLoadErrorCode('SESSION_UNAVAILABLE');
          setRolesLoadDiagnostics({
            hasSession: false,
            auth_user_id: null,
            roleQueryTable: 'rc_users',
            error: msg,
            hadSessionInitially: hadSessionInitiallyRef.current ?? false,
            roleFetchDurationMs: 0,
          });
          setRoles([]);
          lastLoadedUserIdRef.current = null;
          setRolesLoading(false);
          if (import.meta.env.DEV) console.log('Role load:', { hadSessionInitially: false, userId: null, roleFetchDurationMs: 0 });
        }
      }, 500);
      return () => { clearTimeout(t); cancelled = true; };
    }

    // User exists: fetch from rc_users once. 8s timeout on DB only. setRolesLoading(false) in finally.
    setRolesLoadError(null);
    setRolesLoadErrorCode(null);
    setRolesLoadDiagnostics(null);
    setRolesLoading(true);

    const doFetchRoles = async () => {
      const start = Date.now();
      const isCancelled = () => cancelled;
      try {
        const DB_TIMEOUT_MS = 8000;
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error('Role fetch timed out'), { code: 'TIMEOUT' })), DB_TIMEOUT_MS)
        );
        const rcPromise = supabase
          .from('rc_users')
          .select('role')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        const res = await Promise.race([rcPromise, timeoutPromise]) as { data: { role?: string } | null; error: { message?: string; code?: string } | null };
        if (isCancelled()) return;
        if (res.error) throw Object.assign(new Error(res.error?.message ?? 'rc_users error'), { code: res.error?.code ?? 'UNKNOWN' });

        const raw = (res.data?.role ?? '').toLowerCase().trim();
        const mapped = raw ? mapRcUserRoleToAppRole(raw) : null;
        if (mapped) {
          setRoles([mapped]);
          lastLoadedUserIdRef.current = user.id;
        } else {
          setRoles([]);
          lastLoadedUserIdRef.current = null;
        }
        setRolesLoadError(null);
        setRolesLoadErrorCode(null);
        setRolesLoadDiagnostics(null);
      } catch (e) {
        if (isCancelled()) return;
        setRoles([]);
        lastLoadedUserIdRef.current = null;
        const message = e instanceof Error ? e.message : String(e);
        const code = (e && typeof e === 'object' && 'code' in e) ? String((e as { code: unknown }).code) : 'UNKNOWN';
        setRolesLoadError(sanitizeForDisplay(message));
        setRolesLoadErrorCode(code);
        setRolesLoadDiagnostics({
          hasSession: !!sessionRef.current,
          auth_user_id: user.id,
          roleQueryTable: 'rc_users',
          error: message,
          hadSessionInitially: hadSessionInitiallyRef.current ?? true,
          roleFetchDurationMs: Date.now() - start,
        });
      } finally {
        const roleFetchDurationMs = Date.now() - start;
        if (!isCancelled()) setRolesLoading(false);
        if (import.meta.env.DEV) console.log('Role load:', { hadSessionInitially: hadSessionInitiallyRef.current ?? !!user?.id, userId: user.id, roleFetchDurationMs });
      }
    };

    void doFetchRoles();
    return () => { cancelled = true; };
  }, [user?.id]);

  const signInWithEmail = async (email: string) => {
    if (!supabase) return;
    await supabase.auth.signInWithOtp({ email });
  };

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  const primaryRole = roles.length > 0 ? roles[0] : null;

  const loading = authLoading || rolesLoading;

  const value: AuthContextValue = {
    user,
    session,
    loading,
    authLoading,
    rolesLoading,
    rolesLoadError,
    rolesLoadErrorCode,
    rolesLoadDiagnostics,
    roles,
    primaryRole,
    signInWithEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
